-- V27.2: watchdog heartbeat and immutable history for managerial hotel care.
create table if not exists public.sco_control_watchdog_runs(
 id bigint generated always as identity primary key,
 checked_at timestamptz not null default now(),
 escalated integer not null default 0
);
alter table public.sco_control_watchdog_runs enable row level security;
drop policy if exists sco_watchdog_runs_read on public.sco_control_watchdog_runs;
create policy sco_watchdog_runs_read on public.sco_control_watchdog_runs for select to authenticated using(public.sco_is_manager());
grant select on public.sco_control_watchdog_runs to authenticated;

create or replace function public.sco_control_watchdog_v27()
returns jsonb language plpgsql security invoker set search_path='public','pg_temp' as $$
declare changed integer:=0;
begin
 perform pg_advisory_xact_lock(928350);
 update public.sco_control_alerts a
 set sla_due_at=a.created_at+make_interval(hours=>p.hours_to_ack)
 from public.sco_control_sla_policy p
 where a.severity=p.severity and a.status='open' and a.sla_due_at is null;
 update public.sco_control_alerts a
 set escalation_level=least(3,1+floor(extract(epoch from (now()-a.sla_due_at))/(p.hours_between_escalations*3600))::int),
     last_escalated_at=now()
 from public.sco_control_sla_policy p
 where a.status='open' and a.severity=p.severity and a.sla_due_at<now()
 and a.escalation_level<least(3,1+floor(extract(epoch from (now()-a.sla_due_at))/(p.hours_between_escalations*3600))::int);
 get diagnostics changed=row_count;
 insert into public.sco_control_watchdog_runs(escalated) values(changed);
 return jsonb_build_object('escalated',changed,'checked_at',now());
end $$;
revoke all on function public.sco_control_watchdog_v27() from public,anon,authenticated;

create or replace view public.sco_control_health_v27 with (security_invoker=true) as
with hb as(
 select max(scanned_at) filter(where source='scheduler') last_scheduler_scan,max(scanned_at) last_any_scan
 from public.sco_control_scan_runs
), wd as (
 select max(checked_at) last_hourly_watchdog from public.sco_control_watchdog_runs
), incidents as (
 select count(*) filter(where status='open')::int open_alerts,
 count(*) filter(where status='open' and action_task_id is null)::int unassigned_alerts,
 count(*) filter(where status='open' and sla_due_at<now())::int sla_breaches,
 count(*) filter(where status='open' and escalation_level>0)::int escalated_alerts,
 count(*) filter(where status='open' and severity='urgent')::int critical_open
 from public.sco_control_alerts
)
select last_scheduler_scan,last_any_scan,
 case when last_scheduler_scan is null then 'no_scheduler_heartbeat'
 when last_scheduler_scan<now()-interval '36 hours' then 'scheduler_stale'
 when last_hourly_watchdog is null then 'no_hourly_heartbeat'
 when last_hourly_watchdog<now()-interval '130 minutes' then 'hourly_watchdog_stale'
 else 'operational' end watchdog_health,
 open_alerts,unassigned_alerts,sla_breaches,escalated_alerts,critical_open,last_hourly_watchdog
from hb cross join wd cross join incidents;
revoke all on public.sco_control_health_v27 from anon;
grant select on public.sco_control_health_v27 to authenticated;

create table if not exists public.sco_hotel_care_events(
 id bigint generated always as identity primary key,
 hotel_key text not null references public.sco_hotels(hotel_key) on delete cascade,
 old_state text,
 new_state text not null,
 actor uuid references public.sco_members(user_id),
 note text not null default '',
 changed_at timestamptz not null default now()
);
alter table public.sco_hotel_care_events enable row level security;
drop policy if exists sco_hotel_care_events_read on public.sco_hotel_care_events;
create policy sco_hotel_care_events_read on public.sco_hotel_care_events for select to authenticated using(public.sco_is_member());
revoke insert,update,delete on public.sco_hotel_care_events from anon,authenticated;
grant select on public.sco_hotel_care_events to authenticated;

create or replace function public.sco_hotel_care_audit_v27()
returns trigger language plpgsql security definer set search_path='public','pg_temp' as $$
begin
 if tg_op='INSERT' or new.operational_state is distinct from old.operational_state
   or new.note is distinct from old.note or new.next_check_at is distinct from old.next_check_at then
 insert into public.sco_hotel_care_events(hotel_key,old_state,new_state,actor,note)
 values(new.hotel_key,case when tg_op='INSERT' then null else old.operational_state end,
        new.operational_state,
        case when exists(select 1 from public.sco_members where user_id=auth.uid()) then auth.uid() else null end,
        new.note);
 end if;
 return new;
end $$;
drop trigger if exists sco_hotel_care_audit_trigger on public.sco_hotel_care;
create trigger sco_hotel_care_audit_trigger after insert or update on public.sco_hotel_care
for each row execute function public.sco_hotel_care_audit_v27();

-- Bootstrap a real heartbeat by performing a no-op-or-escalate inspection, not writing test incidents.
select public.sco_control_watchdog_v27();

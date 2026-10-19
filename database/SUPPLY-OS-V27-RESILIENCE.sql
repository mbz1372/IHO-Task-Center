-- V27: production operational resilience. Additive/non-destructive.
-- All active alerts require an SLA, a visible escalation, and an auditable handling path.
create table if not exists public.sco_control_sla_policy (
 severity text primary key check (severity in ('urgent','high','normal')),
 hours_to_ack integer not null check (hours_to_ack between 1 and 720),
 hours_between_escalations integer not null check (hours_between_escalations between 1 and 720),
 updated_at timestamptz not null default now()
);
insert into public.sco_control_sla_policy(severity,hours_to_ack,hours_between_escalations)
 values ('urgent',4,4),('high',24,24),('normal',72,48)
on conflict (severity) do nothing;
alter table public.sco_control_sla_policy enable row level security;
drop policy if exists sco_sla_policy_read on public.sco_control_sla_policy;
create policy sco_sla_policy_read on public.sco_control_sla_policy for select to authenticated using (public.sco_is_member());
drop policy if exists sco_sla_policy_manager_update on public.sco_control_sla_policy;
create policy sco_sla_policy_manager_update on public.sco_control_sla_policy for update to authenticated
 using (public.sco_is_manager()) with check (public.sco_is_manager());
grant select,update on public.sco_control_sla_policy to authenticated;

alter table public.sco_control_alerts
 add column if not exists sla_due_at timestamptz,
 add column if not exists acknowledged_at timestamptz,
 add column if not exists acknowledged_by uuid references public.sco_members(user_id),
 add column if not exists assigned_to uuid references public.sco_members(user_id),
 add column if not exists action_task_id uuid references public.sco_tasks(id),
 add column if not exists escalation_level smallint not null default 0,
 add column if not exists last_escalated_at timestamptz,
 add column if not exists handling_note text;
create index if not exists sco_alerts_sla_idx on public.sco_control_alerts(status,sla_due_at) where status='open';

create table if not exists public.sco_control_alert_events (
 id bigint generated always as identity primary key,
 alert_id uuid not null references public.sco_control_alerts(id) on delete cascade,
 hotel_key text not null,
 event_kind text not null check (event_kind in ('detected','acknowledged','escalated','resolved','updated')),
 actor uuid references public.sco_members(user_id),
 note text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists sco_control_alert_events_idx on public.sco_control_alert_events(alert_id,created_at desc);
alter table public.sco_control_alert_events enable row level security;
drop policy if exists sco_control_events_read on public.sco_control_alert_events;
create policy sco_control_events_read on public.sco_control_alert_events for select to authenticated
 using (public.sco_is_manager() or exists
  (select 1 from public.sco_control_alerts a where a.id=alert_id and a.assigned_to=auth.uid()));
revoke insert,update,delete on public.sco_control_alert_events from anon,authenticated;
grant select on public.sco_control_alert_events to authenticated;

create or replace function public.sco_control_alert_audit_v27()
returns trigger language plpgsql security definer set search_path='public','pg_temp' as $$
declare evt text;
begin
 if tg_op='INSERT' then evt:='detected';
 elsif new.status='resolved' and old.status<>'resolved' then evt:='resolved';
 elsif new.acknowledged_at is not null and old.acknowledged_at is null then evt:='acknowledged';
 elsif new.escalation_level>old.escalation_level then evt:='escalated';
 elsif new.assigned_to is distinct from old.assigned_to or new.sla_due_at is distinct from old.sla_due_at then evt:='updated';
 else return new;
 end if;
 insert into public.sco_control_alert_events(alert_id,hotel_key,event_kind,actor,note)
 values(new.id,new.hotel_key,evt,
  case when auth.uid() is not null and exists (select 1 from public.sco_members where user_id=auth.uid())
    then auth.uid() else null end,
  case when evt='escalated' then 'سطح ارجاع '||new.escalation_level
       when evt='acknowledged' then coalesce(new.handling_note,'')
       when evt='resolved' then 'شرط هشدار در پایش بعدی برقرار نبود؛ بسته شد'
       else '' end);
 return new;
end $$;
drop trigger if exists sco_control_alert_audit_trigger on public.sco_control_alerts;
create trigger sco_control_alert_audit_trigger
 after insert or update on public.sco_control_alerts
 for each row execute function public.sco_control_alert_audit_v27();

-- Backfill an "existing issue observed" audit event; no fake user attribution.
insert into public.sco_control_alert_events(alert_id,hotel_key,event_kind,note)
select a.id,a.hotel_key,'detected','سابقه واردشده از نسخه V26'
from public.sco_control_alerts a
where not exists (select 1 from public.sco_control_alert_events e where e.alert_id=a.id);

-- Existing alerts inherit configurable SLA, preserving any explicit manager deadline.
update public.sco_control_alerts a
set sla_due_at=a.created_at+make_interval(hours=>p.hours_to_ack)
from public.sco_control_sla_policy p
where a.severity=p.severity and a.sla_due_at is null;

-- Only an authenticated active manager may acknowledge and create a real assigned task.
-- A locked alert and one linked task make rapid/double clicks idempotent.
create or replace function public.sco_accept_control_alert_v27(
 p_alert uuid,p_assignee uuid,p_due date,p_note text default '')
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare a public.sco_control_alerts%rowtype;
declare t uuid;
declare title_text text;
begin
 if not public.sco_is_manager() then raise exception 'Only active manager may assign control alerts' using errcode='42501'; end if;
 if p_due is null or p_due<current_date or p_due>current_date+365 then raise exception 'Invalid task due date';end if;
 if length(trim(coalesce(p_note,'')))>1000 then raise exception 'Note too long';end if;
 if not exists (select 1 from public.sco_members where user_id=p_assignee and active) then
  raise exception 'Assignee must be active';end if;
 select * into a from public.sco_control_alerts where id=p_alert for update;
 if not found then raise exception 'Alert not found';end if;
 if a.status<>'open' then raise exception 'Alert already resolved';end if;
 if a.action_task_id is not null then
  return jsonb_build_object('created',false,'task_id',a.action_task_id,'alert_id',a.id);
 end if;
 title_text='پیگیری کنترل شبکه ('||a.rule_code||'): '||left(a.description,170);
 insert into public.sco_tasks(hotel_key,title,type,assignee,created_by,priority,status,due_date)
 values(a.hotel_key,title_text,'followup',p_assignee,auth.uid(),
  case when a.severity in ('urgent','high') then a.severity else 'normal' end,'open',p_due)
 returning id into t;
 update public.sco_control_alerts
 set acknowledged_at=now(),acknowledged_by=auth.uid(),assigned_to=p_assignee,
     action_task_id=t,handling_note=trim(coalesce(p_note,''))
 where id=a.id;
 insert into public.sco_events(hotel_key,task_id,kind,details,actor)
 values(a.hotel_key,t,'assigned','اقدام کنترل شبکه واگذار شد: '||a.rule_code,auth.uid());
 return jsonb_build_object('created',true,'task_id',t,'alert_id',a.id);
end $$;
revoke all on function public.sco_accept_control_alert_v27(uuid,uuid,date,text) from public,anon;
grant execute on function public.sco_accept_control_alert_v27(uuid,uuid,date,text) to authenticated;

-- Hourly fail-safe escalates overdue alerts, including acknowledged ones whose incident persists.
-- Escalation is a database inbox event, NOT an SMS or email claim.
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
 set escalation_level=least(3,1+floor(extract(epoch from (now()-a.sla_due_at)) / (p.hours_between_escalations*3600))::int),
     last_escalated_at=now()
 from public.sco_control_sla_policy p
 where a.status='open' and a.severity=p.severity
  and a.sla_due_at<now()
  and a.escalation_level<least(3,1+floor(extract(epoch from (now()-a.sla_due_at)) / (p.hours_between_escalations*3600))::int);
 get diagnostics changed=row_count;
 return jsonb_build_object('escalated',changed,'checked_at',now());
end $$;
revoke all on function public.sco_control_watchdog_v27() from public,anon,authenticated;
do $$
begin
 if exists(select 1 from cron.job where jobname='iho_supply_hourly_watchdog') then
  perform cron.unschedule('iho_supply_hourly_watchdog');
 end if;
 perform cron.schedule('iho_supply_hourly_watchdog','7 * * * *','select public.sco_control_watchdog_v27();');
end $$;

-- Manager-visible heartbeat detects a dead daily scan, overdue incidents and untriaged alerts.
create or replace view public.sco_control_health_v27 with (security_invoker=true) as
with heartbeat as (
 select max(scanned_at) filter(where source='scheduler') last_scheduler_scan,
 max(scanned_at) last_any_scan from public.sco_control_scan_runs
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
 when last_scheduler_scan<now()-interval '36 hours' then 'scheduler_stale' else 'operational' end watchdog_health,
 open_alerts,unassigned_alerts,sla_breaches,escalated_alerts,critical_open
from heartbeat cross join incidents;
revoke all on public.sco_control_health_v27 from anon;
grant select on public.sco_control_health_v27 to authenticated;

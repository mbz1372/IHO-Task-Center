-- Daily control watch: PostgreSQL-native scheduling, no external service key.
-- Jobs only detect and deduplicate issues; they never alter rates, inventory, or automatically assign people.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create table if not exists public.sco_control_scan_runs (
 id bigint generated always as identity primary key,
 source text not null check (source in ('scheduler','manager')),
 scanned_at timestamptz not null default now(),
 observed integer not null default 0
);
alter table public.sco_control_scan_runs enable row level security;
drop policy if exists sco_scan_runs_read on public.sco_control_scan_runs;
create policy sco_scan_runs_read on public.sco_control_scan_runs for select to authenticated using (public.sco_is_manager());
grant select on public.sco_control_scan_runs to authenticated;

create or replace function public.sco_control_scan_service(p_source text default 'scheduler')
returns jsonb language plpgsql security invoker set search_path='public','pg_temp' as $$
declare n integer:=0;
begin
 if p_source not in ('scheduler','manager') then raise exception 'Unknown source';end if;
 perform pg_advisory_xact_lock(928349);
 insert into public.sco_control_alerts(hotel_key,rule_code,severity,description)
 select hotel_key,alert_rule,alert_severity,alert_description
 from public.sco_control_v1
 where collaborating and alert_rule is not null
   and (category in ('پیشران','کلیدی') or alert_rule='confirmed_supply_off')
 on conflict (hotel_key,rule_code) where status='open'
 do update set last_seen_at=now(),severity=excluded.severity,description=excluded.description;
 get diagnostics n=row_count;
 update public.sco_control_alerts a set status='resolved',resolved_at=now()
 where a.status='open'
 and not exists (select 1 from public.sco_control_v1 h where h.hotel_key=a.hotel_key and h.collaborating
 and h.alert_rule=a.rule_code and (h.category in ('پیشران','کلیدی') or h.alert_rule='confirmed_supply_off'));
 insert into public.sco_control_scan_runs(source,observed) values(p_source,n);
 return jsonb_build_object('observed',n,'at',now());
end $$;
revoke all on function public.sco_control_scan_service(text) from public,anon,authenticated;

create or replace function public.sco_scan_control_v1()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
begin
 if not public.sco_is_manager() then raise exception 'Manager access required' using errcode='42501';end if;
 return public.sco_control_scan_service('manager');
end $$;
revoke all on function public.sco_scan_control_v1() from public,anon;
grant execute on function public.sco_scan_control_v1() to authenticated;

-- 04:00 UTC daily. This is a coverage scan, not customer communications.
do $$
begin
 if exists (select 1 from cron.job where jobname='iho_supply_daily_control') then
   perform cron.unschedule('iho_supply_daily_control');
 end if;
 perform cron.schedule('iho_supply_daily_control','0 4 * * *','select public.sco_control_scan_service();');
end $$;

-- Verified scheduler truth from PostgreSQL cron execution log.
-- Manually executed scans MUST NOT count as proof that scheduled jobs executed.
create or replace function public.sco_cron_runs_v27()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare result jsonb;
begin
 if not public.sco_is_manager() then raise exception 'Manager access required' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('jobname',j.jobname,'active',j.active,
  'last_status',d.status,'last_start',d.start_time,'last_end',d.end_time)
  order by j.jobname),'[]'::jsonb)
 into result
 from cron.job j
 left join lateral (
  select status,start_time,end_time from cron.job_run_details
  where jobid=j.jobid order by start_time desc limit 1
 ) d on true
 where j.jobname in ('iho_supply_daily_control','iho_supply_hourly_watchdog');
 return result;
end $$;
revoke all on function public.sco_cron_runs_v27() from public,anon;
grant execute on function public.sco_cron_runs_v27() to authenticated;

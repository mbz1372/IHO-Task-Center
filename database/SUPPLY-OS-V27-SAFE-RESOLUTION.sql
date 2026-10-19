-- V27.1: never auto-clear a verified incident because measurements became stale.
-- Resolve only with direct verified recovery, explicit completed ownership, or collaboration exit.
create or replace function public.sco_control_scan_service(p_source text default 'scheduler')
returns jsonb language plpgsql security invoker set search_path='public','pg_temp' as $$
declare observed integer:=0;resolved integer:=0;
begin
 if p_source not in ('scheduler','manager') then raise exception 'Unknown scan source';end if;
 perform pg_advisory_xact_lock(928349);
 insert into public.sco_control_alerts(hotel_key,rule_code,severity,description)
 select hotel_key,alert_rule,alert_severity,alert_description
 from public.sco_control_v1
 where collaborating and alert_rule is not null and (category in ('پیشران','کلیدی') or alert_rule='confirmed_supply_off')
 on conflict (hotel_key,rule_code) where status='open'
 do update set last_seen_at=now(),severity=excluded.severity,description=excluded.description;
 get diagnostics observed=row_count;
 update public.sco_control_alerts a
 set status='resolved',resolved_at=now()
 from public.sco_control_v1 v
 where a.hotel_key=v.hotel_key and a.status='open'
   and (
     not v.collaborating
     or (a.rule_code='ownership_gap' and not v.owner_gap)
     or (a.rule_code='verification_missing' and not v.capacity_unverified and not v.rate_unverified)
     or (a.rule_code='confirmed_supply_off'
         and v.is_online is true and v.has_rate is true
         and v.capacity_verified_at>=now()-interval '7 days'
         and v.rate_verified_at>=now()-interval '7 days')
   );
 get diagnostics resolved=row_count;
 insert into public.sco_control_scan_runs(source,observed) values(p_source,observed);
 return jsonb_build_object('observed',observed,'confirmed_resolved',resolved,'at',now());
end $$;
revoke all on function public.sco_control_scan_service(text) from public,anon,authenticated;

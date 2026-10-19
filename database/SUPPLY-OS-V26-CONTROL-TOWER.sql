-- Supply OS V26: quality-gated ranking and operational coverage.
-- Sales score is NULL without at least 14 complete dated observations.
create table if not exists public.sco_hotel_care(
 hotel_key text primary key references public.sco_hotels(hotel_key) on delete cascade,
 operational_state text not null check (operational_state in ('healthy','watch','at_risk','paused','out_of_service','unknown')),
 note text not null default '',
 next_check_at timestamptz,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table public.sco_hotel_care enable row level security;
drop policy if exists sco_care_read on public.sco_hotel_care;
create policy sco_care_read on public.sco_hotel_care for select to authenticated using (public.sco_is_member());
drop policy if exists sco_care_write on public.sco_hotel_care;
create policy sco_care_write on public.sco_hotel_care for insert to authenticated with check(public.sco_is_manager() and updated_by=auth.uid());
drop policy if exists sco_care_edit on public.sco_hotel_care;
create policy sco_care_edit on public.sco_hotel_care for update to authenticated using(public.sco_is_manager()) with check(public.sco_is_manager() and updated_by=auth.uid());
grant select,insert,update on public.sco_hotel_care to authenticated;

create table if not exists public.sco_control_alerts (
 id uuid primary key default gen_random_uuid(),
 hotel_key text not null references public.sco_hotels(hotel_key) on delete cascade,
 rule_code text not null,
 severity text not null check(severity in ('normal','high','urgent')),
 description text not null,
 status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 resolved_at timestamptz
);
create unique index if not exists sco_control_alerts_active_key on public.sco_control_alerts(hotel_key,rule_code) where status='open';
alter table public.sco_control_alerts enable row level security;
drop policy if exists sco_alert_read on public.sco_control_alerts;
create policy sco_alert_read on public.sco_control_alerts for select to authenticated using(public.sco_is_member());
revoke insert,update,delete on public.sco_control_alerts from anon,authenticated;
grant select on public.sco_control_alerts to authenticated;

create or replace view public.sco_control_v1 with (security_invoker=true) as
with performance as (
 select hotel_key,count(distinct metric_date)::int metric_days,
 sum(coalesce(nights,0))::numeric nights,
 sum(coalesce(profit,0))::numeric profit,
 sum(coalesce(revenue,0))::numeric revenue,
 sum(coalesce(confirmed,0))::numeric bookings,
 sum(coalesce(visits,0))::numeric visits,
 count(*) filter (where nights is null or profit is null or revenue is null or confirmed is null or visits is null)::int missing_fields
 from public.sco_metrics where metric_date between current_date-89 and current_date group by hotel_key
), ranked as(
 select hotel_key,metric_days,missing_fields,nights,profit,revenue,bookings,visits,
 percent_rank() over(order by nights) rn,
 percent_rank() over(order by profit) rp,
 percent_rank() over(order by revenue) rr,
 percent_rank() over(order by bookings) rb,
 percent_rank() over(order by visits) rv,
 percent_rank() over(order by case when visits>0 then bookings/visits else 0 end) rc
 from performance
), taskstats as (
 select hotel_key,count(*) filter(where status<>'done')::int open_tasks,
 count(*) filter(where status<>'done' and due_date<current_date)::int overdue_tasks
 from public.sco_tasks group by hotel_key
), facts as (
 select h.hotel_key,h.hotel_code,h.name,h.city,h.provider,h.category,h.cooperation_status,
 h.capacity_owner_id,h.rate_owner_id,h.capacity_owner,h.rate_owner,
 h.is_online,h.has_rate,h.capacity_verified_at,h.rate_verified_at,h.last_action_at,
 c.operational_state,c.note care_note,c.next_check_at,
 coalesce(t.open_tasks,0) open_tasks,coalesce(t.overdue_tasks,0) overdue_tasks,
 coalesce(p.metric_days,0) metric_days,p.missing_fields,p.nights,p.profit,p.revenue,p.bookings,p.visits,
 p.rn,p.rp,p.rr,p.rb,p.rv,p.rc,
 (h.cooperation_status='در حال همکاری با هتل' and h.category not in ('خارج از سرویس','حذف تستی')) collaborating,
 case h.category when 'پیشران' then 100 when 'کلیدی' then 82 when 'در حال توسعه' then 64 when 'جدید' then 55 when 'مکمل' then 38 else 15 end category_attention
 from public.sco_hotels h
 left join public.sco_hotel_care c using (hotel_key)
 left join ranked p using (hotel_key)
 left join taskstats t using (hotel_key)
), exceptions as (
 select f.*,
 (collaborating and (capacity_owner_id is null or rate_owner_id is null)) owner_gap,
 (collaborating and (capacity_verified_at is null or capacity_verified_at<now()-interval '7 days')) capacity_unverified,
 (collaborating and (rate_verified_at is null or rate_verified_at<now()-interval '7 days')) rate_unverified,
 (collaborating and is_online=false and capacity_verified_at>=now()-interval '7 days') confirmed_capacity_off,
 (collaborating and has_rate=false and rate_verified_at>=now()-interval '7 days') confirmed_rate_off
 from facts f
)
select hotel_key,hotel_code,name,city,provider,category,cooperation_status,collaborating,
 coalesce(operational_state,case when not collaborating then 'unknown' else 'unknown' end) care_state,
 care_note,next_check_at,capacity_owner_id,rate_owner_id,capacity_owner,rate_owner,
 is_online,has_rate,capacity_verified_at,rate_verified_at,last_action_at,
 open_tasks,overdue_tasks,metric_days,nights,profit,revenue,bookings,visits,
 owner_gap,capacity_unverified,rate_unverified,confirmed_capacity_off,confirmed_rate_off,
 case when confirmed_capacity_off or confirmed_rate_off then 'confirmed_supply_off'
 when owner_gap then 'ownership_gap'
 when capacity_unverified or rate_unverified then 'verification_missing' end alert_rule,
 case when confirmed_capacity_off or confirmed_rate_off then 'قطعی تأییدشده نرخ یا ظرفیت'
 when owner_gap then 'مسئول سیستمی نرخ یا ظرفیت ثبت نشده'
 when capacity_unverified or rate_unverified then 'نرخ یا ظرفیت فاقد بررسی معتبر هفت‌روزه' end alert_description,
 least(150,category_attention+
 case when confirmed_capacity_off or confirmed_rate_off then 42 when owner_gap then 26
 when capacity_unverified or rate_unverified then 14 else 0 end+
 least(overdue_tasks*7,28))::int attention_points,
 case when category in ('پیشران','کلیدی') and (confirmed_capacity_off or confirmed_rate_off) then 'urgent'
 when category in ('پیشران','کلیدی') then 'high' else 'normal' end alert_severity,
 case when metric_days>=14 and coalesce(missing_fields,999)>0 then null::numeric
 when metric_days>=14 then round((25*rn+25*rp+10*rr+10*rb+10*rv+10*rc+
 10*case category when 'پیشران' then 1 when 'کلیدی' then 0.8 when 'در حال توسعه' then 0.6 else 0.3 end)::numeric,1)
 else null::numeric end importance_score,
 round((least(metric_days,90)*100.0/90)::numeric,1) importance_confidence_pct,
 case when rate_verified_at>=now()-interval '7 days' and capacity_verified_at>=now()-interval '7 days'
 and has_rate is not null and is_online is not null then
 (case when has_rate then 50 else 0 end)+(case when is_online then 50 else 0 end) else null end::int online_reliability_score,
 case when rate_verified_at>=now()-interval '7 days' and capacity_verified_at>=now()-interval '7 days'
 and has_rate is not null and is_online is not null then 50 else 0 end::int trust_evidence_pct
from exceptions;
revoke all on public.sco_control_v1 from anon;
grant select on public.sco_control_v1 to authenticated;

create or replace function public.sco_scan_control_v1()
returns jsonb language plpgsql security definer set search_path='public','pg_temp' as $$
declare touched int;
begin
 if not public.sco_is_manager() then raise exception 'Manager access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(928349);
 insert into public.sco_control_alerts(hotel_key,rule_code,severity,description)
 select hotel_key,alert_rule,alert_severity,alert_description
 from public.sco_control_v1
 where collaborating and alert_rule is not null
 and (category in ('پیشران','کلیدی') or alert_rule='confirmed_supply_off')
 on conflict (hotel_key,rule_code) where status='open'
 do update set last_seen_at=now(),severity=excluded.severity,description=excluded.description;
 get diagnostics touched=row_count;
 update public.sco_control_alerts a set status='resolved',resolved_at=now()
 where a.status='open' and not exists(
 select 1 from public.sco_control_v1 h where h.hotel_key=a.hotel_key and h.collaborating
 and h.alert_rule=a.rule_code and (h.category in ('پیشران','کلیدی') or h.alert_rule='confirmed_supply_off'));
 return jsonb_build_object('observed',touched,'at',now());
end $$;
revoke all on function public.sco_scan_control_v1() from public,anon;
grant execute on function public.sco_scan_control_v1() to authenticated;

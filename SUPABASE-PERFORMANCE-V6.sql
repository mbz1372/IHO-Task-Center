-- Performance layer for IHO Hotel SuperApp V6
create index if not exists ihos_hotels_title_idx on public.ihos_hotels using gin (to_tsvector('simple', coalesce(title,'')));
create index if not exists ihos_hotels_provider_idx on public.ihos_hotels(provider);
create index if not exists ihos_hotels_code_idx on public.ihos_hotels(hotel_code);
create index if not exists ihos_hotels_cooperation_idx on public.ihos_hotels(cooperation_status);
create index if not exists ihos_hotels_city_idx on public.ihos_hotels(city);
create index if not exists ihos_hotels_province_idx on public.ihos_hotels(province);
create index if not exists ihos_hotel_automation_provider_idx2 on public.ihos_hotel_automation(provider);

create or replace view public.ihos_hotel_status_v as
select
 h.id,h.hotel_code,h.title,h.city,h.province,h.caring_category,h.cooperation_status,
 coalesce(nullif(a.provider,''),nullif(h.provider,''),'IHO Provider') as provider,
 coalesce(a.hotel_rate,false) as hotel_rate,
 coalesce(a.hotel_capacity,false) as hotel_capacity,
 a.rate_expert,a.capacity_expert,a.online_status,a.follow_up_owner,a.follow_up_at,a.care_owner,a.care_status,a.care_next_at,a.notes,
 coalesce(r.rate_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date) as rate_api,
 coalesce(r.capacity_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date) as capacity_api,
 r.replacement_provider,
 ((coalesce(r.rate_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_rate,false)) as rate_online,
 ((coalesce(r.capacity_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_capacity,false)) as capacity_online,
 case
  when (((coalesce(r.rate_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_rate,false))
    and ((coalesce(r.capacity_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_capacity,false))) then 100
  else (case when ((coalesce(r.rate_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_rate,false)) then 50 when a.rate_expert is not null then 25 else 0 end)
     + (case when ((coalesce(r.capacity_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_capacity,false)) then 50 when a.capacity_expert is not null then 35 else 0 end)
 end as automation_score,
 case
  when lower(trim(coalesce(nullif(a.provider,''),nullif(h.provider,''),'IHO Provider'))) in ('iho','asa','shab') then true
  when not ((((coalesce(r.rate_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_rate,false))
    and ((coalesce(r.capacity_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_capacity,false)))) and r.replacement_provider is not null then true
  else false end as migration_needed,
 case
  when (((coalesce(r.rate_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_rate,false))
    and ((coalesce(r.capacity_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_capacity,false))) then '۱۰۰٪ آنلاین'
  when lower(trim(coalesce(nullif(a.provider,''),nullif(h.provider,''),'IHO Provider'))) in ('iho','asa','shab') then 'نیازمند مهاجرت Provider'
  when ((coalesce(r.capacity_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_capacity,false)) then 'ظرفیت آنلاین'
  when ((coalesce(r.rate_api,false) and coalesce(r.active,true) and (r.effective_from is null or r.effective_from<=current_date)) or coalesce(a.hotel_rate,false)) then 'نرخ آنلاین'
  when a.rate_expert is not null or a.capacity_expert is not null then 'کارشناس‌محور'
  else 'آفلاین' end as automation_status
from public.ihos_hotels h
left join public.ihos_hotel_automation a on a.hotel_id=h.id
left join public.ihos_provider_rules r on lower(trim(r.name))=lower(trim(coalesce(nullif(a.provider,''),nullif(h.provider,''),'IHO Provider')));

grant select on public.ihos_hotel_status_v to anon,authenticated;

create or replace function public.ihos_hotel_dashboard_stats()
returns jsonb language sql stable security invoker as $$
 select jsonb_build_object(
  'all',count(*),
  'online',count(*) filter(where automation_score=100),
  'capacity',count(*) filter(where automation_status='ظرفیت آنلاین'),
  'rate',count(*) filter(where automation_status='نرخ آنلاین'),
  'expert',count(*) filter(where automation_status='کارشناس‌محور'),
  'offline',count(*) filter(where automation_status='آفلاین'),
  'migrate',count(*) filter(where migration_needed=true)
 ) from public.ihos_hotel_status_v;
$$;
grant execute on function public.ihos_hotel_dashboard_stats() to anon,authenticated;

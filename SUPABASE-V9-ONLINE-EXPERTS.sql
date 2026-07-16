-- Run after previous migrations. Focuses analytics on rate/capacity online status.
create or replace view public.ihos_expert_workload_v as
with assignments as (
 select a.rate_expert as expert_name, a.hotel_id, true as is_rate, false as is_capacity
 from public.ihos_hotel_automation a join public.ihos_hotels h on h.id=a.hotel_id
 where lower(trim(coalesce(a.provider,h.provider,'IHO Provider')))='iho provider' and nullif(trim(a.rate_expert),'') is not null
 union all
 select a.capacity_expert as expert_name, a.hotel_id, false, true
 from public.ihos_hotel_automation a join public.ihos_hotels h on h.id=a.hotel_id
 where lower(trim(coalesce(a.provider,h.provider,'IHO Provider')))='iho provider' and nullif(trim(a.capacity_expert),'') is not null
)
select expert_name,
 count(distinct hotel_id) filter(where is_rate)::int as rate_hotels,
 count(distinct hotel_id) filter(where is_capacity)::int as capacity_hotels,
 count(distinct hotel_id)::int as total_hotels
from assignments group by expert_name;
grant select on public.ihos_expert_workload_v to anon,authenticated;

-- Helpful exact-count indexes.
create index if not exists ihos_hotel_automation_rate_expert_idx on public.ihos_hotel_automation(rate_expert);
create index if not exists ihos_hotel_automation_capacity_expert_idx on public.ihos_hotel_automation(capacity_expert);

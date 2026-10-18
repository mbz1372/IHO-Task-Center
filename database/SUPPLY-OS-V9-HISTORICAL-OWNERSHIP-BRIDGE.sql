-- IranHotel Supply OS / Owner names bridge (non-destructive, idempotent)
-- Source: historical Hotel Assignment import. This populates DISPLAY NAMES ONLY.
-- It deliberately does not activate user accounts, fill user_id columns or mark statuses verified.
-- Safety: unique hotel name in sco_hotels and exactly one distinct staff name per name+role.
-- Existing non-empty owner values are never overwritten.
with unique_hotels as (
 select min(hotel_key) hotel_key, lower(trim(name)) name_key
 from public.sco_hotels group by lower(trim(name)) having count(*)=1
), qualified_assignment as (
 select lower(trim(payload->>'HotelName')) name_key,
        payload->>'وظیفه' role_name,
        min(trim(payload->>'First name')) expert
 from public.ihos_supply_import_rows
 where file_key='assignment'
   and payload->>'وظیفه' in ('نرخ','ظرفیت')
   and nullif(trim(payload->>'HotelName'),'') is not null
   and nullif(trim(payload->>'First name'),'') is not null
 group by 1,2 having count(distinct trim(payload->>'First name'))=1
), pivoted as (
 select uh.hotel_key,
        max(a.expert) filter (where a.role_name='ظرفیت') capacity_expert,
        max(a.expert) filter (where a.role_name='نرخ') rate_expert
 from unique_hotels uh join qualified_assignment a on a.name_key=uh.name_key
 group by uh.hotel_key
), updated as (
 update public.sco_hotels h
 set capacity_owner=coalesce(nullif(trim(h.capacity_owner),''),p.capacity_expert),
     rate_owner=coalesce(nullif(trim(h.rate_owner),''),p.rate_expert),
     updated_at=now()
 from pivoted p
 where h.hotel_key=p.hotel_key
 and ((nullif(trim(h.capacity_owner),'') is null and p.capacity_expert is not null)
   or (nullif(trim(h.rate_owner),'') is null and p.rate_expert is not null))
 returning h.hotel_key
)
select count(*) affected_hotels from updated;
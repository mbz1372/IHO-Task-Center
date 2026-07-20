-- IHO Task Center V19 — data truth and contextual help
-- Run after SUPABASE-V18-EXECUTION-INTELLIGENCE.sql.
-- This migration does not create operational sample data.

begin;

alter table if exists public.ihos_hotels
  add column if not exists crm_stage text;

create index if not exists idx_ihos_hotels_crm_stage
  on public.ihos_hotels(crm_stage);

-- Make the system guide visible in persisted custom/system roles. The client
-- also keeps the guide universally accessible so a broken role cannot hide it.
update public.ihos_roles
set permissions=coalesce(permissions,'{}'::jsonb)||'{"help":true}'::jsonb,
    updated_at=now()
where coalesce(permissions->>'help','')<>'true';

-- Remove only untouched rows that match the exact demo fingerprints shipped by
-- old schema versions. Any row linked to real operational history is preserved.
delete from public.ihos_hotels h
where (
    (h.id='h-1' and h.title='هتل درویشی' and h.city='مشهد' and coalesce(h.capacity_total,0)=220)
 or (h.id='h-2' and h.title='هتل پارس' and h.city='مشهد' and coalesce(h.capacity_total,0)=228)
 or (h.id='h-3' and h.title='هتل آریان کیش' and h.city='کیش' and coalesce(h.capacity_total,0)=73)
)
and not exists (select 1 from public.ihos_tasks t where t.hotel_id=h.id)
and not exists (select 1 from public.ihos_documents d where d.hotel_id=h.id)
and not exists (select 1 from public.ihos_calendar_events e where e.hotel_id=h.id)
and not exists (select 1 from public.ihos_hotel_automation a where a.hotel_id=h.id)
and not exists (select 1 from public.ihos_hotel_assignments a where a.hotel_id=h.id)
and not exists (select 1 from public.ihos_hotel_communications c where c.hotel_id=h.id)
and not exists (select 1 from public.ihos_hotel_daily_metrics m where m.hotel_id=h.id)
and not exists (select 1 from public.ihos_hotel_events e where e.hotel_id=h.id);

commit;

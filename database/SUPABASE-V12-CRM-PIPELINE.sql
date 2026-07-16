-- IranHotel OS V12: persist CRM 360 drag & drop stage
alter table public.ihos_hotels
  add column if not exists crm_stage text;

create index if not exists ihos_hotels_crm_stage_idx
  on public.ihos_hotels (crm_stage);

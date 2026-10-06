-- IranHotel Supply Chain OS V24
-- Optional production tables for the unified upload → hotel status → task → timeline flow.
-- The app also has fallback storage in ihos_settings, but running this migration makes the data model clean and queryable.

create extension if not exists pgcrypto;

create table if not exists ihos_supply_import_runs (
  id text primary key,
  file_key text not null,
  file_name text not null,
  uploaded_file_name text,
  rows_count integer default 0,
  required boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_supply_import_rows (
  id text primary key,
  import_id text,
  file_key text not null,
  file_name text,
  uploaded_file_name text,
  row_index integer,
  hotel_code text,
  hotel_title text,
  city text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ihos_supply_import_rows_file_key on ihos_supply_import_rows(file_key);
create index if not exists idx_ihos_supply_import_rows_hotel_code on ihos_supply_import_rows(hotel_code);
create index if not exists idx_ihos_supply_import_rows_hotel_title on ihos_supply_import_rows(hotel_title);

create table if not exists ihos_hotel_events (
  id text primary key,
  hotel_id text,
  hotel_title text,
  event_type text not null,
  title text not null,
  description text,
  severity text,
  actor_id text,
  actor_name text,
  entity_type text,
  entity_id text,
  payload jsonb default '{}'::jsonb,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_ihos_hotel_events_hotel_id on ihos_hotel_events(hotel_id);
create index if not exists idx_ihos_hotel_events_hotel_title on ihos_hotel_events(hotel_title);
create index if not exists idx_ihos_hotel_events_occurred_at on ihos_hotel_events(occurred_at desc);

-- Dedicated optional tables by exact file slot. They keep the same normalized shape as ihos_supply_import_rows.
create table if not exists ihos_supply_reservation_list (like ihos_supply_import_rows including defaults including constraints);
create table if not exists ihos_supply_uploaded_hotels (like ihos_supply_import_rows including defaults including constraints);
create table if not exists ihos_supply_confirmed_sales (like ihos_supply_import_rows including defaults including constraints);
create table if not exists ihos_supply_unconfirmed_sales (like ihos_supply_import_rows including defaults including constraints);
create table if not exists ihos_supply_mehr_mo (like ihos_supply_import_rows including defaults including constraints);
create table if not exists ihos_supply_hotel_assignments (like ihos_supply_import_rows including defaults including constraints);
create table if not exists ihos_supply_analytics_traffic (like ihos_supply_import_rows including defaults including constraints);

alter table ihos_supply_import_runs enable row level security;
alter table ihos_supply_import_rows enable row level security;
alter table ihos_hotel_events enable row level security;
alter table ihos_supply_reservation_list enable row level security;
alter table ihos_supply_uploaded_hotels enable row level security;
alter table ihos_supply_confirmed_sales enable row level security;
alter table ihos_supply_unconfirmed_sales enable row level security;
alter table ihos_supply_mehr_mo enable row level security;
alter table ihos_supply_hotel_assignments enable row level security;
alter table ihos_supply_analytics_traffic enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'ihos_supply_import_runs','ihos_supply_import_rows','ihos_hotel_events',
    'ihos_supply_reservation_list','ihos_supply_uploaded_hotels','ihos_supply_confirmed_sales','ihos_supply_unconfirmed_sales',
    'ihos_supply_mehr_mo','ihos_supply_hotel_assignments','ihos_supply_analytics_traffic'
  ] loop
    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('drop policy if exists %I_insert on %I', t, t);
    execute format('drop policy if exists %I_update on %I', t, t);
    execute format('create policy %I_select on %I for select using (true)', t, t);
    execute format('create policy %I_insert on %I for insert with check (true)', t, t);
    execute format('create policy %I_update on %I for update using (true) with check (true)', t, t);
  end loop;
end $$;

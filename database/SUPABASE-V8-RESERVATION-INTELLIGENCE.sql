-- IranHotel OS V8.1 — Reservation Intelligence tables
-- Safe/idempotent migration for adding reservation analytics beside the Pro operations system.

create table if not exists public.ihos_reservation_rows (
  id text primary key,
  hotel_id text,
  hotel_title text not null,
  city text,
  channel text,
  status text,
  confirmed boolean not null default false,
  nights numeric not null default 0,
  amount numeric not null default 0,
  profit numeric not null default 0,
  reason text,
  reservation_date timestamptz,
  source_file text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ihos_reservation_rows_hotel on public.ihos_reservation_rows(hotel_title, confirmed);
create index if not exists idx_ihos_reservation_rows_city on public.ihos_reservation_rows(city, confirmed);
create index if not exists idx_ihos_reservation_rows_date on public.ihos_reservation_rows(reservation_date desc);

create table if not exists public.ihos_site_traffic_rows (
  id text primary key,
  metric_date date,
  hotel_title text,
  city text,
  channel text,
  sessions numeric not null default 0,
  visitors numeric not null default 0,
  searches numeric not null default 0,
  room_views numeric not null default 0,
  booking_starts numeric not null default 0,
  reservations numeric not null default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ihos_site_traffic_rows_hotel on public.ihos_site_traffic_rows(hotel_title, metric_date desc);
create index if not exists idx_ihos_site_traffic_rows_city on public.ihos_site_traffic_rows(city, metric_date desc);

create table if not exists public.ihos_reservation_insights (
  id text primary key,
  hotel_title text,
  city text,
  insight_type text not null default 'risk',
  title text not null,
  body text,
  severity text not null default 'medium',
  score numeric not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ihos_reservation_insights_hotel on public.ihos_reservation_insights(hotel_title, severity, created_at desc);

do $$
begin
  execute 'alter publication supabase_realtime add table public.ihos_reservation_rows';
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.ihos_site_traffic_rows';
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.ihos_reservation_insights';
exception when duplicate_object then null; when undefined_object then null;
end $$;

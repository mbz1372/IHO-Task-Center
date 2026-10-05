-- IranHotel OS V10 — Unified Supply Chain Super App
-- Run this once in Supabase SQL Editor. It is safe to run multiple times.

create table if not exists public.ihos_reservations (
  id text primary key,
  source text,
  code text,
  "hotelCode" text,
  hotel text,
  city text,
  channel text,
  status text,
  confirmed boolean default false,
  nights numeric default 0,
  amount numeric default 0,
  profit numeric default 0,
  date text,
  reason text,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ihos_reservations add column if not exists source text;
alter table public.ihos_reservations add column if not exists code text;
alter table public.ihos_reservations add column if not exists "hotelCode" text;
alter table public.ihos_reservations add column if not exists hotel text;
alter table public.ihos_reservations add column if not exists city text;
alter table public.ihos_reservations add column if not exists channel text;
alter table public.ihos_reservations add column if not exists status text;
alter table public.ihos_reservations add column if not exists confirmed boolean default false;
alter table public.ihos_reservations add column if not exists nights numeric default 0;
alter table public.ihos_reservations add column if not exists amount numeric default 0;
alter table public.ihos_reservations add column if not exists profit numeric default 0;
alter table public.ihos_reservations add column if not exists date text;
alter table public.ihos_reservations add column if not exists reason text;
alter table public.ihos_reservations add column if not exists raw jsonb;
alter table public.ihos_reservations add column if not exists created_at timestamptz default now();
alter table public.ihos_reservations add column if not exists updated_at timestamptz default now();

create table if not exists public.ihos_site_traffic (
  id text primary key,
  "hotelCode" text,
  hotel text,
  city text,
  sessions numeric default 0,
  users numeric default 0,
  views numeric default 0,
  "bookingStarts" numeric default 0,
  reservations numeric default 0,
  date text,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ihos_site_traffic add column if not exists "hotelCode" text;
alter table public.ihos_site_traffic add column if not exists hotel text;
alter table public.ihos_site_traffic add column if not exists city text;
alter table public.ihos_site_traffic add column if not exists sessions numeric default 0;
alter table public.ihos_site_traffic add column if not exists users numeric default 0;
alter table public.ihos_site_traffic add column if not exists views numeric default 0;
alter table public.ihos_site_traffic add column if not exists "bookingStarts" numeric default 0;
alter table public.ihos_site_traffic add column if not exists reservations numeric default 0;
alter table public.ihos_site_traffic add column if not exists date text;
alter table public.ihos_site_traffic add column if not exists raw jsonb;
alter table public.ihos_site_traffic add column if not exists created_at timestamptz default now();
alter table public.ihos_site_traffic add column if not exists updated_at timestamptz default now();

alter table if exists public.ihos_hotels add column if not exists title text;
alter table if exists public.ihos_hotels add column if not exists hotel_code text;
alter table if exists public.ihos_hotels add column if not exists city text;
alter table if exists public.ihos_hotels add column if not exists province text;
alter table if exists public.ihos_hotels add column if not exists provider text;
alter table if exists public.ihos_hotels add column if not exists grade text;
alter table if exists public.ihos_hotels add column if not exists caring_category text;
alter table if exists public.ihos_hotels add column if not exists capacity_total numeric default 0;

alter table if exists public.ihos_tasks add column if not exists hotel_title text;
alter table if exists public.ihos_tasks add column if not exists hotel_id text;
alter table if exists public.ihos_tasks add column if not exists assigned_name text;
alter table if exists public.ihos_tasks add column if not exists priority text;
alter table if exists public.ihos_tasks add column if not exists status text;
alter table if exists public.ihos_tasks add column if not exists deadline text;
alter table if exists public.ihos_tasks add column if not exists description text;

create index if not exists idx_ihos_reservations_hotel on public.ihos_reservations("hotelCode", hotel);
create index if not exists idx_ihos_reservations_status on public.ihos_reservations(confirmed, date);
create index if not exists idx_ihos_site_traffic_hotel on public.ihos_site_traffic("hotelCode", hotel);

alter table public.ihos_reservations enable row level security;
alter table public.ihos_site_traffic enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ihos_reservations' and policyname='ihos_reservations_all') then
    create policy ihos_reservations_all on public.ihos_reservations for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ihos_site_traffic' and policyname='ihos_site_traffic_all') then
    create policy ihos_site_traffic_all on public.ihos_site_traffic for all using (true) with check (true);
  end if;
end $$;

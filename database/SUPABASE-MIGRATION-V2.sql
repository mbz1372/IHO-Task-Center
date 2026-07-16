create table if not exists public.ihos_hotel_automation (
  id text primary key,
  hotel_id text not null,
  hotel_code text,
  provider text default 'IHO Provider',
  hotel_rate boolean default false,
  hotel_capacity boolean default false,
  rate_expert text,
  capacity_expert text,
  updated_at timestamptz default now()
);
create index if not exists ihos_hotel_automation_hotel_idx on public.ihos_hotel_automation(hotel_id);
create index if not exists ihos_hotel_automation_provider_idx on public.ihos_hotel_automation(provider);
create table if not exists public.ihos_provider_rules (
  id text primary key,
  name text unique not null,
  rate_api boolean default false,
  capacity_api boolean default false,
  active boolean default true,
  effective_from date,
  replacement_provider text,
  priority int default 100,
  updated_at timestamptz default now()
);
alter table public.ihos_hotel_automation enable row level security;
alter table public.ihos_provider_rules enable row level security;
do $$ begin create policy "hotel automation access" on public.ihos_hotel_automation for all using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "provider rules access" on public.ihos_provider_rules for all using (true) with check (true); exception when duplicate_object then null; end $$;

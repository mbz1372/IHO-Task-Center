-- IHO Hotel Operations workflow extension (safe, additive)
create table if not exists public.ihos_hotel_automation (
  id text primary key,
  hotel_id text not null unique,
  hotel_code text,
  provider text,
  hotel_rate boolean default false,
  hotel_capacity boolean default false,
  rate_expert text,
  capacity_expert text,
  online_status text default 'نیازمند بررسی',
  online_owner text,
  online_by text,
  online_at date,
  follow_up_owner text,
  follow_up_at date,
  care_owner text,
  care_status text default 'در صف Care',
  care_next_at date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.ihos_hotel_automation add column if not exists online_status text default 'نیازمند بررسی';
alter table public.ihos_hotel_automation add column if not exists online_owner text;
alter table public.ihos_hotel_automation add column if not exists online_by text;
alter table public.ihos_hotel_automation add column if not exists online_at date;
alter table public.ihos_hotel_automation add column if not exists follow_up_owner text;
alter table public.ihos_hotel_automation add column if not exists follow_up_at date;
alter table public.ihos_hotel_automation add column if not exists care_owner text;
alter table public.ihos_hotel_automation add column if not exists care_status text default 'در صف Care';
alter table public.ihos_hotel_automation add column if not exists care_next_at date;
alter table public.ihos_hotel_automation add column if not exists notes text;
create index if not exists ihos_hotel_automation_hotel_code_idx on public.ihos_hotel_automation(hotel_code);
create index if not exists ihos_hotel_automation_follow_up_idx on public.ihos_hotel_automation(follow_up_at);
create index if not exists ihos_hotel_automation_care_idx on public.ihos_hotel_automation(care_next_at);
alter table public.ihos_hotel_automation enable row level security;
drop policy if exists "authenticated full access hotel automation" on public.ihos_hotel_automation;
create policy "authenticated full access hotel automation" on public.ihos_hotel_automation for all to authenticated using (true) with check (true);
drop policy if exists "anon full access hotel automation" on public.ihos_hotel_automation;
create policy "anon full access hotel automation" on public.ihos_hotel_automation for all to anon using (true) with check (true);

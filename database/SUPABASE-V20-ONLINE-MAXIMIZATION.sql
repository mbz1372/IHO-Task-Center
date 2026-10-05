-- IHO Task Center V20 — Expert import, ownership and online maximization
-- Safe/idempotent. Run after the base schema; it also repairs missing V17/V18 tables.

create extension if not exists pgcrypto;

create table if not exists public.ihos_hotel_assignments (
  id text primary key,
  hotel_id text not null,
  hotel_title text,
  user_id text not null,
  user_name text,
  assignment_role text not null,
  is_primary boolean not null default true,
  active boolean not null default true,
  started_at date not null default current_date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ihos_hotel_assignment_role_check check (assignment_role in ('city_manager','account_manager','rate_expert','capacity_expert'))
);
create index if not exists idx_hotel_assignments_hotel on public.ihos_hotel_assignments(hotel_id,active);
create index if not exists idx_hotel_assignments_user on public.ihos_hotel_assignments(user_id,active);
create unique index if not exists idx_hotel_assignments_active_role on public.ihos_hotel_assignments(hotel_id,assignment_role) where active=true and is_primary=true;

create table if not exists public.ihos_provider_coverage (
  id text primary key,
  provider text not null,
  hotel_id text,
  hotel_code text,
  hotel_title text not null,
  city text,
  coverage_type text not null default 'نرخ و ظرفیت',
  active boolean not null default true,
  effective_from date,
  source_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ihos_provider_coverage add column if not exists delivery_mode text not null default 'api';
alter table public.ihos_provider_coverage add column if not exists rate_online boolean not null default true;
alter table public.ihos_provider_coverage add column if not exists capacity_online boolean not null default true;
alter table public.ihos_provider_coverage drop constraint if exists ihos_provider_coverage_delivery_mode_check;
alter table public.ihos_provider_coverage add constraint ihos_provider_coverage_delivery_mode_check check (delivery_mode in ('api','manual','hybrid'));
create index if not exists idx_provider_coverage_provider on public.ihos_provider_coverage(provider);
create index if not exists idx_provider_coverage_hotel_code on public.ihos_provider_coverage(hotel_code);

alter table public.ihos_hotel_assignments enable row level security;
alter table public.ihos_provider_coverage enable row level security;
drop policy if exists ihos_hotel_assignments_all on public.ihos_hotel_assignments;
create policy ihos_hotel_assignments_all on public.ihos_hotel_assignments for all using (true) with check (true);
drop policy if exists "provider coverage read" on public.ihos_provider_coverage;
drop policy if exists "provider coverage write" on public.ihos_provider_coverage;
create policy "provider coverage read" on public.ihos_provider_coverage for select using (true);
create policy "provider coverage write" on public.ihos_provider_coverage for all using (true) with check (true);
grant select,insert,update,delete on public.ihos_hotel_assignments to anon,authenticated;
grant select,insert,update,delete on public.ihos_provider_coverage to anon,authenticated;

do $$ begin
  alter publication supabase_realtime add table public.ihos_hotel_assignments;
exception when duplicate_object then null; when undefined_object then null; end $$;

notify pgrst, 'reload schema';

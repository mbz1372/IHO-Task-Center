-- IranHotel OS V17 enterprise modules
-- Run once in Supabase SQL Editor.

create table if not exists public.ihos_provider_coverage (
  id text primary key,
  provider text not null,
  hotel_id text null,
  hotel_code text null,
  hotel_title text not null,
  city text null,
  coverage_type text not null default 'نرخ و ظرفیت',
  active boolean not null default true,
  effective_from date null,
  source_name text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_provider_coverage_provider on public.ihos_provider_coverage(provider);
create index if not exists idx_provider_coverage_hotel_code on public.ihos_provider_coverage(hotel_code);
create index if not exists idx_provider_coverage_hotel_id on public.ihos_provider_coverage(hotel_id);

create table if not exists public.ihos_sla_rules (
  id text primary key,
  task_type text not null,
  category text null,
  priority text null default 'همه',
  sla_hours numeric not null default 24,
  warning_hours numeric not null default 4,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sla_rules_category on public.ihos_sla_rules(category);

create table if not exists public.ihos_messages (
  id text primary key,
  sender_id text not null,
  sender_name text not null,
  recipient_type text not null default 'team',
  recipient_id text null,
  recipient_name text null,
  hotel_id text null,
  hotel_title text null,
  body text not null,
  parent_id text null,
  is_important boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_recipient on public.ihos_messages(recipient_type,recipient_id);
create index if not exists idx_messages_created on public.ihos_messages(created_at desc);

create table if not exists public.ihos_hotel_financial_profiles (
  id text primary key,
  hotel_id text not null unique,
  hotel_title text null,
  contract_financial_type text null,
  settlement_model text null,
  purchase_days integer null,
  payment_days integer null,
  commission_percent numeric null,
  credit_limit numeric null,
  guarantee_amount numeric null,
  predicted_category text null,
  risk_score numeric null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_financial_profile_hotel on public.ihos_hotel_financial_profiles(hotel_id);
create index if not exists idx_financial_profile_category on public.ihos_hotel_financial_profiles(predicted_category);

alter table public.ihos_provider_coverage enable row level security;
alter table public.ihos_sla_rules enable row level security;
alter table public.ihos_messages enable row level security;
alter table public.ihos_hotel_financial_profiles enable row level security;

-- The current app uses the anon key with its own role system. These policies match that architecture.
do $$ begin
  create policy "provider coverage read" on public.ihos_provider_coverage for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "provider coverage write" on public.ihos_provider_coverage for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sla rules read" on public.ihos_sla_rules for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sla rules write" on public.ihos_sla_rules for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "messages read" on public.ihos_messages for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "messages write" on public.ihos_messages for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "financial profiles read" on public.ihos_hotel_financial_profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "financial profiles write" on public.ihos_hotel_financial_profiles for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.ihos_messages;
exception when duplicate_object then null; end $$;

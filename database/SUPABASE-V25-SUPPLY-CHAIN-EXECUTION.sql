-- IranHotel Supply Chain OS V25
-- Execution layer: hotel score snapshots, CEO reports, and task outcome/audit records.
-- Run after V24. The app still falls back to ihos_settings if a table is missing.

create extension if not exists pgcrypto;

create table if not exists ihos_supply_hotel_scores (
  id text primary key,
  hotel_id text,
  hotel_code text,
  hotel_title text not null,
  city text,
  provider text,
  caring_category text,
  risk integer default 0,
  opportunity integer default 0,
  health integer default 0,
  reasons jsonb default '[]'::jsonb,
  actions jsonb default '[]'::jsonb,
  confirmed_bookings integer default 0,
  unconfirmed_bookings integer default 0,
  traffic integer default 0,
  open_tasks integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_supply_daily_reports (
  id text primary key,
  report_date date default current_date,
  title text not null,
  summary text,
  totals jsonb default '{}'::jsonb,
  top_hotels jsonb default '[]'::jsonb,
  team_kpi jsonb default '[]'::jsonb,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_supply_task_outcomes (
  id text primary key,
  task_id text,
  hotel_id text,
  hotel_title text,
  outcome_type text,
  title text not null,
  description text,
  actor_id text,
  actor_name text,
  payload jsonb default '{}'::jsonb,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_ihos_supply_scores_hotel on ihos_supply_hotel_scores(hotel_id, hotel_title);
create index if not exists idx_ihos_supply_scores_risk on ihos_supply_hotel_scores(risk desc);
create index if not exists idx_ihos_supply_reports_date on ihos_supply_daily_reports(report_date desc);
create index if not exists idx_ihos_supply_outcomes_hotel on ihos_supply_task_outcomes(hotel_id, hotel_title);

do $$
declare t text;
begin
  foreach t in array array[
    'ihos_supply_hotel_scores',
    'ihos_supply_daily_reports',
    'ihos_supply_task_outcomes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I_select on %I', t, t);
    execute format('drop policy if exists %I_insert on %I', t, t);
    execute format('drop policy if exists %I_update on %I', t, t);
    execute format('create policy %I_select on %I for select using (true)', t, t);
    execute format('create policy %I_insert on %I for insert with check (true)', t, t);
    execute format('create policy %I_update on %I for update using (true) with check (true)', t, t);
  end loop;
end $$;

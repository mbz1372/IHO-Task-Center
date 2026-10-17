-- Supply OS Reboot. Independent of legacy IHO tables.
create extension if not exists pgcrypto;
create table if not exists public.sco_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'expert' check(role in ('manager','expert')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.sco_hotels (
  hotel_key text primary key,
  hotel_code text,
  name text not null,
  city text not null default '',
  provider text not null default '',
  category text not null default '',
  cooperation_status text not null default '',
  capacity_owner text not null default '',
  rate_owner text not null default '',
  is_online boolean,
  has_rate boolean,
  capacity integer,
  last_action_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists sco_hotels_city_idx on public.sco_hotels(city);
create index if not exists sco_hotels_name_idx on public.sco_hotels(name);
create table if not exists public.sco_metrics (
  hotel_key text not null references public.sco_hotels(hotel_key) on delete cascade,
  metric_date date not null,
  confirmed integer,
  unconfirmed integer,
  lost integer,
  visits integer,
  nights integer,
  revenue numeric,
  profit numeric,
  updated_at timestamptz not null default now(),
  primary key(hotel_key,metric_date)
);
create index if not exists sco_metrics_day_idx on public.sco_metrics(metric_date desc);
create table if not exists public.sco_tasks (
  id uuid primary key default gen_random_uuid(),
  hotel_key text not null references public.sco_hotels(hotel_key),
  title text not null,
  type text not null default 'followup',
  assignee uuid references public.sco_members(user_id),
  created_by uuid references public.sco_members(user_id),
  priority text not null default 'normal' check(priority in ('urgent','high','normal')),
  status text not null default 'open' check(status in ('open','waiting','blocked','done')),
  due_date date,
  last_result text,
  outcome text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sco_tasks_open_idx on public.sco_tasks(status,due_date);
create index if not exists sco_tasks_hotel_idx on public.sco_tasks(hotel_key);
create table if not exists public.sco_events (
  id uuid primary key default gen_random_uuid(),
  hotel_key text not null references public.sco_hotels(hotel_key),
  task_id uuid references public.sco_tasks(id),
  kind text not null,
  details text not null,
  actor uuid references public.sco_members(user_id),
  created_at timestamptz not null default now()
);
create index if not exists sco_events_hotel_idx on public.sco_events(hotel_key,created_at desc);
create table if not exists public.sco_imports (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  file_name text not null,
  metric_date date,
  rows_total integer not null default 0,
  rows_saved integer not null default 0,
  rows_rejected integer not null default 0,
  notes jsonb not null default '{}'::jsonb,
  created_by uuid references public.sco_members(user_id),
  created_at timestamptz not null default now()
);
create or replace function public.sco_is_member() returns boolean language sql stable security definer set search_path = public, pg_temp as $$
 select exists(select 1 from public.sco_members where user_id=auth.uid() and active=true);
$$;
create or replace function public.sco_is_manager() returns boolean language sql stable security definer set search_path = public, pg_temp as $$
 select exists(select 1 from public.sco_members where user_id=auth.uid() and active=true and role='manager');
$$;
revoke all on function public.sco_is_member() from public;
revoke all on function public.sco_is_manager() from public;
grant execute on function public.sco_is_member() to authenticated;
grant execute on function public.sco_is_manager() to authenticated;
alter table public.sco_members enable row level security;
alter table public.sco_hotels enable row level security;
alter table public.sco_metrics enable row level security;
alter table public.sco_tasks enable row level security;
alter table public.sco_events enable row level security;
alter table public.sco_imports enable row level security;
drop policy if exists sco_members_read on public.sco_members;
create policy sco_members_read on public.sco_members for select to authenticated using (user_id=auth.uid() or public.sco_is_member());
drop policy if exists sco_members_insert on public.sco_members;
create policy sco_members_insert on public.sco_members for insert to authenticated with check (public.sco_is_manager());
drop policy if exists sco_members_update on public.sco_members;
create policy sco_members_update on public.sco_members for update to authenticated using (public.sco_is_manager()) with check (public.sco_is_manager());
drop policy if exists sco_hotels_read on public.sco_hotels;
create policy sco_hotels_read on public.sco_hotels for select to authenticated using (public.sco_is_member());
drop policy if exists sco_hotels_insert on public.sco_hotels;
create policy sco_hotels_insert on public.sco_hotels for insert to authenticated with check (public.sco_is_manager());
drop policy if exists sco_hotels_update on public.sco_hotels;
create policy sco_hotels_update on public.sco_hotels for update to authenticated using (public.sco_is_manager()) with check(public.sco_is_manager());
drop policy if exists sco_metrics_read on public.sco_metrics;
create policy sco_metrics_read on public.sco_metrics for select to authenticated using (public.sco_is_member());
drop policy if exists sco_metrics_insert on public.sco_metrics;
create policy sco_metrics_insert on public.sco_metrics for insert to authenticated with check (public.sco_is_manager());
drop policy if exists sco_metrics_update on public.sco_metrics;
create policy sco_metrics_update on public.sco_metrics for update to authenticated using (public.sco_is_manager()) with check(public.sco_is_manager());
drop policy if exists sco_tasks_read on public.sco_tasks;
create policy sco_tasks_read on public.sco_tasks for select to authenticated using (public.sco_is_member());
drop policy if exists sco_tasks_insert on public.sco_tasks;
create policy sco_tasks_insert on public.sco_tasks for insert to authenticated with check(public.sco_is_manager() and created_by=auth.uid());
drop policy if exists sco_tasks_update on public.sco_tasks;
create policy sco_tasks_update on public.sco_tasks for update to authenticated using(public.sco_is_manager() or (public.sco_is_member() and assignee=auth.uid())) with check(public.sco_is_manager() or (public.sco_is_member() and assignee=auth.uid()));
drop policy if exists sco_events_read on public.sco_events;
create policy sco_events_read on public.sco_events for select to authenticated using(public.sco_is_member());
drop policy if exists sco_events_insert on public.sco_events;
create policy sco_events_insert on public.sco_events for insert to authenticated with check(public.sco_is_member() and actor=auth.uid());
drop policy if exists sco_imports_read on public.sco_imports;
create policy sco_imports_read on public.sco_imports for select to authenticated using(public.sco_is_member());
drop policy if exists sco_imports_insert on public.sco_imports;
create policy sco_imports_insert on public.sco_imports for insert to authenticated with check(public.sco_is_manager() and created_by=auth.uid());
-- Bootstrap a manager AFTER verifying their Supabase Auth user:
-- INSERT INTO public.sco_members(user_id,full_name,role)
-- SELECT id,'مدیر زنجیره تأمین','manager' FROM auth.users WHERE email='REPLACE_WITH_VERIFIED_EMAIL'
-- ON CONFLICT(user_id) DO UPDATE SET role='manager',active=true;

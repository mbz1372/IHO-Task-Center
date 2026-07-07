-- IHO Task Center - Supabase online schema
-- Run this in Supabase SQL Editor, then add env vars in Vercel:
-- NEXT_PUBLIC_SUPABASE_URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY

create table if not exists public.iho_tasks (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_iho_tasks_updated_at on public.iho_tasks;
create trigger trg_iho_tasks_updated_at before update on public.iho_tasks
for each row execute function public.set_updated_at();

alter table public.iho_tasks enable row level security;

drop policy if exists "iho_tasks_select" on public.iho_tasks;
drop policy if exists "iho_tasks_insert" on public.iho_tasks;
drop policy if exists "iho_tasks_update" on public.iho_tasks;
drop policy if exists "iho_tasks_delete" on public.iho_tasks;

create policy "iho_tasks_select" on public.iho_tasks for select using (true);
create policy "iho_tasks_insert" on public.iho_tasks for insert with check (true);
create policy "iho_tasks_update" on public.iho_tasks for update using (true);
create policy "iho_tasks_delete" on public.iho_tasks for delete using (true);


create table if not exists public.iho_team_members (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_iho_team_members_updated_at on public.iho_team_members;
create trigger trg_iho_team_members_updated_at before update on public.iho_team_members
for each row execute function public.set_updated_at();

alter table public.iho_team_members enable row level security;

drop policy if exists "iho_team_members_select" on public.iho_team_members;
drop policy if exists "iho_team_members_insert" on public.iho_team_members;
drop policy if exists "iho_team_members_update" on public.iho_team_members;
drop policy if exists "iho_team_members_delete" on public.iho_team_members;

create policy "iho_team_members_select" on public.iho_team_members for select using (true);
create policy "iho_team_members_insert" on public.iho_team_members for insert with check (true);
create policy "iho_team_members_update" on public.iho_team_members for update using (true);
create policy "iho_team_members_delete" on public.iho_team_members for delete using (true);

-- V4 secure password table. Do NOT expose this table to the browser.
create table if not exists public.iho_user_auth (
  user_id text primary key,
  password_hash text,
  role text default 'expert',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists trg_iho_user_auth_updated_at on public.iho_user_auth;
create trigger trg_iho_user_auth_updated_at before update on public.iho_user_auth
for each row execute function public.set_updated_at();

alter table public.iho_user_auth enable row level security;

drop policy if exists "iho_user_auth_no_public_select" on public.iho_user_auth;
drop policy if exists "iho_user_auth_no_public_insert" on public.iho_user_auth;
drop policy if exists "iho_user_auth_no_public_update" on public.iho_user_auth;
drop policy if exists "iho_user_auth_no_public_delete" on public.iho_user_auth;
-- No public policies on purpose. Server API uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS.

-- After running this schema, default first-login password for seeded users is: 123456

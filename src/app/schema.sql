create table if not exists iho_os_members (
  id text primary key,
  name text not null,
  role text not null,
  zone text,
  position text,
  password text default '123456',
  active boolean default true,
  score int default 70,
  created_at timestamp with time zone default now()
);

create table if not exists iho_os_hotels (
  id text primary key,
  name text not null,
  city text,
  province text,
  grade text,
  status text,
  owner text,
  priority text,
  rooms int,
  provider text,
  lastFollow text,
  created_at timestamp with time zone default now()
);

create table if not exists iho_os_tasks (
  id text primary key,
  title text not null,
  description text,
  hotel text,
  city text,
  category text,
  priority text,
  status text,
  assigned_to text,
  due text,
  created_at_label text,
  comments jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

alter table iho_os_members enable row level security;
alter table iho_os_hotels enable row level security;
alter table iho_os_tasks enable row level security;

drop policy if exists "iho os members read" on iho_os_members;
drop policy if exists "iho os members insert" on iho_os_members;
drop policy if exists "iho os members update" on iho_os_members;
drop policy if exists "iho os hotels read" on iho_os_hotels;
drop policy if exists "iho os hotels insert" on iho_os_hotels;
drop policy if exists "iho os hotels update" on iho_os_hotels;
drop policy if exists "iho os tasks read" on iho_os_tasks;
drop policy if exists "iho os tasks insert" on iho_os_tasks;
drop policy if exists "iho os tasks update" on iho_os_tasks;
drop policy if exists "iho os tasks delete" on iho_os_tasks;

create policy "iho os members read" on iho_os_members for select using (true);
create policy "iho os members insert" on iho_os_members for insert with check (true);
create policy "iho os members update" on iho_os_members for update using (true);

create policy "iho os hotels read" on iho_os_hotels for select using (true);
create policy "iho os hotels insert" on iho_os_hotels for insert with check (true);
create policy "iho os hotels update" on iho_os_hotels for update using (true);

create policy "iho os tasks read" on iho_os_tasks for select using (true);
create policy "iho os tasks insert" on iho_os_tasks for insert with check (true);
create policy "iho os tasks update" on iho_os_tasks for update using (true);
create policy "iho os tasks delete" on iho_os_tasks for delete using (true);

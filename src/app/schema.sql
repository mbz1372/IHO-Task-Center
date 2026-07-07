create table if not exists iho_os_members (
  id text primary key,
  name text not null,
  role text not null,
  zone text,
  position text,
  password text default '123456',
  active boolean default true,
  score int default 70,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
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
  last_follow text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
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
  due_date text,
  comments jsonb default '[]'::jsonb,
  created_by text,
  created_at_label text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists iho_os_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default now()
);

create table if not exists iho_os_notifications (
  id text primary key,
  title text not null,
  body text,
  user_name text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists iho_os_documents (
  id text primary key,
  title text not null,
  category text,
  url text,
  owner text,
  status text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table iho_os_members add column if not exists updated_at timestamp with time zone default now();
alter table iho_os_tasks add column if not exists due_date text;
alter table iho_os_documents add column if not exists updated_at timestamp with time zone default now();

alter table iho_os_members enable row level security;
alter table iho_os_hotels enable row level security;
alter table iho_os_tasks enable row level security;
alter table iho_os_settings enable row level security;
alter table iho_os_notifications enable row level security;
alter table iho_os_documents enable row level security;

drop policy if exists "iho os members all" on iho_os_members;
drop policy if exists "iho os hotels all" on iho_os_hotels;
drop policy if exists "iho os tasks all" on iho_os_tasks;
drop policy if exists "iho os settings all" on iho_os_settings;
drop policy if exists "iho os notifications all" on iho_os_notifications;
drop policy if exists "iho os documents all" on iho_os_documents;

create policy "iho os members all" on iho_os_members for all using (true) with check (true);
create policy "iho os hotels all" on iho_os_hotels for all using (true) with check (true);
create policy "iho os tasks all" on iho_os_tasks for all using (true) with check (true);
create policy "iho os settings all" on iho_os_settings for all using (true) with check (true);
create policy "iho os notifications all" on iho_os_notifications for all using (true) with check (true);
create policy "iho os documents all" on iho_os_documents for all using (true) with check (true);

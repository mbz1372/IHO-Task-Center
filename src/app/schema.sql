-- IranHotel Operations System Enterprise V3 schema
-- Run in Supabase SQL Editor. Safe to run over previous versions.
create extension if not exists pgcrypto;

create table if not exists ihos_users (
  id text primary key,
  full_name text not null,
  username text unique not null,
  password_hash text not null default '123456',
  role text not null default 'کارشناس',
  team text,
  zone text,
  mobile text,
  email text,
  avatar text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_hotels (
  id text primary key,
  title text not null,
  city text,
  province text,
  star integer default 0,
  status text default 'فعال',
  contract_status text,
  manager_name text,
  manager_mobile text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ihos_hotels add column if not exists hotel_code text;
alter table ihos_hotels add column if not exists country text;
alter table ihos_hotels add column if not exists hotel_group text;
alter table ihos_hotels add column if not exists caring_category text;
alter table ihos_hotels add column if not exists hotel_type text;
alter table ihos_hotels add column if not exists grade text;
alter table ihos_hotels add column if not exists cooperation_status text;
alter table ihos_hotels add column if not exists risk_status text;
alter table ihos_hotels add column if not exists hotel_category text;
alter table ihos_hotels add column if not exists provider text;
alter table ihos_hotels add column if not exists pms text;
alter table ihos_hotels add column if not exists capacity_total integer default 0;
alter table ihos_hotels add column if not exists reservation_phone text;
alter table ihos_hotels add column if not exists purchase_period integer;
alter table ihos_hotels add column if not exists payment_period integer;
alter table ihos_hotels add column if not exists status_end_date text;
alter table ihos_hotels add column if not exists status_start_date text;
alter table ihos_hotels add column if not exists contract_date text;
alter table ihos_hotels add column if not exists site_visible boolean default true;
alter table ihos_hotels add column if not exists search_visible boolean default true;

create table if not exists ihos_tasks (
  id text primary key,
  title text not null,
  description text,
  hotel_id text,
  hotel_title text,
  city text,
  priority text default 'متوسط',
  status text default 'جدید',
  category text,
  assigned_to text,
  assigned_name text,
  created_by text,
  deadline date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_documents (
  id text primary key,
  title text not null,
  type text,
  hotel_id text,
  hotel_title text,
  file_url text,
  storage_path text,
  notes text,
  uploaded_by text,
  created_at timestamptz default now()
);

create table if not exists ihos_calendar_events (
  id text primary key,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  user_id text,
  hotel_id text,
  color text,
  created_at timestamptz default now()
);

create table if not exists ihos_notifications (
  id text primary key,
  title text not null,
  body text,
  user_id text,
  is_read boolean default false,
  entity_type text,
  entity_id text,
  created_at timestamptz default now()
);

create table if not exists ihos_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

insert into ihos_users (id, full_name, username, password_hash, role, team, zone, is_active)
values
('u-admin','محمدباقر ذوالفقاری','admin','123456','مدیر سیستم','مدیریت تأمین','کل کشور',true),
('u-1','فاطمه رنجبر','ranjbar','123456','کارشناس نرخ و ظرفیت','شرق و جنوب','شرق و جنوب',true),
('u-2','پگاه واعظین','vaezin','123456','کارشناس نرخ و ظرفیت','شمال و غرب','شمال و غرب',true),
('u-3','فائزه سالاری','salari','123456','کارشناس نرخ و ظرفیت','مرکز','مرکز',true)
on conflict (id) do nothing;

insert into ihos_hotels (id,title,city,province,star,status,contract_status,provider,capacity_total,site_visible,search_visible)
values
('h-1','هتل درویشی','مشهد','خراسان رضوی',5,'فعال','فعال','IHO Provider',220,true,true),
('h-2','هتل پارس','مشهد','خراسان رضوی',5,'فعال','نیازمند تمدید','IHO Provider',228,true,false),
('h-3','هتل آریان کیش','کیش','هرمزگان',4,'فعال','فعال','IHO Provider',73,true,true)
on conflict (id) do nothing;

-- Storage bucket for contracts, logos, favicons, settings assets
insert into storage.buckets (id, name, public)
values ('ihos-documents', 'ihos-documents', true)
on conflict (id) do update set public = true;

-- RLS policies for internal MVP. Replace with Supabase Auth/RBAC when moving to hardened production.
alter table ihos_users enable row level security;
alter table ihos_hotels enable row level security;
alter table ihos_tasks enable row level security;
alter table ihos_documents enable row level security;
alter table ihos_calendar_events enable row level security;
alter table ihos_notifications enable row level security;
alter table ihos_settings enable row level security;

drop policy if exists "ihos_users_all" on ihos_users;
drop policy if exists "ihos_hotels_all" on ihos_hotels;
drop policy if exists "ihos_tasks_all" on ihos_tasks;
drop policy if exists "ihos_documents_all" on ihos_documents;
drop policy if exists "ihos_calendar_events_all" on ihos_calendar_events;
drop policy if exists "ihos_notifications_all" on ihos_notifications;
drop policy if exists "ihos_settings_all" on ihos_settings;
create policy "ihos_users_all" on ihos_users for all using (true) with check (true);
create policy "ihos_hotels_all" on ihos_hotels for all using (true) with check (true);
create policy "ihos_tasks_all" on ihos_tasks for all using (true) with check (true);
create policy "ihos_documents_all" on ihos_documents for all using (true) with check (true);
create policy "ihos_calendar_events_all" on ihos_calendar_events for all using (true) with check (true);
create policy "ihos_notifications_all" on ihos_notifications for all using (true) with check (true);
create policy "ihos_settings_all" on ihos_settings for all using (true) with check (true);

drop policy if exists "ihos_storage_read" on storage.objects;
drop policy if exists "ihos_storage_insert" on storage.objects;
drop policy if exists "ihos_storage_update" on storage.objects;
drop policy if exists "ihos_storage_delete" on storage.objects;
create policy "ihos_storage_read" on storage.objects for select using (bucket_id = 'ihos-documents');
create policy "ihos_storage_insert" on storage.objects for insert with check (bucket_id = 'ihos-documents');
create policy "ihos_storage_update" on storage.objects for update using (bucket_id = 'ihos-documents') with check (bucket_id = 'ihos-documents');
create policy "ihos_storage_delete" on storage.objects for delete using (bucket_id = 'ihos-documents');

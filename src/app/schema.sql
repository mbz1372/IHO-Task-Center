-- IranHotel Operations System Enterprise v2 schema
-- Run this in Supabase SQL Editor, then redeploy Vercel.
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
  created_at timestamptz default now()
);

create table if not exists ihos_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

insert into ihos_users (id, full_name, username, password_hash, role, team, zone, is_active)
values
('u-admin','محمدباقر ذوالفقاری','admin','123456','مدیر سیستم','مدیریت تامین','کل کشور',true),
('u-1','فاطمه رنجبر','ranjbar','123456','کارشناس نرخ و ظرفیت','شرق و جنوب','شرق و جنوب',true),
('u-2','پگاه واعظین','vaezin','123456','کارشناس نرخ و ظرفیت','شمال و غرب','شمال و غرب',true),
('u-3','فائزه سالاری','salari','123456','کارشناس نرخ و ظرفیت','مرکز','مرکز',true)
on conflict (id) do nothing;

insert into ihos_hotels (id,title,city,province,star,status,contract_status,manager_name,manager_mobile,phone,address)
values
('h-1','هتل درویشی','مشهد','خراسان رضوی',5,'فعال','فعال','مدیریت رزرو','09150000000','051000000','مشهد'),
('h-2','هتل پارس','مشهد','خراسان رضوی',5,'فعال','نیازمند تمدید',null,null,null,null),
('h-3','هتل ارم','کیش','هرمزگان',4,'فعال','فعال',null,null,null,null),
('h-4','هتل اسپیناس','تهران','تهران',5,'فعال','فعال',null,null,null,null)
on conflict (id) do nothing;

-- Simple internal-app policies. For production, replace with Supabase Auth + RBAC policies.
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

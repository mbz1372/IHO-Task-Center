-- IranHotel Operations System Enterprise V4 schema
-- Safe to run over previous versions in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists ihos_roles (
  id text primary key,
  title text not null,
  description text,
  permissions jsonb default '{}'::jsonb,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_users (
  id text primary key,
  full_name text not null,
  username text unique not null,
  password_hash text not null default '123456',
  role text not null default 'کارشناس',
  role_id text,
  team text,
  zone text,
  mobile text,
  email text,
  avatar text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table ihos_users add column if not exists role_id text;

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

create table if not exists ihos_projects (
  id text primary key,
  title text not null,
  description text,
  owner_id text,
  member_ids jsonb default '[]'::jsonb,
  status text default 'فعال',
  deadline date,
  pinned_note text,
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
  due_time text,
  completed_at timestamptz,
  labels jsonb default '[]'::jsonb,
  collaborator_ids jsonb default '[]'::jsonb,
  project_id text,
  pinned_note text,
  estimated_minutes integer default 0,
  spent_minutes integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table ihos_tasks add column if not exists due_time text;
alter table ihos_tasks add column if not exists labels jsonb default '[]'::jsonb;
alter table ihos_tasks add column if not exists collaborator_ids jsonb default '[]'::jsonb;
alter table ihos_tasks add column if not exists project_id text;
alter table ihos_tasks add column if not exists pinned_note text;
alter table ihos_tasks add column if not exists estimated_minutes integer default 0;
alter table ihos_tasks add column if not exists spent_minutes integer default 0;

create table if not exists ihos_task_activities (
  id text primary key,
  task_id text not null,
  title text not null,
  description text,
  assigned_to text,
  is_done boolean default false,
  done_at timestamptz,
  done_by text,
  due_date date,
  due_time text,
  estimated_minutes integer default 0,
  spent_minutes integer default 0,
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
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table ihos_documents add column if not exists pinned boolean default false;
alter table ihos_documents add column if not exists updated_at timestamptz default now();

create table if not exists ihos_calendar_events (
  id text primary key,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  user_id text,
  hotel_id text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

create table if not exists ihos_activity_logs (
  id text primary key,
  user_id text,
  user_name text,
  action text not null,
  entity text not null,
  entity_id text,
  title text,
  duration_minutes integer default 0,
  created_at timestamptz default now()
);

create table if not exists ihos_reminders (
  id text primary key,
  title text not null,
  body text,
  user_id text,
  task_id text,
  notify_at timestamptz not null,
  is_done boolean default false,
  is_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_automations (
  id text primary key,
  title text not null,
  enabled boolean default true,
  trigger_type text default 'task_created',
  trigger_category text,
  assign_to text,
  priority text,
  status text,
  reminder_minutes integer,
  label text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_goals (
  id text primary key,
  title text not null,
  user_id text,
  category text,
  target_count integer default 0,
  start_date date not null,
  end_date date not null,
  metric text default 'activities_done',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ihos_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

insert into ihos_roles (id,title,description,permissions,is_system)
values
('role-admin','مدیر سیستم','دسترسی کامل','{"dashboard":true,"crm360":true,"reports":true,"tasks":true,"tasks_create":true,"tasks_edit":true,"tasks_delete":true,"assignments":true,"hotels":true,"hotels_import":true,"calendar":true,"documents":true,"documents_upload":true,"team":true,"roles":true,"logs":true,"reminders":true,"automations":true,"goals":true,"projects":true,"settings":true,"notifications":true}'::jsonb,true),
('role-city','سیتی منیجر','مدیریت منطقه و تیم','{"dashboard":true,"crm360":true,"reports":true,"tasks":true,"tasks_create":true,"tasks_edit":true,"assignments":true,"hotels":true,"calendar":true,"documents":true,"documents_upload":true,"reminders":true,"projects":true,"notifications":true,"logs":true}'::jsonb,true),
('role-expert','کارشناس','اجرای تسک‌های شخصی','{"dashboard":true,"crm360":true,"reports":true,"tasks":true,"tasks_edit":true,"hotels":true,"calendar":true,"documents":true,"reminders":true,"notifications":true}'::jsonb,true)
on conflict (id) do nothing;

insert into ihos_users (id, full_name, username, password_hash, role, role_id, team, zone, is_active)
values
('u-admin','محمدباقر ذوالفقاری','admin','123456','مدیر سیستم','role-admin','مدیریت تأمین','کل کشور',true),
('u-1','فاطمه رنجبر','ranjbar','123456','کارشناس','role-expert','شرق و جنوب','شرق و جنوب',true),
('u-2','پگاه واعظین','vaezin','123456','کارشناس','role-expert','شمال و غرب','شمال و غرب',true),
('u-3','فائزه سالاری','salari','123456','سیتی منیجر','role-city','مرکز','مرکز',true)
on conflict (id) do nothing;

insert into ihos_hotels (id,title,city,province,star,status,contract_status,provider,capacity_total,site_visible,search_visible)
values
('h-1','هتل درویشی','مشهد','خراسان رضوی',5,'فعال','فعال','IHO Provider',220,true,true),
('h-2','هتل پارس','مشهد','خراسان رضوی',5,'فعال','نیازمند تمدید','IHO Provider',228,true,false),
('h-3','هتل آریان کیش','کیش','هرمزگان',4,'فعال','فعال','IHO Provider',73,true,true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ihos-documents', 'ihos-documents', true)
on conflict (id) do update set public = true;

alter table ihos_roles enable row level security;
alter table ihos_users enable row level security;
alter table ihos_hotels enable row level security;
alter table ihos_projects enable row level security;
alter table ihos_tasks enable row level security;
alter table ihos_task_activities enable row level security;
alter table ihos_documents enable row level security;
alter table ihos_calendar_events enable row level security;
alter table ihos_notifications enable row level security;
alter table ihos_activity_logs enable row level security;
alter table ihos_reminders enable row level security;
alter table ihos_automations enable row level security;
alter table ihos_goals enable row level security;
alter table ihos_settings enable row level security;

-- MVP internal policies. Harden with Supabase Auth for production.
do $$
declare t text;
begin
  foreach t in array array['ihos_roles','ihos_users','ihos_hotels','ihos_projects','ihos_tasks','ihos_task_activities','ihos_documents','ihos_calendar_events','ihos_notifications','ihos_activity_logs','ihos_reminders','ihos_automations','ihos_goals','ihos_settings'] loop
    execute format('drop policy if exists %I on %I', t || '_all', t);
    execute format('create policy %I on %I for all using (true) with check (true)', t || '_all', t);
  end loop;
end$$;

drop policy if exists ihos_storage_read on storage.objects;
drop policy if exists ihos_storage_insert on storage.objects;
drop policy if exists ihos_storage_update on storage.objects;
drop policy if exists ihos_storage_delete on storage.objects;
create policy ihos_storage_read on storage.objects for select using (bucket_id = 'ihos-documents');
create policy ihos_storage_insert on storage.objects for insert with check (bucket_id = 'ihos-documents');
create policy ihos_storage_update on storage.objects for update using (bucket_id = 'ihos-documents') with check (bucket_id = 'ihos-documents');
create policy ihos_storage_delete on storage.objects for delete using (bucket_id = 'ihos-documents');


-- V5 Super App extensions for CRM-grade future modules
create table if not exists ihos_contacts (
  id text primary key,
  hotel_id text,
  full_name text not null,
  position text,
  mobile text,
  phone text,
  email text,
  is_primary boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_interactions (
  id text primary key,
  hotel_id text,
  contact_id text,
  user_id text,
  type text default 'call',
  subject text,
  body text,
  result text,
  next_follow_up timestamptz,
  duration_minutes integer default 0,
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_pipelines (
  id text primary key,
  title text not null,
  entity text default 'hotel',
  stages jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_saved_views (
  id text primary key,
  title text not null,
  user_id text,
  entity text,
  filters jsonb default '{}'::jsonb,
  columns jsonb default '[]'::jsonb,
  is_shared boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_templates (
  id text primary key,
  title text not null,
  type text,
  payload jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ihos_contacts enable row level security;
alter table ihos_interactions enable row level security;
alter table ihos_pipelines enable row level security;
alter table ihos_saved_views enable row level security;
alter table ihos_templates enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ihos_contacts','ihos_interactions','ihos_pipelines','ihos_saved_views','ihos_templates'] loop
    execute format('drop policy if exists %I on %I', t || '_all', t);
    execute format('create policy %I on %I for all using (true) with check (true)', t || '_all', t);
  end loop;
end$$;

-- V7 Full Operations OS modules
create table if not exists ihos_hotel_communications (
  id text primary key,
  hotel_id text,
  hotel_title text,
  channel text,
  contact_person text,
  result text,
  next_followup_at timestamptz,
  created_by text,
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_contracts (
  id text primary key,
  hotel_id text,
  hotel_title text,
  contract_type text,
  commission text,
  payment_period integer,
  start_date date,
  end_date date,
  status text default 'در جریان',
  file_url text,
  owner_id text,
  renewal_task_id text,
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_saved_views (
  id text primary key,
  title text not null,
  module text not null,
  filters jsonb default '{}'::jsonb,
  owner_id text,
  is_shared boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_playbooks (
  id text primary key,
  title text not null,
  category text,
  steps jsonb default '[]'::jsonb,
  sla_hours integer default 24,
  auto_create_activities boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists ihos_internal_messages (
  id text primary key,
  body text not null,
  sender_id text,
  mentioned_user_ids jsonb default '[]'::jsonb,
  entity_type text,
  entity_id text,
  is_read_by jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
create table if not exists ihos_sla_rules (
  id text primary key,
  category text not null,
  title text not null,
  sla_hours integer not null default 24,
  priority text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$ begin alter publication supabase_realtime add table ihos_hotel_communications; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ihos_contracts; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ihos_saved_views; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ihos_playbooks; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ihos_internal_messages; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table ihos_sla_rules; exception when duplicate_object then null; when undefined_object then null; end $$;

-- Hotel SuperApp V2
create table if not exists public.ihos_hotel_automation (
  id text primary key,
  hotel_id text not null,
  hotel_code text,
  provider text default 'IHO Provider',
  hotel_rate boolean default false,
  hotel_capacity boolean default false,
  rate_expert text,
  capacity_expert text,
  updated_at timestamptz default now()
);
create index if not exists ihos_hotel_automation_hotel_idx on public.ihos_hotel_automation(hotel_id);
create index if not exists ihos_hotel_automation_provider_idx on public.ihos_hotel_automation(provider);

create table if not exists public.ihos_provider_rules (
  id text primary key,
  name text unique not null,
  rate_api boolean default false,
  capacity_api boolean default false,
  active boolean default true,
  effective_from date,
  replacement_provider text,
  priority int default 100,
  updated_at timestamptz default now()
);

alter table public.ihos_hotel_automation enable row level security;
alter table public.ihos_provider_rules enable row level security;
do $$ begin
  create policy "authenticated hotel automation" on public.ihos_hotel_automation for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "authenticated provider rules" on public.ihos_provider_rules for all using (true) with check (true);
exception when duplicate_object then null; end $$;

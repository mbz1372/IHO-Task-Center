create extension if not exists pgcrypto;

create table if not exists public.ihos_users(
 id text primary key,
 full_name text,
 username text unique,
 password_hash text,
 role_title text,
 team_name text,
 is_active boolean default true,
 kpi numeric default 70,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create table if not exists public.ihos_hotels(
 id text primary key,
 title text,
 city text,
 province text,
 category text,
 provider text,
 health_score numeric default 70,
 capacity_status text,
 rate_status text,
 contract_status text,
 open_tasks integer default 0,
 revenue numeric default 0,
 raw jsonb default '{}'::jsonb,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create table if not exists public.ihos_tasks(
 id text primary key,
 title text not null,
 description text,
 hotel_id text,
 hotel_title text,
 city text,
 status text default 'جدید',
 priority text default 'متوسط',
 category text,
 assigned_to text,
 assigned_to_name text,
 deadline date,
 progress numeric default 0,
 activities jsonb default '[]'::jsonb,
 created_by text,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create table if not exists public.ihos_reservations(
 id text primary key,
 hotel_id text,
 hotel_title text,
 status text,
 channel text,
 amount numeric default 0,
 reservation_date date,
 raw jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);

create table if not exists public.ihos_documents(
 id text primary key,
 hotel_id text,
 title text,
 type text,
 file_url text,
 uploaded_by text,
 created_at timestamptz default now()
);

create table if not exists public.ihos_activity_logs(
 id text primary key,
 user_id text,
 user_name text,
 action text,
 entity text,
 entity_id text,
 metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);

create table if not exists public.ihos_notifications(
 id text primary key,
 user_id text,
 title text,
 body text,
 is_read boolean default false,
 created_at timestamptz default now()
);

create table if not exists public.ihos_settings(
 id text primary key,
 key text unique,
 value jsonb,
 updated_at timestamptz default now()
);

create table if not exists public.ihos_contracts(
 id text primary key,
 hotel_id text,
 hotel_title text,
 start_date date,
 end_date date,
 commission numeric,
 payment_period text,
 status text,
 file_url text,
 owner_id text,
 created_at timestamptz default now()
);

create table if not exists public.ihos_hotel_communications(
 id text primary key,
 hotel_id text,
 hotel_title text,
 channel text,
 subject text,
 body text,
 result text,
 next_followup_at timestamptz,
 created_by text,
 created_by_name text,
 created_at timestamptz default now()
);

insert into public.ihos_users(id,full_name,username,password_hash,role_title,team_name,is_active,kpi)
values('u-admin','محمدباقر ذوالفقاری','admin','123456','مدیر کل','مدیریت',true,95)
on conflict(id) do update set full_name=excluded.full_name,username=excluded.username;

alter table public.ihos_users enable row level security;
alter table public.ihos_hotels enable row level security;
alter table public.ihos_tasks enable row level security;
alter table public.ihos_reservations enable row level security;
alter table public.ihos_documents enable row level security;
alter table public.ihos_activity_logs enable row level security;
alter table public.ihos_notifications enable row level security;
alter table public.ihos_settings enable row level security;
alter table public.ihos_contracts enable row level security;
alter table public.ihos_hotel_communications enable row level security;

do $$ declare t text; begin
 foreach t in array array['ihos_users','ihos_hotels','ihos_tasks','ihos_reservations','ihos_documents','ihos_activity_logs','ihos_notifications','ihos_settings','ihos_contracts','ihos_hotel_communications'] loop
  execute format('drop policy if exists "allow all %s" on public.%I',t,t);
  execute format('create policy "allow all %s" on public.%I for all using (true) with check (true)',t,t);
 end loop;
end $$;

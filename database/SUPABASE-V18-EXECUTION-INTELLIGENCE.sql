-- IranHotel OS V18 — Execution Intelligence
-- Safe to run after the V17 migration in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1) Explicit hotel ownership. Closing an assignment keeps its history.
create table if not exists public.ihos_hotel_assignments (
  id text primary key,
  hotel_id text not null,
  hotel_title text,
  user_id text not null,
  user_name text,
  assignment_role text not null,
  is_primary boolean not null default true,
  active boolean not null default true,
  started_at date not null default current_date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ihos_hotel_assignment_role_check check (assignment_role in ('city_manager','account_manager','rate_expert','capacity_expert'))
);
create index if not exists idx_hotel_assignments_hotel on public.ihos_hotel_assignments(hotel_id,active);
create index if not exists idx_hotel_assignments_user on public.ihos_hotel_assignments(user_id,active);
create unique index if not exists idx_hotel_assignments_active_role
  on public.ihos_hotel_assignments(hotel_id,assignment_role) where active=true and is_primary=true;

-- 2) A normalized hotel event stream powers the hotel timeline.
create table if not exists public.ihos_hotel_events (
  id text primary key,
  hotel_id text not null,
  hotel_title text,
  event_type text not null,
  title text not null,
  description text,
  severity text not null default 'info',
  actor_id text,
  actor_name text,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_hotel_events_timeline on public.ihos_hotel_events(hotel_id,occurred_at desc);
create index if not exists idx_hotel_events_type on public.ihos_hotel_events(event_type,occurred_at desc);

-- 3) Turn the formerly lightweight communication record into a real timeline item.
alter table if exists public.ihos_hotel_communications add column if not exists subject text;
alter table if exists public.ihos_hotel_communications add column if not exists body text;
alter table if exists public.ihos_hotel_communications add column if not exists created_by_name text;
alter table if exists public.ihos_hotel_communications add column if not exists followup_completed boolean default false;
alter table if exists public.ihos_hotel_communications add column if not exists duration_minutes integer default 0;
create index if not exists idx_hotel_communications_timeline on public.ihos_hotel_communications(hotel_id,created_at desc);
create index if not exists idx_hotel_communications_followup on public.ihos_hotel_communications(next_followup_at) where followup_completed=false;

-- 4) Trace task provenance and prevent duplicate automation output.
alter table if exists public.ihos_tasks add column if not exists source_type text;
alter table if exists public.ihos_tasks add column if not exists source_id text;
alter table if exists public.ihos_tasks add column if not exists automation_id text;
alter table if exists public.ihos_tasks add column if not exists sla_due_at timestamptz;
create index if not exists idx_tasks_automation_source on public.ihos_tasks(automation_id,source_type,source_id);
create index if not exists idx_tasks_open_deadline on public.ihos_tasks(deadline,status);

alter table if exists public.ihos_automations add column if not exists condition_days integer default 45;
alter table if exists public.ihos_automations add column if not exists action_type text default 'create_task';
alter table if exists public.ihos_automations add column if not exists task_template text;
alter table if exists public.ihos_automations add column if not exists max_per_run integer default 25;

create table if not exists public.ihos_automation_runs (
  id text primary key,
  automation_id text not null,
  automation_title text,
  trigger_type text,
  matched_count integer not null default 0,
  created_count integer not null default 0,
  skipped_count integer not null default 0,
  status text not null default 'success',
  message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_automation_runs_rule on public.ihos_automation_runs(automation_id,created_at desc);

-- 5) KPI definitions/snapshots and hotel operational input for future integrations.
create table if not exists public.ihos_kpi_definitions (
  id text primary key,
  title text not null,
  metric_key text not null,
  role_id text,
  team text,
  target_value numeric not null default 0,
  weight numeric not null default 1,
  period text not null default 'monthly',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ihos_kpi_snapshots (
  id text primary key,
  definition_id text,
  user_id text,
  user_name text,
  period_start date not null,
  period_end date not null,
  actual_value numeric not null default 0,
  target_value numeric not null default 0,
  score numeric not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_kpi_snapshots_user_period on public.ihos_kpi_snapshots(user_id,period_start,period_end);

create table if not exists public.ihos_hotel_daily_metrics (
  id text primary key,
  hotel_id text not null,
  hotel_title text,
  snapshot_date date not null default current_date,
  source text not null default 'manual',
  available_capacity numeric default 0,
  online_capacity numeric default 0,
  rate_index numeric,
  booking_count integer default 0,
  gross_sales numeric default 0,
  cancellation_rate numeric default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_hotel_daily_metrics_unique on public.ihos_hotel_daily_metrics(hotel_id,snapshot_date,source);

-- 6) Automatically append task and communication events to each hotel timeline.
create or replace function public.ihos_capture_task_event()
returns trigger language plpgsql security definer set search_path=public as $$
declare event_name text; event_title text; event_severity text;
begin
  if new.hotel_id is null then return new; end if;
  if tg_op='INSERT' then
    event_name:='task_created'; event_title:='تسک جدید: '||coalesce(new.title,'بدون عنوان'); event_severity:='info';
  elsif coalesce(old.status,'') is distinct from coalesce(new.status,'') then
    event_name:='task_status_changed'; event_title:='تغییر وضعیت تسک به '||coalesce(new.status,'نامشخص');
    event_severity:=case when new.status in ('انجام شد','بسته شده','تایید شده') then 'success' else 'info' end;
  else
    return new;
  end if;
  insert into public.ihos_hotel_events(id,hotel_id,hotel_title,event_type,title,description,severity,actor_id,entity_type,entity_id,payload,occurred_at)
  values(gen_random_uuid()::text,new.hotel_id,new.hotel_title,event_name,event_title,new.description,event_severity,new.created_by,'task',new.id,jsonb_build_object('status',new.status,'priority',new.priority,'assigned_to',new.assigned_to,'deadline',new.deadline),now());
  return new;
end$$;
drop trigger if exists trg_ihos_task_hotel_event on public.ihos_tasks;
create trigger trg_ihos_task_hotel_event after insert or update of status on public.ihos_tasks for each row execute function public.ihos_capture_task_event();

create or replace function public.ihos_capture_communication_event()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.hotel_id is null then return new; end if;
  insert into public.ihos_hotel_events(id,hotel_id,hotel_title,event_type,title,description,severity,actor_id,actor_name,entity_type,entity_id,payload,occurred_at)
  values(gen_random_uuid()::text,new.hotel_id,new.hotel_title,'communication',coalesce(new.subject,'ارتباط از طریق '||coalesce(new.channel,'نامشخص')),coalesce(new.body,new.result),'info',new.created_by,new.created_by_name,'communication',new.id,jsonb_build_object('channel',new.channel,'result',new.result,'next_followup_at',new.next_followup_at),coalesce(new.created_at,now()));
  return new;
end$$;
drop trigger if exists trg_ihos_communication_hotel_event on public.ihos_hotel_communications;
create trigger trg_ihos_communication_hotel_event after insert on public.ihos_hotel_communications for each row execute function public.ihos_capture_communication_event();

-- 7) Read-friendly KPI view for reporting and export.
create or replace view public.ihos_user_kpi_v as
select
  u.id as user_id,
  u.full_name,
  u.team,
  u.zone,
  count(t.id)::int as total_tasks,
  count(t.id) filter (where t.status in ('انجام شد','بسته شده','تایید شده'))::int as completed_tasks,
  count(t.id) filter (where t.deadline<current_date and t.status not in ('انجام شد','بسته شده','تایید شده'))::int as overdue_tasks,
  count(t.id) filter (where t.status not in ('انجام شد','بسته شده','تایید شده'))::int as open_tasks,
  round(100.0*count(t.id) filter (where t.status in ('انجام شد','بسته شده','تایید شده'))/nullif(count(t.id),0),1) as completion_rate
from public.ihos_users u
left join public.ihos_tasks t on t.assigned_to=u.id
where u.is_active=true
group by u.id,u.full_name,u.team,u.zone;

-- 8) Enable access under the current anon-key architecture and Realtime refresh.
do $$
declare t text;
begin
  foreach t in array array['ihos_hotel_assignments','ihos_hotel_events','ihos_automation_runs','ihos_kpi_definitions','ihos_kpi_snapshots','ihos_hotel_daily_metrics'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_all',t);
    execute format('create policy %I on public.%I for all using (true) with check (true)',t||'_all',t);
  end loop;
end$$;
grant select on public.ihos_user_kpi_v to anon,authenticated;
do $$ begin alter publication supabase_realtime add table public.ihos_hotel_assignments; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.ihos_hotel_events; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.ihos_automation_runs; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.ihos_hotel_daily_metrics; exception when duplicate_object then null; when undefined_object then null; end $$;

-- 9) Default enterprise permissions and practical starter rules.
update public.ihos_roles set permissions=coalesce(permissions,'{}'::jsonb)||'{"controlTower":true,"hotelOwnership":true,"kpiCenter":true}'::jsonb where id='role-admin';
update public.ihos_roles set permissions=coalesce(permissions,'{}'::jsonb)||'{"controlTower":true,"hotelOwnership":true,"kpiCenter":true,"communications":true}'::jsonb where id='role-city';
update public.ihos_roles set permissions=coalesce(permissions,'{}'::jsonb)||'{"inbox":true,"communications":true,"tasks_create":true}'::jsonb where id='role-expert';

insert into public.ihos_automations(id,title,enabled,trigger_type,trigger_category,condition_days,action_type,task_template,max_per_run,priority,status,label,created_at,updated_at)
values
  ('auto-v18-no-capacity','پیگیری خودکار هتل بدون ظرفیت',true,'hotel_no_capacity','ظرفیت',1,'create_task','دریافت ظرفیت {hotel}',25,'فوری','جدید','اتوماسیون',now(),now()),
  ('auto-v18-contract','هشدار تمدید قرارداد',true,'contract_expiring','قرارداد',45,'create_task','پیگیری تمدید قرارداد {hotel}',25,'بالا','جدید','قرارداد',now(),now()),
  ('auto-v18-overdue','جمع‌آوری تسک‌های معوق',true,'task_overdue','پیگیری',1,'create_task','رفع تأخیر {hotel}',25,'بالا','جدید','SLA',now(),now()),
  ('auto-v18-unassigned','شناسایی هتل بدون مسئول',true,'hotel_unassigned','پیگیری',1,'create_task','تعیین مسئول {hotel}',25,'بالا','جدید','مالکیت',now(),now())
on conflict(id) do nothing;

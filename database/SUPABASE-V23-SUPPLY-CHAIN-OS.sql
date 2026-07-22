-- IHO Task Center V23 — Supply Chain Operating System
-- Idempotent migration. The UI also has a durable ihos_settings fallback so it works before this migration is applied.

create table if not exists public.ihos_work_action_types (
  id text primary key,
  code text not null unique,
  title text not null,
  group_name text not null default 'سایر',
  weight numeric not null default 1,
  default_minutes integer not null default 10,
  requires_reservation_code boolean not null default false,
  active boolean not null default true,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ihos_work_reports (
  id text primary key,
  user_id text,
  user_name text not null,
  department_id text,
  department_name text,
  hotel_id text not null,
  hotel_code text,
  hotel_title text not null,
  action_type_id text,
  action_code text,
  action_title text not null,
  action_group text,
  weight numeric not null default 1,
  reservation_code text,
  channel text,
  note text not null,
  result text,
  spent_minutes integer not null default 0,
  occurred_at timestamptz not null default now(),
  follow_up_at timestamptz,
  source text not null default 'app',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_work_reports_user_time on public.ihos_work_reports(user_id,occurred_at desc);
create index if not exists idx_work_reports_hotel_time on public.ihos_work_reports(hotel_id,occurred_at desc);
create index if not exists idx_work_reports_action on public.ihos_work_reports(action_code,occurred_at desc);
create index if not exists idx_work_reports_reservation on public.ihos_work_reports(reservation_code) where reservation_code is not null;

create table if not exists public.ihos_hotel_sales_metrics (
  id text primary key,
  hotel_id text not null,
  hotel_code text,
  hotel_title text,
  metric_date date not null,
  confirmed_bookings integer not null default 0,
  unconfirmed_bookings integer not null default 0,
  room_nights numeric not null default 0,
  gross_sales numeric not null default 0,
  margin_amount numeric not null default 0,
  cancellations integer not null default 0,
  source_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sales_metrics_hotel_date on public.ihos_hotel_sales_metrics(hotel_id,metric_date desc);
create index if not exists idx_sales_metrics_date on public.ihos_hotel_sales_metrics(metric_date desc);

create table if not exists public.ihos_hotel_blockers (
  id text primary key,
  hotel_id text not null,
  hotel_code text,
  hotel_title text not null,
  blocker_type text,
  title text not null,
  description text,
  severity text not null default 'متوسط',
  status text not null default 'باز',
  owner_id text,
  owner_name text,
  department_id text,
  department_name text,
  opened_at timestamptz not null default now(),
  due_at timestamptz,
  resolved_at timestamptz,
  resolution text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_hotel_blockers_status on public.ihos_hotel_blockers(status,severity,due_at);
create index if not exists idx_hotel_blockers_hotel on public.ihos_hotel_blockers(hotel_id,status);

create table if not exists public.ihos_standard_processes (
  id text primary key,
  title text not null,
  category text,
  department_id text,
  department_name text,
  target_minutes integer,
  sla_hours numeric,
  steps jsonb not null default '[]'::jsonb,
  report_requirements jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ihos_hotel_workflows (
  id text primary key,
  hotel_id text not null,
  hotel_title text,
  process_id text,
  process_title text,
  from_department_id text,
  from_department_name text,
  to_department_id text,
  to_department_name text,
  owner_id text,
  owner_name text,
  status text not null default 'در جریان',
  current_step integer not null default 1,
  started_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_hotel_workflows_hotel on public.ihos_hotel_workflows(hotel_id,status);
create index if not exists idx_hotel_workflows_department on public.ihos_hotel_workflows(to_department_id,status);

create table if not exists public.ihos_kpi_definitions (
  id text primary key,
  title text not null,
  metric_key text not null,
  scope text not null default 'expert',
  target_value numeric not null default 0,
  period text not null default 'monthly',
  weight numeric not null default 1,
  department_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.ihos_hotel_communications add column if not exists subject text;
alter table if exists public.ihos_hotel_communications add column if not exists body text;
alter table if exists public.ihos_hotel_communications add column if not exists created_by_name text;
alter table if exists public.ihos_hotel_communications add column if not exists duration_minutes integer default 0;

insert into public.ihos_work_action_types(id,code,title,group_name,weight,default_minutes,requires_reservation_code)
values
('action-rate_update','rate_update','🔄 آپدیت نرخ','نرخ',2,12,false),
('action-promotion','promotion','🎁 دریافت پروموشن','نرخ',3,20,false),
('action-panel_access','panel_access','🔓 دسترسی نرخ و ظرفیت به هتل','آنلاین‌سازی',4,30,false),
('action-rate_scrape','rate_scrape','🔍 اسکرپ نرخی','نرخ',2,15,false),
('action-rate_mismatch','rate_mismatch','⚠️ پیگیری مغایرت نرخ','نرخ',4,25,true),
('action-foreign_rate','foreign_rate','🌍 نرخ مهمان خارجی','نرخ',3,20,false),
('action-extra_profit','extra_profit','💰 دریافت سود مازاد','تجاری',4,30,true),
('action-review_response','review_response','💬 پاسخ به در انتظار بررسی کارشناس','پیگیری',2,10,false),
('action-cancel','cancel','❌ کنسلی','رزرو',3,18,true),
('action-half_charge','half_charge','🕒 نیم‌شارژ','رزرو',3,18,true),
('action-yellow_rate','yellow_rate','🟡 نرخ زرد','نرخ',2,12,false),
('action-capacity_update','capacity_update','🔁 آپدیت ظرفیت','ظرفیت',3,15,false),
('action-over_capacity','over_capacity','⚠️ اوور ظرفیت','ظرفیت',5,30,true),
('action-extra_capacity','extra_capacity','➕ ظرفیت مازاد','ظرفیت',3,18,false),
('action-capacity_cover','capacity_cover','🧩 پوش ظرفیت','ظرفیت',3,18,false),
('action-other','other','⚙️ سایر','سایر',1,10,false),
('action-sheba','sheba','💳 تغییر شبا','مالی',4,30,false),
('action-panel_training','panel_training','🎓 آموزش پنل','آنلاین‌سازی',5,45,false),
('action-hotel_suggestion','hotel_suggestion','🏨 پیشنهاد هتل','تجاری',2,12,false),
('action-hotel_contact','hotel_contact','📞 ارتباط با هتل','ارتباط',2,10,false),
('action-hotel_mapping','hotel_mapping','📍 مپ کردن هتل','آنلاین‌سازی',4,25,false),
('action-agency','agency','🧭 تعیین آژانس','عملیات',3,20,false),
('action-dashboard_review','dashboard_review','📊 بررسی داشبورد','تحلیل',2,15,false),
('action-payment_followup','payment_followup','💰 پیگیری واریزی','مالی',3,20,true),
('action-package','package','🎁 پکیج','تجاری',3,20,false),
('action-minimum_stay','minimum_stay','🛏️ حداقل اقامت','نرخ',3,15,false),
('action-reservation_rate_fix','reservation_rate_fix','اصلاح نرخ رزرو','رزرو',4,25,true),
('action-club_offer','club_offer','آفر باشگاه','تجاری',3,20,false),
('action-seasonal_notes','seasonal_notes','نکات فصلی','تحلیل',2,15,false)
on conflict (id) do update set title=excluded.title,group_name=excluded.group_name,weight=excluded.weight,default_minutes=excluded.default_minutes,requires_reservation_code=excluded.requires_reservation_code,updated_at=now();

do $$
declare table_name text;
begin
  foreach table_name in array array['ihos_work_action_types','ihos_work_reports','ihos_hotel_sales_metrics','ihos_hotel_blockers','ihos_standard_processes','ihos_hotel_workflows','ihos_kpi_definitions'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('drop policy if exists %I on public.%I',table_name||'_all',table_name);
    execute format('create policy %I on public.%I for all using (true) with check (true)',table_name||'_all',table_name);
    execute format('grant select,insert,update,delete on public.%I to anon,authenticated',table_name);
  end loop;
end $$;

update public.ihos_roles
set permissions=coalesce(permissions,'{}'::jsonb)||'{"workReports":true,"dashboard":true}'::jsonb,
    updated_at=now()
where id in ('role-admin','role-city','role-expert');

do $$
declare table_name text;
begin
  foreach table_name in array array['ihos_work_reports','ihos_hotel_sales_metrics','ihos_hotel_blockers','ihos_hotel_workflows'] loop
    begin execute format('alter publication supabase_realtime add table public.%I',table_name);
    exception when duplicate_object then null; when undefined_object then null; end;
  end loop;
end $$;

notify pgrst, 'reload schema';


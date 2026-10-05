-- IHO Task Center V22
-- Department-aware users/tasks and expert profile images.

begin;

create table if not exists public.ihos_departments (
  id text primary key,
  name text not null unique,
  description text,
  color text not null default '#2563eb',
  manager_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.ihos_users
  add column if not exists avatar text,
  add column if not exists department_id text,
  add column if not exists department_name text;

alter table if exists public.ihos_tasks
  add column if not exists department_id text,
  add column if not exists department_name text;

create index if not exists ihos_users_department_id_idx on public.ihos_users (department_id);
create index if not exists ihos_tasks_department_id_idx on public.ihos_tasks (department_id);
create index if not exists ihos_departments_active_idx on public.ihos_departments (is_active);

insert into public.ihos_departments (id,name,description,color,manager_id,is_active)
values ('dept-supply','تأمین و عملیات','مدیریت تأمین، ظرفیت، نرخ و عملیات هتل‌ها','#2563eb','u-admin',true)
on conflict (id) do update set
  name=excluded.name,
  description=coalesce(public.ihos_departments.description,excluded.description),
  color=coalesce(public.ihos_departments.color,excluded.color),
  updated_at=now();

update public.ihos_users
set department_id='dept-supply', department_name='تأمین و عملیات'
where department_id is null;

update public.ihos_tasks as task
set department_id=coalesce(task.department_id,usr.department_id),
    department_name=coalesce(task.department_name,usr.department_name)
from public.ihos_users as usr
where task.assigned_to=usr.id and task.department_id is null;

alter table public.ihos_departments enable row level security;
drop policy if exists "ihos_departments_all" on public.ihos_departments;
create policy "ihos_departments_all" on public.ihos_departments for all using (true) with check (true);

grant select,insert,update,delete on public.ihos_departments to anon,authenticated;
grant select,insert,update,delete on public.ihos_users to anon,authenticated;
grant select,insert,update,delete on public.ihos_tasks to anon,authenticated;

commit;

notify pgrst, 'reload schema';

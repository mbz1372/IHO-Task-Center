-- IHO Task Center V22 — ownership sync, provider upload safety and message delivery
-- Safe/idempotent. Run once in Supabase SQL Editor after the base schema.

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

create table if not exists public.ihos_messages (
  id text primary key,
  sender_id text not null,
  sender_name text not null,
  recipient_type text not null default 'team',
  recipient_id text,
  recipient_name text,
  hotel_id text,
  hotel_title text,
  body text not null,
  parent_id text,
  is_important boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ihos_notifications (
  id text primary key,
  title text not null,
  body text,
  user_id text,
  is_read boolean not null default false,
  entity_type text,
  entity_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_assignments_hotel on public.ihos_hotel_assignments(hotel_id,active);
create index if not exists idx_hotel_assignments_user on public.ihos_hotel_assignments(user_id,active);
create unique index if not exists idx_hotel_assignments_active_role on public.ihos_hotel_assignments(hotel_id,assignment_role) where active=true and is_primary=true;
create index if not exists idx_messages_recipient on public.ihos_messages(recipient_type,recipient_id,created_at desc);
create index if not exists idx_notifications_user_unread on public.ihos_notifications(user_id,is_read,created_at desc);

alter table public.ihos_hotel_assignments enable row level security;
alter table public.ihos_messages enable row level security;
alter table public.ihos_notifications enable row level security;

drop policy if exists ihos_hotel_assignments_all on public.ihos_hotel_assignments;
create policy ihos_hotel_assignments_all on public.ihos_hotel_assignments for all using (true) with check (true);
drop policy if exists "messages read" on public.ihos_messages;
drop policy if exists "messages write" on public.ihos_messages;
create policy "messages read" on public.ihos_messages for select using (true);
create policy "messages write" on public.ihos_messages for all using (true) with check (true);
drop policy if exists ihos_notifications_all on public.ihos_notifications;
create policy ihos_notifications_all on public.ihos_notifications for all using (true) with check (true);

grant select,insert,update,delete on public.ihos_hotel_assignments to anon,authenticated;
grant select,insert,update,delete on public.ihos_messages to anon,authenticated;
grant select,insert,update,delete on public.ihos_notifications to anon,authenticated;

-- Database-side delivery makes message notifications reliable even when the sender closes the page.
create or replace function public.notify_ihos_message_recipients()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ihos_notifications(id,title,body,user_id,is_read,entity_type,entity_id,created_at)
  select
    'message-notification-' || new.id || '-' || u.id,
    'پیام جدید از ' || new.sender_name,
    left(new.body,180),
    u.id,
    false,
    'message',
    new.id,
    new.created_at
  from public.ihos_users u
  where u.id <> new.sender_id
    and coalesce(u.is_active,true)=true
    and (
      new.recipient_type='all'
      or (new.recipient_type='team' and u.team=new.recipient_id)
      or (new.recipient_type='user' and u.id=new.recipient_id)
    )
  on conflict (id) do update set
    title=excluded.title,
    body=excluded.body,
    user_id=excluded.user_id,
    entity_id=excluded.entity_id;
  return new;
end;
$$;

drop trigger if exists trg_ihos_message_notifications on public.ihos_messages;
create trigger trg_ihos_message_notifications
after insert on public.ihos_messages
for each row execute function public.notify_ihos_message_recipients();

do $$ begin
  alter publication supabase_realtime add table public.ihos_hotel_assignments;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ihos_messages;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ihos_notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;

notify pgrst, 'reload schema';

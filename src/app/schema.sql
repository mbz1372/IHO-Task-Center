-- Supabase schema for online/realtime version
create table if not exists tasks (
  id text primary key,
  title text not null,
  hotel_id int,
  hotel_name text,
  city text,
  category text,
  priority text,
  status text,
  assignee text,
  manager text,
  due_date date,
  description text,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table tasks enable row level security;
create policy "public read" on tasks for select using (true);
create policy "public insert" on tasks for insert with check (true);
create policy "public update" on tasks for update using (true);

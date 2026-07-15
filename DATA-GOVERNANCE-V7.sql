-- IHO Operations OS V7 - Data governance, recycle bin and secure delete audit
create extension if not exists pgcrypto;
create table if not exists public.ihos_recycle_bin (
 id uuid primary key default gen_random_uuid(),
 source_table text not null,
 source_id text,
 payload jsonb not null,
 deleted_by_id text,
 deleted_by_username text,
 deleted_by_name text,
 delete_action text not null,
 deleted_at timestamptz not null default now(),
 restored_at timestamptz,
 restored_by text
);
create index if not exists ihos_recycle_bin_source_idx on public.ihos_recycle_bin(source_table,source_id);
create index if not exists ihos_recycle_bin_deleted_at_idx on public.ihos_recycle_bin(deleted_at desc);
create table if not exists public.ihos_secure_delete_logs (
 id uuid primary key default gen_random_uuid(),
 table_name text not null,
 record_id text,
 action text not null,
 deleted_count integer not null default 0,
 actor_id text,
 actor_username text,
 actor_name text,
 created_at timestamptz not null default now()
);
create index if not exists ihos_secure_delete_logs_created_idx on public.ihos_secure_delete_logs(created_at desc);
alter table public.ihos_recycle_bin enable row level security;
alter table public.ihos_secure_delete_logs enable row level security;
-- No anon policies are intentionally created. Only the server-side service role route can write/read these tables.

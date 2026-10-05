-- IHO Task Center V21 — Hotel/provider execution pipeline
-- Run after V20. Safe to run more than once.

alter table public.ihos_provider_coverage add column if not exists connection_status text not null default 'eligible';
alter table public.ihos_provider_coverage add column if not exists priority integer not null default 50;
alter table public.ihos_provider_coverage add column if not exists rate_live boolean not null default false;
alter table public.ihos_provider_coverage add column if not exists capacity_live boolean not null default false;
alter table public.ihos_provider_coverage add column if not exists blocker_reason text;
alter table public.ihos_provider_coverage add column if not exists next_action text;
alter table public.ihos_provider_coverage add column if not exists owner_name text;
alter table public.ihos_provider_coverage add column if not exists live_at timestamptz;

alter table public.ihos_provider_coverage drop constraint if exists ihos_provider_coverage_connection_status_check;
alter table public.ihos_provider_coverage add constraint ihos_provider_coverage_connection_status_check
  check (connection_status in ('eligible','queued','connecting','testing','live','blocked','rejected','retired'));
alter table public.ihos_provider_coverage drop constraint if exists ihos_provider_coverage_priority_check;
alter table public.ihos_provider_coverage add constraint ihos_provider_coverage_priority_check check (priority between 1 and 999);

create index if not exists idx_provider_coverage_execution on public.ihos_provider_coverage(provider,connection_status,priority);
create index if not exists idx_provider_coverage_live on public.ihos_provider_coverage(rate_live,capacity_live) where active=true;

notify pgrst, 'reload schema';

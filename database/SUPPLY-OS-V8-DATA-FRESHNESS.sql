alter table public.sco_hotels add column if not exists capacity_verified_at timestamptz;
alter table public.sco_hotels add column if not exists rate_verified_at timestamptz;
create index if not exists sco_capacity_freshness_idx on public.sco_hotels(capacity_verified_at);
create index if not exists sco_rate_freshness_idx on public.sco_hotels(rate_verified_at);
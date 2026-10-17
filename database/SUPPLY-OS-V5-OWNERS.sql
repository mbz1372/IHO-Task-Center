-- Role ownership for hotel portfolios. Person IDs are used for tasks; names remain display labels.
alter table public.sco_hotels add column if not exists capacity_owner_id uuid references public.sco_members(user_id);
alter table public.sco_hotels add column if not exists rate_owner_id uuid references public.sco_members(user_id);
alter table public.sco_hotels add column if not exists commercial_owner_id uuid references public.sco_members(user_id);
create index if not exists sco_hotels_capacity_owner_id on public.sco_hotels(capacity_owner_id);
create index if not exists sco_hotels_rate_owner_id on public.sco_hotels(rate_owner_id);
create index if not exists sco_hotels_commercial_owner_id on public.sco_hotels(commercial_owner_id);
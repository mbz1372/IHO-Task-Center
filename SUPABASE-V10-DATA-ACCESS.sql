-- IranHotel OS V10: data access and reminder deletion policy
-- Safe to run after previous migrations.

-- The master hotel table remains the source of truth and is protected in the application layer.
create index if not exists ihos_hotels_title_lower_idx on public.ihos_hotels (lower(title));
create index if not exists ihos_hotels_provider_lower_idx on public.ihos_hotels (lower(provider));
create index if not exists ihos_hotels_hotel_code_idx_v10 on public.ihos_hotels (hotel_code);

-- All application users may manage reminders. Main hotel data deletion stays protected by the server API.
alter table public.ihos_reminders enable row level security;
drop policy if exists ihos_reminders_all on public.ihos_reminders;
drop policy if exists ihos_reminders_select on public.ihos_reminders;
drop policy if exists ihos_reminders_insert on public.ihos_reminders;
drop policy if exists ihos_reminders_update on public.ihos_reminders;
drop policy if exists ihos_reminders_delete on public.ihos_reminders;
create policy ihos_reminders_select on public.ihos_reminders for select using (true);
create policy ihos_reminders_insert on public.ihos_reminders for insert with check (true);
create policy ihos_reminders_update on public.ihos_reminders for update using (true) with check (true);
create policy ihos_reminders_delete on public.ihos_reminders for delete using (true);

grant select,insert,update,delete on public.ihos_reminders to anon,authenticated;
grant select on public.ihos_hotels to anon,authenticated;

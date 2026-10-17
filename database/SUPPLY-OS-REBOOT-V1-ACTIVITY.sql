-- Keep hotel activity current when a manager or assigned expert records an event.
create or replace function public.sco_touch_hotel_activity()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.kind in ('assigned','progress','completed') then
    update public.sco_hotels set last_action_at=new.created_at,updated_at=now()
    where hotel_key=new.hotel_key;
  end if;
  return new;
end;$$;
drop trigger if exists sco_touch_event_activity on public.sco_events;
create trigger sco_touch_event_activity after insert on public.sco_events
for each row execute function public.sco_touch_hotel_activity();
revoke all on function public.sco_touch_hotel_activity() from public;

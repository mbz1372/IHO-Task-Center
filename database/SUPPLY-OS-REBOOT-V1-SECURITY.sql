-- Explicit SQL privileges for Supply OS, complementing RLS.
-- TRUNCATE bypasses row-level security and must never be available to web users.
revoke all privileges on table
 public.sco_members,public.sco_hotels,public.sco_metrics,public.sco_tasks,public.sco_events,public.sco_imports
from anon;
revoke all privileges on table public.sco_hotel_rollup from anon;
revoke truncate,delete,references,trigger on table
 public.sco_members,public.sco_hotels,public.sco_metrics,public.sco_tasks,public.sco_events,public.sco_imports
from authenticated;
revoke insert,update on table public.sco_events from authenticated;
grant insert on table public.sco_events to authenticated;
revoke update on table public.sco_imports from authenticated;
grant select on table public.sco_members,public.sco_hotels,public.sco_metrics,public.sco_tasks,public.sco_events,public.sco_imports,public.sco_hotel_rollup to authenticated;
grant insert,update on table public.sco_members,public.sco_hotels,public.sco_metrics,public.sco_tasks to authenticated;
grant insert on table public.sco_imports to authenticated;

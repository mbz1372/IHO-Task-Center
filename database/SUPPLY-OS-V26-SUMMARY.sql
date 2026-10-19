-- Summary and staff scoreboards computed from operational evidence only.
create or replace view public.sco_control_summary_v1 with (security_invoker=true) as
select count(*)::int total_hotels,
 count(*) filter(where collaborating)::int collaborating_hotels,
 count(*) filter(where collaborating and owner_gap)::int owner_gaps,
 count(*) filter(where collaborating and (capacity_unverified or rate_unverified))::int verification_gaps,
 count(*) filter(where collaborating and (confirmed_capacity_off or confirmed_rate_off))::int verified_supply_outages,
 count(*) filter(where importance_score is not null)::int commercially_scored,
 count(*) filter(where collaborating and category in ('پیشران','کلیدی'))::int critical_portfolio,
 count(*) filter(where collaborating and category in ('پیشران','کلیدی') and owner_gap)::int critical_owner_gaps,
 count(*) filter(where collaborating and open_tasks>0)::int hotels_with_open_work,
 coalesce(sum(overdue_tasks),0)::int overdue_tasks
from public.sco_control_v1;
revoke all on public.sco_control_summary_v1 from anon;
grant select on public.sco_control_summary_v1 to authenticated;

create or replace view public.sco_control_staff_v1 with (security_invoker=true) as
select m.user_id,m.full_name,m.role,m.active,
 count(distinct h.hotel_key) filter (where h.capacity_owner_id=m.user_id or h.rate_owner_id=m.user_id)::int owned_hotels,
 count(distinct h.hotel_key) filter (where (h.capacity_owner_id=m.user_id or h.rate_owner_id=m.user_id) and h.cooperation_status='در حال همکاری با هتل')::int collaborating_owned,
 count(distinct t.id) filter(where t.status<>'done')::int open_tasks,
 count(distinct t.id) filter(where t.status<>'done' and t.due_date<current_date)::int overdue_tasks,
 count(distinct t.id) filter(where t.status='done' and t.verified_at is not null)::int verified_tasks
from public.sco_members m
left join public.sco_hotels h on (h.capacity_owner_id=m.user_id or h.rate_owner_id=m.user_id)
left join public.sco_tasks t on t.assignee=m.user_id
where m.active
group by m.user_id,m.full_name,m.role,m.active;
revoke all on public.sco_control_staff_v1 from anon;
grant select on public.sco_control_staff_v1 to authenticated;

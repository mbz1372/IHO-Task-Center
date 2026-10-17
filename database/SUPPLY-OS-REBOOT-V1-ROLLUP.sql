-- Read-optimized rollup; avoids downloading reservation histories to the browser.
create or replace view public.sco_hotel_rollup with (security_invoker=true) as
select hotel_key,
  coalesce(sum(confirmed) filter(where metric_date>=current_date-29),0)::integer confirmed_30,
  coalesce(sum(confirmed) filter(where metric_date between current_date-59 and current_date-30),0)::integer previous_confirmed,
  coalesce(sum(unconfirmed) filter(where metric_date>=current_date-29),0)::integer unconfirmed_30,
  coalesce(sum(lost) filter(where metric_date>=current_date-29),0)::integer lost_30,
  coalesce(sum(visits) filter(where metric_date>=current_date-29),0)::integer visits_30,
  coalesce(sum(nights) filter(where metric_date>=current_date-29),0)::integer nights_30,
  coalesce(sum(revenue) filter(where metric_date>=current_date-29),0)::numeric revenue_30,
  coalesce(sum(profit) filter(where metric_date>=current_date-29),0)::numeric profit_30
from public.sco_metrics
where metric_date>=current_date-59
group by hotel_key;
grant select on public.sco_hotel_rollup to authenticated;

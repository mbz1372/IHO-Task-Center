-- Comparable room/date/occupancy/board/cancellation only. Old or low confidence prices are excluded.
create or replace view public.sco_parity_24h with (security_invoker=true) as
with freshest as (
 select p.*, row_number() over(partition by hotel_key,room_key,checkin_date,checkout_date,occupancy,meal,cancellation,source order by captured_at desc,id desc) rn
 from public.sco_rate_observations p
 where captured_at>=now()-interval '24 hours' and confidence>=0.8 and available is distinct from false
), matches as (
 select hotel_key,room_key,checkin_date,checkout_date,occupancy,meal,cancellation,
 max(price_irr) filter(where lower(source)='iho') as iho_price,
 min(price_irr) filter(where lower(source)<>'iho') as best_competitor_price,
 string_agg(distinct source,', ') filter(where lower(source)<>'iho') as competitors,
 max(captured_at) as newest_at
 from freshest where rn=1
 group by hotel_key,room_key,checkin_date,checkout_date,occupancy,meal,cancellation
)
select *,round(100.0*(iho_price-best_competitor_price)/nullif(best_competitor_price,0),2) as gap_percent
from matches where iho_price is not null and best_competitor_price is not null and best_competitor_price>0;
revoke all on public.sco_parity_24h from anon, authenticated;
grant select on public.sco_parity_24h to authenticated;
create or replace view public.sco_partner_quality_30d with (security_invoker=true) as
select entity_name,entity_type,
 sum(qualified_calls)::bigint qualified_calls,sum(booking_attempts)::bigint booking_attempts,
 sum(confirmed_bookings)::bigint confirmed_bookings,sum(failed_bookings)::bigint failed_bookings,
 sum(rate_mismatches+inventory_mismatches)::bigint mismatches,
 sum(gross_profit_irr)::numeric profit_irr,
 round(100*sum(confirmed_bookings)::numeric/nullif(sum(booking_attempts),0),2) booking_success_pct,
 round(1000*sum(gross_profit_irr)::numeric/nullif(sum(qualified_calls),0),0) profit_per_1000_qualified_irr,
 max(latency_p95_ms) worst_recorded_p95_ms,
 max(metric_date) latest_date
from public.sco_partner_daily
where metric_date>=current_date-29
group by entity_name,entity_type;
revoke all on public.sco_partner_quality_30d from anon,authenticated;
grant select on public.sco_partner_quality_30d to authenticated;
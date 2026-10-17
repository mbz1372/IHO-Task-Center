-- Atomic, idempotent partial metric imports.
-- A rerun of the same file/date replaces values for its dimensions, not double counts.
create or replace function public.sco_upsert_metric_batch(p_rows jsonb)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb; n integer:=0; k text; d date;
begin
 if not public.sco_is_manager() then raise exception 'manager access required' using errcode='42501'; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>300 then raise exception 'batch must contain <=300 rows'; end if;
 for r in select value from jsonb_array_elements(p_rows)
 loop
  k=r->>'hotel_key';d=(r->>'metric_date')::date;
  if k is null or d is null then raise exception 'hotel_key and metric_date required'; end if;
  insert into public.sco_metrics(hotel_key,metric_date,confirmed,unconfirmed,lost,visits,nights,revenue,profit,updated_at)
   values(k,d,(r->>'confirmed')::integer,(r->>'unconfirmed')::integer,(r->>'lost')::integer,(r->>'visits')::integer,
     (r->>'nights')::integer,(r->>'revenue')::numeric,(r->>'profit')::numeric,now())
  on conflict(hotel_key,metric_date) do update set
   confirmed=case when r?'confirmed' then excluded.confirmed else sco_metrics.confirmed end,
   unconfirmed=case when r?'unconfirmed' then excluded.unconfirmed else sco_metrics.unconfirmed end,
   lost=case when r?'lost' then excluded.lost else sco_metrics.lost end,
   visits=case when r?'visits' then excluded.visits else sco_metrics.visits end,
   nights=case when r?'nights' then excluded.nights else sco_metrics.nights end,
   revenue=case when r?'revenue' then excluded.revenue else sco_metrics.revenue end,
   profit=case when r?'profit' then excluded.profit else sco_metrics.profit end,
   updated_at=now();
  n:=n+1;
 end loop;
 return n;
end;$$;
revoke all on function public.sco_upsert_metric_batch(jsonb) from public;
grant execute on function public.sco_upsert_metric_batch(jsonb) to authenticated;

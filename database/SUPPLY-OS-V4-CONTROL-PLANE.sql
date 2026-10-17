-- Global-class exception control plane for IranHotel Supply OS.
-- Everything below is separate from the legacy IHO schema.
create table if not exists public.sco_cases(
 id uuid primary key default gen_random_uuid(),
 hotel_key text not null references public.sco_hotels(hotel_key),
 issue_type text not null check(issue_type in ('inventory','rate','parity','lost_booking','api_out','contract','settlement','promotion','content','provider')),
 severity text not null default 'p2' check(severity in ('p0','p1','p2','p3')),
 channel text not null default '',
 provider text not null default '',
 description text not null,
 source text not null default 'manual',
 reference text,
 financial_impact_irr numeric,
 status text not null default 'new' check(status in ('new','working','waiting','escalated','resolved')),
 task_id uuid references public.sco_tasks(id),
 assignee uuid references public.sco_members(user_id),
 due_at timestamptz,
 resolution text,
 verified_at timestamptz,
 closed_at timestamptz,
 created_by uuid not null references public.sco_members(user_id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists sco_active_case_dedup on public.sco_cases(hotel_key,issue_type,coalesce(channel,'')) where status<>'resolved';
create index if not exists sco_cases_queue on public.sco_cases(status,severity,due_at);
create index if not exists sco_cases_hotel on public.sco_cases(hotel_key,created_at desc);
create table if not exists public.sco_rate_observations(
 id uuid primary key default gen_random_uuid(),
 hotel_key text not null references public.sco_hotels(hotel_key),
 source text not null,
 room_key text not null default '',
 checkin_date date not null,
 checkout_date date not null,
 occupancy integer not null default 2 check (occupancy between 1 and 10),
 meal text not null default 'unspecified',
 cancellation text not null default 'unspecified',
 price_irr numeric not null check(price_irr>=0),
 available boolean,
 captured_at timestamptz not null default now(),
 confidence numeric not null default 1 check(confidence>=0 and confidence<=1),
 source_reference text,
 check(checkout_date>checkin_date)
);
create index if not exists sco_rate_observations_hotel_date on public.sco_rate_observations(hotel_key,checkin_date,captured_at desc);
create table if not exists public.sco_partner_daily(
 entity_name text not null,
 entity_type text not null check(entity_type in ('provider','api_out_partner','b2b_partner')),
 metric_date date not null,
 qualified_calls integer not null default 0,
 booking_attempts integer not null default 0,
 confirmed_bookings integer not null default 0,
 failed_bookings integer not null default 0,
 rate_mismatches integer not null default 0,
 inventory_mismatches integer not null default 0,
 latency_p95_ms integer,
 gross_profit_irr numeric,
 credit_incidents integer not null default 0,
 source text not null default 'manual',
 updated_at timestamptz not null default now(),
 primary key(entity_name,entity_type,metric_date)
);
create index if not exists sco_partner_daily_date on public.sco_partner_daily(metric_date desc);
create table if not exists public.sco_promotions(
 id uuid primary key default gen_random_uuid(),
 hotel_key text not null references public.sco_hotels(hotel_key),
 name text not null,
 segment text not null default 'all',
 starts_on date not null,
 ends_on date not null,
 funding text not null check(funding in ('hotel','iranhotel','shared')),
 planned_budget_irr numeric not null default 0 check(planned_budget_irr>=0),
 discount_percent numeric not null default 0 check(discount_percent>=0 and discount_percent<=100),
 hypothesis text not null,
 target_kpi text not null,
 status text not null default 'proposed' check(status in ('proposed','approved','rejected','running','finished')),
 owner uuid references public.sco_members(user_id),
 approved_by uuid references public.sco_members(user_id),
 observed_incremental_profit_irr numeric,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(ends_on>=starts_on)
);
create index if not exists sco_promotions_hotel on public.sco_promotions(hotel_key,starts_on desc);
alter table public.sco_cases enable row level security;
alter table public.sco_rate_observations enable row level security;
alter table public.sco_partner_daily enable row level security;
alter table public.sco_promotions enable row level security;
revoke all on public.sco_cases,public.sco_rate_observations,public.sco_partner_daily,public.sco_promotions from anon;
revoke all on public.sco_cases,public.sco_rate_observations,public.sco_partner_daily,public.sco_promotions from authenticated;
grant select on public.sco_cases,public.sco_rate_observations,public.sco_partner_daily,public.sco_promotions to authenticated;
grant insert,update on public.sco_cases,public.sco_rate_observations,public.sco_partner_daily,public.sco_promotions to authenticated;
drop policy if exists sco_cases_read on public.sco_cases;
create policy sco_cases_read on public.sco_cases for select to authenticated using(public.sco_is_member());
drop policy if exists sco_cases_write on public.sco_cases;
create policy sco_cases_write on public.sco_cases for insert to authenticated with check(public.sco_is_manager() and created_by=auth.uid());
drop policy if exists sco_cases_change on public.sco_cases;
create policy sco_cases_change on public.sco_cases for update to authenticated using(public.sco_is_manager()) with check(public.sco_is_manager());
drop policy if exists sco_rate_read on public.sco_rate_observations;
create policy sco_rate_read on public.sco_rate_observations for select to authenticated using(public.sco_is_member());
drop policy if exists sco_rate_write on public.sco_rate_observations;
create policy sco_rate_write on public.sco_rate_observations for insert to authenticated with check(public.sco_is_manager());
drop policy if exists sco_rate_change on public.sco_rate_observations;
create policy sco_rate_change on public.sco_rate_observations for update to authenticated using(public.sco_is_manager()) with check(public.sco_is_manager());
drop policy if exists sco_partner_read on public.sco_partner_daily;
create policy sco_partner_read on public.sco_partner_daily for select to authenticated using(public.sco_is_member());
drop policy if exists sco_partner_write on public.sco_partner_daily;
create policy sco_partner_write on public.sco_partner_daily for insert to authenticated with check(public.sco_is_manager());
drop policy if exists sco_partner_change on public.sco_partner_daily;
create policy sco_partner_change on public.sco_partner_daily for update to authenticated using(public.sco_is_manager()) with check(public.sco_is_manager());
drop policy if exists sco_promotion_read on public.sco_promotions;
create policy sco_promotion_read on public.sco_promotions for select to authenticated using(public.sco_is_member());
drop policy if exists sco_promotion_write on public.sco_promotions;
create policy sco_promotion_write on public.sco_promotions for insert to authenticated with check(public.sco_is_manager() and status='proposed');
drop policy if exists sco_promotion_change on public.sco_promotions;
create policy sco_promotion_change on public.sco_promotions for update to authenticated using(public.sco_is_manager()) with check(public.sco_is_manager());
-- Only manager can approve promotions; operations should be audited in a later dedicated approval RPC.
revoke update on public.sco_tasks from authenticated;
create or replace function public.sco_create_case(
 p_hotel_key text,p_type text,p_severity text,p_description text,p_assignee uuid,p_channel text default '',p_provider text default '',
 p_impact numeric default null
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare previous uuid; result jsonb; id uuid; task_ref uuid; sla_hours integer; title text;
begin
 if not public.sco_is_manager() then raise exception 'manager access required' using errcode='42501'; end if;
 if p_type not in ('inventory','rate','parity','lost_booking','api_out','contract','settlement','promotion','content','provider') then raise exception 'invalid issue type'; end if;
 if p_severity not in ('p0','p1','p2','p3') then raise exception 'invalid severity'; end if;
 if length(trim(coalesce(p_description,'')))<6 then raise exception 'description required'; end if;
 if not exists(select 1 from public.sco_hotels where hotel_key=p_hotel_key) then raise exception 'unknown hotel'; end if;
 if p_assignee is null or not exists(select 1 from public.sco_members where user_id=p_assignee and active) then raise exception 'active assignee required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_hotel_key||p_type||coalesce(p_channel,''),19));
 select c.id into previous from public.sco_cases c where c.hotel_key=p_hotel_key and c.issue_type=p_type and c.channel=coalesce(p_channel,'') and c.status<>'resolved' limit 1;
 if previous is not null then return previous; end if;
 sla_hours=case p_severity when 'p0' then 2 when 'p1' then 8 when 'p2' then 24 else 72 end;
 title=case p_type when 'rate' then 'اصلاح مغایرت نرخ' when 'inventory' then 'دریافت ظرفیت آنلاین' when 'parity' then 'بررسی اختلاف نرخ رقبا'
 when 'lost_booking' then 'بازیابی رزرو از دست رفته' when 'api_out' then 'رفع اختلال API Out'
 when 'contract' then 'پیگیری قرارداد' when 'settlement' then 'پیگیری تسویه'
 when 'promotion' then 'بررسی پیشنهاد ویژه' when 'content' then 'رفع مشکل نمایش/محتوا' else 'بررسی تأمین‌کننده' end;
 result=public.sco_create_actions(jsonb_build_array(jsonb_build_object('hotel_key',p_hotel_key,'title',title||': '||left(trim(p_description),100),'assignee',p_assignee::text,'due_date',(current_date+case when p_severity='p3' then 3 else 1 end)::text,'priority',case when p_severity='p0' then 'urgent' when p_severity='p1' then 'high' else 'normal' end)));
 task_ref=nullif(result->'ids'->>0,'')::uuid;
 insert into public.sco_cases(hotel_key,issue_type,severity,channel,provider,description,financial_impact_irr,status,task_id,assignee,due_at,created_by)
 values(p_hotel_key,p_type,p_severity,coalesce(p_channel,''),coalesce(p_provider,''),trim(p_description),p_impact,'working',task_ref,p_assignee,now()+make_interval(hours=>sla_hours),auth.uid()) returning sco_cases.id into id;
 insert into public.sco_events(hotel_key,task_id,kind,details,actor) values(p_hotel_key,task_ref,'case_created','پرونده جدید '||p_type||' / '||p_severity||' — '||left(p_description,300),auth.uid());
 return id;
end; $$;
revoke all on function public.sco_create_case(text,text,text,text,uuid,text,text,numeric) from public,anon;
grant execute on function public.sco_create_case(text,text,text,text,uuid,text,text,numeric) to authenticated;
create or replace function public.sco_sync_case_task() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.status='done' and old.status<>'done' then
  update public.sco_cases set status='resolved',closed_at=now(),resolution=coalesce(new.last_result,new.outcome,''),updated_at=now() where task_id=new.id and status<>'resolved';
 end if;
 return new;
end; $$;
drop trigger if exists sco_case_task_sync on public.sco_tasks;
create trigger sco_case_task_sync after update of status on public.sco_tasks for each row execute function public.sco_sync_case_task();
revoke all on function public.sco_sync_case_task() from public,anon,authenticated;
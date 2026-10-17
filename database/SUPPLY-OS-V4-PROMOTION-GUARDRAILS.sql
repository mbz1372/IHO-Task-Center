-- Commercial discipline: proposed discounts are not automatically applied to rates.
alter table public.sco_promotions add column if not exists projected_incremental_contribution_irr numeric;
alter table public.sco_promotions add column if not exists approval_note text;
alter table public.sco_promotions add column if not exists created_by uuid references public.sco_members(user_id);
create or replace function public.sco_review_promotion(p_id uuid,p_approve boolean,p_reason text)
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.sco_promotions%rowtype; next_status text;
begin
 if not public.sco_is_manager() then raise exception 'manager access required' using errcode='42501'; end if;
 if length(trim(coalesce(p_reason,'')))<10 then raise exception 'Provide a review reason of at least ten characters'; end if;
 select * into p from public.sco_promotions where id=p_id for update;
 if not found then raise exception 'Unknown proposal'; end if;
 if p.status<>'proposed' then raise exception 'Only proposed promotions may be reviewed'; end if;
 if p_approve then
  if p.funding in ('iranhotel','shared') and (p.projected_incremental_contribution_irr is null or
        p.projected_incremental_contribution_irr<=p.planned_budget_irr) then
   raise exception 'Expected incremental contribution must exceed planned IranHotel/shared budget before approval';
  end if;
  next_status='approved';
 else next_status='rejected'; end if;
 update public.sco_promotions set status=next_status,approved_by=auth.uid(),
  approval_note=trim(p_reason),updated_at=now() where id=p_id;
 insert into public.sco_events(hotel_key,kind,details,actor) values(p.hotel_key,'promotion_review',
  case when p_approve then 'تأیید' else 'رد' end||' پیشنهاد تخفیف: '||p.name||' — '||left(p_reason,300),auth.uid());
 return next_status;
end;$$;
revoke all on function public.sco_review_promotion(uuid,boolean,text) from public,anon;
grant execute on function public.sco_review_promotion(uuid,boolean,text) to authenticated;
revoke update on public.sco_promotions from authenticated;
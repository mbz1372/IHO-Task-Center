-- Manager-only atomic batch action creation. Works for one hotel or a curated queue of up to 25.
create or replace function public.sco_create_actions(p_actions jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 action jsonb;
 h text;
 title_text text;
 assignee_id uuid;
 due date;
 priority_text text;
 task_id uuid;
 created_ids uuid[]:=ARRAY[]::uuid[];
 created_count integer:=0;
 skipped_count integer:=0;
begin
 if not public.sco_is_manager() then
  raise exception 'Only active supply managers can assign work' using errcode='42501';
 end if;
 if jsonb_typeof(p_actions)<>'array' or jsonb_array_length(p_actions) not between 1 and 25 then
  raise exception 'Provide between 1 and 25 tasks';
 end if;
 for action in select value from jsonb_array_elements(p_actions)
 loop
  h=trim(coalesce(action->>'hotel_key',''));
  title_text=trim(coalesce(action->>'title',''));
  if h='' or length(title_text)<3 or length(title_text)>300 then
   raise exception 'Valid hotel and task title required';
  end if;
  if not exists(select 1 from public.sco_hotels where hotel_key=h) then
   raise exception 'Unknown hotel key' using errcode='22023';
  end if;
  assignee_id=nullif(action->>'assignee','')::uuid;
  if assignee_id is null or not exists(select 1 from public.sco_members where user_id=assignee_id and active) then
   raise exception 'Assignee must be an active supply member';
  end if;
  due=nullif(action->>'due_date','')::date;
  priority_text=coalesce(nullif(action->>'priority',''),'normal');
  if priority_text not in ('normal','high','urgent') then raise exception 'Invalid priority'; end if;
  perform pg_advisory_xact_lock(hashtextextended(h||':'||lower(title_text),8));
  if exists(select 1 from public.sco_tasks where hotel_key=h and lower(trim(title))=lower(title_text) and status<>'done') then
   skipped_count=skipped_count+1;
   continue;
  end if;
  insert into public.sco_tasks(hotel_key,title,type,assignee,created_by,priority,status,due_date)
  values(h,title_text,'followup',assignee_id,auth.uid(),priority_text,'open',due)
  returning id into task_id;
  insert into public.sco_events(hotel_key,task_id,kind,details,actor)
  values(h,task_id,'assigned','پیگیری واگذار شد: '||title_text,auth.uid());
  created_ids=array_append(created_ids,task_id);
  created_count=created_count+1;
 end loop;
 return jsonb_build_object('created',created_count,'skipped',skipped_count,'ids',created_ids);
end; $$;
revoke all on function public.sco_create_actions(jsonb) from public,anon;
grant execute on function public.sco_create_actions(jsonb) to authenticated;
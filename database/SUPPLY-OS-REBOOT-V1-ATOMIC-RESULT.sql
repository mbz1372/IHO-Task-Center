create or replace function public.sco_record_task_result(p_task uuid,p_status text,p_outcome text,p_note text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.sco_tasks%rowtype;
begin
 if not public.sco_is_member() then raise exception 'access denied' using errcode='42501'; end if;
 if p_status not in ('open','waiting','blocked','done') then raise exception 'invalid status'; end if;
 if length(trim(coalesce(p_note,'')))<8 then raise exception 'result note too short'; end if;
 select * into t from public.sco_tasks where id=p_task for update;
 if not found then raise exception 'task not found'; end if;
 if not public.sco_is_manager() and t.assignee is distinct from auth.uid() then
   raise exception 'not assigned to current user' using errcode='42501';
 end if;
 update public.sco_tasks
  set status=p_status,outcome=left(coalesce(p_outcome,''),300),last_result=left(trim(p_note),10000),
      completed_at=case when p_status='done' then now() else null end, updated_at=now()
  where id=p_task;
 insert into public.sco_events (hotel_key,task_id,kind,details,actor)
 values(t.hotel_key,p_task,case when p_status='done' then 'completed' else 'progress' end,
        left(coalesce(p_outcome,'')||' — '||trim(p_note),10000),auth.uid());
end;
$$;
revoke all on function public.sco_record_task_result(uuid,text,text,text) from public;
grant execute on function public.sco_record_task_result(uuid,text,text,text) to authenticated;

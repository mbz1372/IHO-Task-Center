-- Separate execution from validated outcomes; a completed task is not yet an independently verified recovery.
ALTER TABLE public.sco_tasks ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.sco_tasks ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.sco_members(user_id);
ALTER TABLE public.sco_tasks ADD COLUMN IF NOT EXISTS review_note text;
CREATE INDEX IF NOT EXISTS sco_tasks_review_queue ON public.sco_tasks(status,verified_at) WHERE status='done';
CREATE OR REPLACE FUNCTION public.sco_review_completed_task(p_task_id uuid,p_approve boolean,p_note text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE t public.sco_tasks%rowtype;
BEGIN
 IF NOT public.sco_is_manager() THEN RAISE EXCEPTION 'Manager role required' USING errcode='42501'; END IF;
 IF length(trim(coalesce(p_note,'')))<8 THEN RAISE EXCEPTION 'Give an evidence-based reason (8+ chars)'; END IF;
 SELECT * INTO t FROM public.sco_tasks WHERE id=p_task_id FOR UPDATE;
 IF NOT FOUND OR t.status<>'done' OR t.verified_at IS NOT NULL THEN RAISE EXCEPTION 'Only not-yet-verified completed tasks may be reviewed'; END IF;
 IF p_approve THEN
  UPDATE public.sco_tasks SET verified_by=auth.uid(),verified_at=now(),review_note=left(trim(p_note),1000),updated_at=now() WHERE id=t.id;
  UPDATE public.sco_cases SET verified_at=now(),resolution=coalesce(t.last_result,t.outcome,''),updated_at=now() WHERE task_id=t.id;
 ELSE
  UPDATE public.sco_tasks SET status='open',verified_by=null,verified_at=null,review_note=left(trim(p_note),1000),completed_at=null,updated_at=now() WHERE id=t.id;
  UPDATE public.sco_cases SET status='working',closed_at=null,verified_at=null,resolution=null,updated_at=now() WHERE task_id=t.id;
 END IF;
 INSERT INTO public.sco_events(hotel_key,task_id,kind,details,actor)
 VALUES(t.hotel_key,t.id,CASE WHEN p_approve THEN 'verified' ELSE 'reopened' END,
 CASE WHEN p_approve THEN 'تأیید نتیجه: ' ELSE 'بازگشایی نتیجه: ' END||left(trim(p_note),1000),auth.uid());
 RETURN CASE WHEN p_approve THEN 'verified' ELSE 'reopened' END;
END; $$;
REVOKE ALL ON FUNCTION public.sco_review_completed_task(uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sco_review_completed_task(uuid,boolean,text) TO authenticated;
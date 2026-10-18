-- Team activation and manager-controlled ownership.
ALTER TABLE public.sco_members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.sco_members ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE public.sco_members ADD COLUMN IF NOT EXISTS created_by uuid references public.sco_members(user_id);
ALTER TABLE public.sco_members ADD COLUMN IF NOT EXISTS last_password_setup_at timestamptz;
CREATE INDEX IF NOT EXISTS sco_members_email_idx ON public.sco_members(lower(email));
CREATE OR REPLACE FUNCTION public.sco_assign_hotel_portfolio(p_hotel_keys text[],p_owner uuid,p_role text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
 IF NOT public.sco_is_manager() THEN RAISE EXCEPTION 'Manager role required' USING errcode='42501'; END IF;
 IF p_role NOT IN ('capacity','rate','commercial') THEN RAISE EXCEPTION 'Invalid owner role'; END IF;
 IF coalesce(array_length(p_hotel_keys,1),0) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Select 1 to 200 hotels per assignment'; END IF;
 IF p_owner IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.sco_members WHERE user_id=p_owner AND active) THEN
  RAISE EXCEPTION 'Assignee must be an active supply member';
 END IF;
 WITH selected AS (SELECT DISTINCT unnest(p_hotel_keys) AS hotel_key),
 assigned AS (UPDATE public.sco_hotels h SET
   capacity_owner_id=CASE WHEN p_role='capacity' THEN p_owner ELSE h.capacity_owner_id END,
   rate_owner_id=CASE WHEN p_role='rate' THEN p_owner ELSE h.rate_owner_id END,
   commercial_owner_id=CASE WHEN p_role='commercial' THEN p_owner ELSE h.commercial_owner_id END,
   capacity_owner=CASE WHEN p_role='capacity' THEN coalesce((SELECT full_name FROM public.sco_members WHERE user_id=p_owner),'') ELSE h.capacity_owner END,
   rate_owner=CASE WHEN p_role='rate' THEN coalesce((SELECT full_name FROM public.sco_members WHERE user_id=p_owner),'') ELSE h.rate_owner END,
   updated_at=now()
   FROM selected s WHERE s.hotel_key=h.hotel_key RETURNING h.hotel_key)
 SELECT count(*) INTO changed FROM assigned;
 INSERT INTO public.sco_events(hotel_key,kind,details,actor)
 SELECT DISTINCT s.hotel_key,'ownership',
  CASE p_role WHEN 'capacity' THEN 'مسئول ظرفیت' WHEN 'rate' THEN 'مسئول نرخ' ELSE 'مالک تجاری' END
  ||' ← '||coalesce((SELECT full_name FROM public.sco_members WHERE user_id=p_owner),'بدون مسئول'),
  auth.uid() FROM unnest(p_hotel_keys) AS s(hotel_key)
 WHERE EXISTS(SELECT 1 FROM public.sco_hotels WHERE hotel_key=s.hotel_key);
 RETURN changed;
END;$$;
REVOKE ALL ON FUNCTION public.sco_assign_hotel_portfolio(text[],uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sco_assign_hotel_portfolio(text[],uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.sco_complete_staff_password_setup()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING errcode='42501'; END IF;
 UPDATE public.sco_members SET must_change_password=false,last_password_setup_at=now() WHERE user_id=auth.uid() AND active;
 RETURN FOUND;
END;$$;
REVOKE ALL ON FUNCTION public.sco_complete_staff_password_setup() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sco_complete_staff_password_setup() TO authenticated;
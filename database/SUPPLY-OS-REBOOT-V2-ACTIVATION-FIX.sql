-- Fix missing pgcrypto lookup in first manager activation.
-- Keep restricted SECURITY DEFINER search path; qualify extension function explicitly.
CREATE OR REPLACE FUNCTION public.sco_claim_first_manager(p_code text,p_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
declare cfg supply_internal.bootstrap_manager%rowtype; verified_at timestamptz;
begin
 if auth.uid() is null then raise exception 'You must sign in first' using errcode='42501'; end if;
 select email_confirmed_at into verified_at from auth.users where id=auth.uid();
 if verified_at is null then raise exception 'Email must be verified' using errcode='42501'; end if;
 if length(trim(coalesce(p_name,'')))<2 or length(p_name)>100 then raise exception 'Name must be 2-100 characters'; end if;
 perform pg_advisory_xact_lock(54120512);
 if exists(select 1 from public.sco_members where role='manager' and active)
 then raise exception 'Initial manager is already configured' using errcode='42501'; end if;
 select * into cfg from supply_internal.bootstrap_manager where id=1 for update;
 if not found or cfg.claimed_at is not null or cfg.expires_at<now()
   or cfg.code_digest is distinct from extensions.digest(trim(p_code),'sha256')
 then raise exception 'Activation code is invalid or expired' using errcode='42501'; end if;
 insert into public.sco_members(user_id,full_name,role,active)
 values(auth.uid(),trim(p_name),'manager',true)
 on conflict(user_id) do update set full_name=excluded.full_name,role='manager',active=true;
 update supply_internal.bootstrap_manager set claimed_at=now() where id=1;
 return true;
end; $$;
REVOKE ALL ON FUNCTION public.sco_claim_first_manager(text,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.sco_claim_first_manager(text,text) TO authenticated;
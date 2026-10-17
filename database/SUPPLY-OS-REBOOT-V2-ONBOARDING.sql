-- One-time secure onboarding for the FIRST Supply OS manager.
-- The secret below is a SHA-256 digest, never the plaintext activation code.
create schema if not exists supply_internal;
revoke all on schema supply_internal from public, anon, authenticated;
create table if not exists supply_internal.bootstrap_manager (
 id smallint primary key default 1 check(id=1),
 code_digest bytea not null,
 expires_at timestamptz not null,
 claimed_at timestamptz
);
revoke all on supply_internal.bootstrap_manager from public, anon, authenticated;
insert into supply_internal.bootstrap_manager(id,code_digest,expires_at,claimed_at)
values(1,decode('0441a0297f1d6118e629a9d2a7d1cc0e75df859978a5ba3ba20d1e88999bf0a1','hex'),now()+interval '7 days',null)
on conflict(id) do update set code_digest=excluded.code_digest,expires_at=excluded.expires_at,claimed_at=null
where not exists(select 1 from public.sco_members where role='manager' and active);
create or replace function public.sco_claim_first_manager(p_code text,p_name text)
returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
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
 if not found or cfg.claimed_at is not null or cfg.expires_at<now() or cfg.code_digest is distinct from digest(trim(p_code),'sha256')
 then raise exception 'Activation code is invalid or expired' using errcode='42501'; end if;
 insert into public.sco_members(user_id,full_name,role,active)
 values(auth.uid(),trim(p_name),'manager',true)
 on conflict(user_id) do update set full_name=excluded.full_name,role='manager',active=true;
 update supply_internal.bootstrap_manager set claimed_at=now() where id=1;
 return true;
end; $$;
revoke all on function public.sco_claim_first_manager(text,text) from public,anon;
grant execute on function public.sco_claim_first_manager(text,text) to authenticated;
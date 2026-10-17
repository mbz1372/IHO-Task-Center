-- Preserve the new Supply OS as system of record. Enrich only empty static fields from validated legacy code matches.
alter table public.sco_hotels add column if not exists phone text;
alter table public.sco_hotels add column if not exists reservation_phone text;
alter table public.sco_hotels add column if not exists manager_name text;
alter table public.sco_hotels add column if not exists manager_mobile text;
alter table public.sco_hotels add column if not exists contract_status text;
alter table public.sco_hotels add column if not exists purchase_period integer;
alter table public.sco_hotels add column if not exists payment_period integer;
alter table public.sco_hotels add column if not exists contact_import_source text;

update public.sco_hotels n set
 phone=coalesce(nullif(trim(n.phone),''),nullif(trim(o.phone),'')),
 reservation_phone=coalesce(nullif(trim(n.reservation_phone),''),nullif(trim(o.reservation_phone),'')),
 manager_name=coalesce(nullif(trim(n.manager_name),''),nullif(trim(o.manager_name),'')),
 manager_mobile=coalesce(nullif(trim(n.manager_mobile),''),nullif(trim(o.manager_mobile),'')),
 contract_status=coalesce(nullif(trim(n.contract_status),''),nullif(trim(o.contract_status),'')),
 purchase_period=coalesce(n.purchase_period,o.purchase_period),
 payment_period=coalesce(n.payment_period,o.payment_period),
 contact_import_source=case when nullif(trim(o.reservation_phone),'') is not null or nullif(trim(o.phone),'') is not null then 'legacy_verified_code' else n.contact_import_source end
from public.ihos_hotels o
where nullif(trim(n.hotel_code),'') is not null
 and trim(n.hotel_code)=trim(o.hotel_code)
 and (nullif(trim(o.phone),'') is not null or nullif(trim(o.reservation_phone),'') is not null or nullif(trim(o.manager_mobile),'') is not null or nullif(trim(o.manager_name),'') is not null)
 and (coalesce(nullif(trim(n.phone),''),'')='' or coalesce(nullif(trim(n.reservation_phone),''),'')=''
 or coalesce(nullif(trim(n.manager_mobile),''),'')='' or coalesce(nullif(trim(n.manager_name),''),'')='');

'use client';
import {useMemo,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {Check,Copy,ShieldCheck,Users,UserPlus,Building2,RefreshCcw,AlertTriangle} from 'lucide-react';
type Person={user_id:string;full_name:string;role:string;active:boolean;email?:string};
type Hotel={hotel_key:string;name:string;city:string;category?:string;provider?:string;capacity_owner_id?:string|null;rate_owner_id?:string|null;commercial_owner_id?:string|null};
const str=(n:number)=>n.toLocaleString('fa-IR');
const roleColumn={capacity:'capacity_owner_id',rate:'rate_owner_id',commercial:'commercial_owner_id'} as const;
type Role=keyof typeof roleColumn;
export default function TeamActivation({db,token,people,hotels,onRefresh}:{db:SupabaseClient;token:string;people:Person[];hotels:Hotel[];onRefresh:()=>Promise<void>}){
 const [email,setEmail]=useState(''),[name,setName]=useState(''),[created,setCreated]=useState<{email:string;name:string;temporary_password:string}|null>(null);
 const [issue,setIssue]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false);
 const [googleEmail,setGoogleEmail]=useState(''),[googleName,setGoogleName]=useState('');
 const [role,setRole]=useState<Role>('capacity'),[assignee,setAssignee]=useState(''),[scope,setScope]=useState('priority'),[city,setCity]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState<string[]>([]),[overwrite,setOverwrite]=useState(false);
 const peopleActive=people.filter(p=>p.active);
 const cities=useMemo(()=>[...new Set(hotels.map(h=>h.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa')),[hotels]);
 const selectable=useMemo(()=>{
  const field=roleColumn[role];
  return hotels.filter(h=>{
   if(scope==='priority'&&!['پیشران','کلیدی'].includes(h.category||''))return false;
   if(scope==='iho'&&!['IHO','IHO Provider'].includes(h.provider||''))return false;
   if(scope==='unowned'&&h[field])return false;
   if(city&&h.city!==city)return false;
   const search=query.trim().toLowerCase();
   if(search&&!([h.name,h.city,h.provider,h.category].join(' ').toLowerCase().includes(search)))return false;
   return true;
  }).sort((a,b)=>a.name.localeCompare(b.name,'fa'));
 },[hotels,scope,role,city,query]);
 const visible=selectable.slice(0,200);
 const conflicts=selected.filter(id=>hotels.find(h=>h.hotel_key===id)?.[roleColumn[role]]).length;
 const newCount=peopleActive.filter(p=>p.role==='expert').length;
 async function approveGoogle(){
  setBusy(true);setIssue('');setSuccess('');
  try{
   const response=await fetch('/api/supply-team/approve-google',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({email:googleEmail.trim().toLowerCase(),name:googleName.trim()})});
   const body=await response.json();
   if(!response.ok)throw Error(body.error||'فعال‌سازی حساب ناموفق بود');
   setSuccess(body.message||'کارشناس فعال شد.');setGoogleEmail('');setGoogleName('');await onRefresh();
  }catch(e:any){setIssue(e.message||'خطا در تأیید')}finally{setBusy(false)}
 }
 async function provision(){
  setBusy(true);setIssue('');setSuccess('');setCreated(null);
  try{
   const r=await fetch('/api/supply-team/provision',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({email,name})});
   const data=await r.json();
   if(!r.ok)throw Error(data.error||'ایجاد حساب کارشناس ناموفق بود');
   setCreated({email:data.email,name:data.name,temporary_password:data.temporary_password});
   setEmail('');setName('');setSuccess('حساب کارشناس ساخته شد. رمز موقت فقط یک‌بار نمایش داده می‌شود. از او بخواه پس از ورود رمز را تغییر دهد.');
   await onRefresh();
  }catch(e:any){setIssue(e.message)}finally{setBusy(false)}
 }
 async function assign(){
  if(!selected.length||!assignee||conflicts>0&&!overwrite)return;
  setBusy(true);setIssue('');setSuccess('');
  try{
   const results:number[]=[];
   for(let i=0;i<selected.length;i+=200){
    const chunk=selected.slice(i,i+200);
    const {data,error}=await db.rpc('sco_assign_hotel_portfolio',{p_hotel_keys:chunk,p_owner:assignee,p_role:role});
    if(error)throw error;
    results.push(Number(data||0));
   }
   setSuccess('مسئولیت '+str(results.reduce((a,b)=>a+b,0))+' هتل ثبت شد. پرونده هتل‌ها و KPI کارشناسان بروزرسانی شدند.');
   setSelected([]);setOverwrite(false);
   await onRefresh();
  }catch(e:any){setIssue(e.message)}finally{setBusy(false)}
 }
 const applyFirst=()=>setSelected(visible.slice(0,100).map(h=>h.hotel_key));
 const toggle=(id:string)=>setSelected(old=>old.includes(id)?old.filter(x=>x!==id):old.length>=200?old:[...old,id]);
 return <div className="sco-team-activation">
  <section className="sco-team-box">
   <header><ShieldCheck size={20}/><div><h3>تأیید ورود کارشناسان با Google</h3><p>کارشناس یک‌بار با Google وارد می‌شود؛ بدون کد فعال‌سازی، ایمیل دعوت یا رمز موقت. بعد از تأیید مدیر وارد میز کار خودش می‌شود.</p></div></header>
   <div className="sco-team-onboard">
    <label>نام و نام خانوادگی<input value={googleName} onChange={e=>setGoogleName(e.target.value)} placeholder="نام کارشناس"/></label>
    <label>همان ایمیل Google کارشناس<input type="email" dir="ltr" value={googleEmail} onChange={e=>setGoogleEmail(e.target.value)} placeholder="staff@gmail.com"/></label>
    <button type="button" disabled={busy||googleName.trim().length<3||!googleEmail.includes('@')} onClick={()=>void approveGoogle()}>{busy?'در حال بررسی…':'تأیید و فعال‌سازی کارشناس'}</button>
   </div>
   <p className="sco-muted">این روش صرفاً برای کاربر Google تأییدشده‌ای است که قبلاً در سامانه وارد شده است. دسترسی مدیر یا سوپرادمین واگذار نمی‌شود.</p>
  </section>
  <section className="sco-team-box">
   <header><UserPlus size={20}/><div><h3>راه‌اندازی سریع تیم تأمین</h3><p>مدیر برای کارشناس حساب می‌سازد؛ نیازی به ایمیل دعوت یا شناسه کاربری نیست.</p></div></header>
   <div className="sco-team-overview"><span>{str(newCount)} کارشناس فعال</span><span>{str(hotels.filter(h=>!!h.capacity_owner_id).length)} هتل با مسئول ظرفیت</span><span>{str(hotels.filter(h=>!!h.rate_owner_id).length)} هتل با مسئول نرخ</span></div>
   <div className="sco-team-onboard">
    <label>نام و نام خانوادگی<input value={name} onChange={e=>setName(e.target.value)} placeholder="نام کارشناس"/></label>
    <label>ایمیل سازمانی<input type="email" dir="ltr" value={email} onChange={e=>setEmail(e.target.value)} placeholder="team@example.com"/></label>
    <button type="button" disabled={busy||name.trim().length<3||!email.includes('@')} onClick={()=>void provision()}>ایجاد حساب کارشناس</button>
   </div>
   {created&&<div className="sco-staff-credentials">
     <div><ShieldCheck size={18}/><b>اطلاعات ورود اولیه — فقط همین بار</b></div>
     <p>ایمیل: <code dir="ltr">{created.email}</code></p>
     <p>رمز موقت: <code dir="ltr">{created.temporary_password}</code></p>
     <button type="button" onClick={()=>navigator.clipboard.writeText('ورود ایران‌هتل: '+location.origin+'\nایمیل: '+created.email+'\nرمز موقت: '+created.temporary_password+'\nپس از ورود رمز خود را تغییر دهید.')}><Copy size={15}/> کپی برای تحویل خصوصی به کارشناس</button>
     <button type="button" className="sco-staff-dismiss" onClick={()=>setCreated(null)}>بستن و پاک‌کردن رمز از این صفحه</button>
   </div>}
  </section>
  <section className="sco-team-box">
   <header><Building2 size={20}/><div><h3>واگذاری گروهی هتل‌ها</h3><p>برای هر هتل یک مالک واقعی برای ظرفیت، نرخ یا مسئولیت تجاری مشخص کن.</p></div></header>
   {!newCount&&<div className="sco-hint"><AlertTriangle size={16}/> ابتدا حداقل یک کارشناس اضافه کن تا بتوانی هتل‌ها را واگذار کنی.</div>}
   <div className="sco-team-filters">
    <label>نوع مسئولیت<select value={role} onChange={e=>{setRole(e.target.value as Role);setSelected([]);setOverwrite(false)}}><option value="capacity">ظرفیت</option><option value="rate">نرخ</option><option value="commercial">مالک تجاری</option></select></label>
    <label>کارشناس<select value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">انتخاب کارشناس</option>{peopleActive.map(p=><option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}</select></label>
    <label>گروه هتل<select value={scope} onChange={e=>{setScope(e.target.value);setSelected([])}}><option value="priority">پیشران و کلیدی</option><option value="iho">IHO Provider</option><option value="unowned">بدون مسئول سیستمی</option><option value="all">همه هتل‌ها</option></select></label>
    <label>شهر<select value={city} onChange={e=>{setCity(e.target.value);setSelected([])}}><option value="">همه شهرها</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
   </div>
   <div className="sco-team-chooser"><input value={query} onChange={e=>{setQuery(e.target.value);setSelected([])}} placeholder="جستجوی نام هتل..."/><span>{str(selectable.length)} هتل منطبق</span><button type="button" onClick={applyFirst}>انتخاب حداکثر ۱۰۰ هتل اول</button><button type="button" onClick={()=>setSelected([])}>پاک‌کردن انتخاب</button></div>
   <div className="sco-team-hotels">{visible.map(h=><label key={h.hotel_key}><input type="checkbox" checked={selected.includes(h.hotel_key)} onChange={()=>toggle(h.hotel_key)}/><span><b>{h.name}</b><small>{h.city} · {h.category||'بدون دسته'} · {h.provider||'بدون تأمین‌کننده'}</small></span><em>{h[roleColumn[role]]?'مسئول دارد':'بدون مسئول'}</em></label>)}</div>
   <div className="sco-team-assign-bottom"><span>{str(selected.length)} هتل انتخاب شد {conflicts>0?'· '+str(conflicts)+' مورد دارای مسئول قبلی':''}</span>{conflicts>0&&<label><input type="checkbox" checked={overwrite} onChange={e=>setOverwrite(e.target.checked)}/> جایگزینی مسئول قبلی را تأیید می‌کنم</label>}
    <button type="button" disabled={busy||!assignee||!selected.length||conflicts>0&&!overwrite} onClick={()=>void assign()}><Check size={16}/> ثبت تخصیص گروهی</button></div>
   {selectable.length>200&&<p className="sco-muted">برای سرعت و جلوگیری از تخصیص اشتباه، فقط ۲۰۰ هتل اول این فیلتر نمایش داده می‌شود؛ با شهر و جستجو محدوده را دقیق‌تر کن.</p>}
  </section>
  {issue&&<div className="sco-alert error">{issue}</div>}{success&&<div className="sco-alert success">{success}</div>}
 </div>;
}
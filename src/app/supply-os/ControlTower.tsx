'use client';
import {useCallback,useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {AlertCircle,ArrowLeft,Check,ChevronLeft,ClipboardCheck,Clock3,Database,Download,Hotel,RefreshCw,Search,ShieldCheck,Target,Users,X} from 'lucide-react';
type HotelRow={
 hotel_key:string;name:string;hotel_code:string|null;city:string;provider:string;category:string;cooperation_status:string;
 collaborating:boolean;care_state:string;care_note:string|null;next_check_at:string|null;
 capacity_owner_id:string|null;rate_owner_id:string|null;capacity_owner:string;rate_owner:string;
 is_online:boolean|null;has_rate:boolean|null;capacity_verified_at:string|null;rate_verified_at:string|null;last_action_at:string|null;
 open_tasks:number;overdue_tasks:number;metric_days:number;nights:number|null;profit:number|null;revenue:number|null;bookings:number|null;visits:number|null;
 owner_gap:boolean;capacity_unverified:boolean;rate_unverified:boolean;confirmed_capacity_off:boolean;confirmed_rate_off:boolean;
 alert_rule:string|null;alert_description:string|null;attention_points:number;alert_severity:string;
 importance_score:number|null;importance_confidence_pct:number;online_reliability_score:number|null;trust_evidence_pct:number;
};
type Summary={total_hotels:number;collaborating_hotels:number;owner_gaps:number;verification_gaps:number;verified_supply_outages:number;commercially_scored:number;critical_portfolio:number;critical_owner_gaps:number;hotels_with_open_work:number;overdue_tasks:number};
type Staff={user_id:string;full_name:string;role:string;active:boolean;owned_hotels:number;collaborating_owned:number;open_tasks:number;overdue_tasks:number;verified_tasks:number};
const states=[['unknown','نامشخص'],['healthy','فعال و سالم'],['watch','نیازمند بهبود'],['at_risk','در معرض خروج'],['paused','متوقف موقت'],['out_of_service','خارج از سرویس']] as const;
const fa=(x:number|null|undefined)=>Number(x||0).toLocaleString('fa-IR');
const isoDay=()=>new Date().toLocaleDateString('en-CA');
const statusLabel=(s:string)=>states.find(x=>x[0]===s)?.[1]||'نامشخص';
const ruleLabel=(r:string|null)=>r==='confirmed_supply_off'?'اختلال تأییدشده':r==='ownership_gap'?'بدون مالک سیستمی':r==='verification_missing'?'کنترل نامعتبر':'بدون هشدار';
function exportCsv(rows:HotelRow[]){
 const headings=['کد هتل','نام هتل','شهر','دسته','وضعیت همکاری','مسئول ظرفیت','مسئول نرخ','امتیاز تجاری','اطمینان داده','وضعیت پایش','شرح هشدار','تسک معوق'];
 const val=(r:HotelRow)=>[r.hotel_code||'',r.name,r.city,r.category,r.cooperation_status,r.capacity_owner||'',r.rate_owner||'',r.importance_score??'فاقد داده',r.importance_confidence_pct,statusLabel(r.care_state),r.alert_description||'',r.overdue_tasks];
 const esc=(v:unknown)=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const body='\ufeff'+[headings,...rows.map(val)].map(r=>r.map(esc).join(',')).join('\r\n');
 const u=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='IHO_Control_Tower_Visible_Hotels.csv';a.click();URL.revokeObjectURL(u);
}
export default function ControlTower({db,manager,userId,onOpenHotel}:{db:SupabaseClient;manager:boolean;userId:string;onOpenHotel?:(key:string)=>void}){
 const [summary,setSummary]=useState<Summary|null>(null),[staff,setStaff]=useState<Staff[]>([]);
 const [rows,setRows]=useState<HotelRow[]>([]),[total,setTotal]=useState(0),[alerts,setAlerts]=useState(0),[lastScan,setLastScan]=useState<string|null>(null);
 const [mode,setMode]=useState<'priority'|'all'|'owners'|'verification'|'outages'>('priority');
 const [q,setQ]=useState(''),[page,setPage]=useState(0),[loading,setLoading]=useState(false);
 const [selected,setSelected]=useState<HotelRow|null>(null),[care,setCare]=useState('unknown'),[note,setNote]=useState(''),[nextCheck,setNextCheck]=useState('');
 const [assignee,setAssignee]=useState(''),[taskTitle,setTaskTitle]=useState(''),[due,setDue]=useState(isoDay());
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const loadOverview=useCallback(async()=>{
   const [s,t,a,scans]=await Promise.all([
    db.from('sco_control_summary_v1').select('*').single(),
    db.from('sco_control_staff_v1').select('*').order('full_name'),
    db.from('sco_control_alerts').select('id',{count:'exact',head:true}).eq('status','open'),
    db.from('sco_control_scan_runs').select('scanned_at').order('scanned_at',{ascending:false}).limit(1)
   ]);
   if(s.error)throw s.error;if(t.error)throw t.error;if(a.error)throw a.error;
   setSummary(s.data as Summary);setStaff((t.data||[]) as Staff[]);setAlerts(a.count||0);setLastScan(scans.data?.[0]?.scanned_at||null);
 },[db]);
 const loadRows=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   let query=db.from('sco_control_v1').select('*',{count:'exact'});
   if(mode!=='all')query=query.eq('collaborating',true);
   if(mode==='priority')query=query.in('category',['پیشران','کلیدی']);
   if(mode==='owners')query=query.eq('owner_gap',true);
   if(mode==='verification')query=query.or('rate_unverified.eq.true,capacity_unverified.eq.true');
   if(mode==='outages')query=query.or('confirmed_capacity_off.eq.true,confirmed_rate_off.eq.true');
   const search=q.trim().replace(/[%(),]/g,' ').trim().slice(0,80);
   if(search)query=query.or('name.ilike.%'+search+'%,hotel_code.ilike.%'+search+'%,city.ilike.%'+search+'%');
   const {data,count,error:e}=await query.order('attention_points',{ascending:false}).order('hotel_key').range(page*35,page*35+34);
   if(e)throw e;
   setRows((data||[]) as HotelRow[]);setTotal(count||0);
  }catch(e:any){setError('خواندن رادار هتل‌ها: '+(e?.message||'خطا'))}finally{setLoading(false)}
 },[db,mode,q,page]);
 useEffect(()=>{void loadOverview().catch(e=>setError(e.message))},[loadOverview]);
 useEffect(()=>{void loadRows()},[loadRows]);
 function pick(r:HotelRow){setSelected(r);setCare(r.care_state);setNote(r.care_note||'');setNextCheck(r.next_check_at?.slice(0,10)||'');setAssignee('');setDue(isoDay());
  setTaskTitle(r.alert_rule==='confirmed_supply_off'?'اصلاح نرخ یا ظرفیت غیرفعال تأییدشده':r.alert_rule==='ownership_gap'?'تخصیص مسئول نرخ و ظرفیت به هتل':'تأیید و تکمیل اطلاعات نرخ و ظرفیت آنلاین');
  setError('');setMessage('');
 }
 async function updateCare(){
  if(!selected||!manager)return;setBusy(true);setError('');setMessage('');
  const {error:e}=await db.from('sco_hotel_care').upsert({
   hotel_key:selected.hotel_key,operational_state:care,note:note.trim().slice(0,1000),
   next_check_at:nextCheck?new Date(nextCheck+'T12:00:00Z').toISOString():null,updated_at:new Date().toISOString(),updated_by:userId
  },{onConflict:'hotel_key'});
  if(e)setError(e.message);else{setMessage('وضعیت مراقبت هتل ثبت شد.');void loadRows();void loadOverview()}
  setBusy(false);
 }
 async function createTask(){
  if(!selected||!manager||taskTitle.trim().length<3||!(assignee||userId))return;
  setBusy(true);setError('');setMessage('');
  const {data,error:e}=await db.rpc('sco_create_actions',{p_actions:[{
   hotel_key:selected.hotel_key,title:taskTitle.trim(),assignee:assignee||userId,
   due_date:due,priority:selected.alert_severity==='urgent'?'urgent':selected.alert_severity==='high'?'high':'normal'
  }]});
  if(e)setError(e.message);
  else{setMessage(data?.created?'تسک با مسئول و مهلت ثبت شد.':'تسک مشابه باز از قبل وجود دارد؛ مورد تکراری ایجاد نشد.');void loadRows();void loadOverview()}
  setBusy(false);
 }
 async function scan(){
  if(!manager)return;setBusy(true);setError('');setMessage('');
  const {data,error:e}=await db.rpc('sco_scan_control_v1');
  if(e)setError(e.message);
  else {setMessage('پایش استثناها انجام شد؛ '+fa(data?.observed)+' مورد بررسی/به‌روزرسانی شد. هیچ تسک تکراری یا خودکار ایجاد نشد.');void loadOverview();void loadRows()}
  setBusy(false);
 }
 const chip=(text:string,n:number,icon:React.ReactNode)=><div className="sco-ctrl-stat"><span>{icon} {text}</span><strong>{fa(n)}</strong></div>;
 return <div className="sco-control">
 <div className="sco-control-heading"><div><span>SUPPLY NETWORK / CONTROL TOWER</span><h2>رادار همکاری و اهمیت هتل‌ها</h2><p>از بانک هتل تا کنترل مسئولیت، صحت داده، صف اقدام و اعتبار قابل استناد</p></div><div className="sco-control-actions">
 <button type="button" onClick={()=>exportCsv(rows)}><Download size={16}/> CSV صفحه جاری</button>
 {manager&&<button type="button" onClick={()=>void scan()} disabled={busy}><RefreshCw size={16}/> {busy?'در حال اجرا…':'اجرای پایش و ثبت هشدار'}</button>}
 </div></div>
 {summary&&<div className="sco-control-stats">
 {chip('هتل‌های در مدار همکاری',summary.collaborating_hotels,<Hotel size={17}/>)}
 {chip('مهم و کلیدی',summary.critical_portfolio,<Target size={17}/>)}
 {chip('بدون مالک معتبر',summary.owner_gaps,<Users size={17}/>)}
 {chip('فاقد کنترل تازه',summary.verification_gaps,<Clock3 size={17}/>)}
 {chip('اختلال قطعی تأییدشده',summary.verified_supply_outages,<AlertCircle size={17}/>)}
 {chip('هتل دارای امتیاز معتبر',summary.commercially_scored,<ShieldCheck size={17}/>)}
 </div>}
 <div className="sco-control-truth"><Database size={19}/><p><b>مبنای تصمیم: شواهد، نه حدس.</b> عدم ثبت نرخ یا ظرفیت، به‌معنای قطع بودن آن نیست. امتیاز تجاری فقط با دست‌کم ۱۴ مشاهده کامل و تاریخ‌دار فعال می‌شود؛ اعتبار نهایی همکاری تا اتصال SLA و شکایت‌های واقعی محاسبه نمی‌شود. {fa(alerts)} هشدار باز ثبت‌شده در سامانه وجود دارد. آخرین پایش ثبت‌شده: {lastScan?new Date(lastScan).toLocaleString('fa-IR'):'هنوز ثبت نشده'}.</p></div>
 <div className="sco-control-grid">
 <section className="sco-control-table-wrap">
  <div className="sco-control-filters">
   <div className="sco-control-tabs">
    {([['priority','پیشران و کلیدی'],['owners','بدون مسئول'],['verification','نیازمند تأیید'],['outages','اختلال قطعی'],['all','همه هتل‌ها']] as const).map(([id,label])=><button type="button" key={id} className={mode===id?'active':''} onClick={()=>{setMode(id);setPage(0)}}>{label}</button>)}
   </div>
   <label className="sco-control-search"><Search size={17}/><input value={q} onChange={e=>{setQ(e.target.value);setPage(0)}} placeholder="جستجوی هتل، کد یا شهر…"/></label>
  </div>
  <div className="sco-control-table-scroll"><table><thead><tr><th>هتل / شهر</th><th>اهمیت فعلی</th><th>وضعیت کنترل</th><th>مسئولیت</th><th>اقدام</th></tr></thead><tbody>
   {rows.map(r=><tr key={r.hotel_key}><td><strong>{r.name}</strong><small>{r.city||'شهر نامشخص'} · {r.category||'بدون گروه'}</small></td>
   <td><b>{r.importance_score==null?'داده ناکافی':fa(r.importance_score)+' / ۱۰۰'}</b><small>اولویت عملیاتی {fa(r.attention_points)}</small></td>
   <td><span className={'sco-control-pill '+(r.alert_rule==='confirmed_supply_off'?'danger':r.alert_rule?'warn':'ok')}>{ruleLabel(r.alert_rule)}</span><small>{r.metric_days?fa(r.metric_days)+' روز داده':'فاقد داده عملکرد'}</small></td>
   <td><span>{r.capacity_owner_id&&r.rate_owner_id?'مالک تأییدشده':'تخصیص سیستمی ناقص'}</span><small>{r.open_tasks?fa(r.open_tasks)+' تسک باز':'بدون تسک باز'}</small></td>
   <td><button type="button" onClick={()=>pick(r)}>پرونده <ChevronLeft size={14}/></button></td></tr>)}
   {!rows.length&&<tr><td colSpan={5} className="sco-control-empty">{loading?'در حال خواندن داده…':'هتلی با این فیلتر پیدا نشد.'}</td></tr>}
  </tbody></table></div>
  <footer className="sco-control-pages"><span>{fa(total)} هتل در این فیلتر · صفحه {fa(page+1)} از {fa(Math.max(1,Math.ceil(total/35)))}</span><div><button disabled={page===0||loading} onClick={()=>setPage(p=>Math.max(0,p-1))}>قبلی</button><button disabled={(page+1)*35>=total||loading} onClick={()=>setPage(p=>p+1)}>بعدی</button></div></footer>
 </section>
 <aside className="sco-control-staff"><h3><Users size={18}/> سلامت مسئولیت تیم</h3><p>این آمار از عضویت و شناسه واقعی کارشناس محاسبه شده است؛ نام‌های قدیمی فایل به‌تنهایی مالکیت تأییدشده نیستند.</p>
 {staff.map(p=><div className="sco-control-person" key={p.user_id}><div><b>{p.full_name}</b><small>{p.role==='manager'?'مدیر':'کارشناس'}</small></div><span>{fa(p.owned_hotels)} هتل</span><small>{fa(p.open_tasks)} کار باز · {fa(p.overdue_tasks)} معوق</small></div>)}
 {!staff.length&&<p>هنوز کارشناس فعالی ثبت نشده است.</p>}
 </aside>
 </div>
 {selected&&<div className="sco-control-overlay" onMouseDown={()=>setSelected(null)}><section className="sco-control-drawer" role="dialog" aria-modal="true" aria-label="مدیریت پرونده هتل" onMouseDown={e=>e.stopPropagation()}>
 <header><button type="button" aria-label="بستن" onClick={()=>setSelected(null)}><X size={20}/></button><small>HOTEL 360 / CONTROL</small><h3>{selected.name}</h3><p>{selected.city} · {selected.provider||'تأمین‌کننده نامشخص'} · {selected.category||'بدون دسته'}</p></header>
 <div className="sco-control-drawer-body">
 <div className="sco-control-mini"><span>امتیاز اهمیت تجاری<b>{selected.importance_score==null?'نامشخص':selected.importance_score+'/۱۰۰'}</b></span><span>اعتبار نرخ و ظرفیت<b>{selected.online_reliability_score==null?'فاقد کنترل':'موقت: '+selected.online_reliability_score+'/۱۰۰'}</b></span><span>تسک معوق<b>{fa(selected.overdue_tasks)}</b></span></div>
 <div className="sco-control-box"><h4>تشخیص سامانه</h4><p>{selected.alert_description||'موردی در کنترل‌های فعلی کشف نشده؛ به‌معنای تضمین سلامت کامل نیست.'}</p><small>آخرین کنترل نرخ: {selected.rate_verified_at?new Date(selected.rate_verified_at).toLocaleDateString('fa-IR'):'ثبت نشده'} | ظرفیت: {selected.capacity_verified_at?new Date(selected.capacity_verified_at).toLocaleDateString('fa-IR'):'ثبت نشده'}</small></div>
 <div className="sco-control-box"><h4>وضعیت همکاری عملیاتی</h4>
  <label>وضعیت<select disabled={!manager} value={care} onChange={e=>setCare(e.target.value)}>{states.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <label>اقدام یا یادداشت مدیریتی<textarea rows={3} disabled={!manager} value={note} onChange={e=>setNote(e.target.value)} placeholder="علت، مانع، برنامه بازگشت یا نتیجه مذاکره…"/></label>
  <label>بررسی بعدی<input disabled={!manager} type="date" value={nextCheck} onChange={e=>setNextCheck(e.target.value)}/></label>
  {manager&&<button type="button" disabled={busy} onClick={()=>void updateCare()}><Check size={16}/> ذخیره وضعیت مراقبت</button>}
 </div>
 {manager&&<div className="sco-control-box"><h4>واگذاری اقدام با SLA</h4>
  <label>اقدام مشخص<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/></label>
  <label>مسئول<select value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">مدیر زنجیره تأمین (تا زمان تخصیص)</option>{staff.filter(x=>x.active&&x.role==='expert').map(x=><option value={x.user_id} key={x.user_id}>{x.full_name}</option>)}</select></label>
  <label>مهلت<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label>
  <button type="button" disabled={busy||taskTitle.trim().length<3} onClick={()=>void createTask()}><ClipboardCheck size={16}/> ثبت تسک واقعی در سیستم</button>
 </div>}
 {onOpenHotel&&<button type="button" className="sco-control-jump" onClick={()=>{onOpenHotel(selected.hotel_key);setSelected(null)}}>باز کردن پرونده هتل در رادار اصلی <ArrowLeft size={16}/></button>}
 {error&&<p role="alert" className="sco-control-error">{error}</p>}
 {message&&<p role="status" className="sco-control-success">{message}</p>}
 </div></section></div>}
 {error&&!selected&&<p className="sco-control-error">{error}</p>}
 {message&&!selected&&<p className="sco-control-success">{message}</p>}
 </div>
}

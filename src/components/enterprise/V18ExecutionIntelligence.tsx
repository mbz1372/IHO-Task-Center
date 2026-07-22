'use client';

import {useEffect,useMemo,useState} from 'react';
import {
  Activity,AlarmClock,AlertTriangle,ArrowLeft,CalendarClock,Check,
  CheckCircle2,ClipboardCheck,Hotel,MessageSquareText,Phone,Plus,
  RefreshCcw,Search,Send,ShieldAlert,Sparkles,Target,UserCheck,Users,Workflow,X
} from 'lucide-react';
import {getSupabase} from '@/lib/superapp/supabase';

const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random()}`;
const nowIso=()=>new Date().toISOString();
const today=()=>new Date().toISOString().slice(0,10);
const fa=(n:number)=>Number(n||0).toLocaleString('fa-IR');
const norm=(v:any)=>String(v??'').replace(/\u200c/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
const isDone=(status:any)=>['انجام شد','بسته شده','تایید شده','تأیید شده'].includes(String(status||''));
const dateOnly=(value:any)=>String(value||'').slice(0,10);
const faDateTime=(value:any)=>value?new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';

type AssignmentRole='city_manager'|'account_manager'|'rate_expert'|'capacity_expert';
type Assignment={id:string;hotel_id:string;hotel_title?:string;user_id:string;user_name?:string;assignment_role:AssignmentRole;is_primary?:boolean;active?:boolean;started_at?:string;ended_at?:string;created_at?:string;updated_at?:string};
type Signal={key:string;type:string;title:string;reason:string;category:string;severity:'critical'|'high'|'medium';deduction:number};

const ROLE_META:Record<AssignmentRole,{label:string;hint:string}>={
  city_manager:{label:'مدیر شهر',hint:'مالک مدیریتی و پاسخ‌گوی منطقه'},
  account_manager:{label:'اکانت منیجر',hint:'مسئول رابطه و قرارداد هتل'},
  rate_expert:{label:'کارشناس نرخ',hint:'مسئول نرخ‌گذاری و رقابت‌پذیری'},
  capacity_expert:{label:'کارشناس ظرفیت',hint:'مسئول ظرفیت و موجودی آنلاین'},
};

async function loadAll(table:string,select='*'){
  const db=getSupabase();
  if(!db)throw new Error('Supabase تنظیم نشده است');
  const rows:any[]=[];
  for(let from=0;;from+=1000){
    const {data,error}=await db.from(table).select(select).range(from,from+999);
    if(error)throw error;
    const batch=data||[];rows.push(...batch);
    if(batch.length<1000)break;
  }
  return rows;
}

async function loadAssignments(){
  return await loadAll('ihos_hotel_assignments','*') as Assignment[];
}

function useFullHotels(seed:any[]){
  const [hotels,setHotels]=useState<any[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let live=true;(async()=>{setLoading(true);try{const rows=await loadAll('ihos_hotels','id,hotel_code,title,city,province,provider,capacity_total,contract_status,contract_date,status_end_date,cooperation_status,risk_status,site_visible,search_visible,hotel_category,updated_at');if(live){setHotels(rows);setError('')}}catch(e:any){if(live){setHotels([]);setError(`دریافت هتل‌ها ناموفق بود: ${e.message}`)}}finally{if(live)setLoading(false)}})();return()=>{live=false}},[]);
  return {hotels,loading,error};
}

function assignmentMap(rows:Assignment[]){
  const out=new Map<string,Assignment[]>();
  rows.filter(r=>r.active!==false).forEach(r=>out.set(r.hotel_id,[...(out.get(r.hotel_id)||[]),r]));
  return out;
}

function taskMap(rows:any[]){
  const out=new Map<string,any[]>();
  rows.forEach(r=>{if(r.hotel_id)out.set(r.hotel_id,[...(out.get(r.hotel_id)||[]),r])});
  return out;
}

function hotelSignals(h:any,hotelTasks:any[],owners:Assignment[]):Signal[]{
  const out:Signal[]=[];
  const end=dateOnly(h.status_end_date);
  const days=end?Math.ceil((new Date(`${end}T12:00:00`).getTime()-Date.now())/86400000):null;
  const overdue=hotelTasks.filter(t=>t.deadline&&dateOnly(t.deadline)<today()&&!isDone(t.status));
  if(Number(h.capacity_total||0)<=0)out.push({key:'capacity',type:'ظرفیت',title:'دریافت ظرفیت آنلاین',reason:'ظرفیت قابل فروش برای هتل ثبت نشده است.',category:'ظرفیت',severity:'critical',deduction:30});
  if(!h.contract_date)out.push({key:'contract-missing',type:'قرارداد',title:'تکمیل اطلاعات قرارداد',reason:'تاریخ یا اطلاعات اصلی قرارداد ناقص است.',category:'قرارداد',severity:'high',deduction:20});
  else if(days!==null&&days>=0&&days<=45)out.push({key:'contract-expiry',type:'قرارداد',title:'پیگیری تمدید قرارداد',reason:`تا پایان وضعیت قرارداد ${fa(days)} روز باقی مانده است.`,category:'قرارداد',severity:days<=15?'critical':'high',deduction:days<=15?25:18});
  if(!h.provider||['iho','asa','shab'].includes(norm(h.provider)))out.push({key:'provider',type:'آنلاین‌سازی',title:'بررسی Provider و آنلاین‌سازی',reason:'منبع آنلاین کامل نرخ و ظرفیت مشخص نیست.',category:'پنل',severity:'medium',deduction:14});
  if(!owners.length)out.push({key:'owner',type:'مالکیت',title:'تعیین مسئول هتل',reason:'هیچ مسئول فعالی برای پرونده هتل تعریف نشده است.',category:'پیگیری',severity:'high',deduction:18});
  if(overdue.length)out.push({key:'overdue',type:'پیگیری',title:'رفع تسک‌های عقب‌افتاده',reason:`${fa(overdue.length)} تسک این هتل از موعد عبور کرده است.`,category:'پیگیری',severity:overdue.length>=3?'critical':'high',deduction:Math.min(25,10+overdue.length*4)});
  if(h.site_visible===false||h.search_visible===false)out.push({key:'visibility',type:'فروش',title:'بررسی نمایش و قابلیت فروش',reason:'هتل در سایت یا نتایج جستجو نمایش کامل ندارد.',category:'محتوا',severity:'medium',deduction:10});
  return out;
}

export function ControlTowerV18({seedHotels=[],tasks=[],users=[],onCreateTask,onOpenOwnership}:any){
  const {hotels,loading,error:hotelError}=useFullHotels(seedHotels);
  const [assignments,setAssignments]=useState<Assignment[]>([]),[q,setQ]=useState(''),[severity,setSeverity]=useState('all'),[reason,setReason]=useState('all'),[dataNotice,setDataNotice]=useState('');
  useEffect(()=>{void loadAssignments().then(setAssignments).catch(e=>setDataNotice(`دریافت تخصیص‌ها ناموفق بود: ${e.message}`))},[]);
  const aMap=useMemo(()=>assignmentMap(assignments),[assignments]);
  const tMap=useMemo(()=>taskMap(tasks),[tasks]);
  const rows=useMemo(()=>hotels.map(h=>{const signals=hotelSignals(h,tMap.get(h.id)||[],aMap.get(h.id)||[]);return{hotel:h,signals,score:Math.max(0,100-signals.reduce((s,x)=>s+x.deduction,0)),owners:aMap.get(h.id)||[]}}).filter(x=>x.signals.length).sort((a,b)=>a.score-b.score),[hotels,tMap,aMap]);
  const filtered=rows.filter(x=>(severity==='all'||x.signals.some(s=>s.severity===severity))&&(reason==='all'||x.signals.some(s=>s.key===reason))&&(!q||norm(`${x.hotel.title} ${x.hotel.hotel_code} ${x.hotel.city} ${x.owners.map(o=>o.user_name).join(' ')}`).includes(norm(q))));
  const critical=rows.filter(x=>x.signals.some(s=>s.severity==='critical')).length;
  const unowned=rows.filter(x=>!x.owners.length).length;
  const overdueHotels=rows.filter(x=>x.signals.some(s=>s.key==='overdue')).length;
  const healthy=Math.max(0,hotels.length-rows.length);
  return <div className="v18Module controlTowerV18">
    <section className="v18Hero"><div><span>EXECUTION CONTROL TOWER</span><h2>مرکز فرمان اقدام‌های عملیاتی</h2><p>در یک نگاه ببین کدام هتل، چرا، توسط چه کسی و تا چه زمانی نیازمند اقدام است.</p></div><div className="v18HeroPulse"><Sparkles/><b>{fa(critical)}</b><span>پرونده بحرانی</span></div></section>
    {(dataNotice||hotelError)&&<div className="v18Notice">{dataNotice||hotelError}</div>}
    <div className="v18Metrics"><Metric icon={ShieldAlert} title="بحرانی" value={critical} hint="نیازمند اقدام فوری" tone="danger"/><Metric icon={UserCheck} title="بدون مالک" value={unowned} hint="مسئول فعال ندارد" tone="warning"/><Metric icon={AlarmClock} title="دارای تأخیر" value={overdueHotels} hint="حداقل یک تسک معوق" tone="purple"/><Metric icon={CheckCircle2} title="بدون هشدار" value={healthy} hint="در داده فعلی" tone="success"/></div>
    <div className="v18Toolbar"><div className="v18Search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="نام، کد، شهر یا مسئول هتل..."/></div><select value={severity} onChange={e=>setSeverity(e.target.value)}><option value="all">همه سطوح</option><option value="critical">بحرانی</option><option value="high">مهم</option><option value="medium">قابل پیگیری</option></select><select value={reason} onChange={e=>setReason(e.target.value)}><option value="all">همه دلایل</option><option value="capacity">بدون ظرفیت</option><option value="contract-missing">قرارداد ناقص</option><option value="contract-expiry">تمدید قرارداد</option><option value="provider">آنلاین‌سازی</option><option value="owner">بدون مسئول</option><option value="overdue">تسک معوق</option><option value="visibility">نمایش و فروش</option></select><span>{loading?<><RefreshCcw className="spin"/>در حال تحلیل...</>:<>{fa(filtered.length)} هتل</>}</span></div>
    <div className="v18ActionTable"><div className="v18ActionHead"><span>هتل و امتیاز سلامت</span><span>علت نیاز به اقدام</span><span>مسئول پرونده</span><span>اقدام بعدی</span></div>{filtered.slice(0,300).map(row=>{const primary=row.signals[0];return <article key={row.hotel.id}><div className="v18HotelCell"><i className={`score-${row.score<45?'bad':row.score<70?'warn':'ok'}`}>{row.score}</i><div><b>{row.hotel.title}</b><small>{row.hotel.hotel_code||'بدون کد'} · {row.hotel.city||'بدون شهر'} · {row.hotel.provider||'بدون Provider'}</small></div></div><div className="v18ReasonCell"><span className={`v18Severity ${primary.severity}`}>{primary.type}</span><div><b>{primary.title}</b><small>{primary.reason}</small></div>{row.signals.length>1&&<em>+{fa(row.signals.length-1)} هشدار دیگر</em>}</div><div className="v18Owners">{row.owners.length?row.owners.slice(0,3).map(o=><span key={o.id} title={ROLE_META[o.assignment_role]?.label}>{o.user_name||users.find((u:any)=>u.id===o.user_id)?.full_name||'کاربر'}</span>):<button onClick={()=>onOpenOwnership?.(row.hotel)}><Users/> تعیین مسئول</button>}</div><button className="btn primary" onClick={()=>onCreateTask?.(row.hotel,primary)}><Plus/> ساخت تسک</button></article>})}{!filtered.length&&!loading&&<Empty icon={CheckCircle2} title="موردی مطابق فیلتر پیدا نشد" text="فیلترها را تغییر بده یا داده‌های هتل را همگام‌سازی کن."/>}</div>
  </div>
}

export function HotelOwnershipV18({seedHotels=[],users=[],initialHotel}:any){
  const {hotels,loading,error:hotelError}=useFullHotels(seedHotels);
  const [rows,setRows]=useState<Assignment[]>([]),[q,setQ]=useState(''),[onlyMissing,setOnlyMissing]=useState(false),[selected,setSelected]=useState<any>(initialHotel||null),[draft,setDraft]=useState<Record<AssignmentRole,string>>({city_manager:'',account_manager:'',rate_expert:'',capacity_expert:''}),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
  useEffect(()=>{
    let active=true;
    const refresh=()=>loadAssignments().then(data=>{if(active){setRows(data);setMsg('مسئولیت‌ها با آخرین تخصیص‌های کاربری همگام شدند')}}).catch(e=>{if(active)setMsg(`دریافت مسئولیت‌ها ناموفق بود: ${e.message}`)});
    const onAssignmentsUpdated=()=>{void refresh()};
    void refresh();window.addEventListener('ihos-assignments-updated',onAssignmentsUpdated);
    const db=getSupabase(),channel=db?.channel('ihos-ownership-v22').on('postgres_changes',{event:'*',schema:'public',table:'ihos_hotel_assignments'},onAssignmentsUpdated).subscribe();
    return()=>{active=false;window.removeEventListener('ihos-assignments-updated',onAssignmentsUpdated);if(db&&channel)void db.removeChannel(channel)};
  },[]);
  useEffect(()=>{if(initialHotel)setSelected(initialHotel)},[initialHotel]);
  const aMap=useMemo(()=>assignmentMap(rows),[rows]);
  useEffect(()=>{if(!selected)return;const list=aMap.get(selected.id)||[];setDraft({city_manager:list.find(x=>x.assignment_role==='city_manager')?.user_id||'',account_manager:list.find(x=>x.assignment_role==='account_manager')?.user_id||'',rate_expert:list.find(x=>x.assignment_role==='rate_expert')?.user_id||'',capacity_expert:list.find(x=>x.assignment_role==='capacity_expert')?.user_id||''})},[selected,aMap]);
  const complete=hotels.filter(h=>new Set((aMap.get(h.id)||[]).map(x=>x.assignment_role)).size===4).length;
  const unassigned=hotels.filter(h=>!(aMap.get(h.id)||[]).length).length;
  const filtered=hotels.filter(h=>(!onlyMissing||(aMap.get(h.id)||[]).length<4)&&(!q||norm(`${h.title} ${h.hotel_code} ${h.city} ${(aMap.get(h.id)||[]).map(x=>x.user_name).join(' ')}`).includes(norm(q))));
  async function save(){
    if(!selected)return;
    setBusy(true);setMsg('');
    const db=getSupabase();if(!db){setMsg('اتصال Supabase برقرار نیست؛ تغییری ذخیره نشد.');setBusy(false);return}const next=[...rows];
    try{
      for(const role of Object.keys(ROLE_META) as AssignmentRole[]){
        let old=next.find(x=>x.hotel_id===selected.id&&x.assignment_role===role&&x.active!==false);
        const user=users.find((u:any)=>u.id===draft[role]);
        if(old&&(!user||old.user_id!==user.id)){
          const closed={...old,active:false,ended_at:today(),updated_at:nowIso()};
          const oldIndex=next.findIndex(x=>x.id===old?.id);next.splice(oldIndex,1,closed);
          const {error}=await db.from('ihos_hotel_assignments').upsert(closed,{onConflict:'id'});if(error)throw error;
          old=undefined;
        }
        if(user){
          const row:Assignment={id:old?.id||`assignment-${selected.id}-${role}-${Date.now()}`,hotel_id:selected.id,hotel_title:selected.title,user_id:user.id,user_name:user.full_name,assignment_role:role,is_primary:true,active:true,started_at:old?.started_at||today(),ended_at:undefined,created_at:old?.created_at||nowIso(),updated_at:nowIso()};
          const index=next.findIndex(x=>x.id===row.id);index>=0?next.splice(index,1,row):next.unshift(row);
          const {error}=await db.from('ihos_hotel_assignments').upsert(row,{onConflict:'id'});if(error)throw error;
        }
      }
      setRows(next);sessionStorage.removeItem('ihos-superapp-snapshot-v22');window.dispatchEvent(new CustomEvent('ihos-assignments-updated'));setMsg('مسئولیت‌های هتل در Supabase ذخیره و با تخصیص‌های کاربری همگام شد');setSelected(null);
    }catch(e:any){setMsg(`ذخیره مسئولیت‌ها ناموفق بود و داده محلی اعمال نشد: ${e.message}`);void loadAssignments().then(setRows).catch(()=>{})}finally{setBusy(false)}
  }
  return <div className="v18Module ownershipV18"><section className="v18Hero"><div><span>HOTEL OWNERSHIP</span><h2>مالکیت و پوشش پرونده هتل‌ها</h2><p>برای هر هتل مدیر شهر، اکانت منیجر، کارشناس نرخ و کارشناس ظرفیت را مشخص کن.</p></div><div className="v18HeroPulse"><Users/><b>{fa(complete)}</b><span>پوشش کامل</span></div></section>{hotelError&&<div className="v18Notice">{hotelError}</div>}<div className="v18Metrics"><Metric icon={Hotel} title="کل هتل‌ها" value={hotels.length} hint="داده قابل مدیریت"/><Metric icon={CheckCircle2} title="پوشش کامل" value={complete} hint="هر چهار نقش" tone="success"/><Metric icon={AlertTriangle} title="بدون مسئول" value={unassigned} hint="نیازمند تخصیص" tone="danger"/><Metric icon={UserCheck} title="کاربر فعال" value={users.filter((u:any)=>u.is_active).length} hint="قابل تخصیص" tone="purple"/></div><div className="v18Toolbar"><div className="v18Search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="هتل، شهر یا نام کارشناس..."/></div><label className="v18Check"><input type="checkbox" checked={onlyMissing} onChange={e=>setOnlyMissing(e.target.checked)}/> فقط پوشش ناقص</label><span>{loading?<RefreshCcw className="spin"/>:<>{fa(filtered.length)} نتیجه</>}</span></div><div className="v18OwnershipGrid">{filtered.slice(0,240).map(h=>{const list=aMap.get(h.id)||[];return <article key={h.id}><header><div className="v18HotelAvatar">{h.title?.slice(0,1)||'ه'}</div><div><b>{h.title}</b><small>{h.hotel_code||'بدون کد'} · {h.city||'بدون شهر'}</small></div><span>{fa(list.length)}/۴</span></header><div className="v18RoleChips">{(Object.keys(ROLE_META) as AssignmentRole[]).map(role=>{const a=list.find(x=>x.assignment_role===role);return <div className={a?'filled':''} key={role}><small>{ROLE_META[role].label}</small><b>{a?.user_name||'تعیین نشده'}</b></div>})}</div><button className="btn ghost full" onClick={()=>setSelected(h)}><UserCheck/> مدیریت مسئولیت‌ها</button></article>})}</div>{selected&&<div className="v18DrawerBackdrop" onClick={()=>setSelected(null)}><aside className="v18Drawer" role="dialog" aria-modal="true" aria-label={`مدیریت مسئولیت‌های ${selected.title}`} onClick={e=>e.stopPropagation()}><header><div><span>پرونده مسئولیت</span><h3>{selected.title}</h3><p>{selected.city||'بدون شهر'} · {selected.hotel_code||'بدون کد'}</p></div><button aria-label="بستن" onClick={()=>setSelected(null)}><X/></button></header><div className="v18AssignmentForm">{(Object.keys(ROLE_META) as AssignmentRole[]).map(role=><label key={role}><div><b>{ROLE_META[role].label}</b><small>{ROLE_META[role].hint}</small></div><select value={draft[role]} onChange={e=>setDraft({...draft,[role]:e.target.value})}><option value="">بدون مسئول</option>{users.filter((u:any)=>u.is_active).map((u:any)=><option key={u.id} value={u.id}>{u.full_name} — {u.team||u.role||'تیم نامشخص'}</option>)}</select></label>)}</div>{msg&&<div className="v18Notice">{msg}</div>}<button className="btn primary full" disabled={busy} onClick={save}>{busy?<RefreshCcw className="spin"/>:<Check/>} ذخیره مسئولیت‌ها</button></aside></div>}</div>
}

export function KpiCenterV18({users=[],tasks=[],activities=[],goals=[]}:any){
  const [period,setPeriod]=useState('30'),[q,setQ]=useState('');
  const from=period==='all'?'':new Date(Date.now()-Number(period)*86400000).toISOString();
  const scopedTasks=tasks.filter((t:any)=>!from||String(t.created_at||'')>=from);
  const scopedActivities=activities.filter((a:any)=>!from||String(a.created_at||'')>=from);
  const rows=users.filter((u:any)=>u.is_active).map((u:any)=>{const mine=scopedTasks.filter((t:any)=>t.assigned_to===u.id);const done=mine.filter((t:any)=>isDone(t.status));const open=mine.filter((t:any)=>!isDone(t.status));const overdue=open.filter((t:any)=>t.deadline&&dateOnly(t.deadline)<today());const onTime=done.filter((t:any)=>!t.deadline||!t.completed_at||dateOnly(t.completed_at)<=dateOnly(t.deadline));const acts=scopedActivities.filter((a:any)=>a.assigned_to===u.id&&a.is_done);const completion=mine.length?Math.round(done.length/mine.length*100):0;const punctuality=done.length?Math.round(onTime.length/done.length*100):100;const backlogHealth=open.length?Math.max(0,100-Math.round(overdue.length/open.length*100)):100;const activityScore=Math.min(100,acts.length*5);const score=Math.round(completion*.35+punctuality*.35+backlogHealth*.2+activityScore*.1);const avgHours=done.filter((t:any)=>t.created_at&&t.completed_at).length?Math.round(done.filter((t:any)=>t.created_at&&t.completed_at).reduce((s:number,t:any)=>s+(new Date(t.completed_at).getTime()-new Date(t.created_at).getTime())/3600000,0)/done.filter((t:any)=>t.created_at&&t.completed_at).length):0;return{u,total:mine.length,done:done.length,open:open.length,overdue:overdue.length,acts:acts.length,completion,punctuality,score,avgHours}}).filter(x=>!q||norm(`${x.u.full_name} ${x.u.team} ${x.u.zone}`).includes(norm(q))).sort((a,b)=>b.score-a.score);
  const teamScore=rows.length?Math.round(rows.reduce((s,x)=>s+x.score,0)/rows.length):0;
  const totalDone=rows.reduce((s,x)=>s+x.done,0),totalOver=rows.reduce((s,x)=>s+x.overdue,0);
  return <div className="v18Module kpiV18"><section className="v18Hero"><div><span>PERFORMANCE & KPI</span><h2>مرکز عملکرد کارشناسان</h2><p>خروجی، انجام به‌موقع، حجم کار و پیشرفت اهداف را بدون عددهای نمایشی مقایسه کن.</p></div><div className="v18HeroPulse"><Target/><b>{fa(teamScore)}٪</b><span>امتیاز تیم</span></div></section><div className="v18Metrics"><Metric icon={CheckCircle2} title="تکمیل‌شده" value={totalDone} hint="در بازه انتخابی" tone="success"/><Metric icon={AlarmClock} title="معوق" value={totalOver} hint="هنوز بسته نشده" tone="danger"/><Metric icon={Activity} title="فعالیت ثبت‌شده" value={rows.reduce((s,x)=>s+x.acts,0)} hint="فعالیت تکمیل‌شده" tone="purple"/><Metric icon={Users} title="کارشناس فعال" value={rows.length} hint="دارای دسترسی فعال"/></div><div className="v18Toolbar"><div className="v18Search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="نام، تیم یا منطقه..."/></div><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="7">۷ روز اخیر</option><option value="30">۳۰ روز اخیر</option><option value="90">۹۰ روز اخیر</option><option value="all">همه زمان‌ها</option></select></div><div className="v18KpiTable"><div className="v18KpiHead"><span>کارشناس</span><span>امتیاز</span><span>تسک باز / معوق</span><span>نرخ تکمیل</span><span>به‌موقع</span><span>میانگین انجام</span></div>{rows.map((x,i)=><article key={x.u.id}><div className="v18Person"><i>{i+1}</i><span>{x.u.full_name?.slice(0,1)||'ک'}</span><div><b>{x.u.full_name}</b><small>{x.u.team||'بدون تیم'} · {x.u.zone||'بدون منطقه'}</small></div></div><strong className={`score-${x.score<50?'bad':x.score<75?'warn':'ok'}`}>{fa(x.score)}٪</strong><span>{fa(x.open)} / <em className={x.overdue?'dangerText':''}>{fa(x.overdue)}</em></span><KpiBar value={x.completion}/><KpiBar value={x.punctuality}/><span>{x.avgHours?`${fa(x.avgHours)} ساعت`:'—'}</span></article>)}</div><section className="v18GoalPanel"><header><div><Target/><span><b>اهداف فعال</b><small>پیشرفت براساس تسک و فعالیت واقعی</small></span></div><strong>{fa(goals.length)} هدف</strong></header><div>{goals.slice(0,12).map((g:any)=>{const done=g.metric==='tasks_done'?tasks.filter((t:any)=>(!g.user_id||t.assigned_to===g.user_id)&&isDone(t.status)&&(!g.start_date||dateOnly(t.completed_at||t.updated_at)>=g.start_date)&&(!g.end_date||dateOnly(t.completed_at||t.updated_at)<=g.end_date)).length:activities.filter((a:any)=>(!g.user_id||a.assigned_to===g.user_id)&&a.is_done&&(!g.start_date||dateOnly(a.done_at||a.updated_at)>=g.start_date)&&(!g.end_date||dateOnly(a.done_at||a.updated_at)<=g.end_date)).length;const pct=Math.min(100,Math.round(done/Math.max(1,g.target_count)*100));return <article key={g.id}><div><b>{g.title}</b><small>{users.find((u:any)=>u.id===g.user_id)?.full_name||'کل تیم'} · {fa(done)} از {fa(g.target_count)}</small></div><KpiBar value={pct}/></article>})}{!goals.length&&<Empty icon={Target} title="هنوز هدفی تعریف نشده" text="از بخش هدف‌گذاری، KPI فردی یا تیمی بساز."/>}</div></section></div>
}

export function CommunicationsCenterV18({me,hotels=[],users=[],onCreateTask}:any){
  const [rows,setRows]=useState<any[]>([]),[q,setQ]=useState(''),[channel,setChannel]=useState('all'),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
  const [form,setForm]=useState<any>({hotel_id:'',channel:'تماس',contact_person:'',subject:'',body:'',result:'نیازمند پیگیری',next_followup_at:'',pinned:false,create_task:true});
  async function load(){try{const data=await loadAll('ihos_hotel_communications','*');setRows(data.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))));setMsg('')}catch(e:any){setRows([]);setMsg(`دریافت ارتباطات ناموفق بود: ${e.message}`)}}
  useEffect(()=>{void load()},[]);
  const filtered=rows.filter(r=>(channel==='all'||r.channel===channel)&&(!q||norm(`${r.hotel_title} ${r.contact_person} ${r.subject} ${r.body} ${r.result}`).includes(norm(q))));
  async function save(){
    const hotel=hotels.find((h:any)=>h.id===form.hotel_id);
    if(!hotel||!form.body.trim()){setMsg('هتل و نتیجه ارتباط را کامل کن');return}
    setBusy(true);
    const row={id:uid(),hotel_id:hotel.id,hotel_title:hotel.title,channel:form.channel,contact_person:form.contact_person||null,subject:form.subject||null,body:form.body.trim(),result:form.result,next_followup_at:form.next_followup_at||null,created_by:me?.id,created_by_name:me?.full_name,pinned:form.pinned,created_at:nowIso(),updated_at:nowIso()};
    const db=getSupabase();if(!db){setMsg('اتصال Supabase برقرار نیست؛ ارتباط ذخیره نشد.');setBusy(false);return}
    try{const {error}=await db.from('ihos_hotel_communications').upsert(row,{onConflict:'id'});if(error)throw error}catch(e:any){setMsg(`ثبت ارتباط ناموفق بود و داده محلی اعمال نشد: ${e.message}`);setBusy(false);return}
    const next=[row,...rows];setRows(next);
    if(form.create_task&&form.next_followup_at)onCreateTask?.(hotel,{title:`پیگیری ${form.subject||form.channel}`,reason:form.body,category:'پیگیری',deadline:dateOnly(form.next_followup_at),assigned_to:me?.id,assigned_name:me?.full_name});
    setForm({hotel_id:'',channel:'تماس',contact_person:'',subject:'',body:'',result:'نیازمند پیگیری',next_followup_at:'',pinned:false,create_task:true});
    setMsg('ارتباط در Timeline هتل ثبت شد');setBusy(false);
  }
  return <div className="v18Module communicationsV18"><section className="v18Hero"><div><span>HOTEL COMMUNICATION TIMELINE</span><h2>مرکز ارتباطات هتل</h2><p>تماس، پیام، جلسه و نتیجه پیگیری را ثبت کن و در صورت نیاز تسک بعدی را همان لحظه بساز.</p></div><div className="v18HeroPulse"><MessageSquareText/><b>{fa(rows.length)}</b><span>ارتباط ثبت‌شده</span></div></section><div className="v18CommsLayout"><section className="v18Panel v18CommsForm"><header><div><Phone/><span><b>ثبت ارتباط جدید</b><small>اطلاعات مستقیماً به Timeline هتل اضافه می‌شود</small></span></div></header><label>هتل<select value={form.hotel_id} onChange={e=>setForm({...form,hotel_id:e.target.value})}><option value="">انتخاب هتل</option>{hotels.slice(0,1000).map((h:any)=><option key={h.id} value={h.id}>{h.title} — {h.city||'بدون شهر'}</option>)}</select></label><div className="v18FormTwo"><label>کانال<select value={form.channel} onChange={e=>setForm({...form,channel:e.target.value})}>{['تماس','پیامک','بله','تلگرام','واتساپ','ایمیل','جلسه حضوری','جلسه آنلاین'].map(x=><option key={x}>{x}</option>)}</select></label><label>مخاطب<input value={form.contact_person} onChange={e=>setForm({...form,contact_person:e.target.value})} placeholder="نام یا سمت مخاطب"/></label></div><label>موضوع<input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="مثلاً دریافت ظرفیت آخر هفته"/></label><label>نتیجه و توضیحات<textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="چه چیزی مطرح شد و نتیجه چه بود؟"/></label><div className="v18FormTwo"><label>نتیجه<select value={form.result} onChange={e=>setForm({...form,result:e.target.value})}>{['موفق','نیازمند پیگیری','منتظر پاسخ هتل','عدم پاسخ','ارجاع به مدیر','بسته شد'].map(x=><option key={x}>{x}</option>)}</select></label><label>پیگیری بعدی<input type="datetime-local" value={form.next_followup_at} onChange={e=>setForm({...form,next_followup_at:e.target.value})}/></label></div><label className="v18Check"><input type="checkbox" checked={form.create_task} onChange={e=>setForm({...form,create_task:e.target.checked})}/> اگر زمان پیگیری مشخص شد، تسک هم ساخته شود</label>{msg&&<div className="v18Notice">{msg}</div>}<button className="btn primary full" disabled={busy} onClick={save}>{busy?<RefreshCcw className="spin"/>:<Send/>} ثبت ارتباط</button></section><section className="v18Panel"><header><div><MessageSquareText/><span><b>Timeline ارتباطات</b><small>{fa(filtered.length)} نتیجه</small></span></div></header><div className="v18Toolbar compact"><div className="v18Search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو در ارتباطات..."/></div><select value={channel} onChange={e=>setChannel(e.target.value)}><option value="all">همه کانال‌ها</option>{['تماس','پیامک','بله','تلگرام','واتساپ','ایمیل','جلسه حضوری','جلسه آنلاین'].map(x=><option key={x}>{x}</option>)}</select></div><div className="v18Timeline">{filtered.slice(0,200).map(r=><article key={r.id}><i/><div><header><b>{r.hotel_title}</b><span>{r.channel}</span><time>{faDateTime(r.created_at)}</time></header><h4>{r.subject||'ارتباط با هتل'}</h4><p>{r.body||r.result}</p><footer><span>{r.contact_person||'مخاطب ثبت نشده'}</span><strong>{r.result||'بدون نتیجه'}</strong>{r.next_followup_at&&<em><CalendarClock/> پیگیری {faDateTime(r.next_followup_at)}</em>}</footer></div></article>)}{!filtered.length&&<Empty icon={MessageSquareText} title="ارتباطی ثبت نشده" text="اولین تماس یا پیام هتل را از فرم کنار صفحه ثبت کن."/>}</div></section></div></div>
}

export function AutomationOperationsV18({automations=[],tasks=[],hotels=[],users=[],onBulkCreate}:any){
  const [assignments,setAssignments]=useState<Assignment[]>([]),[runs,setRuns]=useState<any[]>([]),[preview,setPreview]=useState<Record<string,number>>({}),[running,setRunning]=useState(''),[msg,setMsg]=useState('');
  useEffect(()=>{void loadAssignments().then(setAssignments).catch(e=>setMsg(`دریافت تخصیص‌ها ناموفق بود: ${e.message}`));void loadAll('ihos_automation_runs','*').then(x=>setRuns(x.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,50))).catch(e=>{setRuns([]);setMsg(`دریافت تاریخچه اجرا ناموفق بود: ${e.message}`)})},[]);
  const activeAssignments=useMemo(()=>assignmentMap(assignments),[assignments]);
  function candidates(rule:any){const days=Number(rule.condition_days||45);if(rule.trigger_type==='task_overdue')return tasks.filter((t:any)=>t.deadline&&dateOnly(t.deadline)<today()&&!isDone(t.status)).map((t:any)=>({id:t.id,type:'task',title:t.title,hotel_id:t.hotel_id,hotel_title:t.hotel_title,city:t.city,category:t.category||'پیگیری'}));if(rule.trigger_type==='hotel_no_capacity')return hotels.filter((h:any)=>Number(h.capacity_total||0)<=0).map((h:any)=>({id:h.id,type:'hotel',title:h.title,hotel_id:h.id,hotel_title:h.title,city:h.city,category:'ظرفیت'}));if(rule.trigger_type==='contract_expiring')return hotels.filter((h:any)=>{const end=dateOnly(h.status_end_date);if(!end)return!h.contract_date;const diff=Math.ceil((new Date(`${end}T12:00:00`).getTime()-Date.now())/86400000);return diff>=0&&diff<=days}).map((h:any)=>({id:h.id,type:'hotel',title:h.title,hotel_id:h.id,hotel_title:h.title,city:h.city,category:'قرارداد'}));if(rule.trigger_type==='hotel_unassigned')return hotels.filter((h:any)=>!(activeAssignments.get(h.id)||[]).length).map((h:any)=>({id:h.id,type:'hotel',title:h.title,hotel_id:h.id,hotel_title:h.title,city:h.city,category:'پیگیری'}));if(rule.trigger_type==='task_created')return tasks.filter((t:any)=>Date.now()-new Date(t.created_at||0).getTime()<=86400000).map((t:any)=>({id:t.id,type:'task',title:t.title,hotel_id:t.hotel_id,hotel_title:t.hotel_title,city:t.city,category:t.category||'پیگیری'}));return[]}
  function scan(){const next:Record<string,number>={};automations.filter((a:any)=>a.enabled).forEach((a:any)=>next[a.id]=candidates(a).length);setPreview(next);setMsg('شرایط همه قوانین روی داده فعلی بررسی شد')}
  async function run(rule:any){
    setRunning(rule.id);setMsg('');
    try{
      const found=candidates(rule);const max=Math.max(1,Math.min(100,Number(rule.max_per_run||25)));
      const existing=new Set(tasks.filter((t:any)=>t.automation_id===rule.id&&!isDone(t.status)).map((t:any)=>`${t.source_type}:${t.source_id}`));const user=users.find((u:any)=>u.id===rule.assign_to);
      const created=found.filter(x=>!existing.has(`${x.type}:${x.id}`)).slice(0,max).map(x=>({id:uid(),title:String(rule.task_template||rule.title||'پیگیری خودکار').replace('{hotel}',x.hotel_title||x.title),description:`ایجاد خودکار توسط قانون «${rule.title}» برای ${x.title}`,hotel_id:x.hotel_id||null,hotel_title:x.hotel_title||null,city:x.city||null,priority:rule.priority||'بالا',status:rule.status||'جدید',category:rule.trigger_category||x.category,assigned_to:user?.id||null,assigned_name:user?.full_name||null,created_by:'automation',deadline:today(),due_time:'12:00',labels:[rule.label||'اتوماسیون'].filter(Boolean),collaborator_ids:[],source_type:x.type,source_id:x.id,automation_id:rule.id,created_at:nowIso(),updated_at:nowIso()}));
      const count=created.length?await onBulkCreate?.(created):0;
      const log={id:uid(),automation_id:rule.id,automation_title:rule.title,trigger_type:rule.trigger_type,matched_count:found.length,created_count:Number(count??created.length),status:'success',message:`${created.length} تسک جدید ساخته شد`,started_at:nowIso(),finished_at:nowIso(),created_at:nowIso()};
      const db=getSupabase();if(!db)throw new Error('اتصال Supabase برای ثبت نتیجه اجرا برقرار نیست');const {error}=await db.from('ihos_automation_runs').upsert(log,{onConflict:'id'});if(error)throw error;
      const next=[log,...runs].slice(0,50);setRuns(next);setPreview({...preview,[rule.id]:found.length});setMsg(`قانون اجرا شد: ${fa(found.length)} تطبیق و ${fa(created.length)} تسک جدید`);
    }catch(e:any){setMsg(`اجرای قانون ناموفق بود: ${e.message}`)}finally{setRunning('')}
  }
  return <div className="v18Module automationOpsV18"><section className="v18Hero"><div><span>AUTOMATION OPERATIONS</span><h2>اجرای هوشمند و قابل‌ردیابی اتوماسیون‌ها</h2><p>شرایط عملیاتی را اسکن کن، از ساخت تسک تکراری جلوگیری کن و نتیجه هر اجرا را ثبت کن.</p></div><button className="btn primary" onClick={scan}><RefreshCcw/> اسکن همه قوانین</button></section>{msg&&<div className="v18Notice">{msg}</div>}<div className="v18AutomationLayout"><section className="v18Panel"><header><div><Workflow/><span><b>قوانین اجرایی</b><small>{fa(automations.filter((a:any)=>a.enabled).length)} قانون فعال</small></span></div></header><div className="v18AutomationRules">{automations.map((a:any)=>{const count=preview[a.id];return <article key={a.id} className={a.enabled?'':'disabled'}><div><i><Sparkles/></i><span><b>{a.title}</b><small>{triggerLabel(a.trigger_type)} · مسئول: {users.find((u:any)=>u.id===a.assign_to)?.full_name||'بدون مسئول'}</small></span></div><strong>{count===undefined?'اسکن نشده':`${fa(count)} تطبیق`}</strong><button className="btn ghost" disabled={!a.enabled||running===a.id} onClick={()=>run(a)}>{running===a.id?<RefreshCcw className="spin"/>:<ArrowLeft/>} اجرا</button></article>})}{!automations.length&&<Empty icon={Workflow} title="قانونی تعریف نشده" text="از فرم بالای همین صفحه یک قانون اتوماسیون بساز."/>}</div></section><section className="v18Panel"><header><div><ClipboardCheck/><span><b>تاریخچه اجرا</b><small>آخرین نتیجه قوانین</small></span></div></header><div className="v18RunList">{runs.map(r=><article key={r.id}><i className={r.status==='success'?'ok':'bad'}>{r.status==='success'?<Check/>:<AlertTriangle/>}</i><div><b>{r.automation_title}</b><small>{triggerLabel(r.trigger_type)} · {faDateTime(r.created_at)}</small></div><span>{fa(r.matched_count)} تطبیق</span><strong>{fa(r.created_count)} تسک</strong></article>)}{!runs.length&&<Empty icon={ClipboardCheck} title="هنوز اجرایی ثبت نشده" text="یک قانون را اسکن و اجرا کن تا گزارش آن اینجا نمایش داده شود."/>}</div></section></div></div>
}

function triggerLabel(value:string){return({task_created:'ساخت تسک',task_overdue:'تسک معوق',hotel_no_capacity:'هتل بدون ظرفیت',contract_expiring:'قرارداد نزدیک پایان',hotel_unassigned:'هتل بدون مسئول'} as Record<string,string>)[value]||value||'رویداد'}
function Metric({icon:Icon,title,value,hint,tone='' }:any){return <article className={`v18Metric ${tone}`}><i><Icon/></i><div><small>{title}</small><b>{fa(value)}</b><span>{hint}</span></div></article>}
function KpiBar({value}:any){return <div className="v18Bar"><i style={{width:`${Math.max(0,Math.min(100,Number(value||0)))}%`}}/><span>{fa(Math.round(value||0))}٪</span></div>}
function Empty({icon:Icon,title,text}:any){return <div className="v18Empty"><Icon/><h3>{title}</h3><p>{text}</p></div>}

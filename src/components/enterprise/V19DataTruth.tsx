'use client';

import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,Building2,Check,CheckCircle2,ClipboardList,Database,FileText,Hotel,RefreshCcw,Search,ShieldCheck,Wifi,X} from 'lucide-react';
import {getSupabase} from '@/lib/superapp/supabase';
import {GuideHint} from '@/components/help/SystemGuide';

const norm=(v:any)=>String(v??'').replace(/\u200c/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
const fa=(n:number)=>Number(n||0).toLocaleString('fa-IR');
const today=()=>new Date().toISOString().slice(0,10);
const isDone=(status:any)=>['انجام شد','بسته شده','تایید شده'].includes(String(status||''));
const validStages=['فعال','نیازمند پیگیری','نیازمند تمدید','آنلاین‌سازی','رشد'];

async function loadAll(table:string,select='*'){
  const db=getSupabase();
  if(!db)throw new Error('Supabase تنظیم نشده است');
  const rows:any[]=[];
  for(let from=0;;from+=1000){
    const{data,error}=await db.from(table).select(select).range(from,from+999);
    if(error)throw error;
    const batch=data||[];rows.push(...batch);
    if(batch.length<1000)break;
  }
  return rows;
}

type SourceState={hotels:boolean;status:boolean;metrics:boolean;assignments:boolean;tasks:boolean;documents:boolean};
type ScorePart={key:string;title:string;score:number;max:number;value:string;source:string;ok:boolean};

function contractPart(h:any):ScorePart{
  const status=norm(h.contract_status);
  const end=String(h.status_end_date||'').slice(0,10);
  const expired=!!end&&end<today();
  const bad=expired||['تمدید','منقضی','پایان','ناقص'].some(x=>status.includes(x));
  const active=!!status&&status.includes('فعال')&&!status.includes('غیرفعال')&&!bad;
  return{key:'contract',title:'قرارداد',score:active?20:bad?7:0,max:20,value:active?'فعال':bad?expired?'منقضی‌شده':'نیازمند اقدام':'اطلاعات ثبت نشده',source:'ihos_hotels.contract_status / status_end_date',ok:active};
}

function buildHealthRow(h:any,ctx:any){
  const hotelTasks=ctx.tasks.filter((t:any)=>t.hotel_id===h.id);
  const open=hotelTasks.filter((t:any)=>!isDone(t.status));
  const overdue=open.filter((t:any)=>t.deadline&&String(t.deadline).slice(0,10)<today());
  const hotelDocs=ctx.documents.filter((d:any)=>d.hotel_id===h.id);
  const hotelAssignments=ctx.assignments.filter((a:any)=>a.hotel_id===h.id&&a.active!==false);
  const status=ctx.statusMap.get(h.id)||{};
  const metric=ctx.metricMap.get(h.id);
  const metricCapacity=metric?Math.max(Number(metric.available_capacity||0),Number(metric.online_capacity||0)):null;
  const capacity=metricCapacity!==null?metricCapacity:Number(h.capacity_total||0);
  const capacityPart:ScorePart={key:'capacity',title:'ظرفیت قابل فروش',score:capacity>0?25:0,max:25,value:capacity>0?`${fa(capacity)} اتاق`:'صفر یا ثبت نشده',source:metric?'ihos_hotel_daily_metrics (آخرین رکورد)':'ihos_hotels.capacity_total',ok:capacity>0};
  const contract=contractPart(h);
  const rawOnline=Number.isFinite(Number(status.automation_score))?Number(status.automation_score):null;
  const onlineScore=rawOnline!==null?Math.round(Math.max(0,Math.min(100,rawOnline))*.2):(h.provider?8:0)+(h.site_visible?6:0)+(h.search_visible?6:0);
  const onlinePart:ScorePart={key:'online',title:'آنلاین‌بودن نرخ و ظرفیت',score:onlineScore,max:20,value:rawOnline!==null?`${Math.round(rawOnline)}٪ — ${status.automation_status||'وضعیت محاسبه‌شده'}`:`Provider ${h.provider?'ثبت شده':'نامشخص'}؛ نمایش سایت ${h.site_visible?'فعال':'غیرفعال'}؛ جستجو ${h.search_visible?'فعال':'غیرفعال'}`,source:rawOnline!==null?'ihos_hotel_status_v.automation_score':'ihos_hotels.provider / site_visible / search_visible',ok:onlineScore>=16};
  const activeRoles=new Set(hotelAssignments.map((a:any)=>a.assignment_role));
  const fallbackOwners=[status.rate_expert,status.capacity_expert,h.manager_name].filter(Boolean).length;
  const ownerCount=ctx.sources.assignments?Math.min(4,activeRoles.size):Math.min(4,fallbackOwners);
  const ownerScore=Math.round(ownerCount/4*15);
  const ownershipPart:ScorePart={key:'ownership',title:'پوشش مسئولیت',score:ownerScore,max:15,value:`${fa(ownerCount)} از ۴ نقش`,source:ctx.sources.assignments?'ihos_hotel_assignments (تخصیص فعال)':'ihos_hotel_status_v / ihos_hotels.manager_name',ok:ownerCount===4};
  const executionScore=Math.max(0,15-overdue.length*5);
  const executionPart:ScorePart={key:'execution',title:'سلامت اجرای تسک',score:executionScore,max:15,value:`${fa(open.length)} باز؛ ${fa(overdue.length)} معوق`,source:'ihos_tasks.status / deadline',ok:overdue.length===0};
  const documentPart:ScorePart={key:'documents',title:'اسناد پرونده',score:hotelDocs.length?5:0,max:5,value:`${fa(hotelDocs.length)} سند`,source:'ihos_documents.hotel_id',ok:hotelDocs.length>0};
  const parts=[capacityPart,contract,onlinePart,ownershipPart,executionPart,documentPart];
  const score=parts.reduce((sum,p)=>sum+p.score,0);
  const explicit=validStages.includes(String(h.crm_stage||''));
  const cooperation=norm(h.cooperation_status);
  const metricGrowth=Number(metric?.booking_count||0)>0||Number(metric?.gross_sales||0)>0;
  let derivedStage='فعال';
  if(['قطع','متوقف','غیرفعال'].some(x=>cooperation.includes(x))||overdue.length>0||norm(h.risk_status).includes('ریسک'))derivedStage='نیازمند پیگیری';
  else if(!contract.ok)derivedStage='نیازمند تمدید';
  else if(!capacityPart.ok||onlineScore<16)derivedStage='آنلاین‌سازی';
  else if(score>=80&&metricGrowth)derivedStage='رشد';
  const stage=explicit?h.crm_stage:derivedStage;
  return{hotel:h,score,parts,stage,stageSource:explicit?'ثبت‌شده در ihos_hotels.crm_stage':'محاسبه سیستمی از داده‌های همین پرونده',open,overdue,documents:hotelDocs,assignments:hotelAssignments,status,metric};
}

export function HotelLifecycleHealthV19({seedHotels=[],seedTasks=[],seedDocuments=[],onCreateTask,onOpenHotels}:any){
  const [hotels,setHotels]=useState<any[]>([]),[tasks,setTasks]=useState<any[]>([]),[documents,setDocuments]=useState<any[]>([]);
  const [statuses,setStatuses]=useState<any[]>([]),[metrics,setMetrics]=useState<any[]>([]),[assignments,setAssignments]=useState<any[]>([]);
  const [sources,setSources]=useState<SourceState>({hotels:false,status:false,metrics:false,assignments:false,tasks:false,documents:false});
  const [loading,setLoading]=useState(true),[message,setMessage]=useState(''),[query,setQuery]=useState(''),[stage,setStage]=useState('همه'),[quality,setQuality]=useState('همه'),[selected,setSelected]=useState<any>(null);
  async function refresh(){
    setLoading(true);setMessage('');
    const names=['hotels','status','metrics','assignments','tasks','documents'] as const;
    const jobs=[loadAll('ihos_hotels'),loadAll('ihos_hotel_status_v'),loadAll('ihos_hotel_daily_metrics'),loadAll('ihos_hotel_assignments'),loadAll('ihos_tasks'),loadAll('ihos_documents')];
    const result=await Promise.allSettled(jobs);const next:any={};names.forEach((name,i)=>next[name]=result[i].status==='fulfilled');setSources(next);
    setHotels(result[0].status==='fulfilled'?result[0].value:[]);setStatuses(result[1].status==='fulfilled'?result[1].value:[]);setMetrics(result[2].status==='fulfilled'?result[2].value:[]);setAssignments(result[3].status==='fulfilled'?result[3].value:[]);setTasks(result[4].status==='fulfilled'?result[4].value:[]);setDocuments(result[5].status==='fulfilled'?result[5].value:[]);
    const failed=names.filter((_,i)=>result[i].status==='rejected');
    setMessage(failed.length?`داده‌های ${failed.join('، ')} در دسترس نبود و برای جلوگیری از نمایش عدد نادرست، آن منبع خالی نمایش داده شد.`:`${fa((result[0] as any).value?.length||0)} هتل و همه منابع سلامت مستقیماً از Supabase دریافت شد.`);setLoading(false);
  }
  useEffect(()=>{void refresh()},[]);
  const statusMap=useMemo(()=>new Map(statuses.map(x=>[x.id||x.hotel_id,x])),[statuses]);
  const metricMap=useMemo(()=>{const map=new Map<string,any>();[...metrics].sort((a,b)=>String(b.snapshot_date||b.created_at).localeCompare(String(a.snapshot_date||a.created_at))).forEach(m=>{if(!map.has(m.hotel_id))map.set(m.hotel_id,m)});return map},[metrics]);
  const rows=useMemo(()=>hotels.map(h=>buildHealthRow(h,{tasks,documents,assignments,statusMap,metricMap,sources})),[hotels,tasks,documents,assignments,statusMap,metricMap,sources]);
  const filtered=useMemo(()=>rows.filter(r=>(stage==='همه'||r.stage===stage)&&(quality==='همه'||quality==='بحرانی'&&r.score<45||quality==='نیازمند اقدام'&&r.score>=45&&r.score<75||quality==='سالم'&&r.score>=75)&&(!query.trim()||norm(`${r.hotel.title} ${r.hotel.hotel_code} ${r.hotel.city} ${r.hotel.province} ${r.hotel.provider}`).includes(norm(query)))),[rows,stage,quality,query]);
  const avg=rows.length?Math.round(rows.reduce((s,r)=>s+r.score,0)/rows.length):0;
  async function persistStage(row:any,nextStage:string){
    const db=getSupabase();if(!db){setMessage('برای ذخیره مرحله باید اتصال Supabase برقرار باشد.');return}
    const{error}=await db.from('ihos_hotels').update({crm_stage:nextStage,updated_at:new Date().toISOString()}).eq('id',row.hotel.id);
    if(error){setMessage(`ذخیره مرحله ناموفق بود: ${error.message}`);return}
    setHotels(list=>list.map(h=>h.id===row.hotel.id?{...h,crm_stage:nextStage}:h));setMessage(`مرحله «${row.hotel.title}» در ihos_hotels.crm_stage ذخیره شد.`);
  }
  return <div className="lifecycleV19">
    <header className="lifecycleHeroV19"><div><span>VERIFIABLE HOTEL HEALTH</span><div className="titleWithGuideV19"><h2>چرخه و سلامت هتل</h2><GuideHint topic="crm360"/></div><p>همه امتیازها و مراحل از داده‌های واقعی Supabase محاسبه می‌شوند؛ روی امتیاز هر هتل بزنید تا منبع تک‌تک اعداد را ببینید.</p></div><div className="actions"><button className="btn ghost" onClick={refresh} disabled={loading}><RefreshCcw className={loading?'spin':''}/> همگام‌سازی کامل</button><button className="btn primary" onClick={onOpenHotels}><Hotel/> پرونده هتل‌ها</button></div></header>
    <div className={`healthSourceV19 ${Object.values(sources).every(Boolean)?'ok':'warning'}`}><Database/><div><b>{Object.values(sources).every(Boolean)?'منبع داده آنلاین و کامل است':'برخی منابع در دسترس نیستند'}</b><span>{message}</span></div><small>{Object.entries(sources).map(([key,ok])=><i className={ok?'on':''} key={key}>{ok?'✓':'!'} {key}</i>)}</small></div>
    <div className="healthKpisV19"><article><Building2/><span>هتل واقعی</span><b>{fa(rows.length)}</b></article><article><ShieldCheck/><span>میانگین سلامت</span><b>{fa(avg)}٪</b></article><article><AlertTriangle/><span>زیر ۴۵٪</span><b>{fa(rows.filter(r=>r.score<45).length)}</b></article><article><ClipboardList/><span>تسک معوق مرتبط</span><b>{fa(rows.reduce((n,r)=>n+r.overdue.length,0))}</b></article></div>
    <div className="healthFormulaV19"><CircleAlertIcon/><div><b>فرمول قابل ممیزی</b><span>ظرفیت ۲۵ + قرارداد ۲۰ + آنلاین‌بودن ۲۰ + مالکیت ۱۵ + اجرای تسک ۱۵ + اسناد ۵</span></div><GuideHint topic="crm360"/></div>
    <div className="healthToolbarV19"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام، کد، شهر، استان یا Provider..."/></label><select value={stage} onChange={e=>setStage(e.target.value)}><option>همه</option>{validStages.map(x=><option key={x}>{x}</option>)}</select><select value={quality} onChange={e=>setQuality(e.target.value)}><option>همه</option><option>بحرانی</option><option>نیازمند اقدام</option><option>سالم</option></select><span>{fa(filtered.length)} نتیجه</span></div>
    <div className="healthBoardV19">{validStages.map(lane=>{const laneRows=filtered.filter(r=>r.stage===lane);return <section className="healthLaneV19" key={lane}><header><h3>{lane}</h3><b>{fa(laneRows.length)}</b></header>{laneRows.slice(0,100).map(row=><article className="healthCardV19" key={row.hotel.id}><div className="healthCardHeadV19"><button className={`healthScoreV19 ${row.score<45?'bad':row.score<75?'warn':'good'}`} onClick={()=>setSelected(row)}><b>{fa(row.score)}</b><small>از ۱۰۰</small></button><div><h4>{row.hotel.title}</h4><p>{row.hotel.hotel_code||'بدون کد'} · {row.hotel.city||'بدون شهر'} · {row.hotel.provider||'بدون Provider'}</p></div></div><div className="healthSignalsV19">{row.parts.filter((p:ScorePart)=>!p.ok).slice(0,3).map((p:ScorePart)=><span key={p.key}>{p.title}: {p.value}</span>)}{row.parts.every((p:ScorePart)=>p.ok)&&<span className="good">همه شاخص‌ها مطلوب‌اند</span>}</div><div className="healthCardMetaV19"><span>{fa(row.open.length)} تسک باز</span><span>{fa(row.documents.length)} سند</span><span>{fa(row.assignments.length)} مسئول</span></div><footer><select aria-label={`مرحله ${row.hotel.title}`} value={row.stage} onChange={e=>void persistStage(row,e.target.value)}>{validStages.map(x=><option key={x}>{x}</option>)}</select><button className="btn ghost" onClick={()=>onCreateTask?.(row.hotel)}>ساخت تسک</button><button className="btn primary" onClick={()=>setSelected(row)}>جزئیات امتیاز</button></footer><small className="stageSourceV19">{row.stageSource}</small></article>)}{!laneRows.length&&<div className="healthEmptyV19"><CheckCircle2/><span>موردی در این مرحله نیست</span></div>}</section>})}</div>
    {selected&&<div className="healthDrawerBackdropV19" onClick={()=>setSelected(null)}><aside className="healthDrawerV19" role="dialog" aria-modal="true" aria-label={`جزئیات سلامت ${selected.hotel.title}`} onClick={e=>e.stopPropagation()}><header><div><span>منبع و محاسبه امتیاز</span><h3>{selected.hotel.title}</h3><p>{selected.stage} · {selected.stageSource}</p></div><button aria-label="بستن" onClick={()=>setSelected(null)}><X/></button></header><div className={`healthTotalV19 ${selected.score<45?'bad':selected.score<75?'warn':'good'}`}><b>{fa(selected.score)}</b><span>امتیاز سلامت از ۱۰۰</span></div><div className="healthBreakdownV19">{selected.parts.map((part:ScorePart)=><article key={part.key}><div><span>{part.title}</span><b>{fa(part.score)} / {fa(part.max)}</b></div><progress value={part.score} max={part.max}/><p>{part.value}</p><code>{part.source}</code></article>)}</div><div className="healthEvidenceV19"><h4>شواهد پرونده</h4><p>{fa(selected.open.length)} تسک باز، {fa(selected.overdue.length)} معوق، {fa(selected.documents.length)} سند، {fa(selected.assignments.length)} تخصیص فعال</p>{selected.metric&&<p>آخرین متریک: {selected.metric.snapshot_date} · فروش {fa(selected.metric.gross_sales)} · رزرو {fa(selected.metric.booking_count)}</p>}</div></aside></div>}
  </div>
}

function CircleAlertIcon(){return <AlertTriangle/>}

'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {
  Activity,AlertTriangle,ArrowLeftRight,BarChart3,Building2,CalendarClock,CheckCircle2,
  CircleDollarSign,Database,FileSpreadsheet,Gauge,Hotel,RefreshCcw,Settings2,ShieldAlert,
  Sparkles,Target,Upload,Users2,Wifi,Workflow
} from 'lucide-react';
import {DEFAULT_PROVIDER_RULES} from '@/lib/superapp/automation';
import {loadRows,makeId,normalizeFa,nowIso,saveRows,saveSetting} from './storage';

type Tab='overview'|'online'|'financial'|'performance'|'data';
type Props={
  hotels?:any[];tasks?:any[];users?:any[];me?:any;setView?:(view:any)=>void;
  onCreateTask?:(hotel:any,input?:any)=>void;onOpenHotelImport?:()=>void;
  onImportExperts?:(file:File)=>Promise<void>;onImportAssignments?:(file:File)=>Promise<void>;
};

const fa=(value:number)=>Number(value||0).toLocaleString('fa-IR');
const percent=(part:number,total:number)=>Math.round(part/Math.max(1,total)*100);
const isDone=(value:any)=>['انجام شد','بسته شده','تایید شده'].includes(String(value||''));
const asNumber=(value:any)=>{const n=Number(String(value??'').replace(/[٬,]/g,''));return Number.isFinite(n)?n:0};
const dateOnly=(value:any)=>String(value||'').slice(0,10);
const daysUntil=(value:any)=>{const time=new Date(`${dateOnly(value)}T12:00:00`).getTime();return Number.isFinite(time)?Math.ceil((time-Date.now())/86400000):99999};
const providerKey=(value:any)=>normalizeFa(value||'IHO Provider');

const FINANCIAL_LEVELS=[
  {level:'A+',min:25,max:999,title:'Strategic Cash-flow',tone:'excellent'},
  {level:'A',min:18,max:24,title:'High Cash-flow',tone:'excellent'},
  {level:'A-',min:15,max:17,title:'Good Cash-flow',tone:'good'},
  {level:'B+',min:10,max:14,title:'Medium Cash-flow',tone:'good'},
  {level:'B',min:7,max:9,title:'Limited Cash-flow',tone:'warn'},
  {level:'B-',min:1,max:6,title:'Low Cash-flow',tone:'warn'},
  {level:'D',min:0,max:0,title:'Same-day Settlement',tone:'bad'},
] as const;

function financialClass(hotel:any,profile?:any){
  const settlement=normalizeFa(profile?.settlement_model||profile?.contract_financial_type||'');
  if(settlement.includes('به محض')||settlement.includes('رزرو')&&settlement.includes('فوری'))return{level:'F',title:'Immediate Payment',days:null,tone:'critical'};
  const purchase=asNumber(profile?.purchase_days??hotel?.purchase_period);
  const payment=asNumber(profile?.payment_days??hotel?.payment_period);
  const days=purchase/2+payment;
  const found=days>=25?FINANCIAL_LEVELS[0]:days>=18?FINANCIAL_LEVELS[1]:days>=15?FINANCIAL_LEVELS[2]:days>=10?FINANCIAL_LEVELS[3]:days>=7?FINANCIAL_LEVELS[4]:days>0?FINANCIAL_LEVELS[5]:FINANCIAL_LEVELS[6];
  return{...found,days};
}

function channelValue(row:any,key:'rate'|'capacity'){
  const coverage=normalizeFa(row.coverage_type);
  if(key==='rate')return row.rate_online!==false&&(row.rate_online===true||coverage.includes('نرخ'));
  return row.capacity_online!==false&&(row.capacity_online===true||coverage.includes('ظرفیت'));
}

export default function SupplyChainCommandCenter({hotels=[],tasks=[],users=[],me,setView,onCreateTask,onOpenHotelImport,onImportExperts,onImportAssignments}:Props){
  const [tab,setTab]=useState<Tab>('overview');
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [automation,setAutomation]=useState<any[]>([]),[rules,setRules]=useState<any[]>([]),[coverage,setCoverage]=useState<any[]>([]);
  const [assignments,setAssignments]=useState<any[]>([]),[profiles,setProfiles]=useState<any[]>([]),[reports,setReports]=useState<any[]>([]);
  const [sales,setSales]=useState<any[]>([]),[blockers,setBlockers]=useState<any[]>([]),[settings,setSettings]=useState({capacityMinutes:12,rateMinutes:8,capacityWeight:65,rateWeight:35});
  const expertInput=useRef<HTMLInputElement>(null),assignmentInput=useRef<HTMLInputElement>(null),salesInput=useRef<HTMLInputElement>(null);

  async function refresh(){
    setLoading(true);setError('');
    try{
      const results=await Promise.allSettled([
        loadRows('ihos_hotel_automation'),loadRows('ihos_provider_rules'),loadRows('ihos_provider_coverage'),
        loadRows('ihos_hotel_assignments'),loadRows('ihos_hotel_financial_profiles'),loadRows('ihos_work_reports'),
        loadRows('ihos_hotel_sales_metrics'),loadRows('ihos_hotel_blockers'),loadRows('ihos_settings','key,value',5000)
      ]);
      const rows=(index:number)=>results[index].status==='fulfilled'?(results[index] as PromiseFulfilledResult<any[]>).value:[];
      setAutomation(rows(0));setRules(rows(1));setCoverage(rows(2));setAssignments(rows(3));setProfiles(rows(4));setReports(rows(5));setSales(rows(6));setBlockers(rows(7));
      const config=new Map(rows(8).map((item:any)=>[item.key,item.value]));
      setSettings(current=>({
        capacityMinutes:asNumber(config.get('supply_manual_capacity_minutes'))||current.capacityMinutes,
        rateMinutes:asNumber(config.get('supply_manual_rate_minutes'))||current.rateMinutes,
        capacityWeight:asNumber(config.get('supply_capacity_weight'))||current.capacityWeight,
        rateWeight:asNumber(config.get('supply_rate_weight'))||current.rateWeight,
      }));
      const rejected=results.filter(item=>item.status==='rejected');
      if(rejected.length)setError('بخشی از داده‌های تکمیلی در دسترس نیست؛ شاخص‌های قابل محاسبه نمایش داده شده‌اند.');
    }catch(e:any){setError(e?.message||'دریافت داده‌های زنجیره تأمین ناموفق بود')}finally{setLoading(false)}
  }
  useEffect(()=>{void refresh()},[]);

  const analysis=useMemo(()=>{
    const autoMap=new Map(automation.map(row=>[row.hotel_id,row]));
    const profileMap=new Map(profiles.map(row=>[row.hotel_id,row]));
    const ruleRows=(rules.length?rules:DEFAULT_PROVIDER_RULES.map((rule:any)=>({name:rule.name,rate_api:rule.rateApi,capacity_api:rule.capacityApi,active:rule.active!==false,priority:rule.priority||99})));
    const ruleMap=new Map(ruleRows.map(row=>[providerKey(row.name),row]));
    const coverageMap=new Map<string,any[]>();
    coverage.filter(row=>row.active!==false).forEach(row=>{const key=row.hotel_id||`code:${row.hotel_code}`;coverageMap.set(key,[...(coverageMap.get(key)||[]),row])});
    let cooperating=0,fullLive=0,capacityLive=0,rateLive=0,manual=0,migratable=0,multiProvider=0;
    const providerStats=new Map<string,any>();
    const financeStats=new Map<string,number>();
    const hotelRows=hotels.map(hotel=>{
      const auto=autoMap.get(hotel.id)||{};
      const provider=String(auto.provider||hotel.provider||'IHO Provider').trim()||'IHO Provider';
      const rule:any=ruleMap.get(providerKey(provider))||{};
      const rateApi=rule.active!==false&&!!rule.rate_api;
      const capacityApi=rule.active!==false&&!!rule.capacity_api;
      const selfRate=!!auto.hotel_rate;
      const selfCapacity=!!auto.hotel_capacity;
      const manualRate=!!String(auto.rate_expert||'').trim();
      const manualCapacity=!!String(auto.capacity_expert||'').trim();
      const rateOnline=rateApi||selfRate||manualRate;
      const capacityOnline=capacityApi||selfCapacity||manualCapacity;
      const onlineScore=(capacityOnline?settings.capacityWeight:0)+(rateOnline?settings.rateWeight:0);
      const automatedScore=(capacityApi||selfCapacity?settings.capacityWeight:0)+(rateApi||selfRate?settings.rateWeight:0);
      const candidates=coverageMap.get(hotel.id)||coverageMap.get(`code:${hotel.hotel_code}`)||[];
      const eligibleProviders=[...new Set(candidates.map(item=>item.provider).filter(Boolean))];
      const recommendations=candidates.filter(item=>providerKey(item.provider)!==providerKey(provider)).map(item=>{
        const candidateRule:any=ruleMap.get(providerKey(item.provider))||{};
        const cap=channelValue(item,'capacity')||!!candidateRule.capacity_api;
        const rate=channelValue(item,'rate')||!!candidateRule.rate_api;
        return{provider:item.provider,score:(cap?settings.capacityWeight:0)+(rate?settings.rateWeight:0),priority:Number(candidateRule.priority||item.priority||99)};
      }).sort((a,b)=>b.score-a.score||a.priority-b.priority);
      const canMigrate=!!recommendations[0]&&recommendations[0].score>automatedScore;
      const cooperation=normalizeFa(hotel.cooperation_status);
      const active=cooperation.includes('در حال همکاری')||cooperation==='فعال'||cooperation.includes('همکار فعال');
      if(active){
        cooperating++;
        if(onlineScore>=100)fullLive++;
        if(capacityOnline)capacityLive++;
        if(rateOnline)rateLive++;
        if(manualRate||manualCapacity)manual++;
        if(canMigrate)migratable++;
        if(eligibleProviders.length>1)multiProvider++;
      }
      const p=providerStats.get(provider)||{provider,total:0,full:0,capacity:0,rate:0,manual:0};
      p.total++;if(onlineScore>=100)p.full++;if(capacityOnline)p.capacity++;if(rateOnline)p.rate++;if(manualRate||manualCapacity)p.manual++;providerStats.set(provider,p);
      const financial=financialClass(hotel,profileMap.get(hotel.id));financeStats.set(financial.level,(financeStats.get(financial.level)||0)+1);
      return{...hotel,provider,active,rateOnline,capacityOnline,onlineScore,automatedScore,manualRate,manualCapacity,recommendation:recommendations[0],eligibleProviders,financial};
    });
    const statuses=new Map<string,number>();hotels.forEach(h=>{const key=String(h.cooperation_status||'نامشخص').trim()||'نامشخص';statuses.set(key,(statuses.get(key)||0)+1)});
    const expiring=hotels.filter(h=>{const days=daysUntil(h.status_end_date);return days>=0&&days<=45;}).sort((a,b)=>daysUntil(a.status_end_date)-daysUntil(b.status_end_date));
    return{
      hotelRows,cooperating,fullLive,capacityLive,rateLive,manual,migratable,multiProvider,expiring,
      providers:[...providerStats.values()].sort((a,b)=>b.total-a.total),
      finances:['A+','A','A-','B+','B','B-','D','F'].map(level=>({level,count:financeStats.get(level)||0})),
      statuses:[...statuses.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)
    };
  },[hotels,automation,rules,coverage,profiles,settings]);

  const people=useMemo(()=>{
    const activeAssignments=assignments.filter(row=>row.active!==false);
    const todayReports=reports.filter(row=>dateOnly(row.occurred_at||row.created_at)===dateOnly(nowIso()));
    return users.filter(user=>user.is_active!==false).map(user=>{
      const byId=activeAssignments.filter(row=>row.user_id===user.id||normalizeFa(row.user_name)===normalizeFa(user.full_name));
      const autoRate=automation.filter(row=>normalizeFa(row.rate_expert)===normalizeFa(user.full_name)).length;
      const autoCapacity=automation.filter(row=>normalizeFa(row.capacity_expert)===normalizeFa(user.full_name)).length;
      const rate=Math.max(autoRate,new Set(byId.filter(row=>row.assignment_role==='rate_expert').map(row=>row.hotel_id)).size);
      const capacity=Math.max(autoCapacity,new Set(byId.filter(row=>row.assignment_role==='capacity_expert').map(row=>row.hotel_id)).size);
      const openTasks=tasks.filter(task=>task.assigned_to===user.id&&!isDone(task.status));
      const late=openTasks.filter(task=>task.deadline&&daysUntil(task.deadline)<0).length;
      const userReports=reports.filter(row=>row.user_id===user.id||normalizeFa(row.user_name)===normalizeFa(user.full_name));
      const points=userReports.reduce((sum,row)=>sum+asNumber(row.weight||1),0);
      const minutes=capacity*settings.capacityMinutes+rate*settings.rateMinutes;
      return{user,rate,capacity,minutes,open:openTasks.length,late,points,today:todayReports.filter(row=>row.user_id===user.id).length};
    }).sort((a,b)=>b.points-a.points||b.capacity+b.rate-(a.capacity+a.rate));
  },[users,assignments,automation,tasks,reports,settings]);

  const salesSummary=useMemo(()=>sales.reduce((sum,row)=>({
    gross:sum.gross+asNumber(row.gross_sales),margin:sum.margin+asNumber(row.margin_amount),nights:sum.nights+asNumber(row.room_nights),
    confirmed:sum.confirmed+asNumber(row.confirmed_bookings),unconfirmed:sum.unconfirmed+asNumber(row.unconfirmed_bookings)
  }),{gross:0,margin:0,nights:0,confirmed:0,unconfirmed:0}),[sales]);
  const openBlockers=blockers.filter(row=>!['resolved','closed','حل شد','بسته شد'].includes(String(row.status||'')));
  const urgentTasks=tasks.filter(task=>!isDone(task.status)&&(task.priority==='فوری'||task.deadline&&daysUntil(task.deadline)<0));

  async function handleImport(file:File|undefined,runner:((file:File)=>Promise<void>)|undefined,label:string){
    if(!file||!runner)return;setNotice(`در حال اعمال ${label}...`);
    try{await runner(file);setNotice(`${label} با موفقیت اعمال شد`);await refresh()}catch(e:any){setNotice(`${label} ناموفق بود: ${e.message}`)}
  }
  async function importSales(file:File){
    setNotice('در حال خواندن داده فروش...');
    try{
      const XLSX=await import('xlsx');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false});const ws=wb.Sheets[wb.SheetNames[0]];
      const raw=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false}) as Record<string,any>[];
      const pick=(row:any,names:string[])=>{const key=Object.keys(row).find(k=>names.some(name=>normalizeFa(name)===normalizeFa(k)));return key?row[key]:''};
      const hotelMap=new Map(hotels.map(h=>[normalizeFa(h.hotel_code),h]));
      const titleMap=new Map(hotels.map(h=>[normalizeFa(h.title),h]));
      const rows=raw.map((row,index)=>{const code=String(pick(row,['کد هتل','hotel_code','hotel code']));const title=String(pick(row,['نام هتل','hotel_title','hotel name']));const hotel=hotelMap.get(normalizeFa(code))||titleMap.get(normalizeFa(title));if(!hotel)return null;const date=dateOnly(pick(row,['تاریخ','date','metric_date']))||dateOnly(nowIso());return{id:`sales-${hotel.id}-${date}-${index}`,hotel_id:hotel.id,hotel_code:hotel.hotel_code,hotel_title:hotel.title,metric_date:date,confirmed_bookings:asNumber(pick(row,['رزرو قطعی','confirmed bookings','confirmed_bookings'])),unconfirmed_bookings:asNumber(pick(row,['رزرو غیر قطعی','unconfirmed bookings','unconfirmed_bookings'])),room_nights:asNumber(pick(row,['شب اقامت','room nights','room_nights'])),gross_sales:asNumber(pick(row,['فروش','gross sales','gross_sales'])),margin_amount:asNumber(pick(row,['مارجین','margin','margin_amount'])),cancellations:asNumber(pick(row,['کنسلی','cancellations'])),source_name:file.name,created_at:nowIso(),updated_at:nowIso()}}).filter(Boolean) as any[];
      if(!rows.length)throw new Error('هیچ هتل معتبری با کد یا نام فایل اصلی تطبیق پیدا نکرد');
      await saveRows('ihos_hotel_sales_metrics',rows);setNotice(`${fa(rows.length)} ردیف فروش اعمال شد`);await refresh();
    }catch(e:any){setNotice(`ورود داده فروش ناموفق بود: ${e.message}`)}
  }
  async function saveSupplySettings(){
    setNotice('در حال ذخیره تنظیمات محاسبات...');
    try{await Promise.all([saveSetting('supply_manual_capacity_minutes',settings.capacityMinutes),saveSetting('supply_manual_rate_minutes',settings.rateMinutes),saveSetting('supply_capacity_weight',settings.capacityWeight),saveSetting('supply_rate_weight',settings.rateWeight)]);setNotice('تنظیمات محاسبات ذخیره شد')}catch(e:any){setNotice(`ذخیره تنظیمات ناموفق بود: ${e.message}`)}
  }

  const cooperating=Math.max(1,analysis.cooperating);
  const tabs:[Tab,string,any][]=[['overview','تصویر کلان',Gauge],['online','آنلاین‌سازی',Wifi],['financial','مالی و فروش',CircleDollarSign],['performance','تیم و موانع',Users2],['data','ورود داده و تنظیمات',Database]];
  return <div className="supplyOSV23">
    <section className="supplyHeroV23">
      <div><span>SUPPLY CHAIN OPERATING SYSTEM</span><h1>مرکز فرمان زنجیره تأمین هتل</h1><p>یک تصویر قابل اقدام از همکاری، آنلاین‌سازی نرخ و ظرفیت، مهاجرت Provider، قرارداد، فروش و بار کاری تیم.</p><div className="supplyHeroActionsV23"><button className="btn primary" onClick={()=>setView?.('workReports')}>ثبت گزارش کار سریع</button><button className="btn glass" onClick={()=>setView?.('tasks')}>تسک‌های نیازمند اقدام</button></div></div>
      <div className="supplyHealthV23"><div style={{'--supply-score':`${percent(analysis.capacityLive,cooperating)*3.6}deg`} as any}><b>{percent(analysis.capacityLive,cooperating)}٪</b><span>پوشش ظرفیت</span></div><small>{fa(analysis.capacityLive)} هتل دارای ظرفیت آنلاین یا دستی</small></div>
    </section>
    <div className="supplyTabsV23" role="tablist" aria-label="بخش‌های مرکز زنجیره تأمین">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}><Icon/>{label}</button>)}<button className="refresh" onClick={refresh} disabled={loading}><RefreshCcw className={loading?'spin':''}/> بروزرسانی</button></div>
    {(error||notice)&&<div className={error?'supplyNoticeV23 danger':'supplyNoticeV23'}>{error||notice}</div>}

    {tab==='overview'&&<>
      <section className="supplyMetricsV23">
        <SupplyMetric icon={Building2} title="کل هتل‌ها" value={hotels.length} hint={`${fa(analysis.cooperating)} در حال همکاری`} tone="blue"/>
        <SupplyMetric icon={CheckCircle2} title="کاملاً لایو" value={analysis.fullLive} hint={`${percent(analysis.fullLive,cooperating)}٪ هتل‌های همکار`} tone="green"/>
        <SupplyMetric icon={Wifi} title="ظرفیت آنلاین" value={analysis.capacityLive} hint={`وزن ظرفیت ${settings.capacityWeight}٪`} tone="cyan"/>
        <SupplyMetric icon={ArrowLeftRight} title="قابل مهاجرت" value={analysis.migratable} hint={`${fa(analysis.multiProvider)} هتل چند Providerی`} tone="orange"/>
        <SupplyMetric icon={CalendarClock} title="وضعیت رو به پایان" value={analysis.expiring.length} hint="تا ۴۵ روز آینده" tone="purple"/>
        <SupplyMetric icon={ShieldAlert} title="مانع باز" value={openBlockers.length} hint={`${fa(urgentTasks.length)} تسک مهم یا معوق`} tone="red"/>
      </section>
      <section className="supplyGridV23">
        <article className="supplyPanelV23 span2"><PanelHead eyebrow="ONLINE MIX" title="وضعیت آنلاین‌سازی بر اساس Provider" action="مدیریت Providerها" onAction={()=>setView?.('hotelSuperApp')}/><div className="providerRowsV23">{analysis.providers.slice(0,10).map(row=><div key={row.provider}><div><b>{row.provider}</b><small>{fa(row.total)} هتل · {fa(row.manual)} دستی</small></div><Progress value={percent(row.full,row.total)} label={`${fa(row.full)} کاملاً لایو`}/><Progress value={percent(row.capacity,row.total)} label={`${fa(row.capacity)} ظرفیت`}/></div>)}</div></article>
        <article className="supplyPanelV23"><PanelHead eyebrow="COOPERATION" title="ترکیب وضعیت همکاری"/><div className="statusRowsV23">{analysis.statuses.slice(0,8).map((row,index)=><div key={row.name}><i style={{background:['#2563eb','#14b8a6','#8b5cf6','#f59e0b','#ef4444'][index%5]}}/><span>{row.name}</span><b>{fa(row.count)}</b><small>{percent(row.count,hotels.length)}٪</small></div>)}</div></article>
        <article className="supplyPanelV23"><PanelHead eyebrow="NEXT ACTIONS" title="اقدام‌های فوری مدیر عملیات"/><div className="actionListV23">{analysis.expiring.slice(0,4).map(h=><button key={h.id} onClick={()=>onCreateTask?.(h,{title:`تمدید وضعیت ${h.title}`,category:'قرارداد',priority:'بالا',deadline:h.status_end_date})}><CalendarClock/><span><b>{h.title}</b><small>{daysUntil(h.status_end_date)} روز تا پایان وضعیت</small></span></button>)}{analysis.hotelRows.filter(h=>h.active&&h.recommendation).slice(0,4).map(h=><button key={`m-${h.id}`} onClick={()=>onCreateTask?.(h,{title:`بررسی مهاجرت ${h.title} به ${h.recommendation.provider}`,category:'آنلاین‌سازی',priority:'بالا'})}><ArrowLeftRight/><span><b>{h.title}</b><small>پیشنهاد: {h.recommendation.provider} · امتیاز {h.recommendation.score}٪</small></span></button>)}{!analysis.expiring.length&&!analysis.migratable&&<Empty text="اقدام فوری از داده فعلی استخراج نشد."/>}</div></article>
      </section>
    </>}

    {tab==='online'&&<section className="supplyGridV23">
      <article className="supplyPanelV23 span3"><PanelHead eyebrow="MAXIMUM ONLINE" title="نقشه راه حداکثر آنلاین‌سازی" action="قابلیت و اولویت Provider" onAction={()=>setView?.('hotelSuperApp')}/><div className="onlineFormulaV23"><span><b>{settings.capacityWeight}٪</b> ظرفیت</span><span><b>{settings.rateWeight}٪</b> نرخ</span><span><b>{fa(analysis.manual)}</b> آنلاین دستی و زمان‌بر</span><span><b>{fa(analysis.multiProvider)}</b> دارای بیش از یک گزینه</span></div><div className="migrationTableV23"><header><span>هتل</span><span>Provider فعلی</span><span>وضعیت فعلی</span><span>بهترین گزینه</span><span>بهبود</span><span>اقدام</span></header>{analysis.hotelRows.filter(h=>h.active&&(h.recommendation||h.onlineScore<100)).sort((a,b)=>(b.recommendation?.score||0)-b.automatedScore-((a.recommendation?.score||0)-a.automatedScore)).slice(0,120).map(h=><div key={h.id}><span><b>{h.title}</b><small>{h.city||'بدون شهر'} · {h.hotel_code||'بدون کد'}</small></span><span>{h.provider}</span><span><OnlinePills hotel={h}/></span><span>{h.recommendation?.provider||'بدون گزینه بهتر'}<small>{h.eligibleProviders.length?`${h.eligibleProviders.length} Provider واجدشرایط`:''}</small></span><strong className={h.recommendation?.score>h.automatedScore?'good':''}>{h.recommendation?`+${Math.max(0,h.recommendation.score-h.automatedScore)}٪`:'—'}</strong><button onClick={()=>onCreateTask?.(h,{title:`آنلاین‌سازی ${h.title}${h.recommendation?` روی ${h.recommendation.provider}`:''}`,category:'آنلاین‌سازی',priority:h.capacityOnline?'متوسط':'فوری'})}>ساخت تسک</button></div>)}</div></article>
    </section>}

    {tab==='financial'&&<>
      <section className="supplyMetricsV23"><SupplyMetric icon={CircleDollarSign} title="فروش ثبت‌شده" value={salesSummary.gross} hint={`${fa(salesSummary.margin)} مارجین`} tone="green" money/><SupplyMetric icon={Hotel} title="شب اقامت" value={salesSummary.nights} hint="در داده واردشده" tone="blue"/><SupplyMetric icon={CheckCircle2} title="رزرو قطعی" value={salesSummary.confirmed} hint={`${fa(salesSummary.unconfirmed)} غیرقطعی`} tone="cyan"/><SupplyMetric icon={Target} title="نرخ قطعیت" value={percent(salesSummary.confirmed,salesSummary.confirmed+salesSummary.unconfirmed)} hint="رزرو قطعی از کل" tone="purple" suffix="٪"/></section>
      <section className="supplyGridV23"><article className="supplyPanelV23 span2"><PanelHead eyebrow="CASH-FLOW" title="طبقه‌بندی بازه مؤثر کش‌فلو"/><p className="formulaNoteV23">بازه مؤثر = نصف دوره خرید + دوره پرداخت؛ مدل «به محض ثبت رزرو» مستقیماً سطح F است.</p><div className="financialBandsV23">{analysis.finances.map(row=><button key={row.level}><b>{row.level}</b><span>{FINANCIAL_LEVELS.find(x=>x.level===row.level)?.title||'Immediate Payment'}</span><strong>{fa(row.count)}</strong><i style={{width:`${percent(row.count,hotels.length)}%`}}/></button>)}</div></article><article className="supplyPanelV23"><PanelHead eyebrow="CONTRACT WATCH" title="قرارداد و وضعیت رو به پایان"/><div className="compactHotelListV23">{analysis.expiring.slice(0,12).map(h=><button key={h.id} onClick={()=>onCreateTask?.(h,{title:`پیگیری قرارداد ${h.title}`,category:'قرارداد',priority:daysUntil(h.status_end_date)<15?'فوری':'بالا'})}><span><b>{h.title}</b><small>{h.provider||'بدون Provider'}</small></span><strong>{fa(daysUntil(h.status_end_date))} روز</strong></button>)}{!analysis.expiring.length&&<Empty text="موردی در ۴۵ روز آینده ثبت نشده است."/>}</div></article></section>
    </>}

    {tab==='performance'&&<section className="supplyGridV23">
      <article className="supplyPanelV23 span2"><PanelHead eyebrow="EXPERT WORKLOAD" title="بار کاری نرخ، ظرفیت و کیفیت خروجی" action="مرکز KPI" onAction={()=>setView?.('kpiCenter')}/><div className="peopleTableV23"><header><span>کارشناس</span><span>ظرفیت</span><span>نرخ</span><span>زمان تخمینی/هفته</span><span>تسک باز / معوق</span><span>امتیاز گزارش</span></header>{people.map((row,index)=><div key={row.user.id}><span className="personV23"><i>{row.user.avatar?<img src={row.user.avatar} alt=""/>:row.user.full_name?.slice(0,1)}</i><span><b>{index===0&&row.points>0?'🏆 ':''}{row.user.full_name}</b><small>{row.user.department_name||row.user.team||'بدون دپارتمان'}</small></span></span><b>{fa(row.capacity)}</b><b>{fa(row.rate)}</b><span>{fa(Math.round(row.minutes/60))} ساعت</span><span>{fa(row.open)} / <em className={row.late?'danger':''}>{fa(row.late)}</em></span><strong>{fa(row.points)}</strong></div>)}</div></article>
      <article className="supplyPanelV23"><PanelHead eyebrow="BLOCKERS" title="موانع باز هتل‌ها" action="ثبت در گزارش کار" onAction={()=>setView?.('workReports')}/><div className="blockerListV23">{openBlockers.slice(0,14).map(row=><article key={row.id}><i className={String(row.severity).includes('critical')||row.severity==='بحرانی'?'critical':''}><AlertTriangle/></i><div><b>{row.title||row.blocker_type}</b><small>{row.hotel_title||'بدون هتل'} · {row.owner_name||'بدون مسئول'}</small></div><span>{row.status||'باز'}</span></article>)}{!openBlockers.length&&<Empty text="مانع بازی ثبت نشده است."/>}</div></article>
    </section>}

    {tab==='data'&&<section className="supplyGridV23">
      <article className="supplyPanelV23 span2"><PanelHead eyebrow="DATA INBOX" title="ورود فایل‌های عملیاتی"/><div className="dataImportGridV23">
        <ImportCard icon={Building2} title="All Hotel Data" text="اطلاعات پایه، همکاری، قرارداد، دوره خرید و پرداخت" action="ورود فایل هتل‌ها" onClick={onOpenHotelImport}/>
        <ImportCard icon={Users2} title="فایل کارشناسان" text="کاربران، دپارتمان، نقش، عکس و اطلاعات تماس" action="ورود کارشناسان" onClick={()=>expertInput.current?.click()}/>
        <ImportCard icon={Workflow} title="تخصیص نرخ و ظرفیت" text="A نام هتل، B taskId و C نام کارشناس؛ ۱ ظرفیت و ۲ نرخ" action="ورود تخصیص‌ها" onClick={()=>assignmentInput.current?.click()}/>
        <ImportCard icon={BarChart3} title="فروش و شب اقامت" text="رزرو قطعی و غیرقطعی، شب اقامت، فروش و مارجین" action="ورود داده فروش" onClick={()=>salesInput.current?.click()}/>
        <ImportCard icon={Wifi} title="هتل‌های Provider" text="نام و کد هتل هر Provider، قابلیت نرخ و ظرفیت و اولویت" action="مدیریت Providerها" onClick={()=>setView?.('hotelSuperApp')}/>
        <ImportCard icon={FileSpreadsheet} title="گزارش کار" text="ورود سریع در اپ؛ خروجی قابل تحلیل و جایگزین Google Sheet" action="رفتن به گزارش کار" onClick={()=>setView?.('workReports')}/>
      </div><input ref={expertInput} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>void handleImport(e.target.files?.[0],onImportExperts,'فایل کارشناسان')}/><input ref={assignmentInput} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>void handleImport(e.target.files?.[0],onImportAssignments,'تخصیص کارشناسان')}/><input ref={salesInput} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>{const file=e.target.files?.[0];if(file)void importSales(file)}}/></article>
      <article className="supplyPanelV23"><PanelHead eyebrow="CALCULATION" title="تنظیم مدل آنلاین و بار کاری"/><div className="supplySettingsV23"><label>وزن ظرفیت (%)<input type="number" min="0" max="100" value={settings.capacityWeight} onChange={e=>setSettings({...settings,capacityWeight:asNumber(e.target.value),rateWeight:Math.max(0,100-asNumber(e.target.value))})}/></label><label>وزن نرخ (%)<input type="number" min="0" max="100" value={settings.rateWeight} onChange={e=>setSettings({...settings,rateWeight:asNumber(e.target.value),capacityWeight:Math.max(0,100-asNumber(e.target.value))})}/></label><label>دقیقه هفتگی هر ظرفیت دستی<input type="number" min="1" value={settings.capacityMinutes} onChange={e=>setSettings({...settings,capacityMinutes:asNumber(e.target.value)})}/></label><label>دقیقه هفتگی هر نرخ دستی<input type="number" min="1" value={settings.rateMinutes} onChange={e=>setSettings({...settings,rateMinutes:asNumber(e.target.value)})}/></label><button className="btn primary full" onClick={saveSupplySettings}><Settings2/> ذخیره مدل محاسبات</button></div></article>
    </section>}
  </div>
}

function SupplyMetric({icon:Icon,title,value,hint,tone,money=false,suffix=''}:any){return <article className={`supplyMetricV23 ${tone}`}><i><Icon/></i><span><small>{title}</small><b>{fa(value)}{suffix}</b><em>{hint}{money?' ریال':''}</em></span></article>}
function PanelHead({eyebrow,title,action,onAction}:any){return <header className="supplyPanelHeadV23"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action&&<button onClick={onAction}>{action}</button>}</header>}
function Progress({value,label}:any){return <div className="supplyProgressV23"><span>{label}</span><div><i style={{width:`${Math.min(100,value)}%`}}/></div><b>{value}٪</b></div>}
function Empty({text}:any){return <div className="supplyEmptyV23"><Sparkles/><span>{text}</span></div>}
function OnlinePills({hotel}:any){return <div className="onlinePillsV23"><i className={hotel.capacityOnline?'on':''}>ظرفیت</i><i className={hotel.rateOnline?'on':''}>نرخ</i>{(hotel.manualCapacity||hotel.manualRate)&&<i className="manual">دستی</i>}</div>}
function ImportCard({icon:Icon,title,text,action,onClick}:any){return <button className="importCardV23" onClick={onClick}><i><Icon/></i><span><b>{title}</b><small>{text}</small><em>{action}</em></span><Upload/></button>}

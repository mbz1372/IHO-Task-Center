'use client';

import {useEffect,useMemo,useState} from 'react';
import {
  Area,AreaChart,Bar,BarChart,CartesianGrid,Cell,Legend,Pie,PieChart,
  ResponsiveContainer,Tooltip,XAxis,YAxis
} from 'recharts';
import {
  Activity,ArrowUpLeft,Building2,CheckCircle2,Clock3,Hotel,
  RefreshCcw,ShieldAlert,Sparkles,Users2,Wifi
} from 'lucide-react';
import {getSupabase} from '@/lib/superapp/supabase';
import {DEFAULT_PROVIDER_RULES} from '@/lib/superapp/automation';

const COLORS=['#2563eb','#14b8a6','#8b5cf6','#f59e0b','#ef4444','#64748b','#06b6d4'];
const norm=(v:any)=>String(v??'').replace(/\u200c/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
const fa=(n:number)=>Number(n||0).toLocaleString('fa-IR');
const isoDay=(offset:number)=>{const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)};
const dayLabel=(iso:string)=>new Intl.DateTimeFormat('fa-IR',{weekday:'short'}).format(new Date(`${iso}T12:00:00`));

type HotelSnapshot={
  total:number;
  sellable:number;
  fullyOnline:number;
  capacityOnline:number;
  rateOnline:number;
  expertManaged:number;
  offline:number;
  migrate:number;
  providers:{name:string;count:number}[];
};
const emptySnapshot:HotelSnapshot={total:0,sellable:0,fullyOnline:0,capacityOnline:0,rateOnline:0,expertManaged:0,offline:0,migrate:0,providers:[]};

async function loadAll(table:string,select:string){
  const db=getSupabase();
  if(!db) return [] as any[];
  const out:any[]=[];
  for(let from=0;;from+=1000){
    const {data,error}=await db.from(table).select(select).range(from,from+999);
    if(error) throw error;
    const batch=data||[];
    out.push(...batch);
    if(batch.length<1000) break;
  }
  return out;
}

async function buildHotelSnapshot():Promise<HotelSnapshot>{
  const cached=typeof window!=='undefined'?sessionStorage.getItem('ihos-dashboard-hotel-snapshot-v16'):null;
  if(cached){
    try{
      const parsed=JSON.parse(cached);
      if(Date.now()-parsed.at<5*60*1000) return parsed.data as HotelSnapshot;
    }catch{}
  }
  const [hotels,automation,storedRules]=await Promise.all([
    loadAll('ihos_hotels','id,provider,cooperation_status'),
    loadAll('ihos_hotel_automation','hotel_id,hotel_rate,hotel_capacity,rate_expert,capacity_expert,provider'),
    loadAll('ihos_provider_rules','name,rate_api,capacity_api,active,effective_from,replacement_provider,priority')
  ]);
  const rules=(storedRules.length?storedRules.map((r:any)=>({
    name:r.name,rateApi:!!r.rate_api,capacityApi:!!r.capacity_api,active:r.active!==false,
    effectiveFrom:r.effective_from,replacementProvider:r.replacement_provider,priority:r.priority||99
  })):DEFAULT_PROVIDER_RULES);
  const ruleMap=new Map<string,any>(rules.map((r:any)=>[norm(r.name),r] as [string,any]));
  const autoMap=new Map(automation.map((a:any)=>[a.hotel_id,a]));
  const providerMap=new Map<string,number>();
  let sellable=0,fullyOnline=0,capacityOnline=0,rateOnline=0,expertManaged=0,offline=0,migrate=0;
  const now=new Date().toISOString().slice(0,10);
  for(const h of hotels){
    const cooperation=norm(h.cooperation_status);
    const isSellable=cooperation.includes('در حال همکاری');
    if(!isSellable) continue;
    sellable++;
    const a=autoMap.get(h.id)||{};
    const provider=String(a.provider||h.provider||'IHO Provider').trim()||'IHO Provider';
    providerMap.set(provider,(providerMap.get(provider)||0)+1);
    const r:any=ruleMap.get(norm(provider));
    const effective=!r?.effectiveFrom||r.effectiveFrom<=now;
    const rateApi=!!(r?.active&&effective&&r.rateApi);
    const capApi=!!(r?.active&&effective&&r.capacityApi);
    const rateExpert=String(a.rate_expert||'').trim();
    const capExpert=String(a.capacity_expert||'').trim();
    const rate=rateApi||(!rateExpert&&!!a.hotel_rate);
    const cap=capApi||(!capExpert&&!!a.hotel_capacity);
    if(rate&&cap) fullyOnline++;
    else if(cap) capacityOnline++;
    else if(rate) rateOnline++;
    else if(rateExpert||capExpert) expertManaged++;
    else offline++;
    const bad=['iho','asa','shab'].includes(norm(provider));
    if(bad||(!(rate&&cap)&&!!r?.replacementProvider)) migrate++;
  }
  const providers=[...providerMap.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,7);
  const result={total:hotels.length,sellable,fullyOnline,capacityOnline,rateOnline,expertManaged,offline,migrate,providers};
  if(typeof window!=='undefined') sessionStorage.setItem('ihos-dashboard-hotel-snapshot-v16',JSON.stringify({at:Date.now(),data:result}));
  return result;
}

export default function OperationsDashboard({tasks=[],activities=[],users=[],goals=[],projects=[],logs=[],settings,setView}:any){
  const [hotel,setHotel]=useState<HotelSnapshot>(emptySnapshot);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  async function refresh(){
    setLoading(true);setError('');
    try{sessionStorage.removeItem('ihos-dashboard-hotel-snapshot-v16');setHotel(await buildHotelSnapshot())}
    catch(e:any){setError(e?.message||'خطا در دریافت آمار هتل‌ها')}
    finally{setLoading(false)}
  }
  useEffect(()=>{buildHotelSnapshot().then(setHotel).catch(e=>setError(e?.message||'خطا در دریافت آمار')).finally(()=>setLoading(false))},[]);

  const taskStats=useMemo(()=>{
    const done=tasks.filter((t:any)=>t.status==='انجام شد'||t.status==='بسته شده').length;
    const open=tasks.length-done;
    const urgent=tasks.filter((t:any)=>t.priority==='فوری'&&t.status!=='انجام شد').length;
    const overdue=tasks.filter((t:any)=>t.deadline&&t.deadline<isoDay(0)&&t.status!=='انجام شد'&&t.status!=='بسته شده').length;
    return {done,open,urgent,overdue};
  },[tasks]);

  const trend=useMemo(()=>Array.from({length:7},(_,i)=>{
    const date=isoDay(i-6);
    return {
      day:dayLabel(date),
      created:tasks.filter((t:any)=>String(t.created_at||'').slice(0,10)===date).length,
      completed:tasks.filter((t:any)=>String(t.completed_at||t.updated_at||'').slice(0,10)===date&&(t.status==='انجام شد'||t.status==='بسته شده')).length
    }
  }),[tasks]);

  const statusData=useMemo(()=>{
    const map=new Map<string,number>();
    tasks.forEach((t:any)=>map.set(t.status||'بدون وضعیت',(map.get(t.status||'بدون وضعیت')||0)+1));
    return [...map.entries()].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,6)
  },[tasks]);

  const people=useMemo(()=>users.map((u:any)=>({
    name:u.full_name,
    done:tasks.filter((t:any)=>t.assigned_to===u.id&&(t.status==='انجام شد'||t.status==='بسته شده')).length,
    active:tasks.filter((t:any)=>t.assigned_to===u.id&&t.status!=='انجام شد'&&t.status!=='بسته شده').length,
    activity:logs.filter((l:any)=>l.user_id===u.id||l.user_name===u.full_name).length
  })).sort((a:any,b:any)=>b.done-a.done||b.activity-a.activity).slice(0,6),[users,tasks,logs]);

  const onlineBase=Math.max(1,hotel.sellable||hotel.total);
  const onlinePercent=Math.round((hotel.fullyOnline/onlineBase)*100);

  return <div className="dashboardV15">
    <section className="dashboardHeroV15">
      <div>
        <span className="eyebrowV15">IRANHOTEL OPERATIONS INTELLIGENCE</span>
        <h1>{settings?.orgName||'IranHotel Operations'}</h1>
        <p>نمای زنده عملیات، آنلاین‌سازی هتل‌ها، عملکرد تیم و ریسک‌های نیازمند اقدام</p>
        <div className="heroActionsV15">
          <button className="btn primary" onClick={()=>setView('tasks')}>مشاهده تسک‌های امروز <ArrowUpLeft size={17}/></button>
          <button className="btn glass" onClick={()=>setView('hotelSuperApp')}>سوپر اپ هتل <Hotel size={17}/></button>
        </div>
      </div>
      <div className="heroGaugeV15">
        <div className="gaugeRingV15" style={{'--value':`${onlinePercent*3.6}deg`} as any}><strong>{onlinePercent}٪</strong><span>کاملاً آنلاین</span></div>
        <small>{fa(hotel.fullyOnline)} از {fa(hotel.sellable||hotel.total)} هتل قابل فروش</small>
      </div>
    </section>

    <div className="dashboardToolbarV15">
      <div className={loading?'syncStateV15 loading':'syncStateV15'} role="status" aria-live="polite">{loading?<RefreshCcw className="spin"/>:<Wifi/>}<span>{loading?'در حال همگام‌سازی آمار اصلی...':'آخرین آمار از دیتابیس اصلی'}</span></div>
      <button className="btn ghost" disabled={loading} onClick={refresh}><RefreshCcw className={loading?'spin':''} size={16}/> بروزرسانی داشبورد</button>
    </div>
    {error&&<div className="notice dangerNoticeV15" role="alert">{error}</div>}

    <section className="metricGridV15">
      <Metric icon={Building2} title="کل هتل‌ها" value={hotel.total} hint="جدول اصلی هتل‌ها" tone="blue"/>
      <Metric icon={CheckCircle2} title="۱۰۰٪ آنلاین" value={hotel.fullyOnline} hint={`${onlinePercent}٪ از هتل‌های قابل فروش`} tone="green"/>
      <Metric icon={Activity} title="ظرفیت آنلاین" value={hotel.capacityOnline} hint="نرخ نیازمند اقدام" tone="cyan"/>
      <Metric icon={ShieldAlert} title="نیازمند مهاجرت" value={hotel.migrate} hint="Provider نامناسب یا ناقص" tone="orange"/>
      <Metric icon={Clock3} title="تسک عقب‌افتاده" value={taskStats.overdue} hint={`${taskStats.open} تسک باز`} tone="red"/>
      <Metric icon={Users2} title="کاربران فعال" value={users.filter((u:any)=>u.is_active).length} hint={`${taskStats.done} تسک انجام‌شده`} tone="purple"/>
    </section>

    <section className="dashboardChartsV15">
      <article className="chartCardV15 wide" role="img" aria-label={`روند هفت روزه تسک‌ها؛ ${trend.map((x:any)=>`${x.day}: ${x.created} ایجاد و ${x.completed} تکمیل`).join('، ')}`}>
        <div className="chartHeadV15"><div><span>روند ۷ روز اخیر</span><h3>ورودی و خروجی تسک‌ها</h3></div><span className="chartBadgeV15">عملکرد روزانه</span></div>
        <div className="chartBodyV15"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:10,right:4,left:4,bottom:0}}><defs><linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={.38}/><stop offset="100%" stopColor="#2563eb" stopOpacity={.02}/></linearGradient><linearGradient id="doneGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14b8a6" stopOpacity={.35}/><stop offset="100%" stopColor="#14b8a6" stopOpacity={.02}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}} width={28}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)'}}/><Legend/><Area type="monotone" dataKey="created" name="ایجاد شده" stroke="#2563eb" strokeWidth={2.5} fill="url(#createdGradient)"/><Area type="monotone" dataKey="completed" name="تکمیل شده" stroke="#14b8a6" strokeWidth={2.5} fill="url(#doneGradient)"/></AreaChart></ResponsiveContainer></div>
      </article>

      <article className="chartCardV15" role="img" aria-label={`ترکیب وضعیت تسک‌ها؛ ${statusData.map((x:any)=>`${x.name}: ${x.value}`).join('، ')}`}>
        <div className="chartHeadV15"><div><span>ترکیب تسک‌ها</span><h3>وضعیت جریان کار</h3></div></div>
        <div className="chartBodyV15 donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92} paddingAngle={4}>{statusData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)'}}/><Legend verticalAlign="bottom" height={34}/></PieChart></ResponsiveContainer><div className="donutCenterV15"><b>{fa(tasks.length)}</b><span>کل تسک</span></div></div>
      </article>

      <article className="chartCardV15" role="img" aria-label={`توزیع Providerها؛ ${hotel.providers.map((x:any)=>`${x.name}: ${x.count}`).join('، ')}`}>
        <div className="chartHeadV15"><div><span>توزیع تأمین‌کننده</span><h3>Providerهای پرتعداد</h3></div></div>
        <div className="chartBodyV15"><ResponsiveContainer width="100%" height="100%"><BarChart data={hotel.providers} layout="vertical" margin={{top:4,right:18,left:4,bottom:0}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)"/><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={95} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:10}}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)'}}/><Bar dataKey="count" name="هتل" fill="#2563eb" radius={[8,8,8,8]} barSize={16}/></BarChart></ResponsiveContainer></div>
      </article>

      <article className="chartCardV15 wide" role="img" aria-label={`عملکرد تیم؛ ${people.map((x:any)=>`${x.name}: ${x.done} تکمیل و ${x.active} فعال`).join('، ')}`}>
        <div className="chartHeadV15"><div><span>عملکرد تیم</span><h3>تسک‌های تکمیل‌شده و فعال</h3></div><span className="chartBadgeV15">۶ نفر برتر</span></div>
        <div className="chartBodyV15"><ResponsiveContainer width="100%" height="100%"><BarChart data={people} margin={{top:8,right:4,left:4,bottom:8}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:10}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:10}} width={28}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)'}}/><Legend/><Bar dataKey="done" name="تکمیل‌شده" fill="#14b8a6" radius={[7,7,0,0]}/><Bar dataKey="active" name="در جریان" fill="#2563eb" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div>
      </article>
    </section>

    <section className="dashboardBottomV15">
      <article className="panelV15">
        <div className="panelHeadV15"><div><span>نیازمند توجه</span><h3>تسک‌های اولویت‌دار</h3></div><button onClick={()=>setView('tasks')}>مشاهده همه</button></div>
        <div className="priorityListV15">{tasks.filter((t:any)=>t.status!=='انجام شد'&&t.status!=='بسته شده').sort((a:any,b:any)=>(a.priority==='فوری'?-2:0)-(b.priority==='فوری'?-2:0)||String(a.deadline||'').localeCompare(String(b.deadline||''))).slice(0,6).map((t:any)=><div key={t.id}><span className={`priorityDotV15 ${t.priority==='فوری'?'red':t.priority==='بالا'?'orange':'blue'}`}/><div><b>{t.title}</b><small>{t.hotel_title||'بدون هتل'} · {t.assigned_name||'بدون مسئول'}</small></div><time dateTime={t.deadline||undefined}>{t.deadline?new Intl.DateTimeFormat('fa-IR',{month:'short',day:'numeric'}).format(new Date(t.deadline)):'بدون موعد'}</time></div>)}</div>
      </article>
      <article className="panelV15 insightPanelV15">
        <Sparkles/>
        <span>Insight عملیاتی</span>
        <h3>{hotel.migrate?`${fa(hotel.migrate)} هتل با تغییر Provider می‌توانند وضعیت آنلاین بهتری بگیرند.`:'در حال حاضر مورد فوری برای مهاجرت Provider ثبت نشده است.'}</h3>
        <p>{taskStats.overdue?`${fa(taskStats.overdue)} تسک عقب‌افتاده نیز نیازمند بازتخصیص یا اصلاح ددلاین است.`:'جریان تسک‌های عقب‌افتاده تحت کنترل است.'}</p>
        <button className="btn glass" onClick={()=>setView('hotelSuperApp')}>مشاهده پیشنهادهای عملیاتی</button>
      </article>
    </section>
  </div>
}

function Metric({icon:Icon,title,value,hint,tone}:any){return <article className={`metricV15 ${tone}`}><span className="metricIconV15"><Icon/></span><div><span>{title}</span><strong>{fa(value)}</strong><small>{hint}</small></div></article>}

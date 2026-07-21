'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {
  Activity,ArrowLeft,BarChart3,Building2,CheckCircle2,ChevronLeft,ChevronRight,
  CloudUpload,Database,Edit3,FileSpreadsheet,Hotel,KeyRound,LockKeyhole,
  MapPin,Plus,RefreshCcw,Save,Search,Settings2,ShieldAlert,Sparkles,
  Trash2,TrendingUp,Upload,Users2,Wifi,X
} from 'lucide-react';
import {Bar,BarChart,CartesianGrid,Cell,Legend,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import * as XLSX from 'xlsx';
import {DEFAULT_PROVIDER_RULES} from '@/lib/superapp/automation';
import type {ProviderRule} from '@/lib/superapp/types';
import {getSupabase,upsertChunks} from '@/lib/superapp/supabase';
import {ProviderCoverageCenter} from '@/components/enterprise/V17Modules';

type Row={
  id:string;hotel_code?:string;title:string;city?:string;province?:string;caring_category?:string;
  cooperation_status?:string;provider?:string;pms?:string;grade?:string;crm_stage?:string;
  hotel_rate?:boolean;hotel_capacity?:boolean;rate_expert?:string;capacity_expert?:string;
  rate_api?:boolean;capacity_api?:boolean;rate_online?:boolean;capacity_online?:boolean;
  automation_score?:number;automation_status?:string;migration_needed?:boolean;replacement_provider?:string;
};
type Stats={all:number;sellable:number;online:number;capacity:number;rate:number;expert:number;offline:number;migrate:number};
type ExpertRow={expert_name:string;rate_hotels:number;capacity_hotels:number;total_hotels:number};
type ProviderStat={name:string;count:number;online:number;capacity:number;rate:number;offline:number};
const COLORS=['#2563eb','#14b8a6','#8b5cf6','#f59e0b','#ef4444','#64748b','#06b6d4'];
const emptyStats:Stats={all:0,sellable:0,online:0,capacity:0,rate:0,expert:0,offline:0,migrate:0};
const norm=(v:any)=>String(v??'').replace(/\u200c/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
const fa=(n:number)=>Number(n||0).toLocaleString('fa-IR');
const isSellable=(r:any)=>norm(r?.cooperation_status).includes('در حال همکاری');
const val=(r:any,names:string[])=>{for(const k of Object.keys(r)){if(names.some(n=>norm(n)===norm(k))&&String(r[k]??'').trim()!=='')return r[k]}return undefined};
const text=(r:any,names:string[])=>String(val(r,names)??'').trim();
const yes=(v:any)=>['1','true','yes','بله','فعال','online','بلی'].includes(norm(v));
async function rowsFromFile(file:File){const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const ws=wb.Sheets[wb.SheetNames[0]];if(!ws)throw new Error('شیت قابل خواندن پیدا نشد');const rows=XLSX.utils.sheet_to_json(ws,{defval:null,raw:false}) as any[];if(!rows.length)throw new Error('فایل خالی است');return rows}
async function loadAll(table:string,select='*'){const db=getSupabase();if(!db)return[];const all:any[]=[];for(let from=0;;from+=1000){const{data,error}=await db.from(table).select(select).range(from,from+999);if(error)throw error;const batch=data||[];all.push(...batch);if(batch.length<1000)break}return all}

function enrich(h:any,a:any,rules:ProviderRule[]):Row{
  const provider=String(a?.provider||h.provider||'IHO Provider').trim()||'IHO Provider';
  const rule=rules.find(r=>norm(r.name)===norm(provider));
  const today=new Date().toISOString().slice(0,10);
  const effective=!rule?.effectiveFrom||rule.effectiveFrom<=today;
  const rateApi=!!(rule?.active&&effective&&rule.rateApi);
  const capacityApi=!!(rule?.active&&effective&&rule.capacityApi);
  const rateExpert=String(a?.rate_expert||'').trim()||undefined;
  const capacityExpert=String(a?.capacity_expert||'').trim()||undefined;
  const hotelRate=!!a?.hotel_rate;
  const hotelCapacity=!!a?.hotel_capacity;
  const rateOnline=rateApi||(!rateExpert&&hotelRate);
  const capacityOnline=capacityApi||(!capacityExpert&&hotelCapacity);
  const score=(rateOnline?50:rateExpert?25:0)+(capacityOnline?50:capacityExpert?35:0);
  const badProvider=['iho','asa','shab'].includes(norm(provider));
  const migrationNeeded=badProvider||(!(rateOnline&&capacityOnline)&&!!rule?.replacementProvider);
  let automationStatus='آفلاین';
  if(rateOnline&&capacityOnline)automationStatus='۱۰۰٪ آنلاین';
  else if(badProvider)automationStatus='نیازمند مهاجرت Provider';
  else if(capacityOnline)automationStatus='ظرفیت آنلاین';
  else if(rateOnline)automationStatus='نرخ آنلاین';
  else if(rateExpert||capacityExpert)automationStatus='کارشناس‌محور';
  return {...h,provider,hotel_rate:hotelRate,hotel_capacity:hotelCapacity,rate_expert:rateExpert,capacity_expert:capacityExpert,rate_api:rateApi,capacity_api:capacityApi,rate_online:rateOnline,capacity_online:capacityOnline,automation_score:score,automation_status:automationStatus,migration_needed:migrationNeeded,replacement_provider:rule?.replacementProvider} as Row;
}

export default function HotelSuperApp({isSuperAdmin=false,actor,onCreateTask,initialTab='overview'}:{isSuperAdmin?:boolean;actor?:{id?:string;username?:string;name?:string};onCreateTask?:(row:Row)=>void;initialTab?:string}){
  const [master,setMaster]=useState<Row[]>([]);
  const [rules,setRules]=useState<ProviderRule[]>(DEFAULT_PROVIDER_RULES);
  const [tab,setTab]=useState(initialTab);
  const [q,setQ]=useState('');
  const [provider,setProvider]=useState('all');
  const [status,setStatus]=useState('all');
  const [city,setCity]=useState('all');
  const [scope,setScope]=useState<'sellable'|'all'>('sellable');
  const [page,setPage]=useState(1);
  const [busy,setBusy]=useState(true);
  const [msg,setMsg]=useState('');
  const [selected,setSelected]=useState<Row|null>(null);
  const drawerRef=useRef<HTMLElement>(null);

  useEffect(()=>{
    if(!selected)return;
    const previous=document.activeElement as HTMLElement|null;
    const bodyOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    drawerRef.current?.focus();
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')setSelected(null)};
    document.addEventListener('keydown',onKeyDown);
    return()=>{document.body.style.overflow=bodyOverflow;document.removeEventListener('keydown',onKeyDown);previous?.focus()};
  },[selected]);
  const [importMenu,setImportMenu]=useState(false);
  const pageSize=36;

  async function loadRules(){
    const db=getSupabase();if(!db)return DEFAULT_PROVIDER_RULES;
    const {data,error}=await db.from('ihos_provider_rules').select('*').order('priority');
    if(error||!data?.length)return DEFAULT_PROVIDER_RULES;
    return data.map((x:any)=>({name:x.name,rateApi:!!x.rate_api,capacityApi:!!x.capacity_api,active:x.active!==false,effectiveFrom:x.effective_from,replacementProvider:x.replacement_provider,priority:x.priority||99}));
  }

  async function loadData(force=false){
    setBusy(true);setMsg('در حال همگام‌سازی پرونده‌های هتل...');
    try{
      if(force&&typeof window!=='undefined'){sessionStorage.removeItem('ihos-superapp-snapshot-v16');sessionStorage.removeItem('ihos-dashboard-hotel-snapshot-v16')}
      const cached=typeof window!=='undefined'?sessionStorage.getItem('ihos-superapp-snapshot-v16'):null;
      if(cached&&!force){
        try{const p=JSON.parse(cached);if(Date.now()-p.at<5*60*1000){setRules(p.rules);setMaster(p.rows);setMsg(`${fa(p.rows.length)} هتل از کش سریع`);setBusy(false);return}}catch{}
      }
      const nextRules=await loadRules();
      const [hotels,automation]=await Promise.all([
        loadAll('ihos_hotels','id,hotel_code,title,city,province,caring_category,cooperation_status,provider,pms,grade,crm_stage'),
        loadAll('ihos_hotel_automation','hotel_id,provider,hotel_rate,hotel_capacity,rate_expert,capacity_expert,updated_at')
      ]);
      const autoMap=new Map(automation.map((a:any)=>[a.hotel_id,a]));
      const rows=hotels.map((h:any)=>enrich(h,autoMap.get(h.id),nextRules));
      setRules(nextRules);setMaster(rows);setMsg(`${fa(rows.length)} هتل از دیتابیس اصلی دریافت شد`);
      if(typeof window!=='undefined')sessionStorage.setItem('ihos-superapp-snapshot-v16',JSON.stringify({at:Date.now(),rules:nextRules,rows}));
    }catch(e:any){setMsg(`خطای دریافت اطلاعات: ${e.message}`)}finally{setBusy(false)}
  }
  useEffect(()=>{void loadData()},[]);

  const stats=useMemo(()=>master.reduce((s,r)=>{
    s.all++;
    if(!isSellable(r))return s;
    s.sellable++;
    if(r.automation_status==='۱۰۰٪ آنلاین')s.online++;
    else if(r.automation_status==='ظرفیت آنلاین')s.capacity++;
    else if(r.automation_status==='نرخ آنلاین')s.rate++;
    else if(r.automation_status==='کارشناس‌محور')s.expert++;
    else s.offline++;
    if(r.migration_needed)s.migrate++;
    return s;
  },{...emptyStats}),[master]);

  const providerStats=useMemo(()=>{
    const map=new Map<string,ProviderStat>();
    master.filter(isSellable).forEach(r=>{const key=r.provider||'بدون Provider';const row=map.get(key)||{name:key,count:0,online:0,capacity:0,rate:0,offline:0};row.count++;if(r.automation_status==='۱۰۰٪ آنلاین')row.online++;else if(r.automation_status==='ظرفیت آنلاین')row.capacity++;else if(r.automation_status==='نرخ آنلاین')row.rate++;else row.offline++;map.set(key,row)});
    return [...map.values()].sort((a,b)=>b.count-a.count)
  },[master]);

  const experts=useMemo(()=>{
    const map=new Map<string,ExpertRow>();
    master.filter(r=>isSellable(r)&&norm(r.provider)==='iho provider').forEach(r=>{
      if(r.rate_expert){const e=map.get(r.rate_expert)||{expert_name:r.rate_expert,rate_hotels:0,capacity_hotels:0,total_hotels:0};e.rate_hotels++;map.set(r.rate_expert,e)}
      if(r.capacity_expert){const e=map.get(r.capacity_expert)||{expert_name:r.capacity_expert,rate_hotels:0,capacity_hotels:0,total_hotels:0};e.capacity_hotels++;map.set(r.capacity_expert,e)}
    });
    for(const e of map.values())e.total_hotels=new Set(master.filter(r=>isSellable(r)&&(r.rate_expert===e.expert_name||r.capacity_expert===e.expert_name)).map(r=>r.id)).size;
    return [...map.values()].sort((a,b)=>b.total_hotels-a.total_hotels)
  },[master]);

  const providers=useMemo(()=>['all',...new Set(master.map(r=>r.provider||'بدون Provider'))],[master]);
  const cities=useMemo(()=>['all',...new Set(master.map(r=>r.city).filter(Boolean) as string[])],[master]);
  const filtered=useMemo(()=>master.filter(r=>{
    if(scope==='sellable'&&!isSellable(r))return false;
    if(provider!=='all'&&r.provider!==provider)return false;
    if(city!=='all'&&r.city!==city)return false;
    if(status!=='all'&&r.automation_status!==status)return false;
    if(tab==='fullyOnline'&&r.automation_status!=='۱۰۰٪ آنلاین')return false;
    if(tab==='migration'&&!r.migration_needed)return false;
    if(q.trim()&&!norm(`${r.title} ${r.hotel_code||''} ${r.city||''} ${r.provider||''}`).includes(norm(q)))return false;
    return true
  }),[master,provider,city,status,scope,tab,q]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const rows=filtered.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>setPage(1),[q,provider,city,status,scope,tab]);

  async function importHotels(file:File){
    setBusy(true);setMsg('در حال پردازش فایل هتل‌ها...');
    try{
      const data=await rowsFromFile(file);const stamp=Date.now();
      const mapped=data.map((r,i)=>{const code=text(r,['کد هتل','hotel_code','HotelCode','کدهتل']);return {id:code?`hotel-${code}`:`hotel-import-${stamp}-${i}`,hotel_code:code,title:text(r,['نام هتل','title','HotelName','نام'])||`هتل بدون نام — کد ${code}`,country:text(r,['کشور']),province:text(r,['استان','province']),city:text(r,['شهر','city']),hotel_group:text(r,['گروه نوع هتل']),caring_category:text(r,['CaringCategory','caring_category']),hotel_type:text(r,['نوع هتل']),phone:text(r,['تلفن هتل']),reservation_phone:text(r,['تلفن رزرواسیون','تلن رزرواسیون']),provider:text(r,['نام پروایدر','provider','Provider'])||'IHO Provider',pms:text(r,['PMS']),cooperation_status:text(r,['وضعیت همکاری','cooperation_status']),risk_status:text(r,['وضعیت ریسکی']),hotel_category:text(r,['دسته بندی هتل']),grade:text(r,['درجه هتل']),capacity_total:Number(String(val(r,['ظرفیت کلی هتل','capacity_total'])??'0').replace(/,/g,''))||0,purchase_period:Number(val(r,['دوره خرید','purchase_period'])||0)||undefined,payment_period:Number(val(r,['دوره پرداخت','payment_period'])||0)||undefined,status_start_date:text(r,['تاریخ شروع وضعیت','status_start_date']),status_end_date:text(r,['تاریخ پایان وضعیت','status_end_date']),contract_date:text(r,['تاریخ قرارداد','contract_date']),site_visible:yes(val(r,['نمایش در سایت','site_visible'])),search_visible:yes(val(r,['نمایش در نتایج جستجو','search_visible']))}}).filter(x=>x.hotel_code);
      if(!mapped.length)throw new Error('ستون نام هتل یا کد هتل شناسایی نشد');
      await upsertChunks('ihos_hotels',mapped,300);setMsg(`✅ ${fa(mapped.length)} هتل ذخیره شد`);await loadData(true)
    }catch(e:any){setMsg(`❌ ${e.message}`)}finally{setBusy(false)}
  }

  async function importExperts(file:File){
    setBusy(true);setMsg('در حال تطبیق کارشناسان نرخ و ظرفیت...');
    try{
      const data=await rowsFromFile(file);const hotelByCode=new Map(master.map(h=>[norm(h.hotel_code),h]));const hotelByTitle=new Map(master.map(h=>[norm(h.title),h]));const merged=new Map<string,any>();
      data.forEach(r=>{const code=text(r,['کد هتل','hotel_code','HotelCode']);const title=text(r,['نام هتل','هتل','hotel','HotelName']);const h=hotelByCode.get(norm(code))||hotelByTitle.get(norm(title));if(!h)return;const taskId=Number(val(r,['task id','task_id','TaskId','نوع تسک']));const expert=text(r,['نام','نام کارشناس','کارشناس','expert_name','full_name']);if(!expert||![1,2].includes(taskId))return;const row=merged.get(h.id)||{id:`automation-${h.id}`,hotel_id:h.id,hotel_code:h.hotel_code,provider:h.provider||'IHO Provider',hotel_rate:!!h.hotel_rate,hotel_capacity:!!h.hotel_capacity};if(taskId===1)row.capacity_expert=expert;if(taskId===2)row.rate_expert=expert;row.updated_at=new Date().toISOString();merged.set(h.id,row)});
      await upsertChunks('ihos_hotel_automation',[...merged.values()],300);setMsg(`✅ تخصیص ${fa(merged.size)} هتل بروزرسانی شد`);await loadData(true)
    }catch(e:any){setMsg(`❌ ${e.message}`)}finally{setBusy(false)}
  }

  async function saveRule(rule:ProviderRule){
    const db=getSupabase();if(!db)return;
    const payload={id:`provider-${norm(rule.name).replace(/\s+/g,'-')}`,name:rule.name,rate_api:rule.rateApi,capacity_api:rule.capacityApi,active:rule.active,effective_from:rule.effectiveFrom||null,replacement_provider:rule.replacementProvider||null,priority:rule.priority};
    const {error}=await db.from('ihos_provider_rules').upsert(payload,{onConflict:'id'});if(error){setMsg(error.message);return}setRules(rules.map(r=>r.name===rule.name?rule:r));sessionStorage.removeItem('ihos-superapp-snapshot-v16');setMsg('تنظیم Provider ذخیره شد')
  }

  async function deleteHotel(row:Row){
    if(!isSuperAdmin)return;
    if(!confirm(`هتل «${row.title}» حذف شود؟`))return;
    const res=await fetch('/api/admin/delete',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete-row',table:'ihos_hotels',id:row.id,actor:{...actor,isSuperAdmin:true}})});const out=await res.json();if(!res.ok){setMsg(out.error||'حذف ناموفق بود');return}setMaster(master.filter(h=>h.id!==row.id));setSelected(null);setMsg('هتل حذف و در سطل بازیافت ثبت شد')
  }

  async function clearTable(table:string,label:string){
    if(!isSuperAdmin)return;
    const password=prompt(`رمز حذف کامل برای پاک‌سازی «${label}» را وارد کنید`);if(!password)return;
    const res=await fetch('/api/admin/delete',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'clear-table',table,password,actor:{...actor,isSuperAdmin:true}})});const out=await res.json();if(!res.ok){setMsg(out.error||'پاک‌سازی ناموفق بود');return}setMsg(`${fa(out.deleted||0)} رکورد پاک شد`);await loadData(true)
  }

  const onlinePie=[{name:'۱۰۰٪ آنلاین',value:stats.online},{name:'ظرفیت آنلاین',value:stats.capacity},{name:'نرخ آنلاین',value:stats.rate},{name:'کارشناس‌محور',value:stats.expert},{name:'آفلاین',value:stats.offline}].filter(x=>x.value>0);
  const providerChart=providerStats.slice(0,8).map(x=>({name:x.name,count:x.count,online:x.online}));
  const tabs=[['overview','نمای مدیریتی',BarChart3],['hotels','پرونده هتل‌ها',Hotel],['fullyOnline','۱۰۰٪ آنلاین',CheckCircle2],['migration','پیشنهاد مهاجرت',TrendingUp],['experts','تحلیل کارشناسان',Users2],['providers','Providerها',Database],['coverage','پوشش Providerها',CloudUpload],['settings','تنظیم آنلاین‌سازی',Settings2],...(isSuperAdmin?[['governance','مدیریت داده',LockKeyhole]]:[])] as any[];

  return <div className="hotelOsV15">
    <header className="hotelOsHeaderV15">
      <div><span className="eyebrowV15">HOTEL SUPPLY & ONLINE OPERATIONS</span><h1>سوپر اپ مدیریت هتل</h1><p>مرجع واحد پرونده هتل، منبع نرخ و ظرفیت، Provider، کارشناسان و پیشنهادهای آنلاین‌سازی</p></div>
      <div className="hotelHeaderActionsV15">{isSuperAdmin&&<button className="btn dataManageV16" onClick={()=>setTab('governance')}><LockKeyhole/> مدیریت و پاک‌سازی داده</button>}<button className="btn ghost" onClick={()=>loadData(true)}><RefreshCcw className={busy?'spin':''}/> بروزرسانی</button><div className="importDropdownV15"><button className="btn primary" onClick={()=>setImportMenu(!importMenu)}><Upload/> ورود اطلاعات</button>{importMenu&&<div><label><FileSpreadsheet/> فایل اصلی هتل‌ها<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>{const f=e.target.files?.[0];if(f)void importHotels(f);setImportMenu(false)}}/></label><label><Users2/> فایل کارشناسان<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>{const f=e.target.files?.[0];if(f)void importExperts(f);setImportMenu(false)}}/></label></div>}</div></div>
    </header>
    <nav className="hotelTabsV15" aria-label="بخش‌های سوپر اپ هتل">{tabs.map(([id,label,Icon])=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={17}/><span>{label}</span>{id==='migration'&&stats.migrate>0&&<b>{fa(stats.migrate)}</b>}</button>)}</nav>
    <div className="hotelSyncV15"><span className={busy?'pulse':''}/><p>{msg||'آماده'}</p></div>

    {tab==='overview'&&<>
      <section className="hotelMetricGridV15">
        <Metric title="کل هتل‌ها" value={stats.all} icon={Building2} tone="blue" hint="دیتابیس اصلی"/>
        <Metric title="قابل فروش" value={stats.sellable} icon={Wifi} tone="cyan" hint="در حال همکاری"/>
        <Metric title="۱۰۰٪ آنلاین" value={stats.online} icon={CheckCircle2} tone="green" hint={`${Math.round(stats.online/Math.max(1,stats.sellable)*100)}٪ پوشش`}/>
        <Metric title="ظرفیت آنلاین" value={stats.capacity} icon={Activity} tone="purple" hint="نرخ نیازمند اقدام"/>
        <Metric title="کارشناس‌محور" value={stats.expert} icon={Users2} tone="orange" hint="وابسته به عملیات دستی"/>
        <Metric title="نیازمند مهاجرت" value={stats.migrate} icon={ShieldAlert} tone="red" hint="Provider نامناسب"/>
      </section>
      <section className="hotelChartsV15">
        <article className="chartCardV15"><div className="chartHeadV15"><div><span>ترکیب وضعیت</span><h3>سطح آنلاین‌سازی هتل‌ها</h3></div></div><div className="chartBodyV15 donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={onlinePie} dataKey="value" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={4}>{onlinePie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)'}}/><Legend verticalAlign="bottom"/></PieChart></ResponsiveContainer><div className="donutCenterV15"><b>{fa(stats.online)}</b><span>آنلاین کامل</span></div></div></article>
        <article className="chartCardV15 wide"><div className="chartHeadV15"><div><span>پوشش Provider</span><h3>تعداد و آنلاین کامل به تفکیک Provider</h3></div></div><div className="chartBodyV15"><ResponsiveContainer width="100%" height="100%"><BarChart data={providerChart}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/><XAxis dataKey="name" tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'var(--muted)',fontSize:10}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)'}}/><Legend/><Bar dataKey="count" name="کل هتل" fill="#2563eb" radius={[7,7,0,0]}/><Bar dataKey="online" name="۱۰۰٪ آنلاین" fill="#14b8a6" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></article>
      </section>
      <section className="hotelActionGridV15"><article><Sparkles/><div><span>پیشنهاد عملیاتی</span><h3>{stats.migrate?`${fa(stats.migrate)} هتل برای مهاجرت Provider در اولویت هستند.`:'همه Providerهای فعال در وضعیت مناسب قرار دارند.'}</h3><button onClick={()=>setTab('migration')}>مشاهده پیشنهادها <ArrowLeft/></button></div></article><article><Users2/><div><span>بار کاری کارشناسان</span><h3>{experts.length?`${experts[0].expert_name} با ${fa(experts[0].total_hotels)} هتل بیشترین بار را دارد.`:'فایل کارشناسان هنوز وارد نشده است.'}</h3><button onClick={()=>setTab('experts')}>تحلیل کارشناسان <ArrowLeft/></button></div></article></section>
    </>}

    {['hotels','fullyOnline','migration'].includes(tab)&&<section className="hotelListV15">
      <div className="hotelFilterBarV15"><div className="searchV15"><Search aria-hidden="true"/><input aria-label="جستجوی هتل در سوپر اپ" value={q} onChange={e=>setQ(e.target.value)} placeholder="نام هتل، کد، شهر یا Provider..."/></div><select aria-label="محدوده هتل‌ها" value={scope} onChange={e=>setScope(e.target.value as any)}><option value="sellable">فقط هتل‌های در حال همکاری</option><option value="all">تمام دیتابیس</option></select><select aria-label="فیلتر Provider" value={provider} onChange={e=>setProvider(e.target.value)}>{providers.map(x=><option key={x} value={x}>{x==='all'?'همه Providerها':x}</option>)}</select><select aria-label="فیلتر شهر" value={city} onChange={e=>setCity(e.target.value)}>{cities.slice(0,300).map(x=><option key={x} value={x}>{x==='all'?'همه شهرها':x}</option>)}</select><select aria-label="فیلتر وضعیت آنلاین‌سازی" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">همه وضعیت‌ها</option>{['۱۰۰٪ آنلاین','ظرفیت آنلاین','نرخ آنلاین','کارشناس‌محور','آفلاین','نیازمند مهاجرت Provider'].map(x=><option key={x}>{x}</option>)}</select><span role="status" aria-live="polite">{fa(filtered.length)} نتیجه</span></div>
      <div className="hotelTableV15"><div className="hotelTableHeadV15"><span>هتل</span><span>Provider</span><span>منبع نرخ</span><span>منبع ظرفیت</span><span>وضعیت</span><span>عملیات</span></div>{rows.map(r=><article key={r.id}><div className="hotelIdentityV15"><span>{r.title.slice(0,1)}</span><div><b>{r.title}</b><small>{r.hotel_code||'بدون کد'} · {r.city||'بدون شهر'} · {r.grade||'بدون درجه'}</small></div></div><div><b>{r.provider}</b><small>{r.pms||'بدون PMS'}</small></div><SourceBadge api={r.rate_api} hotel={r.hotel_rate} expert={r.rate_expert}/><SourceBadge api={r.capacity_api} hotel={r.hotel_capacity} expert={r.capacity_expert}/><StatusBadge status={r.automation_status||'آفلاین'} score={r.automation_score||0}/><div className="hotelRowActionsV15"><button aria-label={`ایجاد تسک برای ${r.title}`} onClick={()=>onCreateTask?.(r)}><Plus/></button><button aria-label={`مشاهده پرونده ${r.title}`} onClick={()=>setSelected(r)}><Hotel/></button>{isSuperAdmin&&<button className="danger" aria-label={`حذف هتل ${r.title}`} onClick={()=>void deleteHotel(r)}><Trash2/></button>}</div></article>)}</div>
      {!rows.length&&!busy&&<div className="emptyV15"><Hotel/><h3>هتلی مطابق فیلتر پیدا نشد</h3><p>فیلترها را پاک کن یا فایل اصلی هتل‌ها را دوباره وارد کن.</p></div>}
      <div className="paginationV15"><button aria-label="صفحه قبل" disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronRight/></button><span aria-live="polite">صفحه {fa(page)} از {fa(pages)}</span><button aria-label="صفحه بعد" disabled={page>=pages} onClick={()=>setPage(page+1)}><ChevronLeft/></button></div>
    </section>}

    {tab==='experts'&&<section className="expertsV15"><div className="pageIntroV15"><div><h2>تحلیل بار کاری کارشناسان IHO Provider</h2><p>تعداد هتل‌هایی که ثبت نرخ یا ظرفیت آن‌ها به‌عهده هر کارشناس است.</p></div></div><div className="expertGridV15">{experts.map((e,i)=><article key={e.expert_name}><span className="rankV15">{i+1}</span><div className="expertAvatarV15">{e.expert_name.slice(0,1)}</div><h3>{e.expert_name}</h3><div><span>نرخ <b>{fa(e.rate_hotels)}</b></span><span>ظرفیت <b>{fa(e.capacity_hotels)}</b></span><span>کل یکتا <b>{fa(e.total_hotels)}</b></span></div></article>)}</div>{!experts.length&&<div className="emptyV15"><Users2/><h3>داده کارشناس وجود ندارد</h3><p>فایل تخصیص کارشناسان را از دکمه ورود اطلاعات وارد کن.</p></div>}</section>}

    {tab==='coverage'&&<ProviderCoverageCenter master={master} rules={rules}/>}

    {tab==='providers'&&<section className="providersV15"><div className="pageIntroV15"><div><h2>تحلیل Providerها</h2><p>پوشش نرخ و ظرفیت، تعداد هتل و سهم آنلاین کامل هر Provider</p></div></div><div className="providerGridV15">{providerStats.map(p=>{const rule=rules.find(r=>norm(r.name)===norm(p.name));const pct=Math.round(p.online/Math.max(1,p.count)*100);return <article key={p.name}><div className="providerTopV15"><div><span>{p.name.slice(0,2).toUpperCase()}</span><div><h3>{p.name}</h3><small>{fa(p.count)} هتل</small></div></div><b>{pct}٪</b></div><div className="providerMeterV15"><i style={{width:`${pct}%`}}/></div><div className="providerCapabilitiesV15"><span className={rule?.rateApi?'on':''}>API نرخ</span><span className={rule?.capacityApi?'on':''}>API ظرفیت</span><span className={rule?.active?'on':''}>فعال</span></div><footer><span>آنلاین کامل {fa(p.online)}</span><span>آفلاین/دستی {fa(p.offline)}</span></footer></article>})}</div></section>}

    {tab==='settings'&&<section className="providerSettingsV15"><div className="pageIntroV15"><div><h2>تنظیمات آنلاین‌سازی Provider</h2><p>قابلیت API نرخ و ظرفیت، تاریخ فعال‌سازی و Provider جایگزین را مدیریت کن.</p></div></div><div className="providerRuleTableV15"><div className="providerRuleHeadV15"><span>Provider</span><span>API نرخ</span><span>API ظرفیت</span><span>فعال</span><span>تاریخ شروع</span><span>جایگزین</span><span/></div>{rules.map(rule=><ProviderRuleRow key={rule.name} rule={rule} save={saveRule}/>)}</div></section>}

    {tab==='governance'&&isSuperAdmin&&<section className="governanceV15"><div className="governanceHeroV15"><LockKeyhole/><div><h2>مدیریت و پاک‌سازی داده</h2><p>حذف کامل فقط با رمز سوپر ادمین انجام می‌شود. حذف هتل تکی قبل از حذف در سطل بازیافت ذخیره می‌شود.</p></div></div><div className="dangerGridV15">{[['ihos_hotels','پرونده تمام هتل‌ها','اطلاعات اصلی و اتصال‌های آنلاین‌سازی'],['ihos_hotel_automation','اطلاعات نرخ، ظرفیت و کارشناسان','وضعیت عملیاتی IHO Provider'],['ihos_provider_rules','تنظیمات Providerها','قواعد API و پیشنهاد مهاجرت']].map(([t,l,d])=><article key={t}><Trash2/><div><h3>{l}</h3><p>{d}</p></div><button onClick={()=>clearTable(t,l)}>پاک‌سازی کامل</button></article>)}</div></section>}

    {selected&&<div className="drawerBackdropV15" onClick={()=>setSelected(null)}><aside ref={drawerRef} tabIndex={-1} className="hotelDrawerV15" role="dialog" aria-modal="true" aria-label={`پرونده آنلاین‌سازی ${selected.title}`} onClick={e=>e.stopPropagation()}><header><div className="hotelDrawerAvatarV15">{selected.title.slice(0,1)}</div><div><span>پرونده آنلاین‌سازی</span><h2>{selected.title}</h2><p>{selected.hotel_code||'بدون کد'} · {selected.city||'بدون شهر'} · {selected.provider}</p></div><button aria-label="بستن پرونده هتل" onClick={()=>setSelected(null)}><X/></button></header><section className="drawerScoreV15"><div className="gaugeRingV15 mini" role="progressbar" aria-label="امتیاز آنلاین‌سازی" aria-valuemin={0} aria-valuemax={100} aria-valuenow={selected.automation_score||0} style={{'--value':`${(selected.automation_score||0)*3.6}deg`} as any}><strong>{selected.automation_score||0}٪</strong><span>امتیاز آنلاین</span></div><StatusBadge status={selected.automation_status||'آفلاین'} score={selected.automation_score||0}/></section><section className="drawerSourcesV15"><SourceCard title="منبع نرخ" api={selected.rate_api} hotel={selected.hotel_rate} expert={selected.rate_expert}/><SourceCard title="منبع ظرفیت" api={selected.capacity_api} hotel={selected.hotel_capacity} expert={selected.capacity_expert}/></section>{selected.migration_needed&&<section className="migrationCalloutV15"><Sparkles/><div><span>پیشنهاد مهاجرت</span><h3>انتقال به {selected.replacement_provider||'Provider دارای API کامل'}</h3><p>برای کاهش وابستگی به کارشناس و افزایش آنلاین‌بودن نرخ و ظرفیت.</p></div></section>}<footer><button className="btn primary" onClick={()=>onCreateTask?.(selected)}><Plus/> ایجاد تسک برای هتل</button>{isSuperAdmin&&<button className="btn danger" onClick={()=>deleteHotel(selected)}><Trash2/> حذف هتل</button>}</footer></aside></div>}
  </div>
}

function Metric({title,value,icon:Icon,tone,hint}:any){return <article className={`hotelMetricV15 ${tone}`}><span><Icon/></span><div><small>{title}</small><strong>{fa(value)}</strong><p>{hint}</p></div></article>}
function SourceBadge({api,hotel,expert}:any){const label=api?'Provider API':hotel?'پنل هتل':expert?expert:'آفلاین';return <span className={`sourceBadgeV15 ${api?'api':hotel?'hotel':expert?'expert':'offline'}`}><i/>{label}</span>}
function SourceCard({title,api,hotel,expert}:any){return <article><span>{title}</span><SourceBadge api={api} hotel={hotel} expert={expert}/><small>{api?'بدون دخالت کارشناس':hotel?'هتل اطلاعات را ثبت می‌کند':expert?`مسئول: ${expert}`:'هیچ منبع فعالی ثبت نشده'}</small></article>}
function StatusBadge({status,score}:any){return <span className={`statusBadgeV15 ${status.includes('۱۰۰')?'online':status.includes('ظرفیت')?'capacity':status.includes('نرخ')?'rate':status.includes('مهاجرت')?'migrate':status.includes('کارشناس')?'expert':'offline'}`}><i/>{status}<small>{score}٪</small></span>}
function ProviderRuleRow({rule,save}:any){const [r,setR]=useState(rule);useEffect(()=>setR(rule),[rule]);return <div className="providerRuleRowV15"><b>{r.name}</b><label className="switchV15"><span className="srOnly">API نرخ {r.name}</span><input type="checkbox" checked={r.rateApi} onChange={e=>setR({...r,rateApi:e.target.checked})}/><i/></label><label className="switchV15"><span className="srOnly">API ظرفیت {r.name}</span><input type="checkbox" checked={r.capacityApi} onChange={e=>setR({...r,capacityApi:e.target.checked})}/><i/></label><label className="switchV15"><span className="srOnly">فعال‌بودن {r.name}</span><input type="checkbox" checked={r.active} onChange={e=>setR({...r,active:e.target.checked})}/><i/></label><input type="date" aria-label={`تاریخ شروع ${r.name}`} value={r.effectiveFrom||''} onChange={e=>setR({...r,effectiveFrom:e.target.value})}/><input aria-label={`Provider جایگزین ${r.name}`} value={r.replacementProvider||''} onChange={e=>setR({...r,replacementProvider:e.target.value})} placeholder="Provider جایگزین"/><button aria-label={`ذخیره تنظیمات ${r.name}`} onClick={()=>save(r)}><Save/></button></div>}

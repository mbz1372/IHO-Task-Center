'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {
  AlertTriangle,ArrowLeftRight,BarChart3,Bot,Building2,CalendarClock,CheckCircle2,
  CircleDollarSign,Database,Download,FileSpreadsheet,Gauge,Hotel,ListChecks,RefreshCcw,
  Search,Settings2,ShieldAlert,Sparkles,Target,Upload,Users2,Wifi,Workflow
} from 'lucide-react';
import {DEFAULT_PROVIDER_RULES} from '@/lib/superapp/automation';
import {loadRows,makeId,normalizeFa,nowIso,saveRows,saveSetting} from './storage';

type Tab='dashboard'|'inbox'|'hotels'|'profile'|'team'|'tasks'|'exports'|'ai';
type Props={
  hotels?:any[];tasks?:any[];users?:any[];me?:any;setView?:(view:any)=>void;
  onCreateTask?:(hotel:any,input?:any)=>void;onOpenHotelImport?:()=>void;
  onImportExperts?:(file:File)=>Promise<void>;onImportAssignments?:(file:File)=>Promise<void>;
};
type ExactFileSlot={key:string;name:string;title:string;desc:string;required:boolean;icon:any;kind:string;table:string};

type HotelInsight={
  id:string;key:string;hotel_code?:string;title:string;city?:string;province?:string;provider?:string;caring_category?:string;
  cooperation_status?:string;site_visible?:boolean;search_visible?:boolean;capacity_total?:number;purchase_period?:number;payment_period?:number;
  capacity_owner?:string;rate_owner?:string;city_owner?:string;confirmed:number;unconfirmed:number;reserveRows:number;nights:number;gross:number;margin:number;
  traffic:number;conversion:number;risk:number;opportunity:number;health:number;reasons:string[];actions:string[];openTasks:number;doneTasks:number;lastEvent?:any;events:any[];
};

const fa=(value:number)=>Number(value||0).toLocaleString('fa-IR');
const percent=(part:number,total:number)=>Math.round(part/Math.max(1,total)*100);
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,Math.round(n||0)));
const isDone=(value:any)=>['انجام شد','بسته شده','تایید شده','done','closed','approved'].includes(normalizeFa(value));
const asNumber=(value:any)=>{const n=Number(String(value??'').replace(/[٬,\s]/g,'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));return Number.isFinite(n)?n:0};
const dateOnly=(value:any)=>String(value||'').slice(0,10);
const daysUntil=(value:any)=>{const raw=dateOnly(value);if(!raw)return 99999;const time=new Date(`${raw}T12:00:00`).getTime();return Number.isFinite(time)?Math.ceil((time-Date.now())/86400000):99999};
const rawText=(value:any)=>String(value??'').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim();
const keyText=(value:any)=>normalizeFa(value).replace(/[\s\-_/()（）.]/g,'');
const hotelKey=(code?:any,title?:any)=>{const c=keyText(code);if(c)return `code:${c}`;const t=keyText(title);return t?`title:${t}`:''};
const hotelTitleKey=(title?:any)=>keyText(title)?`title:${keyText(title)}`:'';

const EXACT_FILE_SLOTS:ExactFileSlot[]=[
  {key:'reserveList',name:'لیست رزرو.xlsx',title:'لیست رزرو.xlsx',desc:'ریز همه رزروها؛ مبنای قیف، Lost و ساخت تسک پیگیری',required:true,icon:FileSpreadsheet,kind:'reservation',table:'ihos_supply_reservation_list'},
  {key:'hotelData',name:'All Hotel Data(1).xlsx',title:'All Hotel Data(1).xlsx',desc:'Master هتل‌ها؛ شهر، Provider، قرارداد، ظرفیت، دوره خرید و پرداخت',required:true,icon:Hotel,kind:'hotel',table:'ihos_supply_uploaded_hotels'},
  {key:'confirmed',name:'1405 Sale of confirmed reservations.xlsx',title:'1405 Sale of confirmed reservations.xlsx',desc:'رزروهای قطعی؛ فروش، شب‌اقامت، سود و نرخ قطعیت',required:true,icon:CheckCircle2,kind:'confirmed',table:'ihos_supply_confirmed_sales'},
  {key:'unconfirmed',name:'1405 Sale of unconfirmed reservations.xlsx',title:'1405 Sale of unconfirmed reservations.xlsx',desc:'رزروهای غیرقطعی؛ Lost، دلیل‌های عدم تبدیل و اقدام فوری',required:true,icon:AlertTriangle,kind:'unconfirmed',table:'ihos_supply_unconfirmed_sales'},
  {key:'mehr',name:'Mehr Mo hotels.xlsx',title:'Mehr Mo hotels.xlsx',desc:'فایل مکمل مهر؛ اولویت‌ها و وضعیت‌های عملیاتی ویژه',required:false,icon:Target,kind:'mehr',table:'ihos_supply_mehr_mo'},
  {key:'assignment',name:'Hotel Assignment.xlsx',title:'Hotel Assignment.xlsx',desc:'مالکیت کارشناسان؛ مسئول ظرفیت، نرخ و سیتی‌منیجر',required:true,icon:Users2,kind:'assignment',table:'ihos_supply_hotel_assignments'},
  {key:'traffic',name:'ترافیک بازدید سایت Analytics.xlsx',title:'ترافیک بازدید سایت Analytics.xlsx',desc:'ترافیک و قیف تبدیل؛ بازدید، شروع رزرو، تبدیل و افت',required:true,icon:BarChart3,kind:'traffic',table:'ihos_supply_analytics_traffic'},
];

const FINANCIAL_LEVELS=[
  {level:'A+',min:25,max:999,title:'Strategic Cash-flow'},
  {level:'A',min:18,max:24,title:'High Cash-flow'},
  {level:'A-',min:15,max:17,title:'Good Cash-flow'},
  {level:'B+',min:10,max:14,title:'Medium Cash-flow'},
  {level:'B',min:7,max:9,title:'Limited Cash-flow'},
  {level:'B-',min:1,max:6,title:'Low Cash-flow'},
  {level:'D',min:0,max:0,title:'Same-day Settlement'},
] as const;

function financialClass(hotel:any,profile?:any){
  const settlement=normalizeFa(profile?.settlement_model||profile?.contract_financial_type||'');
  if(settlement.includes('به محض')||settlement.includes('رزرو')&&settlement.includes('فوری'))return{level:'F',title:'Immediate Payment',days:null};
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
function pickValue(row:any,names:string[]){
  const keys=Object.keys(row||{});
  const wanted=names.map(keyText).filter(Boolean);
  const key=keys.find(k=>wanted.some(w=>keyText(k)===w||keyText(k).includes(w)||w.includes(keyText(k))));
  return key?row[key]:'';
}
function firstNonEmpty(row:any,indices:number[]){
  const values=Object.values(row||{});
  for(const index of indices){const v=rawText(values[index]);if(v)return v}
  return '';
}
function buildRowsFromMatrix(matrix:any[][],slot:ExactFileSlot){
  let headerIndex=slot.key==='mehr'?2:matrix.findIndex(row=>row.filter(cell=>rawText(cell)).length>=3&&row.some(cell=>/هتل|hotel|رزرو|reservation|city|شهر|تاریخ|date|کد/i.test(rawText(cell))));
  if(headerIndex<0)headerIndex=0;
  const headers=(matrix[headerIndex]||[]).map((cell:any,index:number)=>rawText(cell)||`col_${index+1}`);
  return matrix.slice(headerIndex+1).filter(row=>row.some(cell=>rawText(cell))).map(row=>Object.fromEntries(headers.map((h:string,index:number)=>[h,row[index]??''])));
}
function rowHotelCode(row:any){return rawText(pickValue(row,['کد هتل','hotel_code','hotel code','HotelId','Hotel ID','کد','HotelCode','اقامتگاه کد']))}
function rowHotelTitle(row:any){return rawText(pickValue(row,['نام هتل','هتل','hotel','hotel name','HotelName','نام اقامتگاه','نام مرکز'])) || firstNonEmpty(row,[0,1])}
function rowCity(row:any){return rawText(pickValue(row,['شهر','city','CityName']))}
function rowValue(row:any,names:string[]){return asNumber(pickValue(row,names))}
function rowCount(row:any,names:string[],fallback=1){const n=rowValue(row,names);return n||fallback}
function mergeText(a?:any,b?:any){return rawText(a)||rawText(b)||''}
function makeExport(rows:any[],fileName:string){
  if(typeof document==='undefined')return;
  const headers=Object.keys(rows[0]||{empty:''});
  const body='\ufeff'+[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(r[h]??'').replaceAll('"','""')}"`).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));a.download=fileName;a.click();
}

export default function SupplyChainCommandCenter({hotels=[],tasks=[],users=[],me,setView,onCreateTask,onOpenHotelImport,onImportExperts,onImportAssignments}:Props){
  const [tab,setTab]=useState<Tab>('dashboard');
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [automation,setAutomation]=useState<any[]>([]),[rules,setRules]=useState<any[]>([]),[coverage,setCoverage]=useState<any[]>([]);
  const [assignments,setAssignments]=useState<any[]>([]),[profiles,setProfiles]=useState<any[]>([]),[reports,setReports]=useState<any[]>([]);
  const [sales,setSales]=useState<any[]>([]),[blockers,setBlockers]=useState<any[]>([]),[storedTasks,setStoredTasks]=useState<any[]>([]),[events,setEvents]=useState<any[]>([]);
  const [settings,setSettings]=useState({capacityMinutes:12,rateMinutes:8,capacityWeight:65,rateWeight:35});
  const [importRuns,setImportRuns]=useState<any[]>([]),[importRows,setImportRows]=useState<any[]>([]),[exactFiles,setExactFiles]=useState<any[]>([]);
  const [query,setQuery]=useState(''),[selectedHotelKey,setSelectedHotelKey]=useState(''),[ownerDraft,setOwnerDraft]=useState<Record<string,string>>({});
  const [aiText,setAiText]=useState(''),[aiLoading,setAiLoading]=useState(false);
  const fileInputs=useRef<Record<string,HTMLInputElement|null>>({});

  async function refresh(){
    setLoading(true);setError('');
    try{
      const results=await Promise.allSettled([
        loadRows('ihos_hotel_automation'),loadRows('ihos_provider_rules'),loadRows('ihos_provider_coverage'),
        loadRows('ihos_hotel_assignments'),loadRows('ihos_hotel_financial_profiles'),loadRows('ihos_work_reports'),
        loadRows('ihos_hotel_sales_metrics'),loadRows('ihos_hotel_blockers'),loadRows('ihos_settings','key,value',5000),
        loadRows('ihos_supply_import_runs'),loadRows('ihos_supply_import_rows'),loadRows('ihos_hotel_events'),loadRows('ihos_tasks')
      ]);
      const rows=(index:number)=>results[index].status==='fulfilled'?(results[index] as PromiseFulfilledResult<any[]>).value:[];
      setAutomation(rows(0));setRules(rows(1));setCoverage(rows(2));setAssignments(rows(3));setProfiles(rows(4));setReports(rows(5));setSales(rows(6));setBlockers(rows(7));
      const config=new Map(rows(8).map((item:any)=>[item.key,item.value]));
      const fileState=config.get('supply_exact_data_files');setExactFiles(Array.isArray(fileState)?fileState:[]);
      setImportRuns(rows(9));setImportRows(rows(10));setEvents(rows(11));setStoredTasks(rows(12));
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

  const allTasks=useMemo(()=>{
    const map=new Map<string,any>();
    [...tasks,...storedTasks].forEach(task=>{if(task?.id)map.set(task.id,task)});
    return [...map.values()];
  },[tasks,storedTasks]);

  const rowsByFile=useMemo(()=>{
    const map:Record<string,any[]>={};
    EXACT_FILE_SLOTS.forEach(slot=>{map[slot.key]=[]});
    importRows.forEach(row=>{const key=row.file_key; if(key){(map[key] ||= []).push(row.payload||row)}});
    return map;
  },[importRows]);

  const analysis=useMemo(()=>{
    const profileMap=new Map(profiles.map(row=>[row.hotel_id,row]));
    const autoMap=new Map(automation.map(row=>[row.hotel_id,row]));
    const ruleRows=(rules.length?rules:DEFAULT_PROVIDER_RULES.map((rule:any)=>({name:rule.name,rate_api:rule.rateApi,capacity_api:rule.capacityApi,active:rule.active!==false,priority:rule.priority||99})));
    const ruleMap=new Map(ruleRows.map(row=>[normalizeFa(row.name||''),row]));
    const coverageMap=new Map<string,any[]>();
    coverage.filter(row=>row.active!==false).forEach(row=>{const key=row.hotel_id||`code:${keyText(row.hotel_code)}`;coverageMap.set(key,[...(coverageMap.get(key)||[]),row])});
    const base=new Map<string,HotelInsight>();
    function ensure(input:any){
      const title=mergeText(input.title,input.hotel_title)||rowHotelTitle(input)||'هتل بدون نام';
      const code=mergeText(input.hotel_code,rowHotelCode(input));
      const key=hotelKey(code,title)||makeId('hotel-key');
      const current=base.get(key);
      const merged:HotelInsight={
        id:current?.id||input.id||key,
        key,hotel_code:mergeText(current?.hotel_code,code),title:mergeText(current?.title,title),city:mergeText(current?.city,input.city||rowCity(input)),province:mergeText(current?.province,input.province||pickValue(input,['استان','province'])),
        provider:mergeText(current?.provider,input.provider||input['نام پروایدر']||pickValue(input,['نام پروایدر','provider','Provider'])),
        caring_category:mergeText(current?.caring_category,input.caring_category||input.CaringCategory||pickValue(input,['CaringCategory','دسته بندی','دسته بندی هتل'])),
        cooperation_status:mergeText(current?.cooperation_status,input.cooperation_status||pickValue(input,['وضعیت همکاری','cooperation_status'])),
        site_visible:current?.site_visible ?? (String(pickValue(input,['نمایش در سایت','site_visible'])).includes('true')||String(pickValue(input,['نمایش در سایت','site_visible'])).includes('بله')),
        search_visible:current?.search_visible ?? (String(pickValue(input,['نمایش در نتایج جستجو','search_visible'])).includes('true')||String(pickValue(input,['نمایش در نتایج جستجو','search_visible'])).includes('بله')),
        capacity_total:current?.capacity_total||asNumber(input.capacity_total||pickValue(input,['ظرفیت کلی هتل','capacity_total'])),purchase_period:current?.purchase_period||asNumber(input.purchase_period||pickValue(input,['دوره خرید','purchase_period'])),payment_period:current?.payment_period||asNumber(input.payment_period||pickValue(input,['دوره پرداخت','payment_period'])),
        capacity_owner:current?.capacity_owner,rate_owner:current?.rate_owner,city_owner:current?.city_owner,
        confirmed:current?.confirmed||0,unconfirmed:current?.unconfirmed||0,reserveRows:current?.reserveRows||0,nights:current?.nights||0,gross:current?.gross||0,margin:current?.margin||0,traffic:current?.traffic||0,conversion:current?.conversion||0,
        risk:0,opportunity:0,health:0,reasons:[],actions:[],openTasks:0,doneTasks:0,events:current?.events||[],lastEvent:current?.lastEvent
      };
      base.set(key,merged);return merged;
    }
    hotels.forEach(h=>ensure(h));
    rowsByFile.hotelData.forEach(row=>ensure(row));
    rowsByFile.mehr.forEach(row=>{const h=ensure(row); if(!h.caring_category)h.caring_category=mergeText(h.caring_category,pickValue(row,['CaringCategory','اولویت','دسته بندی']))});

    function match(row:any){
      const code=rowHotelCode(row);const title=rowHotelTitle(row);const byCode=hotelKey(code,'');const byTitle=hotelTitleKey(title);
      return base.get(byCode)||base.get(byTitle)||ensure({hotel_code:code,title,city:rowCity(row)});
    }
    rowsByFile.reserveList.forEach(row=>{const h=match(row);h.reserveRows+=rowCount(row,['تعداد رزرو','count','booking_count'],1)});
    rowsByFile.confirmed.forEach(row=>{const h=match(row);h.confirmed+=rowCount(row,['تعداد رزرو','رزرو قطعی','confirmed','booking_count'],1);h.nights+=rowValue(row,['شب اقامت','nights','room_nights','room nights']);h.gross+=rowValue(row,['فروش','مبلغ','amount','gross','gross_sales']);h.margin+=rowValue(row,['سود','مارجین','profit','margin','margin_amount'])});
    rowsByFile.unconfirmed.forEach(row=>{const h=match(row);h.unconfirmed+=rowCount(row,['تعداد رزرو','رزرو غیر قطعی','unconfirmed','booking_count'],1);h.nights+=rowValue(row,['شب اقامت','nights','room_nights']);h.gross+=rowValue(row,['فروش','مبلغ','amount','gross','gross_sales'])});
    rowsByFile.traffic.forEach(row=>{const h=match(row);h.traffic+=rowValue(row,['بازدید','sessions','Users','کاربر','views','pageviews','event count'])||1;const conv=rowValue(row,['conversion','نرخ تبدیل','purchase conversion']);if(conv)h.conversion=Math.max(h.conversion,conv)});
    rowsByFile.assignment.forEach(row=>{
      const h=match(row);const values=Object.values(row).map(rawText);const taskLike=normalizeFa(pickValue(row,['taskId','task id','تسک','نوع تسک'])||values[1]);const expert=rawText(pickValue(row,['کارشناس','نام کارشناس','owner','assignee','مسئول'])||values[2]||values[1]);
      if(!expert)return;
      if(taskLike.includes('1')||taskLike.includes('capacity')||taskLike.includes('ظرفیت'))h.capacity_owner=expert;
      else if(taskLike.includes('2')||taskLike.includes('rate')||taskLike.includes('نرخ'))h.rate_owner=expert;
      else if(taskLike.includes('4')||taskLike.includes('city')||taskLike.includes('شهر'))h.city_owner=expert;
      else if(!h.capacity_owner)h.capacity_owner=expert;
    });
    assignments.filter(row=>row.active!==false).forEach(row=>{const h=base.get(hotelKey(row.hotel_code,row.hotel_title))||base.get(row.hotel_id);if(!h)return;const role=normalizeFa(row.assignment_role||row.role||'');const name=rawText(row.user_name||row.owner_name);if(role.includes('rate')||role.includes('نرخ'))h.rate_owner=name||h.rate_owner;else if(role.includes('capacity')||role.includes('ظرفیت'))h.capacity_owner=name||h.capacity_owner;else if(role.includes('city'))h.city_owner=name||h.city_owner});
    const byId=new Map([...base.values()].map(h=>[h.id,h]));
    const byTitle=new Map([...base.values()].map(h=>[keyText(h.title),h]));
    allTasks.forEach(task=>{const h=byId.get(task.hotel_id)||byTitle.get(keyText(task.hotel_title));if(!h)return;if(isDone(task.status))h.doneTasks++;else h.openTasks++});
    events.forEach(ev=>{const h=byId.get(ev.hotel_id)||byTitle.get(keyText(ev.hotel_title));if(!h)return;h.events.push(ev)});
    const now=Date.now();
    const rows=[...base.values()].map(h=>{
      const eventSorted=[...h.events].sort((a,b)=>String(b.occurred_at||b.created_at||'').localeCompare(String(a.occurred_at||a.created_at||'')));
      h.lastEvent=eventSorted[0];
      const reasons:string[]=[];const actions:string[]=[];let risk=0;let opp=0;
      if(!h.capacity_owner){risk+=18;opp+=10;reasons.push('مسئول ظرفیت ندارد');actions.push('تعیین مسئول ظرفیت')}
      if(!h.rate_owner){risk+=12;opp+=8;reasons.push('مسئول نرخ ندارد');actions.push('تعیین مسئول نرخ')}
      if(h.unconfirmed>0){risk+=Math.min(28,h.unconfirmed*4);opp+=Math.min(25,h.unconfirmed*5);reasons.push(`${fa(h.unconfirmed)} رزرو غیرقطعی دارد`);actions.push('پیگیری رزروهای غیرقطعی')}
      if(h.traffic>0&&h.confirmed===0){risk+=20;opp+=20;reasons.push('ترافیک دارد اما فروش قطعی ندارد');actions.push('بررسی نرخ/ظرفیت و پیشنهاد فروش')}
      if(h.traffic>20&&h.confirmed>0&&h.traffic/Math.max(1,h.confirmed)>30){risk+=12;opp+=18;reasons.push('ترافیک نسبت به رزرو قطعی زیاد است');actions.push('تحلیل نرخ تبدیل و محتوای هتل')}
      if(h.openTasks>0){risk+=Math.min(15,h.openTasks*5);reasons.push(`${fa(h.openTasks)} تسک باز دارد`)}
      const lastTime=h.lastEvent?new Date(h.lastEvent.occurred_at||h.lastEvent.created_at).getTime():0;
      if(!lastTime||now-lastTime>7*86400000){risk+=8;reasons.push('اقدام جدید در ۷ روز اخیر ثبت نشده');actions.push('ثبت اقدام پیگیری جدید')}
      if(h.search_visible===false){risk+=8;reasons.push('در نتایج جستجو نمایش ندارد');actions.push('بررسی نمایش در سایت')}
      if(h.confirmed>0){opp+=Math.min(20,h.confirmed*2)}
      if(h.gross>0){opp+=Math.min(20,Math.round(h.gross/100000000))}
      if(normalizeFa(h.caring_category).includes('پیشران')||normalizeFa(h.caring_category).includes('کلیدی')){opp+=12;risk+=3}
      h.risk=clamp(risk);h.opportunity=clamp(opp);h.health=clamp(100-risk+Math.min(20,h.confirmed*2));h.reasons=reasons;h.actions=[...new Set(actions)].slice(0,4);return h;
    }).sort((a,b)=>b.risk-a.risk||b.opportunity-a.opportunity);
    const withIssues=rows.filter(h=>h.risk>=45||h.actions.length);
    return {rows,withIssues,critical:rows.filter(h=>h.risk>=70),healthy:rows.filter(h=>h.health>=75),totals:{hotels:rows.length,confirmed:rows.reduce((s,h)=>s+h.confirmed,0),unconfirmed:rows.reduce((s,h)=>s+h.unconfirmed,0),traffic:rows.reduce((s,h)=>s+h.traffic,0),gross:rows.reduce((s,h)=>s+h.gross,0),nights:rows.reduce((s,h)=>s+h.nights,0)},files:EXACT_FILE_SLOTS.map(slot=>({slot,state:exactFiles.find(x=>x.key===slot.key),rows:rowsByFile[slot.key]?.length||0}))};
  },[hotels,rowsByFile,profiles,automation,rules,coverage,assignments,allTasks,events,exactFiles]);

  const selectedHotel=useMemo(()=>analysis.rows.find(h=>h.key===selectedHotelKey)||analysis.rows[0], [analysis.rows,selectedHotelKey]);
  const filteredHotels=useMemo(()=>analysis.rows.filter(h=>!query||normalizeFa(`${h.title} ${h.city} ${h.provider} ${h.caring_category} ${h.hotel_code}`).includes(normalizeFa(query))).slice(0,150),[analysis.rows,query]);
  const teamKpis=useMemo(()=>users.filter(u=>u.is_active!==false).map(user=>{
    const name=normalizeFa(user.full_name);const owned=analysis.rows.filter(h=>normalizeFa(h.capacity_owner)===name||normalizeFa(h.rate_owner)===name||normalizeFa(h.city_owner)===name);
    const assigned=allTasks.filter(t=>t.assigned_to===user.id||normalizeFa(t.assigned_name)===name);const done=assigned.filter(t=>isDone(t.status));const late=assigned.filter(t=>!isDone(t.status)&&t.deadline&&daysUntil(t.deadline)<0);
    const acts=events.filter(e=>e.actor_id===user.id||normalizeFa(e.actor_name)===name);
    return{user,owned:owned.length,open:assigned.length-done.length,done:done.length,late:late.length,actions:acts.length,riskOwned:owned.filter(h=>h.risk>=60).length,score:done.length*3+acts.length+owned.filter(h=>h.health>=75).length*2-late.length*2}
  }).sort((a,b)=>b.score-a.score),[users,analysis.rows,allTasks,events]);

  async function importExactFile(slot:ExactFileSlot,file:File|undefined){
    if(!file)return;setNotice(`در حال خواندن ${slot.name}...`);
    try{
      const XLSX=await import('xlsx');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false});const ws=wb.Sheets[wb.SheetNames[0]];
      const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}) as any[][];const rows=buildRowsFromMatrix(matrix,slot);
      if(!rows.length)throw new Error('هیچ ردیف معتبری در فایل پیدا نشد');
      const importId=`exact-${slot.key}-${Date.now()}`;const createdAt=nowIso();
      const normalizedRows=rows.map((row,index)=>({id:`${importId}-${index+1}`,import_id:importId,file_key:slot.key,file_name:slot.name,uploaded_file_name:file.name,row_index:index+1,hotel_code:rowHotelCode(row),hotel_title:rowHotelTitle(row),city:rowCity(row),payload:row,created_at:createdAt,updated_at:createdAt}));
      const run={id:importId,file_key:slot.key,file_name:slot.name,uploaded_file_name:file.name,rows_count:rows.length,required:slot.required,created_at:createdAt,updated_at:createdAt};
      await saveRows('ihos_supply_import_runs',[run]);await saveRows('ihos_supply_import_rows',normalizedRows);await saveRows(slot.table,normalizedRows);
      const next=[...exactFiles.filter(item=>item.key!==slot.key),{key:slot.key,name:slot.name,fileName:file.name,rows:rows.length,ok:true,uploadedAt:createdAt}];
      await saveSetting('supply_exact_data_files',next);setExactFiles(next);
      if(slot.key==='assignment'&&onImportAssignments)try{await onImportAssignments(file)}catch{}
      await saveRows('ihos_hotel_events',[{id:makeId('event'),event_type:'data_import',title:`ورود فایل ${slot.name}`,description:`${fa(rows.length)} ردیف از ${file.name} وارد شد`,actor_id:me?.id,actor_name:me?.full_name,entity_type:'import',entity_id:importId,occurred_at:createdAt,created_at:createdAt}]);
      setNotice(`${slot.name}: ${fa(rows.length)} ردیف ذخیره شد و تحلیل‌ها آپدیت شدند.`);await refresh();
    }catch(e:any){setNotice(`${slot.name} ناموفق بود: ${e.message}`)}
  }
  async function createTaskForHotel(h:HotelInsight,action?:string,assignedId?:string){
    const user=users.find(u=>u.id===(assignedId||ownerDraft[h.key]));const now=nowIso();
    const task={id:makeId('task'),title:action||h.actions[0]||`پیگیری ${h.title}`,description:`Risk ${h.risk} / Opportunity ${h.opportunity}\nدلایل: ${h.reasons.join('، ')}`,hotel_id:h.id,hotel_title:h.title,city:h.city,priority:h.risk>=70?'فوری':h.risk>=45?'بالا':'متوسط',status:'در انتظار انجام',category:'Supply Follow-up',assigned_to:user?.id,assigned_name:user?.full_name,created_by:me?.id,deadline:new Date(Date.now()+86400000).toISOString().slice(0,10),source_type:'hotel_risk',source_id:h.key,created_at:now,updated_at:now};
    const event={id:makeId('event'),hotel_id:h.id,hotel_title:h.title,event_type:'task_created',title:`تسک ساخته شد: ${task.title}`,description:task.description,severity:task.priority,actor_id:me?.id,actor_name:me?.full_name,entity_type:'task',entity_id:task.id,occurred_at:now,created_at:now};
    await saveRows('ihos_tasks',[task]);await saveRows('ihos_hotel_events',[event]);setNotice(`تسک برای ${h.title}${user?` و مسئول ${user.full_name}`:''} ثبت شد.`);await refresh();
  }
  async function logHotelAction(h:HotelInsight,title:string){
    const now=nowIso();const event={id:makeId('event'),hotel_id:h.id,hotel_title:h.title,event_type:'manual_action',title,description:'ثبت اقدام دستی از مرکز فرمان تأمین',actor_id:me?.id,actor_name:me?.full_name,occurred_at:now,created_at:now};
    await saveRows('ihos_hotel_events',[event]);setNotice('اقدام روی Timeline هتل ثبت شد.');await refresh();
  }
  async function saveSupplySettings(){
    setNotice('در حال ذخیره تنظیمات محاسبات...');
    try{await Promise.all([saveSetting('supply_manual_capacity_minutes',settings.capacityMinutes),saveSetting('supply_manual_rate_minutes',settings.rateMinutes),saveSetting('supply_capacity_weight',settings.capacityWeight),saveSetting('supply_rate_weight',settings.rateWeight)]);setNotice('تنظیمات محاسبات ذخیره شد')}catch(e:any){setNotice(`ذخیره تنظیمات ناموفق بود: ${e.message}`)}
  }
  async function runAi(){
    setAiLoading(true);setAiText('');
    try{
      const top=analysis.withIssues.slice(0,20).map(h=>({hotel:h.title,city:h.city,risk:h.risk,opportunity:h.opportunity,reasons:h.reasons,actions:h.actions,confirmed:h.confirmed,unconfirmed:h.unconfirmed,traffic:h.traffic,capacity_owner:h.capacity_owner,rate_owner:h.rate_owner}));
      const prompt=`بر اساس داده‌های زنجیره تامین ایران‌هتل، یک تحلیل مدیریتی کوتاه بده: 1) وضعیت کلی 2) پنج اقدام فوری 3) ریسک‌های اصلی 4) پیشنهاد تسک برای تیم. داده: ${JSON.stringify({totals:analysis.totals,critical:analysis.critical.length,top})}`;
      const response=await fetch('/api/avalai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
      const data=await response.json();setAiText(data.text||'تحلیلی دریافت نشد.');
    }catch(e:any){setAiText(`AI در دسترس نبود. تحلیل Rule-based: ${analysis.critical.length} هتل بحرانی، ${analysis.withIssues.length} هتل نیازمند پیگیری و ${analysis.totals.unconfirmed} رزرو غیرقطعی شناسایی شد. اولویت امروز: تعیین Owner ظرفیت/نرخ و پیگیری رزروهای غیرقطعی.`)}finally{setAiLoading(false)}
  }
  function exportManagerReport(){makeExport(analysis.withIssues.map(h=>({hotel:h.title,city:h.city,provider:h.provider,risk:h.risk,opportunity:h.opportunity,health:h.health,confirmed:h.confirmed,unconfirmed:h.unconfirmed,traffic:h.traffic,capacity_owner:h.capacity_owner,rate_owner:h.rate_owner,next_action:h.actions[0],reasons:h.reasons.join(' | ')})),'IHO_supply_followup_hotels.csv')}
  function exportTeam(){makeExport(teamKpis.map(k=>({user:k.user.full_name,owned_hotels:k.owned,open_tasks:k.open,done_tasks:k.done,late_tasks:k.late,actions:k.actions,risk_owned:k.riskOwned,score:k.score})),'IHO_supply_team_kpi.csv')}

  const tabs:[Tab,string,any][]=[['dashboard','داشبورد تصمیم',Gauge],['inbox','ورود ۷ فایل',Database],['hotels','هتل‌های نیازمند پیگیری',ShieldAlert],['profile','پروفایل هتل',Hotel],['team','KPI کارشناسان',Users2],['tasks','تسک و اقدام',ListChecks],['exports','خروجی مدیرعامل',Download],['ai','تحلیل AI',Bot]];
  return <div className="supplyOSV23">
    <section className="supplyHeroV23"><div><span>IRANHOTEL SUPPLY CHAIN OS</span><h1>مرکز فرمان زنجیره تأمین هتل</h1><p>آپلود داده‌ها، تشخیص وضعیت هر هتل، پیشنهاد اقدام، ساخت تسک، ثبت Timeline، KPI کارشناس و خروجی مدیرعامل در یک جریان واحد.</p><div className="supplyHeroActionsV23"><button className="btn primary" onClick={()=>setTab('inbox')}>ورود ۷ فایل اصلی</button><button className="btn glass" onClick={exportManagerReport}>خروجی هتل‌های نیازمند پیگیری</button></div></div><div className="supplyHealthV23"><div style={{'--supply-score':`${percent(analysis.healthy.length,Math.max(1,analysis.rows.length))*3.6}deg`} as any}><b>{percent(analysis.healthy.length,Math.max(1,analysis.rows.length))}٪</b><span>Health کل</span></div><small>{fa(analysis.withIssues.length)} هتل نیازمند اقدام</small></div></section>
    <div className="supplyTabsV23" role="tablist">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon/>{label}</button>)}<button className="refresh" onClick={refresh} disabled={loading}><RefreshCcw className={loading?'spin':''}/> بروزرسانی</button></div>
    {(error||notice)&&<div className={error?'supplyNoticeV23 danger':'supplyNoticeV23'}>{error||notice}</div>}

    {tab==='dashboard'&&<><section className="supplyMetricsV23"><SupplyMetric icon={Hotel} title="کل هتل‌ها" value={analysis.totals.hotels} hint="از Master و فایل‌های آپلودی" tone="blue"/><SupplyMetric icon={ShieldAlert} title="پرریسک" value={analysis.critical.length} hint="Risk بالای ۷۰" tone="red"/><SupplyMetric icon={CheckCircle2} title="رزرو قطعی" value={analysis.totals.confirmed} hint={`${fa(analysis.totals.nights)} شب‌اقامت`} tone="green"/><SupplyMetric icon={AlertTriangle} title="رزرو غیرقطعی" value={analysis.totals.unconfirmed} hint="نیازمند پیگیری" tone="orange"/><SupplyMetric icon={BarChart3} title="ترافیک" value={analysis.totals.traffic} hint="از Analytics" tone="purple"/><SupplyMetric icon={CircleDollarSign} title="فروش" value={analysis.totals.gross} hint="جمع فایل‌های فروش" tone="cyan" money/></section><section className="supplyGridV23"><article className="supplyPanelV23 span2"><PanelHead eyebrow="CEO ACTION LIST" title="Top هتل‌های نیازمند اقدام" action="خروجی CSV" onAction={exportManagerReport}/><HotelRows rows={analysis.withIssues.slice(0,12)} users={users} ownerDraft={ownerDraft} setOwnerDraft={setOwnerDraft} onSelect={h=>{setSelectedHotelKey(h.key);setTab('profile')}} onTask={createTaskForHotel}/></article><article className="supplyPanelV23"><PanelHead eyebrow="DATA READINESS" title="وضعیت ۷ فایل اصلی"/><FileReadiness files={analysis.files}/></article></section></>}

    {tab==='inbox'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="DATA INBOX" title="ورود ۷ فایل واقعی تحلیل رزرو و زنجیره تأمین"/><div className="dataImportGridV23">{EXACT_FILE_SLOTS.map(slot=>{const state=exactFiles.find(item=>item.key===slot.key);const Icon=slot.icon;return <button key={slot.key} className={`importCardV23 ${state?.ok?'ready':''}`} onClick={()=>fileInputs.current[slot.key]?.click()}><i><Icon/></i><span><b>{slot.title}</b><small>{slot.desc}</small><em>{state?.ok?`آپلود شده · ${fa(state.rows)} ردیف`:(slot.required?'الزامی · انتخاب فایل':'اختیاری · انتخاب فایل')}</em></span><Upload/></button>})}</div><p className="formulaNoteV23">بعد از آپلود، داده خام در Supabase ذخیره می‌شود و همین داشبورد، پروفایل هتل، KPI، تسک و خروجی‌ها از یک منبع مشترک تغذیه می‌شوند.</p>{EXACT_FILE_SLOTS.map(slot=><input key={slot.key} ref={el=>{fileInputs.current[slot.key]=el}} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>void importExactFile(slot,e.target.files?.[0])}/>)}</article></section>}

    {tab==='hotels'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="HOTEL RISK RADAR" title="هتل‌ها بر اساس ریسک و فرصت" action="خروجی CSV" onAction={exportManagerReport}/><div className="supplySearchBarV23"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در نام هتل، شهر، Provider، دسته‌بندی..."/></div><HotelRows rows={filteredHotels} users={users} ownerDraft={ownerDraft} setOwnerDraft={setOwnerDraft} onSelect={h=>{setSelectedHotelKey(h.key);setTab('profile')}} onTask={createTaskForHotel}/></article></section>}

    {tab==='profile'&&selectedHotel&&<section className="supplyGridV23"><article className="supplyPanelV23 span2"><PanelHead eyebrow="HOTEL 360" title={selectedHotel.title} action="ساخت تسک" onAction={()=>void createTaskForHotel(selectedHotel)}/><HotelProfile h={selectedHotel}/><div className="actionListV23"><button onClick={()=>void logHotelAction(selectedHotel,'تماس/پیگیری با هتل انجام شد')}><Workflow/><span><b>ثبت اقدام سریع</b><small>روی Timeline هتل ذخیره می‌شود</small></span></button>{selectedHotel.actions.map(action=><button key={action} onClick={()=>void createTaskForHotel(selectedHotel,action)}><ListChecks/><span><b>{action}</b><small>تبدیل به تسک و Assign</small></span></button>)}</div></article><article className="supplyPanelV23"><PanelHead eyebrow="TIMELINE" title="وقایع و اقدامات"/><Timeline events={selectedHotel.events}/></article></section>}

    {tab==='team'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="TEAM KPI" title="عملکرد کارشناسان بر اساس هتل، تسک و اقدام" action="خروجی KPI" onAction={exportTeam}/><div className="peopleTableV23"><header><span>کارشناس</span><span>هتل تحت مسئولیت</span><span>تسک باز</span><span>انجام‌شده</span><span>معوق</span><span>اقدام ثبت‌شده</span><span>امتیاز</span></header>{teamKpis.map(row=><div key={row.user.id}><span className="personV23"><i>{row.user.avatar?<img src={row.user.avatar} alt=""/>:row.user.full_name?.slice(0,1)}</i><span><b>{row.user.full_name}</b><small>{row.user.department_name||row.user.team||'بدون دپارتمان'}</small></span></span><b>{fa(row.owned)}</b><b>{fa(row.open)}</b><b>{fa(row.done)}</b><em className={row.late?'danger':''}>{fa(row.late)}</em><span>{fa(row.actions)}</span><strong>{fa(row.score)}</strong></div>)}</div></article></section>}

    {tab==='tasks'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="TASK FLOW" title="ساخت تسک از دل وضعیت هتل"/><HotelRows rows={analysis.withIssues.slice(0,80)} users={users} ownerDraft={ownerDraft} setOwnerDraft={setOwnerDraft} onSelect={h=>{setSelectedHotelKey(h.key);setTab('profile')}} onTask={createTaskForHotel}/></article></section>}

    {tab==='exports'&&<section className="supplyGridV23"><article className="supplyPanelV23 span2"><PanelHead eyebrow="CEO OUTPUT" title="خروجی‌های قابل ارائه"/><div className="actionListV23"><button onClick={exportManagerReport}><Download/><span><b>خروجی هتل‌های نیازمند پیگیری</b><small>Risk, Opportunity, Owner, Next Action</small></span></button><button onClick={exportTeam}><Download/><span><b>خروجی KPI کارشناسان</b><small>Owner, Tasks, Actions, Score</small></span></button><button onClick={()=>makeExport(analysis.rows.map(h=>({hotel:h.title,city:h.city,health:h.health,risk:h.risk,opportunity:h.opportunity,confirmed:h.confirmed,unconfirmed:h.unconfirmed,traffic:h.traffic})),'IHO_supply_all_hotels_status.csv')}><Download/><span><b>خروجی وضعیت کل هتل‌ها</b><small>برای BI یا گزارش مدیریتی</small></span></button></div></article><article className="supplyPanelV23"><PanelHead eyebrow="MANAGEMENT SUMMARY" title="متن آماده کپی"/><pre className="aiBoxV23">{`گزارش زنجیره تأمین ایران‌هتل\nکل هتل‌ها: ${fa(analysis.totals.hotels)}\nهتل‌های نیازمند پیگیری: ${fa(analysis.withIssues.length)}\nهتل‌های بحرانی: ${fa(analysis.critical.length)}\nرزرو قطعی: ${fa(analysis.totals.confirmed)}\nرزرو غیرقطعی: ${fa(analysis.totals.unconfirmed)}\nاقدام پیشنهادی امروز: پیگیری ${analysis.withIssues.slice(0,5).map(h=>h.title).join('، ')}`}</pre></article></section>}

    {tab==='ai'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="AVAL AI ANALYST" title="تحلیل مدیریتی و پیشنهاد اقدام" action={aiLoading?'در حال تحلیل...':'تحلیل کن'} onAction={()=>void runAi()}/><pre className="aiBoxV23">{aiText||'برای تولید تحلیل، ابتدا فایل‌ها را آپلود کن؛ سپس دکمه «تحلیل کن» را بزن تا Aval AI یا تحلیل Rule-based پیشنهاد اقدام بدهد.'}</pre></article></section>}
  </div>
}

function SupplyMetric({icon:Icon,title,value,hint,tone,money=false,suffix=''}:any){return <article className={`supplyMetricV23 ${tone}`}><i><Icon/></i><span><small>{title}</small><b>{fa(value)}{suffix}</b><em>{hint}{money?' ریال':''}</em></span></article>}
function PanelHead({eyebrow,title,action,onAction}:any){return <header className="supplyPanelHeadV23"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action&&<button onClick={onAction}>{action}</button>}</header>}
function Progress({value,label}:any){return <div className="supplyProgressV23"><span>{label}</span><div><i style={{width:`${Math.min(100,value)}%`}}/></div><b>{value}٪</b></div>}
function FileReadiness({files}:any){return <div className="statusRowsV23">{files.map(({slot,state,rows}:any)=><div key={slot.key}><i style={{background:state?.ok?'#14b8a6':slot.required?'#ef4444':'#f59e0b'}}/><span>{slot.title}</span><b>{state?.ok?'آماده':'ناقص'}</b><small>{state?.ok?`${fa(state.rows||rows)} ردیف`:slot.required?'الزامی':'اختیاری'}</small></div>)}</div>}
function HotelRows({rows,users,ownerDraft,setOwnerDraft,onSelect,onTask}:any){return <div className="migrationTableV23"><header><span>هتل</span><span>Risk</span><span>Opportunity</span><span>Owner</span><span>علت</span><span>اقدام</span></header>{rows.map((h:HotelInsight)=><div key={h.key}><span><button className="linkBtnV23" onClick={()=>onSelect(h)}><b>{h.title}</b><small>{h.city||'بدون شهر'} · {h.provider||'بدون Provider'}</small></button></span><strong className={h.risk>=70?'danger':h.risk>=45?'warn':'good'}>{h.risk}</strong><strong>{h.opportunity}</strong><span><select value={ownerDraft[h.key]||''} onChange={(e)=>setOwnerDraft((p:any)=>({...p,[h.key]:e.target.value}))}><option value="">انتخاب مسئول</option>{users.filter((u:any)=>u.is_active!==false).map((u:any)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><small>{h.capacity_owner||h.rate_owner||'بدون Owner'}</small></span><span>{h.reasons.slice(0,2).join('، ')||'—'}</span><button onClick={()=>onTask(h,h.actions[0],ownerDraft[h.key])}>ساخت تسک</button></div>)}</div>}
function HotelProfile({h}:any){return <div className="profileGridV23"><SupplyMetric icon={ShieldAlert} title="Risk" value={h.risk} hint={h.reasons[0]||'بدون ریسک اصلی'} tone={h.risk>=70?'red':'orange'}/><SupplyMetric icon={Target} title="Opportunity" value={h.opportunity} hint={h.actions[0]||'اقدام پیشنهادی'} tone="purple"/><SupplyMetric icon={CheckCircle2} title="رزرو قطعی" value={h.confirmed} hint={`${fa(h.nights)} شب‌اقامت`} tone="green"/><SupplyMetric icon={AlertTriangle} title="غیرقطعی" value={h.unconfirmed} hint="نیازمند پیگیری" tone="orange"/><div className="profileFactsV23"><b>وضعیت هتل</b><span>شهر: {h.city||'—'}</span><span>Provider: {h.provider||'—'}</span><span>Caring: {h.caring_category||'—'}</span><span>مسئول ظرفیت: {h.capacity_owner||'—'}</span><span>مسئول نرخ: {h.rate_owner||'—'}</span><span>تسک باز: {fa(h.openTasks)}</span><span>آخرین اقدام: {h.lastEvent?.title||'ثبت نشده'}</span></div></div>}
function Timeline({events}:any){const rows=[...(events||[])].sort((a,b)=>String(b.occurred_at||b.created_at||'').localeCompare(String(a.occurred_at||a.created_at||''))).slice(0,30);return <div className="timelineV23">{rows.length?rows.map((e:any)=><article key={e.id}><i/><div><b>{e.title}</b><small>{e.actor_name||'سیستم'} · {String(e.occurred_at||e.created_at||'').slice(0,16).replace('T',' ')}</small><p>{e.description}</p></div></article>):<Empty text="هنوز اقدامی برای این هتل ثبت نشده است."/>}</div>}
function Empty({text}:any){return <div className="supplyEmptyV23"><Sparkles/><span>{text}</span></div>}

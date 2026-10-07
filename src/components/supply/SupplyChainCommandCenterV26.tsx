'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {
  AlertTriangle,BarChart3,Bot,Building2,CheckCircle2,CircleDollarSign,Database,Download,
  FileSpreadsheet,Gauge,Hotel,ListChecks,RefreshCcw,Search,Settings2,ShieldAlert,Sparkles,
  Target,Upload,Users2,Workflow
} from 'lucide-react';
import {loadRows,makeId,normalizeFa,nowIso,saveRows,saveSetting} from './storage';

type Tab='command'|'data'|'hotels'|'profile'|'tasks'|'team'|'ceo'|'ai';
type Props={
  hotels?:any[]; tasks?:any[]; users?:any[]; me?:any; setView?:(view:any)=>void;
  onCreateTask?:(hotel:any,input?:any)=>void; onOpenHotelImport?:()=>void;
  onImportExperts?:(file:File)=>Promise<void>; onImportAssignments?:(file:File)=>Promise<void>;
};
type Slot={key:string;name:string;title:string;desc:string;required:boolean;table:string;icon:any};
type Insight={
  id:string; key:string; title:string; code?:string; city?:string; province?:string; provider?:string; category?:string; status?:string;
  capacityOwner?:string; rateOwner?:string; cityOwner?:string; confirmed:number; unconfirmed:number; reserveRows:number;
  nights:number; sales:number; margin:number; traffic:number; conversion:number; openTasks:number; doneTasks:number;
  risk:number; opportunity:number; health:number; reasons:string[]; nextActions:string[]; events:any[]; lastEvent?:any;
};

const SLOTS:Slot[]=[
  {key:'reserveList',name:'لیست رزرو.xlsx',title:'لیست رزرو.xlsx',desc:'ریز رزروها؛ پایه Lost، قیف و پیگیری رزروهای حساس',required:true,table:'ihos_supply_reservation_list',icon:FileSpreadsheet},
  {key:'hotelData',name:'All Hotel Data(1).xlsx',title:'All Hotel Data(1).xlsx',desc:'Master هتل‌ها؛ شهر، Provider، وضعیت همکاری، قرارداد و اهمیت',required:true,table:'ihos_supply_uploaded_hotels',icon:Hotel},
  {key:'confirmed',name:'1405 Sale of confirmed reservations.xlsx',title:'1405 Sale of confirmed reservations.xlsx',desc:'رزرو قطعی، شب‌اقامت، فروش و مارجین',required:true,table:'ihos_supply_confirmed_sales',icon:CheckCircle2},
  {key:'unconfirmed',name:'1405 Sale of unconfirmed reservations.xlsx',title:'1405 Sale of unconfirmed reservations.xlsx',desc:'رزرو غیرقطعی و فرصت‌های از دست‌رفته',required:true,table:'ihos_supply_unconfirmed_sales',icon:AlertTriangle},
  {key:'mehr',name:'Mehr Mo hotels.xlsx',title:'Mehr Mo hotels.xlsx',desc:'فایل مکمل مهر و اولویت‌های عملیاتی',required:false,table:'ihos_supply_mehr_mo',icon:Target},
  {key:'assignment',name:'Hotel Assignment.xlsx',title:'Hotel Assignment.xlsx',desc:'Owner نرخ، ظرفیت و City Manager',required:true,table:'ihos_supply_hotel_assignments',icon:Users2},
  {key:'traffic',name:'ترافیک بازدید سایت Analytics.xlsx',title:'ترافیک بازدید سایت Analytics.xlsx',desc:'بازدید، قیف تبدیل و هتل‌های پرترافیک کم‌تبدیل',required:true,table:'ihos_supply_analytics_traffic',icon:BarChart3},
];

const fa=(n:any)=>Number(n||0).toLocaleString('fa-IR');
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n||0)));
const percent=(a:number,b:number)=>Math.round((a/Math.max(1,b))*100);
const text=(v:any)=>String(v??'').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim();
const keyText=(v:any)=>normalizeFa(v).replace(/[\s\-_/()（）.]/g,'');
const done=(s:any)=>['انجام شد','بسته شده','تایید شده','done','closed','approved','completed'].includes(normalizeFa(s));
const num=(v:any)=>{const raw=String(v??'').replace(/[٬,\s]/g,'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());const n=Number(raw);return Number.isFinite(n)?n:0};
const dateOnly=(v:any)=>String(v||'').slice(0,10);
const daysUntil=(v:any)=>{const d=dateOnly(v);if(!d)return 9999;const t=new Date(`${d}T12:00:00`).getTime();return Number.isFinite(t)?Math.ceil((t-Date.now())/86400000):9999};
const hotelKey=(code?:any,title?:any)=>keyText(code)?`code:${keyText(code)}`:keyText(title)?`title:${keyText(title)}`:'';
function pick(row:any,names:string[]){const keys=Object.keys(row||{});const wanted=names.map(keyText);const k=keys.find(x=>wanted.some(w=>keyText(x)===w||keyText(x).includes(w)||w.includes(keyText(x))));return k?row[k]:''}
function hCode(row:any){return text(pick(row,['کد هتل','کد','hotel_code','hotel code','HotelId','HotelCode','id']))}
function hTitle(row:any){return text(pick(row,['نام هتل','هتل','hotel','hotel name','HotelName','نام اقامتگاه','نام مرکز']))||text(Object.values(row||{})[0])}
function hCity(row:any){return text(pick(row,['شهر','city','CityName']))}
function hProvider(row:any){return text(pick(row,['provider','Provider','نام پروایدر','پروایدر']))}
function hCategory(row:any){return text(pick(row,['CaringCategory','caring_category','دسته بندی','دسته‌بندی','اولویت']))}
function buildRows(matrix:any[][],slot:Slot){
  let header=slot.key==='mehr'?2:matrix.findIndex(r=>r.filter(c=>text(c)).length>=3&&r.some(c=>/هتل|hotel|رزرو|reservation|شهر|city|کد|date|تاریخ/i.test(text(c))));
  if(header<0)header=0;
  const heads=(matrix[header]||[]).map((c:any,i:number)=>text(c)||`col_${i+1}`);
  return matrix.slice(header+1).filter(r=>r.some(c=>text(c))).map(r=>Object.fromEntries(heads.map((h:string,i:number)=>[h,r[i]??''])));
}
function csv(rows:any[],name:string){
  if(typeof document==='undefined')return;
  const headers=Object.keys(rows[0]||{empty:''});
  const body='\ufeff'+[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(r[h]??'').replaceAll('"','""')}"`).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();
}

export default function SupplyChainCommandCenterV26({hotels=[],tasks=[],users=[],me,onImportAssignments}:Props){
  const [tab,setTab]=useState<Tab>('command');
  const [notice,setNotice]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const [runs,setRuns]=useState<any[]>([]),[rawRows,setRawRows]=useState<any[]>([]),[events,setEvents]=useState<any[]>([]),[dbTasks,setDbTasks]=useState<any[]>([]),[fileState,setFileState]=useState<any[]>([]);
  const [query,setQuery]=useState(''),[selected,setSelected]=useState(''),[assignDraft,setAssignDraft]=useState<Record<string,string>>({}),[ai,setAi]=useState(''),[aiBusy,setAiBusy]=useState(false);
  const inputs=useRef<Record<string,HTMLInputElement|null>>({});

  async function refresh(){
    setLoading(true);setError('');
    try{
      const res=await Promise.allSettled([
        loadRows('ihos_supply_import_runs'),loadRows('ihos_supply_import_rows'),loadRows('ihos_hotel_events'),loadRows('ihos_tasks'),loadRows('ihos_settings','key,value',5000)
      ]);
      const rows=(i:number)=>res[i].status==='fulfilled'?(res[i] as PromiseFulfilledResult<any[]>).value:[];
      setRuns(rows(0));setRawRows(rows(1));setEvents(rows(2));setDbTasks(rows(3));
      const cfg=new Map(rows(4).map((x:any)=>[x.key,x.value]));const fs=cfg.get('supply_exact_data_files');setFileState(Array.isArray(fs)?fs:[]);
      if(res.some(x=>x.status==='rejected'))setError('بخشی از داده‌های Supabase در دسترس نیست؛ fallback تا حد امکان فعال است.');
    }catch(e:any){setError(e?.message||'خطا در دریافت داده‌ها')}finally{setLoading(false)}
  }
  useEffect(()=>{void refresh()},[]);

  const slotRows=useMemo(()=>{const out:Record<string,any[]>={};SLOTS.forEach(s=>out[s.key]=[]);rawRows.forEach(r=>{if(r.file_key)(out[r.file_key] ||= []).push(r.payload||r)});return out},[rawRows]);
  const allTasks=useMemo(()=>{const map=new Map<string,any>();[...tasks,...dbTasks].forEach(t=>t?.id&&map.set(t.id,t));return [...map.values()]},[tasks,dbTasks]);

  const insights=useMemo(()=>{
    const map=new Map<string,Insight>();
    const ensure=(input:any):Insight=>{
      const code=text(input.hotel_code||input.code||hCode(input)); const title=text(input.title||input.hotel_title||hTitle(input))||'هتل بدون نام'; const key=hotelKey(code,title)||`title:${keyText(title)}`||makeId('hotel');
      const cur=map.get(key); const h:Insight={
        id:cur?.id||input.id||key,key,title:cur?.title||title,code:cur?.code||code,city:cur?.city||text(input.city||hCity(input)),province:cur?.province||text(input.province||pick(input,['استان','province'])),provider:cur?.provider||text(input.provider||hProvider(input)),category:cur?.category||text(input.caring_category||hCategory(input)),status:cur?.status||text(input.cooperation_status||input.status||pick(input,['وضعیت همکاری','status'])),
        capacityOwner:cur?.capacityOwner,rateOwner:cur?.rateOwner,cityOwner:cur?.cityOwner,confirmed:cur?.confirmed||0,unconfirmed:cur?.unconfirmed||0,reserveRows:cur?.reserveRows||0,nights:cur?.nights||0,sales:cur?.sales||0,margin:cur?.margin||0,traffic:cur?.traffic||0,conversion:cur?.conversion||0,openTasks:cur?.openTasks||0,doneTasks:cur?.doneTasks||0,risk:0,opportunity:0,health:0,reasons:[],nextActions:[],events:cur?.events||[],lastEvent:cur?.lastEvent
      }; map.set(key,h); return h;
    };
    hotels.forEach(h=>ensure(h)); slotRows.hotelData.forEach(r=>ensure(r)); slotRows.mehr.forEach(r=>{const h=ensure(r); if(!h.category)h.category=hCategory(r)});
    const match=(r:any)=>map.get(hotelKey(hCode(r),''))||map.get(hotelKey('',hTitle(r)))||ensure({hotel_code:hCode(r),title:hTitle(r),city:hCity(r)});
    slotRows.reserveList.forEach(r=>{const h=match(r);h.reserveRows+=Math.max(1,num(pick(r,['تعداد رزرو','booking_count','count'])))});
    slotRows.confirmed.forEach(r=>{const h=match(r);h.confirmed+=Math.max(1,num(pick(r,['تعداد رزرو','رزرو قطعی','confirmed','booking_count'])));h.nights+=num(pick(r,['شب اقامت','nights','room_nights']));h.sales+=num(pick(r,['فروش','مبلغ','amount','gross_sales']));h.margin+=num(pick(r,['سود','مارجین','profit','margin']))});
    slotRows.unconfirmed.forEach(r=>{const h=match(r);h.unconfirmed+=Math.max(1,num(pick(r,['تعداد رزرو','رزرو غیر قطعی','unconfirmed','booking_count'])));h.sales+=num(pick(r,['فروش','مبلغ','amount','gross_sales']))});
    slotRows.traffic.forEach(r=>{const h=match(r);h.traffic+=num(pick(r,['بازدید','sessions','views','کاربر','users','pageviews','event count']))||1;h.conversion=Math.max(h.conversion,num(pick(r,['conversion','نرخ تبدیل','purchase conversion']))) });
    slotRows.assignment.forEach(r=>{const h=match(r);const vals=Object.values(r).map(text);const task=normalizeFa(pick(r,['taskId','task id','نوع تسک','تسک'])||vals[1]);const expert=text(pick(r,['کارشناس','نام کارشناس','owner','assignee','مسئول'])||vals[2]||vals[1]);if(!expert)return;if(task.includes('1')||task.includes('ظرفیت')||task.includes('capacity'))h.capacityOwner=expert;else if(task.includes('2')||task.includes('نرخ')||task.includes('rate'))h.rateOwner=expert;else if(task.includes('4')||task.includes('city')||task.includes('شهر'))h.cityOwner=expert;else if(!h.capacityOwner)h.capacityOwner=expert});
    const byId=new Map([...map.values()].map(h=>[h.id,h])); const byTitle=new Map([...map.values()].map(h=>[keyText(h.title),h]));
    allTasks.forEach(t=>{const h=byId.get(t.hotel_id)||byTitle.get(keyText(t.hotel_title));if(!h)return;done(t.status)?h.doneTasks++:h.openTasks++});
    events.forEach(e=>{const h=byId.get(e.hotel_id)||byTitle.get(keyText(e.hotel_title));if(h)h.events.push(e)});
    const now=Date.now();
    return [...map.values()].map(h=>{
      h.lastEvent=[...h.events].sort((a,b)=>String(b.occurred_at||b.created_at||'').localeCompare(String(a.occurred_at||a.created_at||'')))[0];
      const reasons:string[]=[]; const actions:string[]=[]; let risk=0, opp=0;
      if(!h.capacityOwner){risk+=18;opp+=10;reasons.push('بدون مسئول ظرفیت');actions.push('تعیین مسئول ظرفیت')}
      if(!h.rateOwner){risk+=12;opp+=8;reasons.push('بدون مسئول نرخ');actions.push('تعیین مسئول نرخ')}
      if(h.unconfirmed>0){risk+=Math.min(30,h.unconfirmed*4);opp+=Math.min(30,h.unconfirmed*5);reasons.push(`${fa(h.unconfirmed)} رزرو غیرقطعی`);actions.push('پیگیری رزروهای غیرقطعی')}
      if(h.traffic>0&&h.confirmed===0){risk+=20;opp+=20;reasons.push('ترافیک دارد ولی رزرو قطعی ندارد');actions.push('بررسی نرخ، ظرفیت و محتوای هتل')}
      if(h.traffic>30&&h.confirmed>0&&h.traffic/Math.max(1,h.confirmed)>25){risk+=12;opp+=16;reasons.push('نرخ تبدیل پایین نسبت به ترافیک');actions.push('تحلیل تبدیل و اصلاح پیشنهاد فروش')}
      if(h.openTasks>0){risk+=Math.min(14,h.openTasks*5);reasons.push(`${fa(h.openTasks)} تسک باز`)}
      const last=h.lastEvent?new Date(h.lastEvent.occurred_at||h.lastEvent.created_at).getTime():0; if(!last||now-last>7*86400000){risk+=8;reasons.push('بدون اقدام جدید در ۷ روز اخیر');actions.push('ثبت پیگیری جدید')}
      if(normalizeFa(h.category).includes('پیشران')||normalizeFa(h.category).includes('کلیدی')){risk+=4;opp+=14}
      if(h.confirmed>0)opp+=Math.min(25,h.confirmed*2); if(h.sales>0)opp+=Math.min(20,Math.round(h.sales/100000000));
      h.risk=clamp(risk);h.opportunity=clamp(opp);h.health=clamp(100-risk+Math.min(20,h.confirmed*2));h.reasons=reasons;h.nextActions=[...new Set(actions)].slice(0,4);return h;
    }).sort((a,b)=>b.risk-a.risk||b.opportunity-a.opportunity);
  },[hotels,slotRows,allTasks,events]);

  const selectedHotel=useMemo(()=>insights.find(h=>h.key===selected)||insights[0],[insights,selected]);
  const needAction=insights.filter(h=>h.risk>=45||h.nextActions.length);
  const visible=insights.filter(h=>!query||normalizeFa(`${h.title} ${h.city} ${h.provider} ${h.category} ${h.code}`).includes(normalizeFa(query))).slice(0,200);
  const totals=useMemo(()=>({hotels:insights.length,critical:insights.filter(h=>h.risk>=70).length,need:needAction.length,confirmed:insights.reduce((s,h)=>s+h.confirmed,0),unconfirmed:insights.reduce((s,h)=>s+h.unconfirmed,0),traffic:insights.reduce((s,h)=>s+h.traffic,0),sales:insights.reduce((s,h)=>s+h.sales,0)}),[insights,needAction.length]);
  const team=useMemo(()=>users.filter(u=>u.is_active!==false).map(u=>{const name=normalizeFa(u.full_name);const owned=insights.filter(h=>normalizeFa(h.capacityOwner)===name||normalizeFa(h.rateOwner)===name||normalizeFa(h.cityOwner)===name);const assigned=allTasks.filter(t=>t.assigned_to===u.id||normalizeFa(t.assigned_name)===name);const ev=events.filter(e=>e.actor_id===u.id||normalizeFa(e.actor_name)===name);const d=assigned.filter(t=>done(t.status));const late=assigned.filter(t=>!done(t.status)&&t.deadline&&daysUntil(t.deadline)<0);return{user:u,owned:owned.length,open:assigned.length-d.length,done:d.length,late:late.length,actions:ev.length,risk:owned.filter(h=>h.risk>=60).length,score:d.length*3+ev.length+owned.filter(h=>h.health>=75).length*2-late.length*2}}).sort((a,b)=>b.score-a.score),[users,insights,allTasks,events]);

  async function importFile(slot:Slot,file?:File){
    if(!file)return;setNotice(`در حال خواندن ${slot.name}...`);
    try{
      const XLSX=await import('xlsx'); const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false}); const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=buildRows(XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}) as any[][],slot); if(!rows.length)throw new Error('ردیف معتبری پیدا نشد');
      const id=`import-${slot.key}-${Date.now()}`; const t=nowIso(); const normRows=rows.map((r,i)=>({id:`${id}-${i+1}`,import_id:id,file_key:slot.key,file_name:slot.name,uploaded_file_name:file.name,row_index:i+1,hotel_code:hCode(r),hotel_title:hTitle(r),city:hCity(r),payload:r,created_at:t,updated_at:t}));
      await saveRows('ihos_supply_import_runs',[{id,file_key:slot.key,file_name:slot.name,uploaded_file_name:file.name,rows_count:rows.length,required:slot.required,created_at:t,updated_at:t}]);
      await saveRows('ihos_supply_import_rows',normRows); await saveRows(slot.table,normRows);
      const fs=[...fileState.filter(x=>x.key!==slot.key),{key:slot.key,name:slot.name,fileName:file.name,rows:rows.length,ok:true,uploadedAt:t}]; await saveSetting('supply_exact_data_files',fs); setFileState(fs);
      if(slot.key==='assignment'&&onImportAssignments)try{await onImportAssignments(file)}catch{}
      await saveRows('ihos_hotel_events',[{id:makeId('event'),event_type:'data_import',title:`آپلود ${slot.name}`,description:`${fa(rows.length)} ردیف از ${file.name}`,actor_id:me?.id,actor_name:me?.full_name,entity_type:'import',entity_id:id,occurred_at:t,created_at:t}]);
      setNotice(`${slot.name}: ${fa(rows.length)} ردیف ذخیره شد.`); await refresh();
    }catch(e:any){setNotice(`${slot.name} ناموفق بود: ${e.message}`)}
  }
  async function createTask(h:Insight,action?:string,ownerId?:string){
    const u=users.find(x=>x.id===(ownerId||assignDraft[h.key])); const t=nowIso(); const task={id:makeId('task'),title:action||h.nextActions[0]||`پیگیری ${h.title}`,description:`Risk ${h.risk} / Opportunity ${h.opportunity}\nدلایل: ${h.reasons.join('، ')}`,hotel_id:h.id,hotel_title:h.title,city:h.city,priority:h.risk>=70?'فوری':h.risk>=45?'بالا':'متوسط',status:'در انتظار انجام',category:'Supply Follow-up',assigned_to:u?.id,assigned_name:u?.full_name,created_by:me?.id,deadline:new Date(Date.now()+86400000).toISOString().slice(0,10),source_type:'hotel_risk',source_id:h.key,created_at:t,updated_at:t};
    await saveRows('ihos_tasks',[task]); await saveRows('ihos_hotel_events',[{id:makeId('event'),hotel_id:h.id,hotel_title:h.title,event_type:'task_created',title:`تسک ساخته شد: ${task.title}`,description:task.description,severity:task.priority,actor_id:me?.id,actor_name:me?.full_name,entity_type:'task',entity_id:task.id,occurred_at:t,created_at:t}]); setNotice(`تسک برای ${h.title} ثبت شد.`); await refresh();
  }
  async function logAction(h:Insight,title:string){const t=nowIso();await saveRows('ihos_hotel_events',[{id:makeId('event'),hotel_id:h.id,hotel_title:h.title,event_type:'manual_action',title,description:'ثبت اقدام از Hotel 360',actor_id:me?.id,actor_name:me?.full_name,occurred_at:t,created_at:t}]);setNotice('اقدام ثبت شد.');await refresh()}
  async function bulkTop10(){for(const h of needAction.slice(0,10))await createTask(h,h.nextActions[0]);}
  async function persistScores(){const t=nowIso();await saveRows('ihos_supply_hotel_scores',insights.map(h=>({id:`${h.key}-${t.slice(0,10)}`,hotel_id:h.id,hotel_title:h.title,hotel_code:h.code,city:h.city,risk:h.risk,opportunity:h.opportunity,health:h.health,reasons:h.reasons,actions:h.nextActions,created_at:t,updated_at:t})));setNotice('Snapshot امتیاز هتل‌ها ذخیره شد.')}
  function exportActions(){csv(needAction.map(h=>({hotel:h.title,city:h.city,provider:h.provider,category:h.category,risk:h.risk,opportunity:h.opportunity,health:h.health,confirmed:h.confirmed,unconfirmed:h.unconfirmed,traffic:h.traffic,capacity_owner:h.capacityOwner,rate_owner:h.rateOwner,next_action:h.nextActions[0],reasons:h.reasons.join(' | ')})),'IHO_Top_Actions.csv')}
  function exportTeam(){csv(team.map(k=>({user:k.user.full_name,owned:k.owned,open_tasks:k.open,done_tasks:k.done,late:k.late,actions:k.actions,risk_hotels:k.risk,score:k.score})),'IHO_Team_KPI.csv')}
  async function runAi(){setAiBusy(true);setAi('');try{const top=needAction.slice(0,20).map(h=>({hotel:h.title,city:h.city,risk:h.risk,opp:h.opportunity,reasons:h.reasons,actions:h.nextActions,owners:{capacity:h.capacityOwner,rate:h.rateOwner},confirmed:h.confirmed,unconfirmed:h.unconfirmed,traffic:h.traffic}));const prompt=`به عنوان تحلیلگر زنجیره تامین ایران‌هتل، براساس داده زیر گزارش مدیریتی کوتاه، ۵ اقدام فوری و پیشنهاد Assign بده: ${JSON.stringify({totals,top})}`;const r=await fetch('/api/avalai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});const d=await r.json();setAi(d.text||'پاسخی دریافت نشد.')}catch{setAi(`تحلیل Rule-based: ${fa(totals.need)} هتل نیازمند پیگیری داریم. ${fa(totals.critical)} مورد بحرانی است. اولویت امروز: پیگیری رزروهای غیرقطعی، تعیین Owner ظرفیت/نرخ و ساخت تسک برای Top 10.`)}finally{setAiBusy(false)}}
  const tabs:[Tab,string,any][]=[['command','مرکز فرمان',Gauge],['data','ورود داده',Database],['hotels','هتل‌ها',ShieldAlert],['profile','Hotel 360',Hotel],['tasks','تسک‌ها',ListChecks],['team','KPI تیم',Users2],['ceo','گزارش مدیرعامل',Download],['ai','AI',Bot]];

  return <div className="supplyOSV23"><section className="supplyHeroV23"><div><span>IRANHOTEL SUPPLY CHAIN OS</span><h1>سیستم تصمیم و اجرای زنجیره تأمین</h1><p>داده را می‌گیرد، وضعیت هتل را می‌فهمد، اولویت می‌سازد، تسک می‌دهد، Timeline و KPI را آپدیت می‌کند و گزارش مدیرعامل می‌دهد.</p><div className="supplyHeroActionsV23"><button className="btn primary" onClick={()=>setTab('data')}>آپلود ۷ فایل</button><button className="btn glass" onClick={exportActions}>خروجی Top Action</button><button className="btn glass" onClick={()=>void persistScores()}>ذخیره Snapshot</button></div></div><div className="supplyHealthV23"><div style={{'--supply-score':`${percent(insights.filter(h=>h.health>=75).length,Math.max(1,insights.length))*3.6}deg`} as any}><b>{percent(insights.filter(h=>h.health>=75).length,Math.max(1,insights.length))}٪</b><span>Health</span></div><small>{fa(totals.need)} هتل نیازمند اقدام</small></div></section>
    <div className="supplyTabsV23">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon/>{label}</button>)}<button className="refresh" onClick={refresh} disabled={loading}><RefreshCcw className={loading?'spin':''}/> بروزرسانی</button></div>{(error||notice)&&<div className={error?'supplyNoticeV23 danger':'supplyNoticeV23'}>{error||notice}</div>}

    {tab==='command'&&<><Metrics totals={totals}/><section className="supplyGridV23"><article className="supplyPanelV23 span2"><PanelHead eyebrow="TODAY COMMAND" title="Top Action List امروز" action="ساخت ۱۰ تسک اول" onAction={()=>void bulkTop10()}/><HotelTable rows={needAction.slice(0,20)} users={users} draft={assignDraft} setDraft={setAssignDraft} onSelect={(h:Insight)=>{setSelected(h.key);setTab('profile')}} onTask={createTask}/></article><article className="supplyPanelV23"><PanelHead eyebrow="DATA HEALTH" title="وضعیت فایل‌ها"/><FileHealth fileState={fileState}/></article></section></>}
    {tab==='data'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="DATA INBOX" title="۷ فایل عملیاتی"/><div className="dataImportGridV23">{SLOTS.map(s=>{const st=fileState.find(x=>x.key===s.key);const Icon=s.icon;return <button key={s.key} className={`importCardV23 ${st?.ok?'ready':''}`} onClick={()=>inputs.current[s.key]?.click()}><i><Icon/></i><span><b>{s.title}</b><small>{s.desc}</small><em>{st?.ok?`آپلود شده · ${fa(st.rows)} ردیف`:(s.required?'الزامی':'اختیاری')}</em></span><Upload/></button>})}</div>{SLOTS.map(s=><input key={s.key} ref={el=>{inputs.current[s.key]=el}} hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>void importFile(s,e.target.files?.[0])}/>)}</article></section>}
    {tab==='hotels'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="HOTEL RADAR" title="وضعیت همه هتل‌ها" action="خروجی" onAction={exportActions}/><div className="supplySearchBarV23"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در هتل، شهر، Provider، دسته‌بندی..."/></div><HotelTable rows={visible} users={users} draft={assignDraft} setDraft={setAssignDraft} onSelect={(h:Insight)=>{setSelected(h.key);setTab('profile')}} onTask={createTask}/></article></section>}
    {tab==='profile'&&selectedHotel&&<section className="supplyGridV23"><article className="supplyPanelV23 span2"><PanelHead eyebrow="HOTEL 360" title={selectedHotel.title} action="ساخت تسک" onAction={()=>void createTask(selectedHotel)}/><Hotel360 h={selectedHotel}/><div className="actionListV23"><button onClick={()=>void logAction(selectedHotel,'تماس با هتل و پیگیری انجام شد')}><Workflow/><span><b>ثبت تماس/پیگیری</b><small>در Timeline هتل ذخیره می‌شود</small></span></button>{selectedHotel.nextActions.map(a=><button key={a} onClick={()=>void createTask(selectedHotel,a)}><ListChecks/><span><b>{a}</b><small>تبدیل به تسک</small></span></button>)}</div></article><article className="supplyPanelV23"><PanelHead eyebrow="TIMELINE" title="اقدامات و وقایع"/><Timeline events={selectedHotel.events}/></article></section>}
    {tab==='tasks'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="EXECUTION" title="ساخت تسک از روی ریسک هتل"/><HotelTable rows={needAction.slice(0,100)} users={users} draft={assignDraft} setDraft={setAssignDraft} onSelect={(h:Insight)=>{setSelected(h.key);setTab('profile')}} onTask={createTask}/></article></section>}
    {tab==='team'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="TEAM ACCOUNTABILITY" title="KPI کارشناسان" action="خروجی KPI" onAction={exportTeam}/><div className="peopleTableV23"><header><span>کارشناس</span><span>هتل</span><span>تسک باز</span><span>انجام‌شده</span><span>معوق</span><span>اقدام</span><span>امتیاز</span></header>{team.map(k=><div key={k.user.id}><span className="personV23"><i>{k.user.full_name?.slice(0,1)}</i><span><b>{k.user.full_name}</b><small>{k.user.department_name||k.user.team||'—'}</small></span></span><b>{fa(k.owned)}</b><b>{fa(k.open)}</b><b>{fa(k.done)}</b><em className={k.late?'danger':''}>{fa(k.late)}</em><span>{fa(k.actions)}</span><strong>{fa(k.score)}</strong></div>)}</div></article></section>}
    {tab==='ceo'&&<section className="supplyGridV23"><article className="supplyPanelV23"><PanelHead eyebrow="CEO REPORT" title="خروجی‌ها"/><div className="actionListV23"><button onClick={exportActions}><Download/><span><b>Top Action List</b><small>برای پیگیری امروز</small></span></button><button onClick={exportTeam}><Download/><span><b>KPI تیم</b><small>عملکرد کارشناسان</small></span></button><button onClick={()=>csv(insights.map(h=>({hotel:h.title,city:h.city,health:h.health,risk:h.risk,opportunity:h.opportunity,confirmed:h.confirmed,unconfirmed:h.unconfirmed,traffic:h.traffic})),'IHO_All_Hotels_Status.csv')}><Download/><span><b>وضعیت کل هتل‌ها</b><small>برای BI</small></span></button></div></article><article className="supplyPanelV23 span2"><PanelHead eyebrow="COPY SUMMARY" title="متن آماده مدیرعامل"/><pre className="aiBoxV23">{`گزارش Supply امروز\nکل هتل‌ها: ${fa(totals.hotels)}\nهتل‌های نیازمند اقدام: ${fa(totals.need)}\nهتل‌های بحرانی: ${fa(totals.critical)}\nرزرو قطعی: ${fa(totals.confirmed)}\nرزرو غیرقطعی: ${fa(totals.unconfirmed)}\nاقدام پیشنهادی: تمرکز روی ${needAction.slice(0,5).map(h=>h.title).join('، ')}`}</pre></article></section>}
    {tab==='ai'&&<section className="supplyGridV23"><article className="supplyPanelV23 span3"><PanelHead eyebrow="AI ANALYST" title="تحلیل و پیشنهاد اقدام" action={aiBusy?'در حال تحلیل...':'تحلیل کن'} onAction={()=>void runAi()}/><pre className="aiBoxV23">{ai||'پس از آپلود فایل‌ها، تحلیل مدیریتی و پیشنهاد Assign/Action را اینجا بگیر.'}</pre></article></section>}
  </div>
}
function Metrics({totals}:any){return <section className="supplyMetricsV23"><SupplyMetric icon={Hotel} title="کل هتل‌ها" value={totals.hotels} hint="دیتاست واحد" tone="blue"/><SupplyMetric icon={ShieldAlert} title="نیازمند اقدام" value={totals.need} hint={`${fa(totals.critical)} بحرانی`} tone="red"/><SupplyMetric icon={CheckCircle2} title="رزرو قطعی" value={totals.confirmed} hint="از فایل قطعی" tone="green"/><SupplyMetric icon={AlertTriangle} title="غیرقطعی" value={totals.unconfirmed} hint="فرصت پیگیری" tone="orange"/><SupplyMetric icon={BarChart3} title="ترافیک" value={totals.traffic} hint="Analytics" tone="purple"/><SupplyMetric icon={CircleDollarSign} title="فروش" value={totals.sales} hint="ریال" tone="cyan"/></section>}
function SupplyMetric({icon:Icon,title,value,hint,tone}:any){return <article className={`supplyMetricV23 ${tone}`}><i><Icon/></i><span><small>{title}</small><b>{fa(value)}</b><em>{hint}</em></span></article>}
function PanelHead({eyebrow,title,action,onAction}:any){return <header className="supplyPanelHeadV23"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action&&<button onClick={onAction}>{action}</button>}</header>}
function FileHealth({fileState}:any){return <div className="statusRowsV23">{SLOTS.map(s=>{const st=fileState.find((x:any)=>x.key===s.key);return <div key={s.key}><i style={{background:st?.ok?'#14b8a6':s.required?'#ef4444':'#f59e0b'}}/><span>{s.title}</span><b>{st?.ok?'آماده':'ناقص'}</b><small>{st?.ok?`${fa(st.rows)} ردیف`:s.required?'الزامی':'اختیاری'}</small></div>})}</div>}
function HotelTable({rows,users,draft,setDraft,onSelect,onTask}:any){return <div className="migrationTableV23"><header><span>هتل</span><span>Risk</span><span>Opp</span><span>Owner</span><span>علت</span><span>اقدام</span></header>{rows.map((h:Insight)=><div key={h.key}><span><button className="linkBtnV23" onClick={()=>onSelect(h)}><b>{h.title}</b><small>{h.city||'—'} · {h.provider||'بدون Provider'}</small></button></span><strong className={h.risk>=70?'danger':h.risk>=45?'warn':'good'}>{h.risk}</strong><strong>{h.opportunity}</strong><span><select value={draft[h.key]||''} onChange={e=>setDraft((p:any)=>({...p,[h.key]:e.target.value}))}><option value="">انتخاب مسئول</option>{users.filter((u:any)=>u.is_active!==false).map((u:any)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><small>{h.capacityOwner||h.rateOwner||'بدون Owner'}</small></span><span>{h.reasons.slice(0,2).join('، ')||'—'}</span><button onClick={()=>onTask(h,h.nextActions[0],draft[h.key])}>ساخت تسک</button></div>)}</div>}
function Hotel360({h}:any){return <div className="profileGridV23"><SupplyMetric icon={ShieldAlert} title="Risk" value={h.risk} hint={h.reasons[0]||'—'} tone={h.risk>=70?'red':'orange'}/><SupplyMetric icon={Target} title="Opportunity" value={h.opportunity} hint={h.nextActions[0]||'—'} tone="purple"/><SupplyMetric icon={CheckCircle2} title="قطعی" value={h.confirmed} hint={`${fa(h.nights)} شب`} tone="green"/><SupplyMetric icon={AlertTriangle} title="غیرقطعی" value={h.unconfirmed} hint="پیگیری" tone="orange"/><div className="profileFactsV23"><b>پرونده هتل</b><span>شهر: {h.city||'—'}</span><span>Provider: {h.provider||'—'}</span><span>Caring: {h.category||'—'}</span><span>Owner ظرفیت: {h.capacityOwner||'—'}</span><span>Owner نرخ: {h.rateOwner||'—'}</span><span>تسک باز: {fa(h.openTasks)}</span><span>آخرین اقدام: {h.lastEvent?.title||'ثبت نشده'}</span></div></div>}
function Timeline({events}:any){const list=[...(events||[])].sort((a,b)=>String(b.occurred_at||b.created_at||'').localeCompare(String(a.occurred_at||a.created_at||''))).slice(0,30);return <div className="timelineV23">{list.length?list.map((e:any)=><article key={e.id}><i/><div><b>{e.title}</b><small>{e.actor_name||'سیستم'} · {String(e.occurred_at||e.created_at||'').slice(0,16).replace('T',' ')}</small><p>{e.description}</p></div></article>):<div className="supplyEmptyV23"><Sparkles/><span>هنوز اقدامی ثبت نشده است.</span></div>}</div>}

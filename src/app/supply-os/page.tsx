'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createClient,Session} from '@supabase/supabase-js';
import {Activity,AlertCircle,ArrowLeft,ArrowRight,BarChart3,Building2,Check,CheckCircle2,ChevronLeft,ClipboardCheck,Clock3,CloudUpload,Download,FileSpreadsheet,Filter,Hotel,Info,LogOut,RefreshCw,Search,ShieldCheck,Sparkles,Target,TrendingDown,TrendingUp,UploadCloud,UserRound,Users,WifiOff,X} from 'lucide-react';
import {Mode,Column,Hotel as H,Rollup,Score,MODES,FIELDS,FIELD_SETS,autoMap,booleanish,clean,csv,keyOf,norm,num,score,toIsoDate} from './engine';
import './supply.css';

type Member={user_id:string;full_name:string;role:'manager'|'expert';active:boolean};
type Task={id:string;hotel_key:string;title:string;type:string;assignee:string|null;created_by:string|null;priority:'urgent'|'high'|'normal';status:'open'|'waiting'|'blocked'|'done';due_date:string|null;last_result:string|null;outcome:string|null;created_at:string;updated_at:string;completed_at:string|null};
type Event={id:string;hotel_key:string;task_id:string|null;kind:string;details:string;actor:string|null;created_at:string};
type Import={id:string;source:string;file_name:string;metric_date:string|null;rows_total:number;rows_saved:number;rows_rejected:number;created_at:string};
type Item=H & {stats:Rollup|undefined;score:Score;open:number;tasks:Task[]};
type View='today'|'hotels'|'tasks'|'team'|'data'|'report';
const u=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
const db=u&&k?createClient(u,k,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const today=()=>new Date().toLocaleDateString('en-CA');
const fa=(n:number|string|undefined|null)=>Number(n||0).toLocaleString('fa-IR');
const statusName:Record<string,string>={open:'در انتظار اقدام',waiting:'در انتظار هتل',blocked:'نیازمند تصمیم مدیر',done:'انجام شد'};
const priorityName:Record<string,string>={urgent:'فوری',high:'بالا',normal:'معمولی'};
const outcomeList=['ظرفیت آنلاین فعال شد','نرخ اصلاح شد','رزرو پیگیری و قطعی شد','قرارداد/همکاری بهبود یافت','پیگیری انجام شد','هتل پاسخ نداد','مانع رفع نشد','سایر'];
async function getAll(table:string,filter?:(q:any)=>any,cap=12000){
 if(!db)return [];
 const acc:any[]=[];
 for(let offset=0;offset<cap;offset+=1000){
  let q=db.from(table).select('*');
  if(filter)q=filter(q);
  const {data,error}=await q.range(offset,Math.min(cap-1,offset+999));
  if(error)throw error;
  acc.push(...(data||[]));
  if((data||[]).length<1000)break;
 }
 return acc;
}
function dateDelta(day:string|null|undefined){if(!day)return 9999;return Math.floor((new Date(day+'T23:59:59').getTime()-Date.now())/86400000)}
function IconStat({title,value,hint,icon:Icon,color}:any){return <div className="sco-stat"><span className={'sco-stat-icon '+(color||'')}><Icon size={19}/></span><div><small>{title}</small><strong>{value}</strong><em>{hint}</em></div></div>}
function Hint({children}:any){return <div className="sco-hint"><Info size={18}/>{children}</div>}
export default function SupplyOS(){
 const [session,setSession]=useState<Session|null>(null),[userReady,setUserReady]=useState(false),[member,setMember]=useState<Member|null>(null),[loginEmail,setLoginEmail]=useState(''),[loginSent,setLoginSent]=useState(false);
 const [setupName,setSetupName]=useState(''),[activationCode,setActivationCode]=useState('');
 const [view,setView]=useState<View>('today'),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [hotels,setHotels]=useState<H[]>([]),[metrics,setMetrics]=useState<Rollup[]>([]),[tasks,setTasks]=useState<Task[]>([]),[members,setMembers]=useState<Member[]>([]),[imports,setImports]=useState<Import[]>([]);
 const [selected,setSelected]=useState<string|null>(null),[events,setEvents]=useState<Event[]>([]),[filter,setFilter]=useState(''),[city,setCity]=useState('all'),[focus,setFocus]=useState<'all'|'risk'|'opportunity'|'mine'>('risk');
 const [taskTitle,setTaskTitle]=useState(''),[taskOwner,setTaskOwner]=useState(''),[taskDue,setTaskDue]=useState(today()),[taskOutcome,setTaskOutcome]=useState(outcomeList[0]),[resultNote,setResultNote]=useState(''),[taskStatus,setTaskStatus]=useState<Task['status']>('open'),[editingTask,setEditingTask]=useState<string|null>(null);
 const [editHotel,setEditHotel]=useState(false),[onlineDraft,setOnlineDraft]=useState('unknown'),[rateDraft,setRateDraft]=useState('unknown'),[capacityDraft,setCapacityDraft]=useState(''),[capacityOwnerDraft,setCapacityOwnerDraft]=useState(''),[rateOwnerDraft,setRateOwnerDraft]=useState('');
 const [mode,setMode]=useState<Mode>('hotels'),[importDate,setImportDate]=useState(today()),[fileLabel,setFileLabel]=useState(''),[headers,setHeaders]=useState<string[]>([]),[mapping,setMapping]=useState<Partial<Record<Column,string>>>({}),[preview,setPreview]=useState<any[]>([]),[progress,setProgress]=useState(''),[importSummary,setImportSummary]=useState<{read:number;saved:number;rejected:number;samples:string[]}|null>(null);
 const raw=useRef<Record<string,any>[]>([]);
 const [newMemberUid,setNewMemberUid]=useState(''),[newMemberName,setNewMemberName]=useState(''),[newMemberRole,setNewMemberRole]=useState<Member['role']>('expert');
 const isManager=member?.role==='manager';

 const refresh=useCallback(async()=>{
  if(!db||!member)return;
  setLoading(true);setError('');
  try{
   const results=await Promise.all([getAll('sco_hotels'),getAll('sco_hotel_rollup',undefined,15000),getAll('sco_tasks',q=>q.order('created_at',{ascending:false}),8000),getAll('sco_members'),getAll('sco_imports',q=>q.order('created_at',{ascending:false}),300)]);
   setHotels(results[0] as H[]);setMetrics(results[1] as Rollup[]);setTasks(results[2] as Task[]);setMembers(results[3] as Member[]);setImports(results[4] as Import[]);
  }catch(e:any){setError('خطا در دریافت داده: '+e.message)}finally{setLoading(false)}
 },[member]);
 useEffect(()=>{
  if(!db){setUserReady(true);return}
  let active=true;
  db.auth.getSession().then(({data})=>{if(active){setSession(data.session);setUserReady(true)}}).catch(()=>setUserReady(true));
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,next)=>{if(active)setSession(next)});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!db||!session){setMember(null);return}
  let cancel=false;
  db.from('sco_members').select('*').eq('user_id',session.user.id).maybeSingle().then(({data,error})=>{
   if(!cancel){if(error)setError(error.message);setMember(data?.active?data as Member:null)}
  });
  return()=>{cancel=true};
 },[session]);
 useEffect(()=>{if(member)void refresh()},[member,refresh]);
 useEffect(()=>{
  if(!selected||!db||!member){setEvents([]);return}
  db.from('sco_events').select('*').eq('hotel_key',selected).order('created_at',{ascending:false}).limit(40)
   .then(({data})=>setEvents((data||[]) as Event[]));
 },[selected,member,tasks]);

 const scores=useMemo(()=>{
  const m=new Map(metrics.map(x=>[x.hotel_key,x]));
  const taskMap=new Map<string,Task[]>();
  tasks.forEach(t=>{const arr=taskMap.get(t.hotel_key)||[];arr.push(t);taskMap.set(t.hotel_key,arr)});
  return hotels.map(h=>{
   const mine=taskMap.get(h.hotel_key)||[],open=mine.filter(t=>t.status!=='done').length;
   return {...h,stats:m.get(h.hotel_key),score:score(h,m.get(h.hotel_key),h.last_action_at,open),open,tasks:mine} as Item;
  }).sort((a,b)=>b.score.risk-a.score.risk||b.score.opportunity-a.score.opportunity);
 },[hotels,metrics,tasks]);
 const selection=scores.find(x=>x.hotel_key===selected);
 const staff=members.filter(x=>x.active);
 const activeTasks=tasks.filter(t=>t.status!=='done');
 const overdue=activeTasks.filter(t=>dateDelta(t.due_date)<0);
 const unassigned=activeTasks.filter(t=>!t.assignee);
 const cities=[...new Set(hotels.map(h=>h.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
 const visible=scores.filter(h=>{
  if(city!=='all'&&h.city!==city)return false;
  if(filter&&!norm([h.name,h.city,h.hotel_code,h.provider,h.category].join(' ')).includes(norm(filter)))return false;
  if(focus==='risk'&&!h.score.needsAction)return false;
  if(focus==='opportunity'&&h.score.opportunity<35)return false;
  if(focus==='mine'&&!h.tasks.some(t=>t.assignee===session?.user.id&&t.status!=='done'))return false;
  return true;
 });
 const teamKpis=staff.map(person=>{
  const tt=tasks.filter(t=>t.assignee===person.user_id);
  const done=tt.filter(t=>t.status==='done');
  return {...person,open:tt.filter(t=>t.status!=='done').length,done:done.length,overdue:tt.filter(t=>t.status!=='done'&&dateDelta(t.due_date)<0).length,onTime:done.filter(t=>t.completed_at&&t.due_date&&new Date(t.completed_at).getTime()<=new Date(t.due_date+'T23:59:59').getTime()).length};
 }).sort((a,b)=>b.open-a.open);
 const compactReport=()=>{const totalConf=scores.reduce((s,h)=>s+Number(h.stats?.confirmed_30||0),0);const lost=scores.reduce((s,h)=>s+Number(h.stats?.lost_30||0),0);
 return 'گزارش زنجیره تأمین ایران‌هتل — '+new Date().toLocaleDateString('fa-IR')+'\n'+
 'کل هتل‌ها: '+fa(scores.length)+' | هتل‌های نیازمند اقدام: '+fa(scores.filter(h=>h.score.needsAction).length)+'\n'+
 'پیگیری‌های باز: '+fa(activeTasks.length)+' | معوق: '+fa(overdue.length)+' | بدون مسئول: '+fa(unassigned.length)+'\n'+
 'رزرو قطعی ۳۰ روز: '+fa(totalConf)+' | رزرو از دست‌رفته: '+fa(lost)+'\n'+
 'پیشنهاد اقدام: '+scores.slice(0,5).map(h=>h.name+' ('+h.score.suggestion+')').join('؛ ');}
 function selectHotel(h:Item){setSelected(h.hotel_key);setTaskTitle(h.score.suggestion);setTaskOwner(session?.user.id||'');setTaskDue(today());setEditingTask(null);setResultNote('');setEditHotel(false);setOnlineDraft(h.is_online===true?'yes':h.is_online===false?'no':'unknown');setRateDraft(h.has_rate===true?'yes':h.has_rate===false?'no':'unknown');setCapacityDraft(h.capacity==null?'':String(h.capacity));setCapacityOwnerDraft(h.capacity_owner||'');setRateOwnerDraft(h.rate_owner||'');}
 function selectTask(t:Task){setSelected(t.hotel_key);setEditingTask(t.id);setTaskStatus(t.status);setTaskOwner(t.assignee||'');setTaskTitle(t.title);setTaskOutcome(t.outcome||outcomeList[0]);setResultNote('');const h=scores.find(x=>x.hotel_key===t.hotel_key);if(h){setOnlineDraft(h.is_online===true?'yes':h.is_online===false?'no':'unknown');setRateDraft(h.has_rate===true?'yes':h.has_rate===false?'no':'unknown');setCapacityDraft(h.capacity==null?'':String(h.capacity));setCapacityOwnerDraft(h.capacity_owner||'');setRateOwnerDraft(h.rate_owner||'')}}
 async function createTask(){
  if(!db||!isManager||!selection)return;
  if(!taskOwner||!taskTitle.trim()){setError('عنوان اقدام و مسئول پیگیری را مشخص کن.');return}
  const duplicate=tasks.find(t=>t.hotel_key===selection.hotel_key&&t.status!=='done'&&norm(t.title)===norm(taskTitle));
  if(duplicate){selectTask(duplicate);setNotice('این اقدام تسک باز دارد؛ برای جلوگیری از تکرار، همان تسک انتخاب شد.');return}
  setBusy(true);setError('');
  try{
   const {data,error:e}=await db.from('sco_tasks').insert({hotel_key:selection.hotel_key,title:taskTitle.trim(),type:'followup',assignee:taskOwner,created_by:session!.user.id,priority:selection.score.risk>=70?'urgent':selection.score.risk>=40?'high':'normal',status:'open',due_date:taskDue||null}).select().single();
   if(e)throw e;
   await db.from('sco_events').insert({hotel_key:selection.hotel_key,task_id:data.id,kind:'assigned',details:'واگذاری «'+taskTitle.trim()+'» به '+(staff.find(u=>u.user_id===taskOwner)?.full_name||'کارشناس'),actor:session!.user.id});
   setNotice('تسک ساخته شد؛ نتیجه آن را در همین صفحه ثبت کنید.');selectTask(data as Task);await refresh();
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 }
 async function saveResult(){
  if(!db||!editingTask||!session)return;
  const task=tasks.find(t=>t.id===editingTask);if(!task)return;
  if(resultNote.trim().length<8){setError('نتیجه واقعی اقدام را حداقل در ۸ کاراکتر ثبت کن.');return}
  setBusy(true);setError('');
  try{
   const {error:e}=await db.rpc('sco_record_task_result',{p_task:task.id,p_status:taskStatus,p_outcome:taskOutcome,p_note:resultNote.trim()});
   if(e)throw e;
   setResultNote('');setNotice('نتیجه و تاریخچه اقدام با هم ثبت شدند.');await refresh();
  }catch(e:any){setError('ثبت نتیجه: '+e.message)}finally{setBusy(false)}
 }
 async function saveHotelStatus(){
  if(!db||!selection||!isManager||!session)return;
  setBusy(true);setError('');
  try{
   const patch={is_online:onlineDraft==='unknown'?null:onlineDraft==='yes',has_rate:rateDraft==='unknown'?null:rateDraft==='yes',capacity:capacityDraft.trim()===''?null:Math.max(0,Math.floor(num(capacityDraft))),capacity_owner:capacityOwnerDraft.trim(),rate_owner:rateOwnerDraft.trim(),updated_at:new Date().toISOString()};
   const {error:e}=await db.from('sco_hotels').update(patch).eq('hotel_key',selection.hotel_key);
   if(e)throw e;
   const {error:ev}=await db.from('sco_events').insert({hotel_key:selection.hotel_key,kind:'manual_update',actor:session.user.id,details:'وضعیت هتل و مسئولیت‌ها به‌روزرسانی شد. آنلاین: '+onlineDraft+' | نرخ: '+rateDraft+' | ظرفیت: '+(capacityDraft||'نامشخص')});
   if(ev)throw ev;
   setEditHotel(false);setNotice('وضعیت هتل به‌روزرسانی شد و در تاریخچه ثبت شد.');await refresh();
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 }

 async function addMember(){
  if(!db||!isManager||!newMemberName.trim()||!newMemberUid.trim())return;
  setBusy(true);setError('');
  try{
   const {error:e}=await db.from('sco_members').upsert({user_id:newMemberUid.trim(),full_name:newMemberName.trim(),role:newMemberRole,active:true},{onConflict:'user_id'});
   if(e)throw e;
   setNewMemberUid('');setNewMemberName('');setNotice('کارشناس/مدیر به تیم اضافه شد.');await refresh();
  }catch(e:any){setError('افزودن کاربر: '+e.message)}finally{setBusy(false)}
 }
 async function readFile(file?:File){
  if(!file)return;
  setProgress('در حال خواندن و شناسایی ستون‌ها...');setError('');setImportSummary(null);
  try{
   const XLSX=await import('xlsx');
   const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:false,cellDates:false});
   const ws=wb.Sheets[wb.SheetNames[0]];
   if(!ws)throw Error('هیچ شیتی پیدا نشد');
   const matrix=XLSX.utils.sheet_to_json<any[]>(ws,{header:1,raw:false,defval:''});
   const pickHeader=(line:any[])=>{const cells=line.map(clean).filter(Boolean);return cells.length>=2&&cells.some(c=>FIELDS.some(f=>[f.key,...f.aliases].some(a=>norm(c)===norm(a)||norm(c).includes(norm(a)))))};
   const headerRow=matrix.findIndex((r,i)=>i<15&&pickHeader(r));
   const pos=headerRow<0?0:headerRow;
   const cols=(matrix[pos]||[]).map((c:any,i:number)=>clean(c)||'ستون '+(i+1));
   const records=matrix.slice(pos+1).filter(r=>r.some(c=>clean(c))).map(r=>Object.fromEntries(cols.map((name:string,i:number)=>[name,r[i]??''])));
   if(!records.length)throw Error('ردیف داده‌ای پیدا نشد');
   raw.current=records;setHeaders(cols);setMapping(autoMap(cols,mode));setPreview(records.slice(0,4));setFileLabel(file.name);
   setProgress('آماده بررسی: '+fa(records.length)+' ردیف. ستون‌ها را تأیید کن و ذخیره را بزن.');
  }catch(e:any){setError('خواندن فایل ناموفق بود: '+e.message);setProgress('')}
 }
 function matchedHotel(row:any,lookups:{code:Map<string,H>;exact:Map<string,H>;names:Map<string,H[]>}):H|null{
  const code=norm(mapping.code?row[mapping.code]:''),name=norm(mapping.name?row[mapping.name]:''),city=norm(mapping.city?row[mapping.city]:'');
  if(code&&lookups.code.has(code))return lookups.code.get(code)!;
  if(name&&lookups.exact.has(name+'@'+city))return lookups.exact.get(name+'@'+city)!;
  const list=lookups.names.get(name)||[];return list.length===1?list[0]:null;
 }
 async function startImport(){
  if(!db||!isManager||!raw.current.length)return;
  if(!mapping.code&&!mapping.name){setError('ستون کد هتل یا نام هتل باید انتخاب شود.');return}
  const allowed=FIELD_SETS[mode].filter(x=>x!=='code'&&x!=='name'&&x!=='city'&&x!=='date');
  if(mode!=='hotels'&&!allowed.some(x=>!!mapping[x])){setError('حداقل یک ستون اطلاعاتی مثل فروش، بازدید، مالک، نرخ یا ظرفیت را مشخص کن.');return}
  if(mode==='hotels'&&!mapping.name){setError('برای فهرست پایه، ستون نام هتل ضروری است.');return}
  setBusy(true);setError('');setImportSummary(null);setProgress('اعتبارسنجی و تطبیق هتل‌ها...');
  const records=raw.current;const rejected:string[]=[];const accepted=new Map<string,Record<string,any>>();
  try{
   const lookups={code:new Map(hotels.filter(h=>h.hotel_code).map(h=>[norm(h.hotel_code),h])),exact:new Map(hotels.map(h=>[norm(h.name)+'@'+norm(h.city),h])),names:new Map<string,H[]>()};
   hotels.forEach(h=>lookups.names.set(norm(h.name),[...(lookups.names.get(norm(h.name))||[]),h]));
   const get=(r:any,f:Column)=>mapping[f]?r[mapping[f]!]:'';
   const fields=FIELD_SETS[mode];
   for(const r of records){
    const name=clean(get(r,'name')),city=clean(get(r,'city')),code=clean(get(r,'code'));
    let key='';
    if(mode==='hotels'){key=keyOf(code,name,city);if(!name||!key){if(rejected.length<10)rejected.push(name||'نام هتل خالی');continue}}
    else {const found=matchedHotel(r,lookups);if(!found){if(rejected.length<10)rejected.push(name||code||'هتل نامشخص');continue}key=found.hotel_key}
    const rowDate=mode==='hotels'||mode==='owners'||mode==='availability'?null:(mapping.date?toIsoDate(get(r,'date')):importDate);
    if(mode!=='hotels'&&mode!=='owners'&&mode!=='availability'&&!rowDate){if(rejected.length<10)rejected.push(name||code||'تاریخ نامعتبر');continue}
    const groupKey=rowDate?key+'|'+rowDate:key;
    const p=accepted.get(groupKey)||{hotel_key:key};
    if(mode==='hotels'){
     p.hotel_code=code||null;p.name=name;p.city=city;
     for(const f of ['provider','category','cooperation_status','capacity_owner','rate_owner'] as Column[])if(mapping[f])p[f]=clean(get(r,f));
     p.updated_at=new Date().toISOString();
    }else if(mode==='availability'||mode==='owners'){
     if(mode==='availability'){
      if(mapping.is_online)p.is_online=booleanish(get(r,'is_online'));
      if(mapping.has_rate)p.has_rate=booleanish(get(r,'has_rate'));
      if(mapping.capacity)p.capacity=Math.max(0,Math.trunc(num(get(r,'capacity'))));
     }else{
      if(mapping.capacity_owner)p.capacity_owner=clean(get(r,'capacity_owner'));
      if(mapping.rate_owner)p.rate_owner=clean(get(r,'rate_owner'));
      if(mapping.owner){
       const name=clean(get(r,'owner')),role=norm(get(r,'owner_type'));
       if(role==='1'||role.includes('capacity')||role.includes('ظرفیت'))p.capacity_owner=name;
       else if(role==='2'||role.includes('rate')||role.includes('نرخ'))p.rate_owner=name;
       else if(!mapping.owner_type)p.capacity_owner=name;
      }
     }
     p.updated_at=new Date().toISOString();
    }else{
     const relevant=(mode==='performance'?['confirmed','unconfirmed','lost','visits','nights','revenue','profit']:mode==='confirmed'?['confirmed','nights','revenue','profit']:mode==='unconfirmed'?['unconfirmed','lost']:['visits']) as Column[];
     for(const f of relevant)if(mapping[f])p[f]=Number(p[f]||0)+num(get(r,f));
     if(mode==='confirmed'&&!mapping.confirmed)p.confirmed=Number(p.confirmed||0)+1;
     if(mode==='unconfirmed'&&!mapping.unconfirmed)p.unconfirmed=Number(p.unconfirmed||0)+1;
     p.metric_date=rowDate;p.updated_at=new Date().toISOString();
    }
    accepted.set(groupKey,p);
   }
   // Multiple reservations from the same hotel are intentionally aggregated before writing.
   const actualRejected=(()=>{let n=0;for(const r of records){if(mode==='hotels'){if(!clean(get(r,'name')))n++}else if(!matchedHotel(r,lookups)||(mode!=='owners'&&mode!=='availability'&&mapping.date&&!toIsoDate(get(r,'date'))))n++}return n})();
   if(mode!=='hotels'&&actualRejected/records.length>0.2)throw Error('بیش از ۲۰٪ ردیف‌ها به هتل‌ها تطبیق داده نشدند. ابتدا فهرست پایه و ستون‌های کد/نام را بررسی کن. نمونه: '+rejected.slice(0,3).join('، '));
   if(!accepted.size)throw Error('هیچ ردیف معتبری برای ذخیره وجود ندارد.');
   const values=[...accepted.values()];
   const hotelUpdates=mode==='hotels'||mode==='availability'||mode==='owners';
   if(hotelUpdates){
    const hotelMap=new Map(hotels.map(h=>[h.hotel_key,h]));
    for(let i=0;i<values.length;i+=200){
     const batch=values.slice(i,i+200);
     setProgress('ذخیره هتل‌ها: '+fa(Math.min(values.length,i+batch.length))+' از '+fa(values.length));
     const data=mode==='hotels'?batch:batch.map(row=>({...hotelMap.get(row.hotel_key),...row}));
     const {error:e}=await db.from('sco_hotels').upsert(data,{onConflict:'hotel_key'});if(e)throw e;
    }
   }else{
    for(let i=0;i<values.length;i+=900){
     const slice=values.slice(i,i+900);
     const batches=[slice.slice(0,300),slice.slice(300,600),slice.slice(600,900)].filter(x=>x.length);
     setProgress('ذخیره شاخص‌های هتل/تاریخ: '+fa(Math.min(values.length,i+slice.length))+' از '+fa(values.length));
     const results=await Promise.all(batches.map(p=>db.rpc('sco_upsert_metric_batch',{p_rows:p})));
     const failed=results.find(r=>r.error);if(failed?.error)throw failed.error;
    }
   }
   const summary={read:records.length,saved:values.length,rejected:actualRejected,samples:rejected};
   const {error:logErr}=await db.from('sco_imports').insert({source:mode,file_name:fileLabel,metric_date:mode==='hotels'||mode==='owners'||mode==='availability'||mapping.date?null:importDate,rows_total:records.length,rows_saved:values.length,rows_rejected:actualRejected,notes:{sample:rejected.slice(0,8),aggregated:true},created_by:session!.user.id});
   setImportSummary(summary);
   setProgress('ذخیره کامل شد: '+fa(values.length)+' هتل/رکورد تجمیعی؛ '+fa(actualRejected)+' ردیف نامنطبق.');
   if(logErr)setNotice('داده‌ها ذخیره شدند ولی سابقه آپلود ثبت نشد: '+logErr.message);
   raw.current=[];setHeaders([]);setPreview([]);await refresh();
  }catch(e:any){setError('آپلود متوقف شد: '+e.message);setProgress('در صورت ثبت بخشی از داده، آپلود مجدد همین فایل/تاریخ بدون دوبرابرشدن شاخص‌ها امکان‌پذیر است.')}finally{setBusy(false)}
 }

 if(!db)return <main className="sco-auth"><h1>Supply OS</h1><p>متغیرهای اتصال Supabase روی این نسخه تنظیم نشده‌اند.</p></main>;
 if(!userReady)return <main className="sco-auth"><RefreshCw className="sco-spin"/> در حال بررسی ورود...</main>;
 if(!session)return <main className="sco-auth"><div className="sco-authbox"><span className="sco-mark"><Hotel/></span><h1>IranHotel Supply OS</h1><p>زنجیره تأمین را از کار روزانه تا نتیجه مدیریت کن.</p><label>ایمیل سازمانی</label><input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="you@company.com" dir="ltr"/><button onClick={async()=>{setError('');const {error:e}=await db.auth.signInWithOtp({email:loginEmail,emailRedirectTo:location.origin+'/'});if(e)setError(e.message);else setLoginSent(true)}} disabled={!loginEmail.includes('@')}>دریافت لینک ورود</button>{loginSent&&<Hint>لینک ورود به ایمیل ارسال شده؛ پوشه Spam را هم بررسی کن.</Hint>}{error&&<p className="sco-error">{error}</p>}<small>ورود و اطلاعات کارکنان با Supabase Auth محافظت می‌شود.</small></div></main>;
 if(!member)return <main className="sco-auth"><div className="sco-authbox">
  <span className="sco-mark"><ShieldCheck size={24}/></span>
  <h2>راه‌اندازی فضای تأمین</h2>
  <p>ورود ایمیلی انجام شد. برای فعال‌سازی مدیر اولیه، کد یک‌بارمصرف راه‌اندازی را وارد کن. اعضای بعدی از داخل بخش تیم اضافه می‌شوند.</p>
  <small>{session.user.email}</small>
  <label>نام نمایشی مدیر</label><input value={setupName} onChange={e=>setSetupName(e.target.value)} placeholder="نام و نام خانوادگی"/>
  <label>کد یک‌بارمصرف فعال‌سازی</label><input dir="ltr" autoComplete="off" value={activationCode} onChange={e=>setActivationCode(e.target.value)} placeholder="کد فعال‌سازی"/>
  <button disabled={busy||setupName.trim().length<2||!activationCode.trim()} onClick={async()=>{
   setBusy(true);setError('');
   try{const {error:e}=await db.rpc('sco_claim_first_manager',{p_code:activationCode.trim(),p_name:setupName.trim()});if(e)throw e;setMember({user_id:session.user.id,full_name:setupName.trim(),role:'manager',active:true});setActivationCode('');setNotice('حساب مدیر فعال شد. برای شروع فقط فهرست هتل‌ها را وارد کن.')}catch(e:any){setError(e.message)}finally{setBusy(false)}
  }}>{busy?'در حال فعال‌سازی...':'فعال‌سازی مدیر و شروع کار'}</button>
  {error&&<p className="sco-error">{error}</p>}
  <button className="sco-ghost" onClick={()=>db.auth.signOut()}>خروج از حساب</button>
 </div></main>;
 return <main className="sco-root">
  <div className="sco-main"><header className="sco-top"><div><small>IRANHOTEL / SUPPLY</small><h1>{({today:'مرکز فرمان امروز',hotels:'رادار هتل‌ها',tasks:'کارهای در جریان',team:'تیم و پاسخگویی',data:'ورود و سلامت داده',report:'گزارش تصمیم‌ساز'} as Record<View,string>)[view]}</h1></div><div className="sco-topactions"><span className="sco-date">{new Date().toLocaleDateString('fa-IR',{weekday:'long',day:'numeric',month:'long'})}</span><button onClick={()=>void refresh()} disabled={loading} aria-label="بروزرسانی"><RefreshCw size={18} className={loading?'sco-spin':''}/></button></div></header>
  <nav className="sco-focused-nav" aria-label="مسیر اصلی کار">
    <div className="sco-focused-nav-main">
      {([['today','امروز',Target],['tasks','پیگیری‌ها',ClipboardCheck],['hotels','هتل‌ها',Building2]] as const).map(([id,label,Icon])=><button type="button" key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={18}/>{label}{id==='tasks'&&activeTasks.length>0&&<small>{fa(activeTasks.length)}</small>}</button>)}
    </div>
    <div className="sco-focused-nav-tools">
      <select aria-label="ابزارهای مدیریتی" value={['team','data','report'].includes(view)?view:''} onChange={e=>e.target.value&&setView(e.target.value as View)}>
        <option value="" disabled>گزارش و تنظیمات</option>
        <option value="team">عملکرد تیم</option>
        <option value="report">گزارش مدیر</option>
        <option value="data">آپلود و به‌روزرسانی داده</option>
      </select>
      <span className="sco-current-user">{member.full_name||session.user.email}</span>
      <button type="button" title="خروج از حساب" onClick={()=>db.auth.signOut()}><LogOut size={17}/></button>
    </div>
  </nav>
  {(error||notice)&&<div className={error?'sco-alert error':'sco-alert success'}><span>{error||notice}</span><button onClick={()=>{setError('');setNotice('')}}><X size={16}/></button></div>}
  {view==='today'&&<><section className="sco-hero"><div><span className="sco-eyebrow"><Sparkles size={15}/> زنجیره تأمین نتیجه‌محور</span><h2>امروز کدام هتل را رشد می‌دهیم؟</h2><p>هتل را انتخاب کن، یک کار مشخص به مسئول بده، نتیجه را ثبت کن؛ فردا اثرش را با داده فروش بسنج.</p><button onClick={()=>{setView('hotels');setFocus('risk')}}>شروع از هتل‌های اولویت‌دار <ArrowLeft size={17}/></button></div><div className="sco-hero-graph"><b>{fa(scores.filter(h=>h.score.needsAction).length)}</b><small>هتل نیازمند اقدام</small></div></section>
   <div className="sco-stats"><IconStat title="هتل‌های ثبت‌شده" value={fa(hotels.length)} hint="فهرست پایه" icon={Hotel} color="blue"/><IconStat title="پیگیری باز" value={fa(activeTasks.length)} hint={fa(unassigned.length)+' بدون مسئول'} icon={ClipboardCheck} color="orange"/><IconStat title="کار معوق" value={fa(overdue.length)} hint="نیازمند مداخله" icon={Clock3} color="red"/><IconStat title="کار انجام‌شده" value={fa(tasks.filter(t=>t.status==='done').length)} hint="با نتیجه ثبت‌شده" icon={CheckCircle2} color="green"/></div>
   {!hotels.length?<div className="sco-empty"><CloudUpload size={35}/><h3>برای شروع فقط فهرست هتل‌ها را وارد کن</h3><p>بدون نیاز به هفت فایل یا تنظیمات پیچیده.</p><button onClick={()=>{setMode('hotels');setView('data')}}>آپلود فهرست هتل‌ها</button></div>:<div className="sco-two"><section className="sco-panel"><div className="sco-panelhead"><div><span>TOP OPPORTUNITIES</span><h3>اولویت‌های امروز</h3></div><button onClick={()=>{setView('hotels');setFocus('risk')}}>همه موارد <ChevronLeft size={16}/></button></div><div className="sco-hotelrows">{scores.filter(h=>h.score.needsAction).slice(0,12).map(h=><button key={h.hotel_key} onClick={()=>selectHotel(h)} className={selected===h.hotel_key?'active':''}><span className="sco-risk">{h.score.risk}</span><span className="sco-grow"><b>{h.name}</b><small>{h.city||'بدون شهر'} · {h.score.reasons[0]||'فرصت فروش'}</small></span><span className="sco-gain">فرصت {fa(h.score.opportunity)}</span><ChevronLeft size={17}/></button>)}{scores.every(h=>!h.score.needsAction)&&<Hint>هنوز داده کافی برای ساخت اولویت قطعی نداریم؛ وضعیت آنلاین و عملکرد را وارد کن.</Hint>}</div></section><section className="sco-panel"><div className="sco-panelhead"><div><span>EXECUTION</span><h3>پیگیری‌های ضروری</h3></div><button onClick={()=>setView('tasks')}>لیست کامل <ChevronLeft size={16}/></button></div><div className="sco-worklist">{activeTasks.slice().sort((a,b)=>dateDelta(a.due_date)-dateDelta(b.due_date)).slice(0,10).map(t=><button key={t.id} onClick={()=>selectTask(t)}><span className={dateDelta(t.due_date)<0?'sco-dot red':'sco-dot amber'}/><span><b>{t.title}</b><small>{hotels.find(h=>h.hotel_key===t.hotel_key)?.name||t.hotel_key} · {staff.find(s=>s.user_id===t.assignee)?.full_name||'بدون مسئول'}</small></span><em>{t.due_date||'بدون مهلت'}</em></button>)}{!activeTasks.length&&<Hint>اولین کار را از یکی از هتل‌های سمت راست بساز؛ بعد نتیجه در همین صفحه پیگیری می‌شود.</Hint>}</div></section></div>}
  </>}
  {view==='hotels'&&<section className="sco-panel"><div className="sco-panelhead"><div><span>HOTEL INTELLIGENCE</span><h3>هتل‌ها؛ مسئله، فرصت و اقدام</h3></div><button onClick={()=>csv(visible.map(h=>({name:h.name,city:h.city,provider:h.provider,risk:h.score.risk,opportunity:h.score.opportunity,reason:h.score.reasons.join(' | '),suggestion:h.score.suggestion})), 'IHO_Hotel_Priorities.csv')}><Download size={16}/> خروجی اکسل/CSV</button></div><div className="sco-toolbar"><div className="sco-search"><Search size={17}/><input value={filter} placeholder="نام هتل، کد، شهر..." onChange={e=>setFilter(e.target.value)}/></div><select value={city} onChange={e=>setCity(e.target.value)}><option value="all">همه شهرها</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select><select value={focus} onChange={e=>setFocus(e.target.value as any)}><option value="risk">نیازمند اقدام</option><option value="opportunity">فرصت فروش</option><option value="all">همه هتل‌ها</option><option value="mine">پیگیری‌های من</option></select></div><div className="sco-list-meta">{fa(visible.length)} هتل · مرتب‌شده بر اساس ریسک و فرصت</div><div className="sco-table"><div className="sco-tablehead"><span>هتل</span><span>ریسک</span><span>فرصت</span><span>رزرو ۳۰ روز</span><span>اقدام پیشنهادی</span><span/></div>{visible.slice(0,250).map(h=><button className="sco-tr" key={h.hotel_key} onClick={()=>selectHotel(h)}><span className="sco-tablehotel"><b>{h.name}</b><small>{h.city} · {h.provider||'بدون تأمین‌کننده'}</small></span><b className={h.score.risk>=60?'sco-critical':''}>{fa(h.score.risk)}</b><b>{fa(h.score.opportunity)}</b><span>{fa(h.stats?.confirmed_30)}</span><span className="sco-suggest">{h.score.suggestion}</span><ChevronLeft size={17}/></button>)}</div>{visible.length>250&&<Hint>۲۵۰ هتل اول نمایش داده می‌شود. برای پیدا کردن هتل دیگر جستجو یا فیلتر کن.</Hint>}</section>}
  {view==='tasks'&&<section className="sco-panel"><div className="sco-panelhead"><div><span>FOLLOW-UP PIPELINE</span><h3>از واگذاری تا نتیجه</h3></div><button onClick={()=>csv(tasks.map(t=>({hotel:hotels.find(h=>h.hotel_key===t.hotel_key)?.name,title:t.title,owner:staff.find(s=>s.user_id===t.assignee)?.full_name,status:statusName[t.status],due:t.due_date,result:t.last_result})), 'IHO_Supply_Tasks.csv')}><Download size={16}/> خروجی</button></div><div className="sco-taskgroups">{(['open','waiting','blocked','done'] as Task['status'][]).map(st=><div key={st}><div className="sco-grouphead"><b>{statusName[st]}</b><small>{fa(tasks.filter(t=>t.status===st).length)}</small></div>{tasks.filter(t=>t.status===st).slice(0,40).map(t=><button key={t.id} className="sco-taskcard" onClick={()=>selectTask(t)}><b>{t.title}</b><small>{hotels.find(h=>h.hotel_key===t.hotel_key)?.name||'هتل نامشخص'}</small><span>{staff.find(s=>s.user_id===t.assignee)?.full_name||'بدون مسئول'} · {t.due_date||'بدون مهلت'}</span></button>)}</div>)}</div></section>}
  {view==='team'&&<section className="sco-panel"><div className="sco-panelhead"><div><span>ACCOUNTABILITY</span><h3>عملکرد واقعی تیم</h3></div><button onClick={()=>csv(teamKpis.map(m=>({name:m.full_name,open:m.open,done:m.done,late:m.overdue,on_time:m.onTime})), 'IHO_Team_KPIs.csv')}><Download size={16}/> خروجی</button></div><div className="sco-teamrow sco-teamtitle"><span>کارشناس</span><span>باز</span><span>بسته</span><span>معوق</span><span>به‌موقع</span></div>{teamKpis.map(p=><div className="sco-teamrow" key={p.user_id}><span><span className="sco-avatar">{p.full_name.slice(0,1)}</span><b>{p.full_name}</b><small>{p.role==='manager'?'مدیر':'کارشناس'}</small></span><strong>{fa(p.open)}</strong><strong>{fa(p.done)}</strong><strong className="sco-critical">{fa(p.overdue)}</strong><strong>{fa(p.onTime)}</strong></div>)}{isManager&&<div className="sco-memberadd"><h3>افزودن عضو تیم</h3><p>کارشناس ابتدا با ایمیل وارد می‌شود و شناسه ورودش را در اختیار مدیر قرار می‌دهد.</p><input value={newMemberUid} onChange={e=>setNewMemberUid(e.target.value)} placeholder="شناسه Supabase Auth کاربر" dir="ltr"/><input value={newMemberName} onChange={e=>setNewMemberName(e.target.value)} placeholder="نام و نام خانوادگی"/><select value={newMemberRole} onChange={e=>setNewMemberRole(e.target.value as Member['role'])}><option value="expert">کارشناس</option><option value="manager">مدیر</option></select><button disabled={busy||!newMemberUid||!newMemberName} onClick={()=>void addMember()}>افزودن به تیم</button></div>}</section>}
  {view==='report'&&<div className="sco-report"><div className="sco-reporthead"><span><BarChart3 size={20}/> گزارش روزانه مدیریت</span><button onClick={()=>navigator.clipboard.writeText(compactReport())}><ClipboardCheck size={16}/> کپی گزارش</button></div><pre>{compactReport()}</pre><div className="sco-stats"><IconStat icon={Target} title="اقدام‌پذیر" value={fa(scores.filter(h=>h.score.needsAction).length)} hint="بنا به داده موجود"/><IconStat icon={AlertCircle} title="معوق" value={fa(overdue.length)} hint="نیازمند تصمیم مدیر"/><IconStat icon={TrendingDown} title="افت رزرو" value={fa(scores.filter(h=>h.score.movement!==null&&h.score.movement<-35).length)} hint="در مقایسه با دوره قبل"/><IconStat icon={CheckCircle2} title="بسته‌شده" value={fa(tasks.filter(t=>t.status==='done').length)} hint="با ثبت اقدام"/></div><section className="sco-panel"><h3>پنج هتل اول برای اقدام مدیر</h3>{scores.slice(0,5).map(h=><button className="sco-reporthotel" key={h.hotel_key} onClick={()=>selectHotel(h)}><b>{h.name}</b><span>ریسک {fa(h.score.risk)}</span><em>{h.score.suggestion}</em><ChevronLeft size={18}/></button>)}</section></div>}
  {view==='data'&&<div className="sco-data"><div className="sco-dataIntro"><span><CloudUpload size={21}/> ورودی ساده، نتیجه قابل‌اعتماد</span><h2>از یک فایل شروع کن؛ باقی فایل‌ها اختیاری‌اند.</h2><p>هیچ رزرو خامی به دیتابیس فرستاده نمی‌شود؛ اطلاعات پیش از ذخیره در سطح هتل تجمیع می‌شوند.</p></div>{!isManager?<Hint>ورود داده فقط با نقش مدیر مجاز است. کارشناسان می‌توانند پرونده‌ها و وظایف خود را ببینند.</Hint>:<section className="sco-panel"><div className="sco-uploadStep"><span>۱</span><div><h3>چه نوع اطلاعاتی داری؟</h3><p>برای راه‌اندازی فقط «فهرست هتل‌ها» کافی است.</p></div></div><div className="sco-modegrid">{MODES.map(m=><button key={m.id} className={mode===m.id?'active':''} onClick={()=>{setMode(m.id);setMapping(headers.length?autoMap(headers,m.id):{});setImportSummary(null)}}><b>{m.label}</b><small>{m.help}</small>{m.required&&<em>برای شروع</em>}</button>)}</div><div className="sco-uploadStep"><span>۲</span><div><h3>فایل را انتخاب کن</h3><p>Excel یا CSV؛ می‌توانی ستون‌ها را قبل از ذخیره تطبیق بدهی. برای فایل‌های چندروزه یا سالانه، ستون «تاریخ واقعی رزرو» را حتماً نگاشت کن.</p></div></div><div className="sco-filezone"><label><UploadCloud size={24}/><span>{fileLabel||'انتخاب فایل اکسل یا CSV'}</span><small>فایل روی سرور خام ذخیره نمی‌شود؛ داده‌ها تجمیع می‌شوند.</small><input type="file" accept=".xlsx,.xls,.csv" onChange={e=>void readFile(e.target.files?.[0])}/></label>{!['hotels','availability','owners'].includes(mode)&&<label>تاریخ گزارش<input type="date" value={importDate} onChange={e=>setImportDate(e.target.value)}/></label>}</div>{headers.length>0&&<><div className="sco-uploadStep"><span>۳</span><div><h3>ستون‌ها را تأیید کن</h3><p>هر ستون مقصد را به ستون صحیح فایل متصل کن؛ گزینه خالی یعنی آن شاخص وارد نمی‌شود.</p></div></div><div className="sco-mapgrid">{FIELD_SETS[mode].map(f=><label key={f}><span>{FIELDS.find(x=>x.key===f)?.label}</span><select value={mapping[f]||''} onChange={e=>setMapping(m=>({...m,[f]:e.target.value}))}><option value="">بدون ستون</option>{headers.map((h,i)=><option key={i} value={h}>{h}</option>)}</select></label>)}</div><div className="sco-preview"><h4>پیش‌نمایش ۴ ردیف نخست</h4><div>{preview.map((row,i)=><p key={i}>{clean(mapping.name?row[mapping.name]:'')||clean(mapping.code?row[mapping.code]:'')||'—'} · {clean(mapping.city?row[mapping.city]:'')}</p>)}</div></div><button className="sco-primary" onClick={()=>void startImport()} disabled={busy||!mapping.name&&!mapping.code}>{busy?'در حال ثبت...':'تأیید و ثبت داده‌های تطبیق‌یافته'} <ArrowLeft size={17}/></button></>}{progress&&<div className="sco-progress"><Activity size={17}/>{progress}</div>}{importSummary&&<div className="sco-successdata"><Check size={20}/> {fa(importSummary.saved)} هتل ذخیره شد. {fa(importSummary.rejected)} ردیف نامنطبق. {importSummary.samples.length>0&&<small>نمونه ردیف‌های نامنطبق: {importSummary.samples.slice(0,3).join('، ')}</small>}</div>}</section>}<section className="sco-panel"><h3>تاریخچه ورود داده</h3>{imports.slice(0,12).map(i=><div className="sco-importitem" key={i.id}><FileSpreadsheet size={18}/><span><b>{MODES.find(m=>m.id===i.source)?.label||i.source}</b><small>{i.file_name}</small></span><em>{fa(i.rows_saved)} هتل · {fa(i.rows_rejected)} ردیف نامنطبق</em><small>{String(i.created_at).slice(0,10)}</small></div>)}{!imports.length&&<Hint>هنوز فایلی در نسخه جدید وارد نشده است.</Hint>}</section></div>}
  </div>
  {selection&&<div className="sco-backdrop" onClick={()=>setSelected(null)}><div className="sco-drawer" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true"><header><button onClick={()=>setSelected(null)}><X size={20}/></button><span className="sco-drawerlabel">HOTEL 360 / اقدام</span><h2>{selection.name}</h2><p>{selection.city||'شهر نامشخص'} · {selection.provider||'بدون تأمین‌کننده'} · {selection.category||'بدون دسته‌بندی'}</p></header><div className="sco-drawbody"><div className="sco-scorecards"><div><small>ریسک</small><b>{fa(selection.score.risk)}</b></div><div><small>فرصت</small><b>{fa(selection.score.opportunity)}</b></div><div><small>رزرو ۳۰ روز</small><b>{fa(selection.stats?.confirmed_30)}</b></div></div><section><div className="sco-profilehead"><h3>وضعیت عملیاتی هتل</h3>{isManager&&<button onClick={()=>setEditHotel(v=>!v)}>{editHotel?'بستن':'ویرایش سریع'}</button>}</div>{editHotel?<div className="sco-quickform"><label>ظرفیت آنلاین<select value={onlineDraft} onChange={e=>setOnlineDraft(e.target.value)}><option value="unknown">نامشخص</option><option value="yes">فعال</option><option value="no">غیرفعال</option></select></label><label>نرخ آنلاین<select value={rateDraft} onChange={e=>setRateDraft(e.target.value)}><option value="unknown">نامشخص</option><option value="yes">فعال</option><option value="no">غیرفعال</option></select></label><label>ظرفیت<input value={capacityDraft} onChange={e=>setCapacityDraft(e.target.value)} inputMode="numeric"/></label><label>مسئول ظرفیت<input value={capacityOwnerDraft} onChange={e=>setCapacityOwnerDraft(e.target.value)}/></label><label>مسئول نرخ<input value={rateOwnerDraft} onChange={e=>setRateOwnerDraft(e.target.value)}/></label><button className="sco-primary" disabled={busy} onClick={()=>void saveHotelStatus()}>ذخیره تغییرات هتل <Check size={16}/></button></div>:<div className="sco-quickview"><span>ظرفیت آنلاین: <b>{selection.is_online==null?'نامشخص':selection.is_online?'فعال':'غیرفعال'}</b></span><span>نرخ آنلاین: <b>{selection.has_rate==null?'نامشخص':selection.has_rate?'فعال':'غیرفعال'}</b></span><span>ظرفیت: <b>{selection.capacity==null?'نامشخص':fa(selection.capacity)}</b></span></div>}</section><section><h3>چرا باید اقدام کنیم؟</h3>{selection.score.reasons.length?selection.score.reasons.map((r,i)=><p key={i} className="sco-reason"><AlertCircle size={15}/>{r}</p>):<Hint>فعلاً نشانه‌ای از ریسک قطعی نداریم؛ داده بیشتر وارد کن.</Hint>}<div className="sco-drawfacts"><span>مسئول ظرفیت: <b>{selection.capacity_owner||'ثبت نشده'}</b></span><span>مسئول نرخ: <b>{selection.rate_owner||'ثبت نشده'}</b></span><span>آنلاین: <b>{selection.is_online===null||selection.is_online===undefined?'نامشخص':selection.is_online?'بله':'خیر'}</b></span></div></section>{editingTask?<section><h3>ثبت نتیجه پیگیری</h3><p className="sco-muted">{tasks.find(t=>t.id===editingTask)?.title}</p><label>وضعیت<select value={taskStatus} onChange={e=>setTaskStatus(e.target.value as Task['status'])}>{(['open','waiting','blocked','done'] as Task['status'][]).map(s=><option value={s} key={s}>{statusName[s]}</option>)}</select></label><label>نوع نتیجه<select value={taskOutcome} onChange={e=>setTaskOutcome(e.target.value)}>{outcomeList.map(x=><option key={x}>{x}</option>)}</select></label><label>چه اقدامی شد؟<textarea value={resultNote} onChange={e=>setResultNote(e.target.value)} rows={4} placeholder="با هتل تماس گرفتم؛ نتیجه، مانع و قدم بعدی..."/></label><button className="sco-primary" disabled={busy||resultNote.trim().length<8} onClick={()=>void saveResult()}>ثبت نتیجه اقدام <Check size={17}/></button><button className="sco-inline" onClick={()=>setEditingTask(null)}>بازگشت به تعریف اقدام</button></section>:<section><h3>اقدام بعدی</h3><p className="sco-muted">پیشنهاد سیستم: {selection.score.suggestion}</p>{isManager?<><label>اقدام مشخص<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/></label><label>مسئول پیگیری<select value={taskOwner} onChange={e=>setTaskOwner(e.target.value)}><option value="">انتخاب مسئول</option>{staff.map(u=><option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}</select></label><label>مهلت<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label><button className="sco-primary" disabled={busy||!taskOwner||!taskTitle} onClick={()=>void createTask()}>واگذاری این اقدام <ArrowLeft size={17}/></button></>:<Hint>کارشناس فقط نتیجه تسک‌های واگذارشده را ثبت می‌کند.</Hint>}</section>}<section><h3>تسک‌های این هتل</h3>{selection.tasks.map(t=><button className="sco-mini-task" key={t.id} onClick={()=>selectTask(t)}><b>{t.title}</b><small>{statusName[t.status]} · {staff.find(s=>s.user_id===t.assignee)?.full_name||'بدون مسئول'}</small><ChevronLeft size={15}/></button>)}{!selection.tasks.length&&<p className="sco-muted">هنوز تسکی ندارد.</p>}</section><section><h3>تاریخچه واقعی اقدامات</h3>{events.map(e=><div className="sco-event" key={e.id}><span/><div><small>{new Date(e.created_at).toLocaleDateString('fa-IR')} · {staff.find(m=>m.user_id===e.actor)?.full_name||'سیستم'}</small><p>{e.details}</p></div></div>)}{!events.length&&<p className="sco-muted">اقدامی ثبت نشده است.</p>}</section></div></div></div>}
 </main>;
}

'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createClient,Session} from '@supabase/supabase-js';
import {Activity,AlertCircle,ArrowLeft,ArrowRight,BarChart3,Building2,Check,CheckCircle2,ChevronLeft,ClipboardCheck,Clock3,CloudUpload,Download,FileSpreadsheet,Phone,Filter,Hotel,Info,LogOut,RefreshCw,Search,ShieldCheck,Sparkles,Target,TrendingDown,TrendingUp,UploadCloud,UserRound,Users,WifiOff,X} from 'lucide-react';
import {Mode,Column,Hotel as H,Rollup,Score,MODES,FIELDS,FIELD_SETS,autoMap,booleanish,clean,csv,keyOf,norm,num,score,toIsoDate} from './engine';
import './supply.css';
import {CaseCreate,CaseQueue,SupplyCase} from './Cases';
import MarketTools from './MarketTools';
import CommercialTools from './CommercialTools';
import TeamActivation from './TeamActivation';
import VerifiedOutcomes from './VerifiedOutcomes';

type Member={user_id:string;full_name:string;role:'manager'|'expert';active:boolean;must_change_password?:boolean};
type Task={id:string;hotel_key:string;title:string;type:string;assignee:string|null;created_by:string|null;priority:'urgent'|'high'|'normal';status:'open'|'waiting'|'blocked'|'done';due_date:string|null;last_result:string|null;outcome:string|null;created_at:string;updated_at:string;completed_at:string|null;verified_at?:string|null;verified_by?:string|null;review_note?:string|null};
type Event={id:string;hotel_key:string;task_id:string|null;kind:string;details:string;actor:string|null;created_at:string};
type Import={id:string;source:string;file_name:string;metric_date:string|null;rows_total:number;rows_saved:number;rows_rejected:number;created_at:string};
type Item=H & {stats:Rollup|undefined;score:Score;open:number;tasks:Task[]};
type View='today'|'hotels'|'tasks'|'team'|'data'|'report'|'market'|'commercial';
const u=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
const db=u&&k?createClient(u,k,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const today=()=>new Date().toLocaleDateString('en-CA');
const fa=(n:number|string|undefined|null)=>Number(n||0).toLocaleString('fa-IR');
const statusName:Record<string,string>={open:'در انتظار اقدام',waiting:'در انتظار هتل',blocked:'نیازمند تصمیم مدیر',done:'انجام شد'};
const priorityName:Record<string,string>={urgent:'فوری',high:'بالا',normal:'معمولی'};
const ACTION_PRESETS=['دریافت ظرفیت آنلاین','اصلاح نرخ و قیمت رقابتی','پیگیری رزروهای غیرقطعی','مذاکره پیشنهاد ویژه / تخفیف','بررسی قرارداد و شرایط همکاری','رفع مشکل نمایش هتل'];
const outcomeList=['ظرفیت آنلاین فعال شد','نرخ اصلاح شد','رزرو پیگیری و قطعی شد','قرارداد/همکاری بهبود یافت','پیگیری انجام شد','هتل پاسخ نداد','مانع رفع نشد','سایر'];
async function getAll(table:string,filter?:(q:any)=>any,cap=12000){
 if(!db)return [];
 const size=1000;const parallel=4;
 const fetchPage=async(offset:number)=>{
  let q=db.from(table).select('*');
  if(filter)q=filter(q);
  const {data,error}=await q.range(offset,Math.min(cap-1,offset+size-1));
  if(error)throw error;
  return data||[];
 };
 // Small tables require only one request. Large tables are paginated concurrently,
 // always with an explicit deterministic sort supplied by the caller.
 const first=await fetchPage(0);
 const rows:any[]=[...first];
 if(first.length<size)return rows;
 for(let base=size;base<cap;base+=size*parallel){
  const offsets=Array.from({length:Math.min(parallel,Math.ceil((cap-base)/size))},(_,i)=>base+i*size);
  const chunks=await Promise.all(offsets.map(fetchPage));
  for(const chunk of chunks)rows.push(...chunk);
  if(chunks.some(chunk=>chunk.length<size))break;
 }
 return rows.slice(0,cap);
}
function dateDelta(day:string|null|undefined){if(!day)return 9999;return Math.floor((new Date(day+'T23:59:59').getTime()-Date.now())/86400000)}
function IconStat({title,value,hint,icon:Icon,color}:any){return <div className="sco-stat"><span className={'sco-stat-icon '+(color||'')}><Icon size={19}/></span><div><small>{title}</small><strong>{value}</strong><em>{hint}</em></div></div>}
function Hint({children}:any){return <div className="sco-hint"><Info size={18}/>{children}</div>}
export default function SupplyOS(){
 const [session,setSession]=useState<Session|null>(null),[userReady,setUserReady]=useState(false),[member,setMember]=useState<Member|null>(null),[loginEmail,setLoginEmail]=useState(''),[loginSent,setLoginSent]=useState(false);
 const [setupName,setSetupName]=useState(''),[activationCode,setActivationCode]=useState('');
 const [loginPassword,setLoginPassword]=useState('');
 const [firstPass,setFirstPass]=useState(''),[firstPassConfirm,setFirstPassConfirm]=useState('');
 const [view,setView]=useState<View>('today'),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [hotels,setHotels]=useState<H[]>([]),[metrics,setMetrics]=useState<Rollup[]>([]),[tasks,setTasks]=useState<Task[]>([]),[members,setMembers]=useState<Member[]>([]),[imports,setImports]=useState<Import[]>([]),[cases,setCases]=useState<SupplyCase[]>([]);
 const [selected,setSelected]=useState<string|null>(null),[events,setEvents]=useState<Event[]>([]),[filter,setFilter]=useState(''),[city,setCity]=useState('all'),[focus,setFocus]=useState<'all'|'risk'|'opportunity'|'mine'>('risk');
 const [taskTitle,setTaskTitle]=useState(''),[taskOwner,setTaskOwner]=useState(''),[taskDue,setTaskDue]=useState(today()),[taskOutcome,setTaskOutcome]=useState(outcomeList[0]),[resultNote,setResultNote]=useState(''),[taskStatus,setTaskStatus]=useState<Task['status']>('open'),[editingTask,setEditingTask]=useState<string|null>(null);
 const [bulkOwner,setBulkOwner]=useState(''),[bulkDue,setBulkDue]=useState(today()),[bulkOpen,setBulkOpen]=useState(false),[caseOpen,setCaseOpen]=useState(false);
 const [verifyStatus,setVerifyStatus]=useState(false),[editHotel,setEditHotel]=useState(false),[onlineDraft,setOnlineDraft]=useState('unknown'),[rateDraft,setRateDraft]=useState('unknown'),[capacityDraft,setCapacityDraft]=useState(''),[capacityOwnerDraft,setCapacityOwnerDraft]=useState(''),[rateOwnerDraft,setRateOwnerDraft]=useState(''),[capacityOwnerIdDraft,setCapacityOwnerIdDraft]=useState(''),[rateOwnerIdDraft,setRateOwnerIdDraft]=useState(''),[commercialOwnerIdDraft,setCommercialOwnerIdDraft]=useState('');
 const [mode,setMode]=useState<Mode>('hotels'),[importDate,setImportDate]=useState(today()),[fileLabel,setFileLabel]=useState(''),[headers,setHeaders]=useState<string[]>([]),[mapping,setMapping]=useState<Partial<Record<Column,string>>>({}),[preview,setPreview]=useState<any[]>([]),[progress,setProgress]=useState(''),[importSummary,setImportSummary]=useState<{read:number;saved:number;rejected:number;samples:string[]}|null>(null);
 const raw=useRef<Record<string,any>[]>([]);
 const [aiBrief,setAiBrief]=useState(''),[aiBusy,setAiBusy]=useState(false);
 const [newMemberUid,setNewMemberUid]=useState(''),[newMemberName,setNewMemberName]=useState(''),[newMemberRole,setNewMemberRole]=useState<Member['role']>('expert');
 const isManager=member?.role==='manager';

 const refresh=useCallback(async()=>{
  if(!db||!member)return;
  setLoading(true);setError('');
  try{
   const results=await Promise.all([getAll('sco_hotels',q=>q.order('hotel_key',{ascending:true}),15000),getAll('sco_hotel_rollup',q=>q.order('hotel_key',{ascending:true}),15000),getAll('sco_tasks',q=>q.order('created_at',{ascending:false}),8000),getAll('sco_members',q=>q.order('user_id',{ascending:true})),getAll('sco_imports',q=>q.order('created_at',{ascending:false}),300),getAll('sco_cases',q=>q.order('created_at',{ascending:false}),4000)]);
   setHotels(results[0] as H[]);setMetrics(results[1] as Rollup[]);setTasks(results[2] as Task[]);setMembers(results[3] as Member[]);setImports(results[4] as Import[]);setCases(results[5] as SupplyCase[]);
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
   if(!cancel){if(error)setError(error.message);setMember(data?.active?data as Member:null);if(data?.active&&data.role==='expert'){setView('tasks');setFocus('mine')}}
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
 const deskTasks=isManager?tasks:tasks.filter(t=>t.assignee===session?.user.id);
 const deskOpen=deskTasks.filter(t=>t.status!=='done');
 const deskOverdue=deskOpen.filter(t=>dateDelta(t.due_date)<0);
 const recoveryQueue=useMemo(()=>scores.filter(h=>
  (h.provider==='IHO Provider'||h.provider==='IHO')&&
  !['خارج از سرویس','حذف تستی'].includes(h.category||'')&&
  (h.is_online==null||h.has_rate==null||!h.capacity_owner||!h.rate_owner)&&
  !h.tasks.some(t=>t.status!=='done'&&t.title.includes('وضعیت نرخ و ظرفیت'))
 ).sort((a,b)=>{
  const tier=(h:Item)=>h.category==='پیشران'?4:h.category==='کلیدی'?3:h.category==='در حال توسعه'?2:1;
  return tier(b)-tier(a)||a.name.localeCompare(b.name,'fa');
 }).slice(0,100),[scores]);
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
 const ready={hotel:hotels.length,online:hotels.filter(h=>h.is_online!==null&&h.is_online!==undefined).length,rate:hotels.filter(h=>h.has_rate!==null&&h.has_rate!==undefined).length,owner:hotels.filter(h=>!!h.capacity_owner&&!!h.rate_owner).length,onlineFresh:hotels.filter(h=>h.capacity_verified_at&&Date.now()-new Date(h.capacity_verified_at).getTime()<48*3600000).length,rateFresh:hotels.filter(h=>h.rate_verified_at&&Date.now()-new Date(h.rate_verified_at).getTime()<48*3600000).length,sales:metrics.length,lastSale:imports.filter(i=>['performance','confirmed','unconfirmed','traffic'].includes(i.source)).map(i=>i.created_at).sort().at(-1)||''};
 const bulkCandidates=scores.filter(h=>h.score.needsAction&&!h.tasks.some(t=>t.status!=='done')).slice(0,10);
 const callHref=(phone:unknown)=>'tel:'+clean(phone).replace(/[^0-9+]/g,'');
 const teamKpis=staff.map(person=>{
  const tt=tasks.filter(t=>t.assignee===person.user_id);
  const done=tt.filter(t=>t.status==='done');
  const verified=done.filter(t=>!!t.verified_at).length;
  return {...person,verified,open:tt.filter(t=>t.status!=='done').length,done:done.length,overdue:tt.filter(t=>t.status!=='done'&&dateDelta(t.due_date)<0).length,onTime:done.filter(t=>t.completed_at&&t.due_date&&new Date(t.completed_at).getTime()<=new Date(t.due_date+'T23:59:59').getTime()).length,owned:hotels.filter(h=>[h.capacity_owner_id,h.rate_owner_id,h.commercial_owner_id].includes(person.user_id)).length};
 }).sort((a,b)=>b.open-a.open);
 const compactReport=()=>{const totalConf=scores.reduce((s,h)=>s+Number(h.stats?.confirmed_30||0),0);const lost=scores.reduce((s,h)=>s+Number(h.stats?.lost_30||0),0);
 return 'گزارش زنجیره تأمین ایران‌هتل — '+new Date().toLocaleDateString('fa-IR')+'\n'+
 'کل هتل‌ها: '+fa(scores.length)+' | هتل‌های نیازمند اقدام: '+fa(scores.filter(h=>h.score.needsAction).length)+'\n'+
 'پیگیری‌های باز: '+fa(activeTasks.length)+' | معوق: '+fa(overdue.length)+' | بدون مسئول: '+fa(unassigned.length)+'\n'+'پوشش داده: نرخ آنلاین '+fa(ready.rate)+'، ظرفیت آنلاین '+fa(ready.online)+'، مسئول نرخ و ظرفیت '+fa(ready.owner)+' از '+fa(ready.hotel)+' هتل\n'+
 'رزرو قطعی ۳۰ روز: '+fa(totalConf)+' | رزرو از دست‌رفته: '+fa(lost)+'\n'+
 'پیشنهاد اقدام: '+scores.filter(h=>h.score.needsAction).slice(0,5).map(h=>h.name+' ('+h.score.suggestion+')').join('؛ ');}
 async function runSupplyAi(){
  if(!session||!isManager)return;
  setAiBrief('');setAiBusy(true);setError('');
  const pack={
   period:'آخرین ۳۰ روز تا امروز',total_hotels:scores.length,
   data_quality:{online_known:ready.online,rate_known:ready.rate,owner_known:ready.owner,metric_hotels:ready.sales},
   open_tasks:activeTasks.length,late_tasks:overdue.length,
   open_incidents:cases.filter(c=>c.status!=='resolved').length,
   critical_incidents:cases.filter(c=>c.status!=='resolved'&&c.severity==='p0').map(c=>({hotel:hotels.find(h=>h.hotel_key===c.hotel_key)?.name,type:c.issue_type,description:c.description.slice(0,120)})).slice(0,5),
   top_hotels:scores.filter(h=>h.score.needsAction).slice(0,12).map(h=>({hotel:h.name,city:h.city,provider:h.provider,caring:h.category,risk:h.score.risk,opportunity:h.score.opportunity,reasons:h.score.reasons,confirmed:h.stats?.confirmed_30||0,unconfirmed:h.stats?.unconfirmed_30||0,lost:h.stats?.lost_30||0,visits:h.stats?.visits_30||0})),
   team:teamKpis.slice(0,15).map(u=>({name:u.full_name,open:u.open,overdue:u.overdue,done:u.done}))
  };
  try{
   const response=await fetch('/api/supply-ai',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({prompt:'با حفظ تفکیک ریسک واقعی و کمبود داده، از این بسته مدیریتی امروز گزارش اولویت و برنامه اجرایی بده: '+JSON.stringify(pack)})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'خطای تحلیل');
   setAiBrief(data.text||'پاسخی دریافت نشد.');
  }catch(e:any){setError('تحلیل AI: '+e.message)}finally{setAiBusy(false)}
 }
 function selectHotel(h:Item){setCaseOpen(false);setSelected(h.hotel_key);setTaskTitle(h.score.suggestion);setTaskOwner(h.commercial_owner_id||h.capacity_owner_id||h.rate_owner_id||session?.user.id||'');setTaskDue(today());setEditingTask(null);setResultNote('');setEditHotel(false);setVerifyStatus(false);setOnlineDraft(h.is_online===true?'yes':h.is_online===false?'no':'unknown');setRateDraft(h.has_rate===true?'yes':h.has_rate===false?'no':'unknown');setCapacityDraft(h.capacity==null?'':String(h.capacity));setCapacityOwnerDraft(h.capacity_owner||'');setRateOwnerDraft(h.rate_owner||'');setCapacityOwnerIdDraft(h.capacity_owner_id||'');setRateOwnerIdDraft(h.rate_owner_id||'');setCommercialOwnerIdDraft(h.commercial_owner_id||'');}
 function selectTask(t:Task){setCaseOpen(false);setSelected(t.hotel_key);setEditingTask(t.id);setTaskStatus(t.status);setTaskOwner(t.assignee||'');setTaskTitle(t.title);setTaskOutcome(t.outcome||outcomeList[0]);setResultNote('');setVerifyStatus(false);const h=scores.find(x=>x.hotel_key===t.hotel_key);if(h){setOnlineDraft(h.is_online===true?'yes':h.is_online===false?'no':'unknown');setRateDraft(h.has_rate===true?'yes':h.has_rate===false?'no':'unknown');setCapacityDraft(h.capacity==null?'':String(h.capacity));setCapacityOwnerDraft(h.capacity_owner||'');setRateOwnerDraft(h.rate_owner||'');setCapacityOwnerIdDraft(h.capacity_owner_id||'');setRateOwnerIdDraft(h.rate_owner_id||'');setCommercialOwnerIdDraft(h.commercial_owner_id||'')}}
 async function createTask(){
  if(!db||!isManager||!selection)return;
  if(!taskOwner||!taskTitle.trim()){setError('عنوان اقدام و مسئول پیگیری را مشخص کن.');return}
  setBusy(true);setError('');
  try{
   const {data,error:e}=await db.rpc('sco_create_actions',{p_actions:[{hotel_key:selection.hotel_key,title:taskTitle.trim(),assignee:taskOwner,due_date:taskDue,priority:selection.score.risk>=70?'urgent':selection.score.risk>=40?'high':'normal'}]});
   if(e)throw e;
   const id=data?.ids?.[0];
   if(data?.skipped){setNotice('این هتل قبلاً همین پیگیری باز را دارد؛ تسک تکراری ساخته نشد.')}
   else{setNotice('تسک با تاریخچه قابل پیگیری ساخته شد. نتیجه اقدام را اینجا ثبت کن.');if(id){setEditingTask(id);setTaskStatus('open');}}
   await refresh();
  }catch(e:any){setError('واگذاری ناموفق بود: '+e.message)}finally{setBusy(false)}
 }
 async function createBulkActions(){
  if(!db||!isManager||!bulkOwner||!bulkCandidates.length)return;
  setBusy(true);setError('');
  try{
   const actions=bulkCandidates.map(h=>({hotel_key:h.hotel_key,title:h.score.suggestion,assignee:bulkOwner,due_date:bulkDue,priority:h.score.risk>=70?'urgent':h.score.risk>=40?'high':'normal'}));
   const {data,error:e}=await db.rpc('sco_create_actions',{p_actions:actions});
   if(e)throw e;
   setNotice(fa(data?.created||0)+' پیگیری واگذار شد؛ '+fa(data?.skipped||0)+' مورد تکراری رد شد.');
   setBulkOpen(false);setView('tasks');await refresh();
  }catch(e:any){setError('واگذاری گروهی ناموفق بود: '+e.message)}finally{setBusy(false)}
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
   const timestamp=new Date().toISOString();
   const oldOnline=selection.is_online===true?'yes':selection.is_online===false?'no':'unknown';
   const oldRate=selection.has_rate===true?'yes':selection.has_rate===false?'no':'unknown';
   const capacityChanged=onlineDraft!==oldOnline||capacityDraft!==(selection.capacity==null?'':String(selection.capacity));
   const rateChanged=rateDraft!==oldRate;
   const patch={capacity_verified_at:(verifyStatus||capacityChanged)&&(onlineDraft!=='unknown'||capacityDraft.trim()!=='')?timestamp:selection.capacity_verified_at||null,rate_verified_at:(verifyStatus||rateChanged)&&rateDraft!=='unknown'?timestamp:selection.rate_verified_at||null,is_online:onlineDraft==='unknown'?null:onlineDraft==='yes',has_rate:rateDraft==='unknown'?null:rateDraft==='yes',capacity:capacityDraft.trim()===''?null:Math.max(0,Math.floor(num(capacityDraft))),capacity_owner:capacityOwnerIdDraft?staff.find(u=>u.user_id===capacityOwnerIdDraft)?.full_name||capacityOwnerDraft.trim():capacityOwnerDraft.trim(),rate_owner:rateOwnerIdDraft?staff.find(u=>u.user_id===rateOwnerIdDraft)?.full_name||rateOwnerDraft.trim():rateOwnerDraft.trim(),capacity_owner_id:capacityOwnerIdDraft||null,rate_owner_id:rateOwnerIdDraft||null,commercial_owner_id:commercialOwnerIdDraft||null,updated_at:new Date().toISOString()};
   const {error:e}=await db.from('sco_hotels').update(patch).eq('hotel_key',selection.hotel_key);
   if(e)throw e;
   const {error:ev}=await db.from('sco_events').insert({hotel_key:selection.hotel_key,kind:'manual_update',actor:session.user.id,details:'وضعیت هتل و مسئولیت‌ها به‌روزرسانی شد. آنلاین: '+onlineDraft+' | نرخ: '+rateDraft+' | ظرفیت: '+(capacityDraft||'نامشخص')});
   if(ev)throw ev;
   setEditHotel(false);setVerifyStatus(false);setNotice('وضعیت هتل به‌روزرسانی شد و در تاریخچه ثبت شد.');await refresh();
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
      if(mapping.is_online&&booleanish(get(r,'is_online'))!==null){p.is_online=booleanish(get(r,'is_online'));p.capacity_verified_at=new Date().toISOString();}
      if(mapping.has_rate&&booleanish(get(r,'has_rate'))!==null){p.has_rate=booleanish(get(r,'has_rate'));p.rate_verified_at=new Date().toISOString();}
      if(mapping.capacity&&clean(get(r,'capacity'))!==''){p.capacity=Math.max(0,Math.trunc(num(get(r,'capacity'))));p.capacity_verified_at=new Date().toISOString();}
     }else{
      if(mapping.capacity_owner&&clean(get(r,'capacity_owner')))p.capacity_owner=clean(get(r,'capacity_owner'));
      if(mapping.rate_owner&&clean(get(r,'rate_owner')))p.rate_owner=clean(get(r,'rate_owner'));
      if(mapping.owner&&clean(get(r,'owner'))){
       const name=clean(get(r,'owner')),role=norm(get(r,'owner_type'));
       if(role==='1'||role.includes('capacity')||role.includes('ظرفیت'))p.capacity_owner=name;
       else if(role==='2'||role.includes('rate')||role.includes('نرخ'))p.rate_owner=name;
       else if(!mapping.owner_type)p.capacity_owner=name;
      }
     }
     if(Object.keys(p).filter(x=>!['hotel_key','updated_at'].includes(x)).length===0){if(rejected.length<10)rejected.push(name||code||'ردیف بدون تغییر');continue}
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
   // Convert staff names from Hotel Assignment into immutable user IDs where unambiguous.
   // Keep the original display name if the staff member has not yet joined the platform.
   const unmatchedOwners=new Set<string>();
   if(mode==='owners'||mode==='hotels'){
    for(const record of accepted.values()){
     for(const [nameField,idField] of [['capacity_owner','capacity_owner_id'],['rate_owner','rate_owner_id']] as const){
      const original=clean(record[nameField]||'');
      if(!original)continue;
      const matches=staff.filter(p=>norm(p.full_name)===norm(original));
      if(matches.length===1)record[idField]=matches[0].user_id;
      else unmatchedOwners.add(original);
     }
    }
   }
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
   if(unmatchedOwners.size)setNotice('داده‌ها ذخیره شدند، اما نام '+fa(unmatchedOwners.size)+' کارشناس هنوز با حساب کاربری یکسان تطبیق ندارد. ابتدا حساب افراد را در بخش تیم بساز و فایل مسئولان را دوباره وارد کن. نمونه: '+[...unmatchedOwners].slice(0,4).join('، '));
   if(logErr)setNotice('داده‌ها ذخیره شدند ولی سابقه آپلود ثبت نشد: '+logErr.message);
   raw.current=[];setHeaders([]);setPreview([]);await refresh();
  }catch(e:any){setError('آپلود متوقف شد: '+e.message);setProgress('در صورت ثبت بخشی از داده، آپلود مجدد همین فایل/تاریخ بدون دوبرابرشدن شاخص‌ها امکان‌پذیر است.')}finally{setBusy(false)}
 }

 if(!db)return <main className="sco-auth"><h1>Supply OS</h1><p>متغیرهای اتصال Supabase روی این نسخه تنظیم نشده‌اند.</p></main>;
 if(!userReady)return <main className="sco-auth"><RefreshCw className="sco-spin"/> در حال بررسی ورود...</main>;
 if(!session)return <main className="sco-auth"><div className="sco-authbox">
  <span className="sco-mark"><Hotel/></span><h1>IranHotel Supply OS</h1>
  <p>با ایمیل و رمز عبور حساب موجودت وارد شو؛ ارسال ایمیل برای ورود روزانه لازم نیست.</p>
  <label>ایمیل سازمانی</label><input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="you@company.com" dir="ltr" autoComplete="username"/>
  <label>رمز ورود</label><input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} dir="ltr" autoComplete="current-password" placeholder="رمز عبور"/>
  <button disabled={busy||!loginEmail.includes('@')||!loginPassword} onClick={async()=>{setBusy(true);setError('');const {error:e}=await db.auth.signInWithPassword({email:loginEmail.trim(),password:loginPassword});setBusy(false);if(e)setError(e.message);else setLoginPassword('')}}>ورود با رمز عبور</button>
  <a href="/account-access" style={{fontSize:12,textAlign:'center',color:'#0b7b9a'}}>تنظیم رمز دائمی حساب (بدون ارسال ایمیل، در صورت داشتن نشست فعال)</a>
  <button className="sco-ghost" disabled={busy||!loginEmail.includes('@')} onClick={async()=>{setBusy(true);setError('');const {error:e}=await db.auth.signInWithOtp({email:loginEmail.trim(),options:{emailRedirectTo:location.origin+'/',shouldCreateUser:false}});setBusy(false);if(e)setError(e.message);else setLoginSent(true)}}>ورود یک‌باره با لینک ایمیل</button>
  {loginSent&&<Hint>لینک ورود ارسال شد؛ پس از ورود رمز دائمی تعیین کن.</Hint>}
  {error&&<p className="sco-error">{error}</p>}
  <small>سقف ارسال ایمیل Supabase ممکن است تکمیل شده باشد. ورود رمزدار از سهمیه ارسال ایمیل استفاده نمی‌کند.</small>
 </div></main>;
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
 if(member.must_change_password)return <main className="sco-auth"><div className="sco-authbox">
  <span className="sco-mark"><ShieldCheck/></span><h2>فعال‌سازی امن حساب کارشناس</h2>
  <p>ورود اول با رمز موقت انجام شد. قبل از دسترسی به اطلاعات هتل‌ها، یک رمز شخصی و حداقل ۱۲ کاراکتری تعیین کن.</p>
  <small>{session.user.email}</small>
  <label>رمز جدید<input type="password" dir="ltr" autoComplete="new-password" minLength={12} value={firstPass} onChange={e=>setFirstPass(e.target.value)}/></label>
  <label>تکرار رمز<input type="password" dir="ltr" autoComplete="new-password" minLength={12} value={firstPassConfirm} onChange={e=>setFirstPassConfirm(e.target.value)}/></label>
  <button disabled={busy||firstPass.length<12||firstPass!==firstPassConfirm} onClick={async()=>{
   setBusy(true);setError('');
   try{
    const {error:e}=await db.auth.updateUser({password:firstPass});
    if(e)throw e;
    const {error:completeError}=await db.rpc('sco_complete_staff_password_setup');
    if(completeError)throw completeError;
    setFirstPass('');setFirstPassConfirm('');setMember({...member,must_change_password:false});
    setNotice('رمز شخصی شما فعال شد. به فضای کار تیم تأمین خوش آمدید.');
   }catch(e:any){setError(e.message||'خطای تغییر رمز')}finally{setBusy(false)}
  }}>ذخیره رمز و ورود به فضای کار</button>
  {error&&<p className="sco-error">{error}</p>}
  <button className="sco-ghost" onClick={()=>db.auth.signOut()}>خروج از حساب</button>
 </div></main>;
 return <main className="sco-root">
  <div className="sco-main"><header className="sco-top"><div><small>IRANHOTEL / SUPPLY</small><h1>{({today:'مرکز فرمان امروز',hotels:'رادار هتل‌ها',tasks:'کارهای در جریان',team:'تیم و پاسخگویی',data:'ورود و سلامت داده',report:'گزارش تصمیم‌ساز',market:'هوشمندی بازار و تأمین‌کننده',commercial:'تصمیم‌های تجاری و تخفیف'} as Record<View,string>)[view]}</h1></div><div className="sco-topactions"><span className="sco-date">{new Date().toLocaleDateString('fa-IR',{weekday:'long',day:'numeric',month:'long'})}</span><button onClick={()=>void refresh()} disabled={loading} aria-label="بروزرسانی"><RefreshCw size={18} className={loading?'sco-spin':''}/></button></div></header>
  <nav className="sco-focused-nav" aria-label="مسیر اصلی کار">
    <div className="sco-focused-nav-main">
      {([['today','امروز',Target],['tasks','پیگیری‌ها',ClipboardCheck],['hotels','هتل‌ها',Building2]] as const).map(([id,label,Icon])=><button type="button" key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={18}/>{label}{id==='tasks'&&deskOpen.length>0&&<small>{fa(deskOpen.length)}</small>}</button>)}
    </div>
    <div className="sco-focused-nav-tools">
      <select aria-label="ابزارهای مدیریتی" value={['team','data','report','market','commercial'].includes(view)?view:''} onChange={e=>e.target.value&&setView(e.target.value as View)}>
        <option value="" disabled>گزارش و تنظیمات</option>
        {isManager&&<><option value="team">عملکرد تیم</option><option value="market">پایش نرخ رقبا و API Out</option><option value="commercial">تخفیف و کمپین</option><option value="report">گزارش مدیر</option><option value="data">آپلود و به‌روزرسانی داده</option></>}
      </select>
      <span className="sco-current-user">{member.full_name||session.user.email}</span>
      <button type="button" title="خروج از حساب" onClick={()=>db.auth.signOut()}><LogOut size={17}/></button>
    </div>
  </nav>
  {(error||notice)&&<div className={error?'sco-alert error':'sco-alert success'}><span>{error||notice}</span><button onClick={()=>{setError('');setNotice('')}}><X size={16}/></button></div>}
  {view==='today'&&<>{isManager&&(!staff.some(p=>p.role==='expert')||!hotels.some(h=>!!h.capacity_owner_id&&!!h.rate_owner_id)||ready.rateFresh===0||ready.onlineFresh===0||ready.sales===0)&&
  <section className="sco-kickoff">
   <div className="sco-kickoff-head"><div><span>START HERE — SUPPLY OPERATIONS</span><h3>چهار قدم برای عملیاتی‌شدن زنجیره تأمین</h3><p>هتل‌های پایه قبلاً وارد شده‌اند. قدم‌های زیر را به همین ترتیب تکمیل کن؛ سیستم هر مرحله را از داده واقعی تشخیص می‌دهد.</p></div><b>{[staff.some(p=>p.role==='expert'),hotels.some(h=>!!h.capacity_owner_id&&!!h.rate_owner_id),ready.rateFresh>0&&ready.onlineFresh>0,ready.sales>0].filter(Boolean).length.toLocaleString('fa-IR')} / ۴</b></div>
   <div className="sco-kickoff-steps">
     <button onClick={()=>setView('team')}><span className={staff.some(p=>p.role==='expert')?'done':''}>{staff.some(p=>p.role==='expert')?<Check size={18}/>:1}</span><div><b>اعضای تیم</b><small>{fa(staff.filter(p=>p.role==='expert').length)} کارشناس فعال · ایجاد حساب بدون دعوت ایمیلی</small></div><ChevronLeft size={17}/></button>
     <button onClick={()=>setView('team')}><span className={hotels.some(h=>!!h.capacity_owner_id&&!!h.rate_owner_id)?'done':''}>{hotels.some(h=>!!h.capacity_owner_id&&!!h.rate_owner_id)?<Check size={18}/>:2}</span><div><b>واگذاری مالکیت هتل‌ها</b><small>{fa(hotels.filter(h=>!!h.capacity_owner_id&&!!h.rate_owner_id).length)} هتل با هر دو مسئول نرخ و ظرفیت</small></div><ChevronLeft size={17}/></button>
     <button onClick={()=>{setView('data');setMode('availability')}}><span className={ready.rateFresh>0&&ready.onlineFresh>0?'done':''}>{ready.rateFresh>0&&ready.onlineFresh>0?<Check size={18}/>:3}</span><div><b>وضعیت آنلاین امروز</b><small>تأیید نرخ و ظرفیت ۴۸ ساعت اخیر</small></div><ChevronLeft size={17}/></button>
     <button onClick={()=>{setView('data');setMode('performance')}}><span className={ready.sales>0?'done':''}>{ready.sales>0?<Check size={18}/>:4}</span><div><b>عملکرد و رزروهای ناموفق</b><small>فروش و رزروهای از دست‌رفته با تاریخ واقعی</small></div><ChevronLeft size={17}/></button>
   </div>
  </section>}
  <CaseQueue cases={isManager?cases:cases.filter(c=>c.assignee===session?.user.id)} hotelName={key=>hotels.find(h=>h.hotel_key===key)?.name||key} onSelect={key=>{const h=scores.find(x=>x.hotel_key===key);if(h)selectHotel(h);}} limit={8}/><section className="sco-hero"><div><span className="sco-eyebrow"><Sparkles size={15}/> زنجیره تأمین نتیجه‌محور</span><h2>{isManager?'امروز کدام هتل را رشد می‌دهیم؟':'امروز کدام پیگیری را به نتیجه می‌رسانی؟'}</h2><p>هتل را انتخاب کن، یک کار مشخص به مسئول بده، نتیجه را ثبت کن؛ فردا اثرش را با داده فروش بسنج.</p><button onClick={()=>{setView(isManager?'hotels':'tasks');setFocus(isManager?'risk':'mine')}}>{isManager?'شروع از هتل‌های اولویت‌دار':'مشاهده پیگیری‌های من'} <ArrowLeft size={17}/></button></div><div className="sco-hero-graph"><b>{fa(scores.filter(h=>h.score.needsAction).length)}</b><small>هتل نیازمند اقدام</small></div></section>
   <div className="sco-stats"><IconStat title="هتل‌های ثبت‌شده" value={fa(hotels.length)} hint="فهرست پایه" icon={Hotel} color="blue"/><IconStat title="پیگیری باز" value={fa(deskOpen.length)} hint={isManager?fa(unassigned.length)+' بدون مسئول':'پیگیری‌های واگذارشده به من'} icon={ClipboardCheck} color="orange"/><IconStat title="کار معوق" value={fa(deskOverdue.length)} hint="نیازمند اقدام امروز" icon={Clock3} color="red"/><IconStat title="کار انجام‌شده" value={fa(deskTasks.filter(t=>t.status==='done').length)} hint="با نتیجه ثبت‌شده" icon={CheckCircle2} color="green"/></div>
   <section className="sco-readiness" aria-label="آمادگی داده برای تصمیم">
    <div><b>کیفیت اطلاعات برای تصمیم‌گیری</b><small>وضعیت نامشخص را ریسک قطعی فروش حساب نمی‌کنیم.</small></div>
    <span>نرخ تأییدشده ۴۸ ساعت اخیر: <strong>{fa(ready.rateFresh)} / {fa(ready.hotel)}</strong></span>
    <span>ظرفیت تأییدشده ۴۸ ساعت اخیر: <strong>{fa(ready.onlineFresh)} / {fa(ready.hotel)}</strong></span>
    <span>مالک نرخ و ظرفیت: <strong>{fa(ready.owner)} / {fa(ready.hotel)}</strong></span>
    <span>هتل‌های دارای شاخص ۳۰روزه: <strong>{ready.sales>0?fa(ready.sales):'ثبت نشده'}</strong></span>
    {isManager&&<button type="button" onClick={()=>{setMode(ready.owner===0?'owners':ready.online===0?'availability':'performance');setView('data')}}>تکمیل داده‌ها <ArrowLeft size={15}/></button>}
   </section>
   {isManager&&bulkCandidates.length>0&&<section className="sco-bulkbar">
     <div><b>برنامه اقدام سریع امروز</b><small>{fa(bulkCandidates.length)} هتل با شواهد قابل پیگیری و بدون تسک باز</small></div>
     <button type="button" onClick={()=>setBulkOpen(v=>!v)}>{bulkOpen?'بستن':'واگذاری گروهی ۱۰ هتل'} <ArrowLeft size={15}/></button>
     {bulkOpen&&<div className="sco-bulkform"><p>اقدام برای هر هتل بر اساس دلیل اولویت ساخته می‌شود. پیش‌نمایش:</p>
       <div className="sco-bulkpreview">{bulkCandidates.map(h=><span key={h.hotel_key}>{h.name}: {h.score.suggestion}</span>)}</div>
       <label>مسئول پیگیری<select value={bulkOwner} onChange={e=>setBulkOwner(e.target.value)}><option value="">انتخاب کارشناس</option>{staff.map(u=><option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}</select></label>
       <label>مهلت<input type="date" value={bulkDue} onChange={e=>setBulkDue(e.target.value)}/></label>
       <button type="button" disabled={busy||!bulkOwner} onClick={()=>void createBulkActions()}>{busy?'در حال واگذاری...':'تأیید و ساخت پیگیری‌ها'}</button>
     </div>}
   </section>}

   {!hotels.length?<div className="sco-empty"><CloudUpload size={35}/><h3>برای شروع فقط فهرست هتل‌ها را وارد کن</h3><p>بدون نیاز به هفت فایل یا تنظیمات پیچیده.</p><button onClick={()=>{setMode('hotels');setView('data')}}>آپلود فهرست هتل‌ها</button></div>:<div className="sco-two"><section className="sco-panel"><div className="sco-panelhead"><div><span>TOP OPPORTUNITIES</span><h3>اولویت‌های امروز</h3></div><button onClick={()=>{setView('hotels');setFocus('risk')}}>همه موارد <ChevronLeft size={16}/></button></div><div className="sco-hotelrows">{scores.filter(h=>h.score.needsAction).slice(0,12).map(h=><button key={h.hotel_key} onClick={()=>selectHotel(h)} className={selected===h.hotel_key?'active':''}><span className="sco-risk">{h.score.risk}</span><span className="sco-grow"><b>{h.name}</b><small>{h.city||'بدون شهر'} · {h.score.reasons[0]||'فرصت فروش'}</small></span><span className="sco-gain">فرصت {fa(h.score.opportunity)}</span><ChevronLeft size={17}/></button>)}{scores.every(h=>!h.score.needsAction)&&<div className="sco-recovery">
  <Hint>از داده فعلی نمی‌توان ریسک واقعی فروش را اثبات کرد. برای شروع روی IHO Providerهای پیشران و کلیدی، وضعیت نرخ/ظرفیت و مسئولیت‌ها را تأیید می‌کنیم.</Hint>
  <h4>شروع عملیاتی: تکمیل وضعیت هتل‌های مهم</h4>
  {recoveryQueue.slice(0,12).map(h=><button key={h.hotel_key} onClick={()=>{selectHotel(h);setTaskTitle('تأیید و تکمیل وضعیت نرخ و ظرفیت آنلاین')}}>
    <span><b>{h.name}</b><small>{h.city||'—'} · {h.category||'بدون دسته'}</small></span><span>تکمیل وضعیت</span><ChevronLeft size={16}/>
  </button>)}
  {!recoveryQueue.length&&<p>اطلاعات تکمیلی هتل‌ها را از بخش ورود داده اضافه کن.</p>}
 </div>}</div></section><section className="sco-panel"><div className="sco-panelhead"><div><span>EXECUTION</span><h3>پیگیری‌های ضروری</h3></div><button onClick={()=>setView('tasks')}>لیست کامل <ChevronLeft size={16}/></button></div><div className="sco-worklist">{deskOpen.slice().sort((a,b)=>dateDelta(a.due_date)-dateDelta(b.due_date)).slice(0,10).map(t=><button key={t.id} onClick={()=>selectTask(t)}><span className={dateDelta(t.due_date)<0?'sco-dot red':'sco-dot amber'}/><span><b>{t.title}</b><small>{hotels.find(h=>h.hotel_key===t.hotel_key)?.name||t.hotel_key} · {staff.find(s=>s.user_id===t.assignee)?.full_name||'بدون مسئول'}</small></span><em>{t.due_date||'بدون مهلت'}</em></button>)}{!deskOpen.length&&<Hint>{isManager?'اولین کار را از یک هتل اولویت‌دار بساز.':'فعلاً هیچ پیگیری بازی به شما واگذار نشده است.'}</Hint>}</div></section></div>}
  </>}
  {view==='hotels'&&<section className="sco-panel"><div className="sco-panelhead"><div><span>HOTEL INTELLIGENCE</span><h3>هتل‌ها؛ مسئله، فرصت و اقدام</h3></div><button onClick={()=>csv(visible.map(h=>({hotel_code:h.hotel_code,name:h.name,city:h.city,provider:h.provider,category:h.category,risk:h.score.risk,opportunity:h.score.opportunity,confirmed_30:h.stats?.confirmed_30,unconfirmed_30:h.stats?.unconfirmed_30,lost_30:h.stats?.lost_30,visits_30:h.stats?.visits_30,capacity_owner:h.capacity_owner,rate_owner:h.rate_owner,phone:h.reservation_phone||h.phone,action:h.score.suggestion,reason:h.score.reasons.join(' | ')})), 'IHO_Action_Plan.csv')}><Download size={16}/> خروجی اکسل/CSV</button></div><div className="sco-toolbar"><div className="sco-search"><Search size={17}/><input value={filter} placeholder="نام هتل، کد، شهر..." onChange={e=>setFilter(e.target.value)}/></div><select value={city} onChange={e=>setCity(e.target.value)}><option value="all">همه شهرها</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select><select value={focus} onChange={e=>setFocus(e.target.value as any)}><option value="risk">نیازمند اقدام</option><option value="opportunity">فرصت فروش</option><option value="all">همه هتل‌ها</option><option value="mine">پیگیری‌های من</option></select></div><div className="sco-list-meta">{fa(visible.length)} هتل · مرتب‌شده بر اساس ریسک و فرصت</div><div className="sco-table"><div className="sco-tablehead"><span>هتل</span><span>ریسک</span><span>فرصت</span><span>رزرو ۳۰ روز</span><span>اقدام پیشنهادی</span><span/></div>{visible.slice(0,250).map(h=><button className="sco-tr" key={h.hotel_key} onClick={()=>selectHotel(h)}><span className="sco-tablehotel"><b>{h.name}</b><small>{h.city} · {h.provider||'بدون تأمین‌کننده'}</small></span><b className={h.score.risk>=60?'sco-critical':''}>{fa(h.score.risk)}</b><b>{fa(h.score.opportunity)}</b><span>{fa(h.stats?.confirmed_30)}</span><span className="sco-suggest">{h.score.suggestion}</span><ChevronLeft size={17}/></button>)}</div>{visible.length>250&&<Hint>۲۵۰ هتل اول نمایش داده می‌شود. برای پیدا کردن هتل دیگر جستجو یا فیلتر کن.</Hint>}</section>}
  {view==='tasks'&&<VerifiedOutcomes db={db!} tasks={deskTasks} isManager={isManager} hotelName={key=>hotels.find(h=>h.hotel_key===key)?.name||key} assigneeName={id=>staff.find(p=>p.user_id===id)?.full_name||'بدون مسئول'} onRefresh={refresh}/>}
  {view==='tasks'&&<section className="sco-panel"><div className="sco-panelhead"><div><span>FOLLOW-UP PIPELINE</span><h3>از واگذاری تا نتیجه</h3></div><button onClick={()=>csv(deskTasks.map(t=>({hotel:hotels.find(h=>h.hotel_key===t.hotel_key)?.name,title:t.title,owner:staff.find(s=>s.user_id===t.assignee)?.full_name,status:statusName[t.status],due:t.due_date,result:t.last_result})), 'IHO_Supply_Tasks.csv')}><Download size={16}/> خروجی</button></div><div className="sco-taskgroups">{(['open','waiting','blocked','done'] as Task['status'][]).map(st=><div key={st}><div className="sco-grouphead"><b>{statusName[st]}</b><small>{fa(deskTasks.filter(t=>t.status===st).length)}</small></div>{deskTasks.filter(t=>t.status===st).slice(0,40).map(t=><button key={t.id} className="sco-taskcard" onClick={()=>selectTask(t)}><b>{t.title}</b><small>{hotels.find(h=>h.hotel_key===t.hotel_key)?.name||'هتل نامشخص'}</small><span>{staff.find(s=>s.user_id===t.assignee)?.full_name||'بدون مسئول'} · {t.due_date||'بدون مهلت'}</span></button>)}</div>)}</div></section>}
  {view==='team'&&isManager&&<section className="sco-panel"><div className="sco-panelhead"><div><span>ACCOUNTABILITY</span><h3>عملکرد واقعی تیم</h3></div><button onClick={()=>csv(teamKpis.map(m=>({name:m.full_name,hotel_portfolio:m.owned,open:m.open,done:m.done,verified:m.verified,late:m.overdue,on_time:m.onTime})), 'IHO_Team_KPIs.csv')}><Download size={16}/> خروجی</button></div><div className="sco-teamrow sco-teamtitle"><span>کارشناس</span><span>هتل تحت مسئولیت</span><span>باز</span><span>بسته</span><span>تأییدشده</span><span>معوق</span><span>به‌موقع</span></div>{teamKpis.map(p=><div className="sco-teamrow" key={p.user_id}><span><span className="sco-avatar">{p.full_name.slice(0,1)}</span><b>{p.full_name}</b><small>{p.role==='manager'?'مدیر':'کارشناس'}</small></span><strong>{fa(p.owned)}</strong><strong>{fa(p.open)}</strong><strong>{fa(p.done)}</strong><strong>{fa(p.verified)}</strong><strong className="sco-critical">{fa(p.overdue)}</strong><strong>{fa(p.onTime)}</strong></div>)}{isManager&&<TeamActivation db={db!} token={session.access_token} people={staff} hotels={hotels} onRefresh={refresh}/>} </section>}
  {view==='report'&&isManager&&<div className="sco-report"><div className="sco-reporthead"><span><BarChart3 size={20}/> گزارش روزانه مدیریت</span><button onClick={()=>navigator.clipboard.writeText(compactReport())}><ClipboardCheck size={16}/> کپی گزارش</button></div><pre>{compactReport()}</pre>{isManager&&<section className="sco-ai-brief"><div><b>تحلیل هوشمند روی اطلاعات واقعی امروز</b><small>داده‌های تجمیعی، بدون اطلاعات مهمان، فقط با کلیک تو ارسال می‌شوند.</small></div><button disabled={aiBusy} onClick={()=>void runSupplyAi()}><Sparkles size={16}/>{aiBusy?'در حال تحلیل...':'ساخت Morning Brief با AI'}</button>{aiBrief&&<pre>{aiBrief}</pre>}</section>}<div className="sco-stats"><IconStat icon={Target} title="اقدام‌پذیر" value={fa(scores.filter(h=>h.score.needsAction).length)} hint="بنا به داده موجود"/><IconStat icon={AlertCircle} title="معوق" value={fa(overdue.length)} hint="نیازمند تصمیم مدیر"/><IconStat icon={TrendingDown} title="افت رزرو" value={fa(scores.filter(h=>h.score.movement!==null&&h.score.movement<-35).length)} hint="در مقایسه با دوره قبل"/><IconStat icon={CheckCircle2} title="بسته‌شده" value={fa(tasks.filter(t=>t.status==='done').length)} hint="با ثبت اقدام"/></div><section className="sco-panel"><h3>پنج هتل اول برای اقدام مدیر</h3>{scores.slice(0,5).map(h=><button className="sco-reporthotel" key={h.hotel_key} onClick={()=>selectHotel(h)}><b>{h.name}</b><span>ریسک {fa(h.score.risk)}</span><em>{h.score.suggestion}</em><ChevronLeft size={18}/></button>)}</section></div>}
  {view==='market'&&<MarketTools db={db!} hotels={hotels} isManager={isManager}/>}
  {view==='commercial'&&<CommercialTools db={db!} hotels={hotels} isManager={isManager} userId={session.user.id}/>}
  {view==='data'&&<div className="sco-data"><div className="sco-dataIntro"><span><CloudUpload size={21}/> ورودی ساده، نتیجه قابل‌اعتماد</span><h2>از یک فایل شروع کن؛ باقی فایل‌ها اختیاری‌اند.</h2><p>هیچ رزرو خامی به دیتابیس فرستاده نمی‌شود؛ اطلاعات پیش از ذخیره در سطح هتل تجمیع می‌شوند.</p></div><section className="sco-import-templates">
  <div><b>از صفر فایل نساز</b><p>قالب‌ها با کد، نام و شهر همین هتل‌های ثبت‌شده پر شده‌اند. فقط ستون‌های خالی را تکمیل کن؛ خانه خالی اطلاعات قبلی را پاک نمی‌کند.</p></div>
  <button type="button" onClick={()=>csv(hotels.map(h=>({'کد هتل':h.hotel_code||'','نام هتل':h.name,'شهر':h.city,'مسئول ظرفیت':h.capacity_owner||'','مسئول نرخ':h.rate_owner||''})), 'IHO_Hotel_Assignment_Template.csv')} disabled={!hotels.length}><Download size={16}/> قالب مسئولان هتل</button>
  <button type="button" onClick={()=>csv(hotels.map(h=>({'کد هتل':h.hotel_code||'','نام هتل':h.name,'شهر':h.city,'ظرفیت آنلاین':h.is_online==null?'':h.is_online?'بله':'خیر','نرخ آنلاین':h.has_rate==null?'':h.has_rate?'بله':'خیر','ظرفیت':h.capacity??''})), 'IHO_Online_Rate_Capacity_Template.csv')} disabled={!hotels.length}><Download size={16}/> قالب نرخ و ظرفیت</button>
 </section>{!isManager?<Hint>ورود داده فقط با نقش مدیر مجاز است. کارشناسان می‌توانند پرونده‌ها و وظایف خود را ببینند.</Hint>:<section className="sco-panel"><div className="sco-uploadStep"><span>۱</span><div><h3>چه نوع اطلاعاتی داری؟</h3><p>برای راه‌اندازی فقط «فهرست هتل‌ها» کافی است.</p></div></div><div className="sco-modegrid">{MODES.map(m=><button key={m.id} className={mode===m.id?'active':''} onClick={()=>{setMode(m.id);setMapping(headers.length?autoMap(headers,m.id):{});setImportSummary(null)}}><b>{m.label}</b><small>{m.help}</small>{m.required&&<em>برای شروع</em>}</button>)}</div><div className="sco-uploadStep"><span>۲</span><div><h3>فایل را انتخاب کن</h3><p>Excel یا CSV؛ می‌توانی ستون‌ها را قبل از ذخیره تطبیق بدهی. برای فایل‌های چندروزه یا سالانه، ستون «تاریخ واقعی رزرو» را حتماً نگاشت کن.</p></div></div><div className="sco-filezone"><label><UploadCloud size={24}/><span>{fileLabel||'انتخاب فایل اکسل یا CSV'}</span><small>فایل روی سرور خام ذخیره نمی‌شود؛ داده‌ها تجمیع می‌شوند.</small><input type="file" accept=".xlsx,.xls,.csv" onChange={e=>void readFile(e.target.files?.[0])}/></label>{!['hotels','availability','owners'].includes(mode)&&<label>تاریخ گزارش<input type="date" value={importDate} onChange={e=>setImportDate(e.target.value)}/></label>}</div>{headers.length>0&&<><div className="sco-uploadStep"><span>۳</span><div><h3>ستون‌ها را تأیید کن</h3><p>هر ستون مقصد را به ستون صحیح فایل متصل کن؛ گزینه خالی یعنی آن شاخص وارد نمی‌شود.</p></div></div><div className="sco-mapgrid">{FIELD_SETS[mode].map(f=><label key={f}><span>{FIELDS.find(x=>x.key===f)?.label}</span><select value={mapping[f]||''} onChange={e=>setMapping(m=>({...m,[f]:e.target.value}))}><option value="">بدون ستون</option>{headers.map((h,i)=><option key={i} value={h}>{h}</option>)}</select></label>)}</div><div className="sco-preview"><h4>پیش‌نمایش ۴ ردیف نخست</h4><div>{preview.map((row,i)=><p key={i}>{clean(mapping.name?row[mapping.name]:'')||clean(mapping.code?row[mapping.code]:'')||'—'} · {clean(mapping.city?row[mapping.city]:'')}</p>)}</div></div><button className="sco-primary" onClick={()=>void startImport()} disabled={busy||!mapping.name&&!mapping.code}>{busy?'در حال ثبت...':'تأیید و ثبت داده‌های تطبیق‌یافته'} <ArrowLeft size={17}/></button></>}{progress&&<div className="sco-progress"><Activity size={17}/>{progress}</div>}{importSummary&&<div className="sco-successdata"><Check size={20}/> {fa(importSummary.saved)} هتل ذخیره شد. {fa(importSummary.rejected)} ردیف نامنطبق. {importSummary.samples.length>0&&<small>نمونه ردیف‌های نامنطبق: {importSummary.samples.slice(0,3).join('، ')}</small>}</div>}</section>}<section className="sco-panel"><h3>تاریخچه ورود داده</h3>{imports.slice(0,12).map(i=><div className="sco-importitem" key={i.id}><FileSpreadsheet size={18}/><span><b>{MODES.find(m=>m.id===i.source)?.label||i.source}</b><small>{i.file_name}</small></span><em>{fa(i.rows_saved)} هتل · {fa(i.rows_rejected)} ردیف نامنطبق</em><small>{String(i.created_at).slice(0,10)}</small></div>)}{!imports.length&&<Hint>هنوز فایلی در نسخه جدید وارد نشده است.</Hint>}</section></div>}
  </div>
  {selection&&<div className="sco-backdrop" onClick={()=>setSelected(null)}><div className="sco-drawer" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true"><header><button onClick={()=>setSelected(null)}><X size={20}/></button><span className="sco-drawerlabel">HOTEL 360 / اقدام</span><h2>{selection.name}</h2><p>{selection.city||'شهر نامشخص'} · {selection.provider||'بدون تأمین‌کننده'} · {selection.category||'بدون دسته‌بندی'}</p></header><div className="sco-drawbody"><div className="sco-scorecards"><div><small>ریسک</small><b>{fa(selection.score.risk)}</b></div><div><small>فرصت</small><b>{fa(selection.score.opportunity)}</b></div><div><small>رزرو ۳۰ روز</small><b>{fa(selection.stats?.confirmed_30)}</b></div></div><section><div className="sco-case-actions"><h3>اختلالات این هتل</h3><span>{fa(cases.filter(c=>c.hotel_key===selection.hotel_key&&c.status!=='resolved').length)} پرونده باز</span>{isManager&&<button type="button" onClick={()=>setCaseOpen(v=>!v)}>{caseOpen?'بستن فرم':'ثبت مشکل + واگذاری سریع'}</button>}</div>
 {isManager&&<CaseCreate key={selection.hotel_key} db={db!} hotel={{hotel_key:selection.hotel_key,name:selection.name,provider:selection.provider||''}} staff={staff} enabled={caseOpen} suggestedAssignee={selection.capacity_owner_id||selection.rate_owner_id||selection.commercial_owner_id||session.user.id} onCreated={()=>{setNotice('پرونده و تسک با SLA ثبت شد.');void refresh()}} onClose={()=>setCaseOpen(false)}/>}
 {cases.filter(c=>c.hotel_key===selection.hotel_key).slice(0,8).map(c=><div key={c.id} className="sco-case-mini"><b>{c.severity.toUpperCase()} · {c.issue_type}</b><span>{c.description}</span><small>{c.status==='resolved'?'رفع شده':c.due_at&&new Date(c.due_at)<new Date()?'SLA گذشته':'در جریان'}</small></div>)}
 </section><section><div className="sco-profilehead"><h3>وضعیت عملیاتی هتل</h3>{isManager&&<button onClick={()=>setEditHotel(v=>!v)}>{editHotel?'بستن':'ویرایش سریع'}</button>}</div>{editHotel?<div className="sco-quickform"><label>ظرفیت آنلاین<select value={onlineDraft} onChange={e=>setOnlineDraft(e.target.value)}><option value="unknown">نامشخص</option><option value="yes">فعال</option><option value="no">غیرفعال</option></select></label><label>نرخ آنلاین<select value={rateDraft} onChange={e=>setRateDraft(e.target.value)}><option value="unknown">نامشخص</option><option value="yes">فعال</option><option value="no">غیرفعال</option></select></label><label>ظرفیت<input value={capacityDraft} onChange={e=>setCapacityDraft(e.target.value)} inputMode="numeric"/></label><label>مسئول ظرفیت (کاربر سیستم)<select value={capacityOwnerIdDraft} onChange={e=>{setCapacityOwnerIdDraft(e.target.value);if(e.target.value)setCapacityOwnerDraft(staff.find(u=>u.user_id===e.target.value)?.full_name||'')}}><option value="">بدون تخصیص سیستمی</option>{staff.map(u=><option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}</select></label><label>مسئول نرخ (کاربر سیستم)<select value={rateOwnerIdDraft} onChange={e=>{setRateOwnerIdDraft(e.target.value);if(e.target.value)setRateOwnerDraft(staff.find(u=>u.user_id===e.target.value)?.full_name||'')}}><option value="">بدون تخصیص سیستمی</option>{staff.map(u=><option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}</select></label><label>مالک تجاری هتل<select value={commercialOwnerIdDraft} onChange={e=>setCommercialOwnerIdDraft(e.target.value)}><option value="">بدون مالک تجاری</option>{staff.map(u=><option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}</select></label><label className="sco-confirm-freshness"><input type="checkbox" checked={verifyStatus} onChange={e=>setVerifyStatus(e.target.checked)}/> صحت وضعیت نرخ و ظرفیت را امروز بررسی و تأیید کرده‌ام</label><label>نام مسئول ظرفیت (در فایل)<input value={capacityOwnerDraft} onChange={e=>setCapacityOwnerDraft(e.target.value)}/></label><label>نام مسئول نرخ (در فایل)<input value={rateOwnerDraft} onChange={e=>setRateOwnerDraft(e.target.value)}/></label><button className="sco-primary" disabled={busy} onClick={()=>void saveHotelStatus()}>ذخیره تغییرات هتل <Check size={16}/></button></div>:<div className="sco-quickview"><span>ظرفیت آنلاین: <b>{selection.is_online==null?'نامشخص':selection.is_online?'فعال':'غیرفعال'}</b></span><span>نرخ آنلاین: <b>{selection.has_rate==null?'نامشخص':selection.has_rate?'فعال':'غیرفعال'}</b></span><span>ظرفیت: <b>{selection.capacity==null?'نامشخص':fa(selection.capacity)}</b></span></div><small className="sco-muted">آخرین تأیید ظرفیت: {selection.capacity_verified_at?new Date(selection.capacity_verified_at).toLocaleDateString('fa-IR'):'ثبت نشده'} · تأیید نرخ: {selection.rate_verified_at?new Date(selection.rate_verified_at).toLocaleDateString('fa-IR'):'ثبت نشده'}</small>}</section><section className="sco-hotel-contact">
  <h3>تماس سریع با هتل</h3>
  <div className="sco-contact-links">
    {selection.reservation_phone&&<a href={callHref(selection.reservation_phone)}> <Phone size={16}/> رزرو: {selection.reservation_phone}</a>}
    {selection.phone&&selection.phone!==selection.reservation_phone&&<a href={callHref(selection.phone)}><Phone size={16}/> هتل: {selection.phone}</a>}
    {selection.manager_mobile&&<a href={callHref(selection.manager_mobile)}><Phone size={16}/> مدیر: {selection.manager_mobile}</a>}
  </div>
  {!selection.phone&&!selection.reservation_phone&&!selection.manager_mobile&&<p className="sco-muted">شماره تماس این هتل ثبت نشده است.</p>}
  {selection.contact_import_source==='legacy_verified_code'&&<small>اطلاعات تماس از نسخه قبلی بازیابی شده؛ قبل از تماس صحت شماره را بررسی کن.</small>}
  {selection.contract_status&&<p className="sco-muted">وضعیت قرارداد: {selection.contract_status}</p>}
 </section><section><h3>چرا باید اقدام کنیم؟</h3>{selection.score.reasons.length?selection.score.reasons.map((r,i)=><p key={i} className="sco-reason"><AlertCircle size={15}/>{r}</p>):<Hint>فعلاً نشانه‌ای از ریسک قطعی نداریم؛ داده بیشتر وارد کن.</Hint>}<div className="sco-drawfacts"><span>مسئول ظرفیت: <b>{selection.capacity_owner||'ثبت نشده'}</b></span><span>مسئول نرخ: <b>{selection.rate_owner||'ثبت نشده'}</b></span><span>آنلاین: <b>{selection.is_online===null||selection.is_online===undefined?'نامشخص':selection.is_online?'بله':'خیر'}</b></span></div></section>{editingTask?<section><h3>ثبت نتیجه پیگیری</h3><p className="sco-muted">{tasks.find(t=>t.id===editingTask)?.title}</p><label>وضعیت<select value={taskStatus} onChange={e=>setTaskStatus(e.target.value as Task['status'])}>{(['open','waiting','blocked','done'] as Task['status'][]).map(s=><option value={s} key={s}>{statusName[s]}</option>)}</select></label><label>نوع نتیجه<select value={taskOutcome} onChange={e=>setTaskOutcome(e.target.value)}>{outcomeList.map(x=><option key={x}>{x}</option>)}</select></label><label>چه اقدامی شد؟<textarea value={resultNote} onChange={e=>setResultNote(e.target.value)} rows={4} placeholder="با هتل تماس گرفتم؛ نتیجه، مانع و قدم بعدی..."/></label><button className="sco-primary" disabled={busy||resultNote.trim().length<8} onClick={()=>void saveResult()}>ثبت نتیجه اقدام <Check size={17}/></button><button className="sco-inline" onClick={()=>setEditingTask(null)}>بازگشت به تعریف اقدام</button></section>:<section><h3>اقدام بعدی</h3><p className="sco-muted">پیشنهاد سیستم: {selection.score.suggestion}</p>{isManager?<><div className="sco-action-presets">{ACTION_PRESETS.map(label=><button key={label} type="button" className={taskTitle===label?'active':''} onClick={()=>setTaskTitle(label)}>{label}</button>)}</div><label>اقدام مشخص<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/></label><label>مسئول پیگیری<select value={taskOwner} onChange={e=>setTaskOwner(e.target.value)}><option value="">انتخاب مسئول</option>{staff.map(u=><option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}</select></label><label>مهلت<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label><button className="sco-primary" disabled={busy||!taskOwner||!taskTitle} onClick={()=>void createTask()}>واگذاری این اقدام <ArrowLeft size={17}/></button></>:<Hint>کارشناس فقط نتیجه تسک‌های واگذارشده را ثبت می‌کند.</Hint>}</section>}<section><h3>تسک‌های این هتل</h3>{selection.tasks.map(t=><button className="sco-mini-task" key={t.id} onClick={()=>selectTask(t)}><b>{t.title}</b><small>{statusName[t.status]} · {staff.find(s=>s.user_id===t.assignee)?.full_name||'بدون مسئول'}</small><ChevronLeft size={15}/></button>)}{!selection.tasks.length&&<p className="sco-muted">هنوز تسکی ندارد.</p>}</section><section><h3>تاریخچه واقعی اقدامات</h3>{events.map(e=><div className="sco-event" key={e.id}><span/><div><small>{new Date(e.created_at).toLocaleDateString('fa-IR')} · {staff.find(m=>m.user_id===e.actor)?.full_name||'سیستم'}</small><p>{e.details}</p></div></div>)}{!events.length&&<p className="sco-muted">اقدامی ثبت نشده است.</p>}</section></div></div></div>}
 </main>;
}

'use client';
import React,{useEffect,useMemo,useState,useCallback} from 'react';
import {createClient} from '@supabase/supabase-js';
import {Activity,AlertTriangle,ArrowRight,BarChart3,Building2,Check,CheckCircle2,ClipboardList,Clock,Download,Filter,Hotel,LoaderCircle,Plus,RefreshCw,Search,ShieldAlert,Target,Users,X} from 'lucide-react';
import './operations.css';
type HotelRow={hotel_key:string;name:string;city?:string;hotel_code?:string|number;provider?:string;category?:string;is_online?:boolean|null;has_rate?:boolean|null;capacity_owner?:string|null;rate_owner?:string|null;commercial_owner_id?:string|null;rate_owner_id?:string|null;capacity_owner_id?:string|null};
type TaskRow={id:string;hotel_key:string;title:string;type:string;assignee:string|null;created_by:string|null;priority:'urgent'|'high'|'normal';status:'open'|'waiting'|'blocked'|'done';due_date:string|null;last_result:string|null;outcome:string|null;created_at:string;updated_at:string;completed_at:string|null;verified_at?:string|null};
type Member={user_id:string;full_name:string;role:string;active:boolean};
type Metric={hotel_key:string;confirmed_30?:number;lost_30?:number;unconfirmed_30?:number;visits_30?:number};
const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
const client=endpoint&&anon?createClient(endpoint,anon):null;
const day=()=>new Date().toLocaleDateString('en-CA');
const labels={open:'باز',waiting:'منتظر هتل',blocked:'نیازمند تصمیم',done:'انجام‌شده'};
const grades={urgent:'بحرانی',high:'بالا',normal:'عادی'};
const fmt=(v:number)=>v.toLocaleString('fa-IR');
const diff=(s:string|null)=>s?Math.floor((new Date(s+'T23:59:59').getTime()-Date.now())/86400000):999;
async function loadRows(table:string,max=15000){
 if(!client)return [];
 const result:any[]=[];
 for(let i=0;i<max;i+=1000){
  const {data,error}=await client.from(table).select('*').range(i,Math.min(i+999,max-1));
  if(error)throw error;
  result.push(...(data||[]));
  if(!data||data.length<1000)break;
 }
 return result;
}
function exportCsv(rows:(string|number)[][],filename:string){
 const escape=(value:string|number)=>'"'+String(value??'').replace(/"/g,'""')+'"';
 const csv='\uFEFF'+rows.map(row=>row.map(escape).join(',')).join('\r\n');
 const a=document.createElement('a');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
export default function Operations(){
 const [user,setUser]=useState(''),[me,setMe]=useState<Member|null>(null),[ready,setReady]=useState(false);
 const [hotels,setHotels]=useState<HotelRow[]>([]),[tasks,setTasks]=useState<TaskRow[]>([]),[team,setTeam]=useState<Member[]>([]),[metrics,setMetrics]=useState<Metric[]>([]);
 const [tab,setTab]=useState<'priority'|'tasks'|'hotels'|'team'>('priority');
 const [query,setQuery]=useState(''),[state,setState]=useState('active'),[owner,setOwner]=useState('all'),[loading,setLoading]=useState(false);
 const [selected,setSelected]=useState<HotelRow|null>(null),[taskTitle,setTaskTitle]=useState(''),[assignee,setAssignee]=useState(''),[priority,setPriority]=useState<TaskRow['priority']>('high'),[due,setDue]=useState(day()),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const manager=me?.role==='manager';
 const sync=useCallback(async()=>{
  if(!client)return;setLoading(true);
  try{
   const [hh,tt,mm,rr]=await Promise.all([loadRows('sco_hotels'),loadRows('sco_tasks',12000),loadRows('sco_members',2000),loadRows('sco_hotel_rollup')]);
   setHotels(hh as HotelRow[]);setTasks(tt as TaskRow[]);setTeam(mm as Member[]);setMetrics(rr as Metric[]);setMessage('');
  }catch(e:any){setMessage('خطا در همگام‌سازی: '+String(e.message||e));}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  if(!client){setReady(true);return;}
  let alive=true;
  client.auth.getUser().then(async({data})=>{
   if(!alive)return;
   const id=data.user?.id||'';setUser(id);
   if(id){
    const {data:membership}=await client!.from('sco_members').select('*').eq('user_id',id).maybeSingle();
    if(!alive)return;
    setMe(membership?.active?membership as Member:null);
   }
   setReady(true);
  }).catch(()=>setReady(true));
  return()=>{alive=false};
 },[]);
 useEffect(()=>{if(me)void sync()},[me,sync]);
 const members=team.filter(x=>x.active);
 const names=useMemo(()=>Object.fromEntries(members.map(m=>[m.user_id,m.full_name])),[members]);
 const byHotel=useMemo(()=>{
  const map=new Map<string,TaskRow[]>();
  tasks.forEach(t=>{const list=map.get(t.hotel_key)||[];list.push(t);map.set(t.hotel_key,list)});
  return map;
 },[tasks]);
 const rollup=useMemo(()=>new Map(metrics.map(x=>[x.hotel_key,x])),[metrics]);
 const queue=useMemo(()=>hotels.map(h=>{
  const m=rollup.get(h.hotel_key),list=byHotel.get(h.hotel_key)||[];
  const late=list.filter(t=>t.status!=='done'&&diff(t.due_date)<0).length;
  const open=list.filter(t=>t.status!=='done').length;
  const lost=Number(m?.lost_30||0),unconfirmed=Number(m?.unconfirmed_30||0);
  const visits=Number(m?.visits_30||0),confirmed=Number(m?.confirmed_30||0);
  const missingRate=h.has_rate!==true,missingOnline=h.is_online!==true;
  // Explicitly score missing operational data as a hypothesis, not evidence of lost sales.
  const score=Math.min(100,Math.round(Math.min(35,lost*4)+Math.min(20,unconfirmed*2)+Math.min(15,late*8)+(missingRate?10:0)+(missingOnline?10:0)+(open?Math.min(10,open*3):0)));
  const opportunity=Math.min(100,Math.round(Math.min(45,visits/10)+Math.min(25,unconfirmed*2)+Math.min(20,lost*2)+(missingRate?10:0)));
  const reasons=[lost?fmt(lost)+' رزرو از دست‌رفته':'',unconfirmed?fmt(unconfirmed)+' غیرقطعی':'',missingRate?'نرخ نامشخص/غیرفعال':'',missingOnline?'ظرفیت آنلاین نامشخص/غیرفعال':'',late?fmt(late)+' تسک معوق':''].filter(Boolean);
  return {...h,score,opportunity,open,late,lost,unconfirmed,confirmed,visits,reasons,uncertain:!m};
 }).sort((a,b)=>b.score-a.score||b.opportunity-a.opportunity),[hotels,rollup,byHotel]);
 const live=tasks.filter(t=>t.status!=='done');
 const visibleTasks=tasks.filter(t=>(manager||t.assignee===user)&&
  (state==='all'||(state==='active'?t.status!=='done':state==='late'?t.status!=='done'&&diff(t.due_date)<0:t.status===state))&&
  (owner==='all'||t.assignee===owner)&&
  (!query||[t.title,hotels.find(h=>h.hotel_key===t.hotel_key)?.name].join(' ').toLowerCase().includes(query.toLowerCase()))
 ).sort((a,b)=>Number(diff(a.due_date))-Number(diff(b.due_date)));
 const visibleHotels=queue.filter(h=>(owner==='all'||[h.commercial_owner_id,h.capacity_owner_id,h.rate_owner_id].includes(owner)||byHotel.get(h.hotel_key)?.some(t=>t.assignee===owner))&&(!query||[h.name,h.city,h.hotel_code,h.provider].join(' ').toLowerCase().includes(query.toLowerCase())));
 const mine=tasks.filter(t=>t.assignee===user&&t.status!=='done');
 const late=live.filter(t=>diff(t.due_date)<0);
 const unowned=live.filter(t=>!t.assignee);
 async function mutate(id:string,patch:Partial<TaskRow>){
  if(!client)return;
  setBusy(true);
  const before=tasks;
  setTasks(prev=>prev.map(t=>t.id===id?{...t,...patch}:t));
  const {data,error}=await client.from('sco_tasks').update({...patch,updated_at:new Date().toISOString()}).eq('id',id).select('id').maybeSingle();
  if(error||!data){setTasks(before);setMessage('تغییر ذخیره نشد؛ دسترسی یا سیاست امنیتی جدول را بررسی کنید. '+(error?.message||''));}
  else{setMessage('تغییر ذخیره شد.');await sync();}
  setBusy(false);
 }
 async function addTask(e:React.FormEvent){
  e.preventDefault();if(!client||!selected||!taskTitle.trim())return;
  setBusy(true);
  const row={hotel_key:selected.hotel_key,title:taskTitle.trim(),type:'operational',assignee:assignee||user,created_by:user,priority,status:'open',due_date:due,last_result:null,outcome:null};
  const {error}=await client.from('sco_tasks').insert(row);
  if(error)setMessage('ثبت تسک ناموفق: '+error.message);
  else{setSelected(null);setTaskTitle('');await sync();}
  setBusy(false);
 }
 const teamStats=members.map(m=>({m,open:live.filter(t=>t.assignee===m.user_id).length,late:late.filter(t=>t.assignee===m.user_id).length,done:tasks.filter(t=>t.assignee===m.user_id&&t.status==='done').length,verified:tasks.filter(t=>t.assignee===m.user_id&&t.verified_at).length}));
 function toCsv(){exportCsv([['شناسه هتل','نام هتل','شهر','مسئول','عنوان اقدام','اولویت','وضعیت','موعد','نتیجه'],...visibleTasks.map(t=>[t.hotel_key,hotels.find(h=>h.hotel_key===t.hotel_key)?.name||'',hotels.find(h=>h.hotel_key===t.hotel_key)?.city||'',names[t.assignee||'']||'',t.title,grades[t.priority],labels[t.status],t.due_date||'',t.last_result||''])],'IHO-operations-'+day()+'.csv')}
 const pickHotel=(h:HotelRow)=>{setSelected(h);setAssignee(h.commercial_owner_id||h.capacity_owner_id||h.rate_owner_id||user);setTaskTitle('پیگیری نرخ، ظرفیت و تبدیل فروش '+h.name);setDue(day());setPriority('high')};
 if(!ready)return <main className="op-auth">در حال بررسی دسترسی…</main>;
 if(!client)return <main className="op-auth">اتصال پایگاه داده تعریف نشده است. تنظیمات Supabase پروژه را بررسی کنید.</main>;
 if(!user||!me)return <main className="op-auth"><h2>دسترسی به مرکز عملیات</h2><p>با حساب فعال زنجیره تأمین وارد شوید.</p><a href="/supply-os">ورود از پنل اصلی ←</a></main>;
 return <main className="op-root" dir="rtl">
  <aside className="op-side"><div className="op-brand"><span className="op-logo"><Hotel size={23}/></span><div><b>ایران‌هتل</b><small>SUPPLY COMMAND CENTER</small></div></div>
   <div className="op-side-label">عملیات روزانه</div>
   {([['priority','اتاق فرمان',Target],['tasks','مدیریت تسک',ClipboardList],['hotels','فرصت‌های هتل',Building2],['team','عملکرد تیم',Users]] as const).map(([key,label,Icon])=><button key={key} className={'op-nav '+(tab===key?'active':'')} onClick={()=>{setTab(key);setQuery('')}}><Icon size={19}/>{label}</button>)}
   <div className="op-divider"/>
   <a className="op-external" href="/supply-os">پنل اصلی زنجیره تأمین <ArrowRight size={15}/></a>
   <a className="op-external" href="/reservation-intelligence">هوشمندی رزرو <ArrowRight size={15}/></a>
   <div className="op-sidebar-bottom"><div className="op-avatar">{me.full_name.slice(0,1)}</div><div><strong>{me.full_name}</strong><small>{manager?'مدیر زنجیره تأمین':'کارشناس تأمین'}</small></div></div>
  </aside>
  <section className="op-main">
   <header className="op-top"><div><div className="op-breadcrumb">زنجیره تأمین / مرکز عملیات</div><h1>{tab==='priority'?'اتاق فرمان امروز':tab==='tasks'?'پیگیری‌ها و تسک‌ها':tab==='hotels'?'اولویت‌بندی هتل‌ها':'عملکرد کارشناسان'}</h1><p>اقدام مشخص، مسئول مشخص، موعد مشخص و نتیجه قابل سنجش</p></div>
    <div className="op-actions"><span className="op-live"><span/> متصل به داده عملیاتی</span><button className="op-button light" onClick={()=>void sync()} disabled={loading}><RefreshCw size={16} className={loading?'op-spin':''}/> بروزرسانی</button><button className="op-button light" onClick={toCsv}><Download size={16}/> خروجی تسک</button></div></header>
   {message&&<div className="op-notice"><AlertTriangle size={16}/>{message}<button onClick={()=>setMessage('')}><X size={16}/></button></div>}
   <div className="op-kpis">
    <article><span><Hotel size={20}/></span><small>هتل‌های مرجع</small><strong>{fmt(hotels.length)}</strong><em>از پایگاه داده اصلی</em></article>
    <article><span><ClipboardList size={20}/></span><small>تسک باز</small><strong>{fmt(manager?live.length:mine.length)}</strong><em>پیگیری‌های در جریان</em></article>
    <article><span className="danger"><Clock size={20}/></span><small>تسک معوق</small><strong>{fmt(manager?late.length:mine.filter(t=>diff(t.due_date)<0).length)}</strong><em>نیازمند اقدام امروز</em></article>
    <article><span><ShieldAlert size={20}/></span><small>بدون مسئول</small><strong>{fmt(unowned.length)}</strong><em>نیازمند تعیین مالک</em></article>
   </div>
   {tab==='priority'&&<><div className="op-section-title"><div><h2>اولویت‌های اجرایی امروز</h2><p>مرتب‌شده بر اساس رزروهای ازدست‌رفته، غیرقطعی، نرخ/ظرفیت و تاخیر اقدام</p></div><button className="op-button" onClick={()=>{setTab('hotels')}}>مشاهده همه هتل‌ها <ArrowRight size={16}/></button></div><div className="op-split"><div className="op-panel"><div className="op-panel-head"><strong>هتل‌های نیازمند اقدام</strong><span>TOP 12</span></div><div className="op-hotel-list">{visibleHotels.slice(0,12).map(h=><div className="op-hotel" key={h.hotel_key}><div className="op-risk" data-level={h.score>=50?'high':'medium'}>{fmt(h.score)}</div><div className="op-hotel-info"><b>{h.name}</b><small>{h.city||'بدون شهر'} · {h.reasons.slice(0,2).join(' · ')||'بررسی کیفیت داده'}</small></div><button onClick={()=>pickHotel(h)}>ایجاد اقدام <Plus size={14}/></button></div>)}</div></div>
    <div className="op-panel"><div className="op-panel-head"><strong>تسک‌های فوری</strong><button onClick={()=>setTab('tasks')}>همه موارد</button></div><div className="op-quick-list">{live.filter(t=>manager||t.assignee===user).sort((a,b)=>diff(a.due_date)-diff(b.due_date)).slice(0,9).map(t=><div className="op-quick" key={t.id}><div><b>{t.title}</b><small>{hotels.find(h=>h.hotel_key===t.hotel_key)?.name||t.hotel_key} · {names[t.assignee||'']||'بدون مسئول'}</small></div><span className={diff(t.due_date)<0?'op-overdue':'op-date'}>{diff(t.due_date)<0?'معوق':t.due_date||'بدون موعد'}</span><button title="انجام شد" disabled={busy} onClick={()=>void mutate(t.id,{status:'done',completed_at:new Date().toISOString()})}><Check size={17}/></button></div>)}</div></div></div></>}
   {(tab==='tasks'||tab==='hotels')&&<><div className="op-toolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجوی هتل، شناسه یا تسک…"/></label>{tab==='tasks'&&<select value={state} onChange={e=>setState(e.target.value)}><option value="active">تسک‌های باز</option><option value="late">معوق</option><option value="open">اقدام نشده</option><option value="waiting">منتظر هتل</option><option value="blocked">نیازمند تصمیم</option><option value="done">انجام‌شده</option><option value="all">همه وضعیت‌ها</option></select>}{manager&&<select value={owner} onChange={e=>setOwner(e.target.value)}><option value="all">همه کارشناسان</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select>}<span className="op-count">{fmt(tab==='tasks'?visibleTasks.length:visibleHotels.length)} مورد</span></div>
   {tab==='tasks'?<div className="op-panel op-scroll"><table className="op-table"><thead><tr><th>تسک و هتل</th><th>مسئول</th><th>اولویت</th><th>موعد</th><th>وضعیت</th><th>اقدام</th></tr></thead><tbody>{visibleTasks.slice(0,500).map(t=><tr key={t.id}><td><b>{t.title}</b><small>{hotels.find(h=>h.hotel_key===t.hotel_key)?.name||t.hotel_key}</small></td><td>{manager?<select value={t.assignee||''} onChange={e=>void mutate(t.id,{assignee:e.target.value||null})} disabled={busy}><option value="">بدون مسئول</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select>:names[t.assignee||'']||'بدون مسئول'}</td><td><span className={'op-pill '+t.priority}>{grades[t.priority]}</span></td><td className={diff(t.due_date)<0&&t.status!=='done'?'op-overdue':''}>{t.due_date||'—'}</td><td><select value={t.status} disabled={busy} onChange={e=>void mutate(t.id,{status:e.target.value as TaskRow['status'],...(e.target.value==='done'?{completed_at:new Date().toISOString()}:{})})}>{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td><td><button onClick={()=>{const h=hotels.find(h=>h.hotel_key===t.hotel_key);if(h)pickHotel(h)}}>تسک جدید +</button></td></tr>)}</tbody></table></div>:<div className="op-panel op-scroll"><table className="op-table"><thead><tr><th>هتل</th><th>شهر</th><th>ریسک عملیاتی</th><th>فرصت</th><th>رزروهای از‌دست‌رفته</th><th>تسک باز</th><th>اقدام</th></tr></thead><tbody>{visibleHotels.slice(0,500).map(h=><tr key={h.hotel_key}><td><b>{h.name}</b><small>کد {h.hotel_code||h.hotel_key} · {h.provider||'—'}</small></td><td>{h.city||'—'}</td><td><span className={'op-pill '+(h.score>=50?'urgent':'normal')}>{fmt(h.score)} / ۱۰۰</span></td><td>{fmt(h.opportunity)}</td><td>{h.uncertain?'داده موجود نیست':fmt(h.lost)}</td><td>{fmt(h.open)}</td><td><button onClick={()=>pickHotel(h)}>تعریف اقدام +</button></td></tr>)}</tbody></table></div>}</>}
   {tab==='team'&&<div className="op-panel op-scroll"><div className="op-panel-head"><strong>وضعیت عملکرد تیم</strong><small>اعداد بر مبنای تسک‌های ثبت‌شده، نه حجم فروش قطعی</small></div><table className="op-table"><thead><tr><th>کارشناس</th><th>تسک باز</th><th>معوق</th><th>انجام‌شده</th><th>تاییدشده</th><th>نرخ اتمام</th></tr></thead><tbody>{teamStats.map(({m,open,late,done,verified})=><tr key={m.user_id}><td><b>{m.full_name}</b></td><td>{fmt(open)}</td><td className={late?'op-overdue':''}>{fmt(late)}</td><td>{fmt(done)}</td><td>{fmt(verified)}</td><td><div className="op-progress"><span style={{width:Math.round(done/Math.max(open+done,1)*100)+'%'}}/></div>{Math.round(done/Math.max(open+done,1)*100)}٪</td></tr>)}</tbody></table></div>}
   <footer className="op-footer">شاخص ریسک، امتیاز عملیاتی پیشنهادی است؛ نبود داده نرخ یا ظرفیت معادل قطعی نبودن موجودی نیست. پایگاه داده و تایید نهایی نتایج از پنل مرکزی انجام می‌شود.</footer>
  </section>
  {selected&&<div className="op-modal-back" onMouseDown={()=>setSelected(null)}><section className="op-modal" onMouseDown={e=>e.stopPropagation()}><button className="op-close" onClick={()=>setSelected(null)}><X size={19}/></button><div className="op-modal-eyebrow">تسک جدید برای هتل</div><h2>{selected.name}</h2><p>{selected.city||'—'} · کد {selected.hotel_code||selected.hotel_key}</p><form onSubmit={addTask}><label>عنوان اقدام<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required/></label><label>مسئول اجرا<select value={assignee} onChange={e=>setAssignee(e.target.value)} required>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></label><div className="op-modal-grid"><label>اولویت<select value={priority} onChange={e=>setPriority(e.target.value as TaskRow['priority'])}><option value="urgent">بحرانی</option><option value="high">بالا</option><option value="normal">عادی</option></select></label><label>مهلت<input type="date" value={due} onChange={e=>setDue(e.target.value)} required/></label></div><button type="submit" className="op-button op-submit" disabled={busy||!taskTitle.trim()}>{busy?<LoaderCircle size={17} className="op-spin"/>:<Plus size={17}/>} ثبت و تخصیص تسک</button></form></section></div>}
 </main>;
}

'use client';
import {useCallback,useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {AlertTriangle,Clock3,ClipboardCheck,RefreshCw,ShieldAlert} from 'lucide-react';
type Staff={user_id:string;full_name:string;role:string;active:boolean};
type Incident={id:string;hotel_key:string;rule_code:string;severity:string;description:string;sla_due_at:string|null;escalation_level:number;action_task_id:string|null;created_at:string;sco_hotels:{name:string;city:string;category:string}|null};
type Health={watchdog_health:string;last_scheduler_scan:string|null;open_alerts:number;unassigned_alerts:number;sla_breaches:number;escalated_alerts:number};
const fmt=(v:string|null)=>v?new Date(v).toLocaleString('fa-IR'):'نامشخص';
const today=()=>new Date().toLocaleDateString('en-CA');
export default function IncidentInbox({db,staff,onChanged}:{db:SupabaseClient;staff:Staff[];onChanged:()=>void}){
 const [health,setHealth]=useState<Health|null>(null),[rows,setRows]=useState<Incident[]>([]),[total,setTotal]=useState(0),[filter,setFilter]=useState('unassigned'),[page,setPage]=useState(0);
 const [selected,setSelected]=useState<Incident|null>(null),[events,setEvents]=useState<{id:number;event_kind:string;note:string;created_at:string}[]>([]);
 const [owner,setOwner]=useState(''),[due,setDue]=useState(today()),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{
  const [h,r]=await Promise.all([db.from('sco_control_health_v27').select('*').single(),(async()=>{
   let q=db.from('sco_control_alerts').select('id,hotel_key,rule_code,severity,description,sla_due_at,escalation_level,action_task_id,created_at,sco_hotels(name,city,category)',{count:'exact'}).eq('status','open');
   if(filter==='unassigned')q=q.is('action_task_id',null);
   if(filter==='overdue')q=q.lt('sla_due_at',new Date().toISOString());
   if(filter==='escalated')q=q.gt('escalation_level',0);
   return q.order('escalation_level',{ascending:false}).order('sla_due_at',{ascending:true}).range(page*20,page*20+19);
  })()]);
  if(h.error||r.error){setError(h.error?.message||r.error?.message||'خطا');return}
  setHealth(h.data as Health);setRows((r.data||[]) as unknown as Incident[]);setTotal(r.count||0);
 },[db,filter,page]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{if(!selected){setEvents([]);return}
 db.from('sco_control_alert_events').select('id,event_kind,note,created_at').eq('alert_id',selected.id).order('created_at',{ascending:false}).limit(20).then(({data})=>setEvents(data||[]));
 },[db,selected]);
 function open(a:Incident){setSelected(a);setOwner(staff.find(s=>s.active&&s.role==='expert')?.user_id||staff.find(s=>s.active)?.user_id||'');setDue(today());setNote('');setError('');}
 async function assign(){if(!selected||!owner)return;setBusy(true);setError('');
  const {data,error:e}=await db.rpc('sco_accept_control_alert_v27',{p_alert:selected.id,p_assignee:owner,p_due:due,p_note:note.trim()});
  setBusy(false);if(e){setError(e.message);return}
  setMessage(data?.created?'تسک با مسئول مشخص و تاریخچه ثبت شد.':'این هشدار از قبل تسک دارد.');
  setSelected(null);await load();onChanged();
 }
 return <section className="sco-incident"><div className="sco-incident-head">
 <div><h3><ShieldAlert size={20}/> صندوق هشدار و SLA</h3><p>هر مورد تا انتساب به تسک واقعی و بررسی رفع مسئله قابل ردیابی است.</p></div>
 <button onClick={()=>void load()} type="button"><RefreshCw size={17}/> به‌روزرسانی</button></div>
 {health&&<><div className={health.watchdog_health==='operational'?'sco-incident-health':'sco-incident-health warning'}>
 <Clock3 size={17}/><span>{health.watchdog_health==='operational'?'پایش روزانه ثبت شده':'پایش زمان‌بندی‌شده نیازمند بررسی است'} · آخرین گزارش: {fmt(health.last_scheduler_scan)}</span></div>
 <div className="sco-incident-numbers">{[['باز',health.open_alerts],['بدون مسئول اقدام',health.unassigned_alerts],['عبور از SLA',health.sla_breaches],['ارجاع‌شده',health.escalated_alerts]].map(([label,n])=><div key={label}><small>{label}</small><b>{Number(n).toLocaleString('fa-IR')}</b></div>)}</div></>}
 <div className="sco-incident-filters">{[['unassigned','فاقد اقدام'],['overdue','گذشته از SLA'],['escalated','ارجاع‌شده'],['all','همه']].map(([id,label])=><button className={filter===id?'active':''} key={id} type="button" onClick={()=>{setFilter(id);setPage(0)}}>{label}</button>)}</div>
 <div className="sco-incident-list">{rows.map(a=><button className="sco-incident-row" type="button" key={a.id} onClick={()=>open(a)}>
  <AlertTriangle size={17}/><div><strong>{a.sco_hotels?.name||a.hotel_key}</strong><p>{a.description}</p><small>مهلت: {fmt(a.sla_due_at)} · سطح ارجاع {a.escalation_level.toLocaleString('fa-IR')}</small></div><span>{a.action_task_id?'واگذار شده':'اقدام لازم'}</span>
 </button>)}{rows.length===0&&<p>موردی در این فیلتر وجود ندارد. این به معنی تأیید سلامت تمام منابع نیست.</p>}</div>
 <footer className="sco-incident-footer"><small>{total.toLocaleString('fa-IR')} هشدار</small><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>قبلی</button><button disabled={(page+1)*20>=total} onClick={()=>setPage(p=>p+1)}>بعدی</button></footer>
 {selected&&<div className="sco-control-overlay" onMouseDown={()=>setSelected(null)}><div className="sco-control-drawer" role="dialog" aria-modal="true" aria-label="رسیدگی به هشدار" onMouseDown={e=>e.stopPropagation()}>
 <header><button type="button" onClick={()=>setSelected(null)} aria-label="بستن">×</button><h3>رسیدگی به هشدار هتل</h3><p>{selected.description}</p></header>
 <div className="sco-control-drawer-body"><div className="sco-control-box"><h4>ارجاع اقدام واقعی</h4>
 {selected.action_task_id?<p>این هشدار قبلاً به یک تسک متصل شده است.</p>:<>
 <label>مسئول<select value={owner} onChange={e=>setOwner(e.target.value)}>{staff.filter(s=>s.active).map(s=><option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}</select></label>
 <label>مهلت<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label>
 <label>توضیح<textarea value={note} maxLength={1000} onChange={e=>setNote(e.target.value)} rows={3}/></label>
 <button disabled={!owner||busy} onClick={()=>void assign()} type="button"><ClipboardCheck size={17}/>{busy?'در حال ثبت…':'پذیرش و ساخت تسک'}</button></>}
 </div><div className="sco-control-box"><h4>تاریخچه غیرقابل ویرایش</h4>{events.map(e=><p key={e.id}>{e.event_kind} — {fmt(e.created_at)} {e.note}</p>)}</div>
 {error&&<p role="alert" className="sco-control-error">{error}</p>}</div></div></div>}
 {error&&!selected&&<p className="sco-control-error">{error}</p>}
 {message&&<p className="sco-control-success">{message}</p>}
 </section>
}
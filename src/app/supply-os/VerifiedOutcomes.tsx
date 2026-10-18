'use client';
import {useMemo,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {CheckCircle2,RotateCcw,ShieldCheck,ClipboardCheck} from 'lucide-react';
type DoneTask={id:string;hotel_key:string;title:string;status:string;outcome?:string|null;last_result?:string|null;completed_at?:string|null;verified_at?:string|null;review_note?:string|null;assignee?:string|null};
export default function VerifiedOutcomes({db,tasks,hotelName,assigneeName,onRefresh,isManager}:{db:SupabaseClient;tasks:DoneTask[];hotelName:(id:string)=>string;assigneeName:(id:string|null|undefined)=>string;onRefresh:()=>Promise<void>;isManager:boolean}){
 const pending=useMemo(()=>tasks.filter(t=>t.status==='done'&&!t.verified_at),[tasks]);
 const verified=tasks.filter(t=>t.status==='done'&&!!t.verified_at).length;
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [working,setWorking]=useState<string|null>(null),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function decide(id:string,approve:boolean){
  const note=(notes[id]||'').trim();if(note.length<8)return;
  setWorking(id);setMessage('');setError('');
  try{
   const {error:e}=await db.rpc('sco_review_completed_task',{p_task_id:id,p_approve:approve,p_note:note});
   if(e)throw e;
   setMessage(approve?'نتیجه این پیگیری تأیید شد و در KPI خروجی معتبر محاسبه می‌شود.':'پیگیری بازگشایی شد و برای اقدام بیشتر به مسئول بازگشت.');
   setNotes(x=>({...x,[id]:''}));
   await onRefresh();
  }catch(e:any){setError(e.message||'بررسی نتیجه ناموفق بود')}finally{setWorking(null)}
 }
 return <section className="sco-verification">
  <div className="sco-verify-top"><div><span>VERIFIED OUTCOMES</span><h3>کنترل کیفیت نتیجه اقدامات</h3><p>بستن تسک به‌تنهایی موفقیت نیست؛ مدیر باید نتیجه ثبت‌شده را بررسی و تأیید کند.</p></div><div><span><ClipboardCheck size={16}/>{pending.length.toLocaleString('fa-IR')} منتظر تأیید</span><span><ShieldCheck size={16}/>{verified.toLocaleString('fa-IR')} نتیجه تأییدشده</span></div></div>
  {pending.slice(0,15).map(t=><article key={t.id} className="sco-verify-task">
    <div><strong>{hotelName(t.hotel_key)} — {t.title}</strong><small>مسئول: {assigneeName(t.assignee)} · {t.completed_at?new Date(t.completed_at).toLocaleDateString('fa-IR'):'—'}</small></div>
    <p>{t.last_result||t.outcome||'نتیجه عملیاتی ثبت نشده است'}</p>
    {isManager&&<div className="sco-verify-actions"><input value={notes[t.id]||''} onChange={e=>setNotes(x=>({...x,[t.id]:e.target.value}))} placeholder="دلیل تأیید یا علت بازگشایی، حداقل ۸ کاراکتر"/>
      <button type="button" disabled={!!working||(notes[t.id]||'').trim().length<8} onClick={()=>void decide(t.id,true)}><CheckCircle2 size={15}/> تأیید نتیجه</button>
      <button type="button" disabled={!!working||(notes[t.id]||'').trim().length<8} onClick={()=>void decide(t.id,false)}><RotateCcw size={15}/> بازگشایی</button>
    </div>}
  </article>)}
  {!pending.length&&<p className="sco-hint">هیچ نتیجه‌ای منتظر بررسی مدیر نیست.</p>}
  {pending.length>15&&<p className="sco-muted">۱۵ مورد اول نمایش داده شده‌اند. با تأیید آن‌ها، موارد بعدی نمایان می‌شوند.</p>}
  {message&&<p className="sco-successdata">{message}</p>}{error&&<p className="sco-error">{error}</p>}
 </section>;
}

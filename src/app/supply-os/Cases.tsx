'use client';
import {useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {AlertTriangle,Clock3,ShieldAlert,Plus,CheckCircle2,X,ArrowLeft} from 'lucide-react';
export type SupplyCase={
 id:string;hotel_key:string;issue_type:string;severity:'p0'|'p1'|'p2'|'p3';channel:string;
 provider:string;description:string;financial_impact_irr:number|null;status:string;
 task_id:string|null;assignee:string|null;due_at:string|null;created_at:string;resolution?:string|null
};
const issues=[
 ['inventory','کمبود ظرفیت و آفلاینی'],
 ['rate','مغایرت نرخ و قیمت'],
 ['parity','اختلاف نرخ رقبا'],
 ['lost_booking','رزرو از دست رفته'],
 ['api_out','اختلال رزرو API OUT'],
 ['provider','اختلال تأمین‌کننده'],
 ['contract','مسئله قرارداد'],
 ['settlement','تسویه و اعتبار'],
 ['promotion','تخفیف و کمپین'],
 ['content','نمایش و محتوای هتل']
] as const;
const typeTitle=(type:string)=>issues.find(x=>x[0]===type)?.[1]||type;
const sLabel=(status:string)=>({new:'جدید',working:'در حال پیگیری',waiting:'منتظر هتل/تأمین‌کننده',escalated:'ارجاع مدیر',resolved:'رفع‌شده'} as Record<string,string>)[status]||status;
const priorityName=(v:string)=>({p0:'P0 بحرانی · ۲ ساعت',p1:'P1 فوری · ۸ ساعت',p2:'P2 مهم · ۲۴ ساعت',p3:'P3 عادی · ۷۲ ساعت'} as Record<string,string>)[v]||v;
export function CaseQueue({cases,hotelName,onSelect,limit=10}:{cases:SupplyCase[];hotelName:(id:string)=>string;onSelect:(key:string)=>void;limit?:number}){
 const active=cases.filter(c=>c.status!=='resolved').sort((a,b)=>Number(a.severity.slice(1))-Number(b.severity.slice(1))||new Date(a.due_at||'9999').getTime()-new Date(b.due_at||'9999').getTime());
 if(!cases.length)return null;
 return <section className="sco-case-queue" aria-label="اختلالات و SLA تأمین">
 <div className="sco-case-head"><div><span>SUPPLY EXCEPTIONS</span><h3>اختلالات واقعی و زمان پاسخ</h3></div><strong>{active.length.toLocaleString('fa-IR')} مورد باز</strong></div>
 {active.length?active.slice(0,limit).map(c=><button key={c.id} className="sco-case-row" onClick={()=>onSelect(c.hotel_key)}>
  <span className={'sco-case-badge '+c.severity}>{c.severity.toUpperCase()}</span>
  <span className="sco-case-name"><b>{hotelName(c.hotel_key)}</b><small>{typeTitle(c.issue_type)} · {c.description}</small></span>
  <span className={'sco-case-sla '+(c.due_at&&Date.now()>new Date(c.due_at).getTime()?'overdue':'')}>{c.due_at?(Date.now()>new Date(c.due_at).getTime()?'از SLA عبور کرده':'مهلت: '+new Date(c.due_at).toLocaleString('fa-IR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})):'بدون SLA'}</span>
  <ArrowLeft size={16}/>
 </button>):<p className="sco-muted">اختلال بازی وجود ندارد.</p>}
 </section>;
}
export function CaseCreate({db,hotel,staff,enabled,suggestedAssignee='',onCreated,onClose}:{db:SupabaseClient;hotel:{hotel_key:string;name:string;provider?:string};staff:{user_id:string;full_name:string}[];enabled:boolean;suggestedAssignee?:string;onCreated:()=>void;onClose:()=>void}){
 const [type,setType]=useState('inventory'),[severity,setSeverity]=useState('p2'),[description,setDescription]=useState(''),[assignee,setAssignee]=useState(suggestedAssignee),[channel,setChannel]=useState(''),[provider,setProvider]=useState(hotel.provider||''),[impact,setImpact]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!enabled)return null;
 const submit=async()=>{if(!assignee||description.trim().length<6)return;setBusy(true);setError('');
 try{const {error}=await db.rpc('sco_create_case',{p_hotel_key:hotel.hotel_key,p_type:type,p_severity:severity,p_description:description.trim(),p_assignee:assignee,p_channel:channel.trim(),p_provider:provider.trim(),p_impact:impact.trim()?Number(impact):null});if(error)throw error;onCreated();onClose();setDescription('');}catch(e:any){setError(e.message||'خطای ذخیره');}finally{setBusy(false)}};
 return <section className="sco-case-create">
  <div className="sco-case-create-head"><h3><AlertTriangle size={18}/> ثبت و ارجاع مشکل هتل</h3><button onClick={onClose} aria-label="بستن"><X size={17}/></button></div>
  <p>با یک ثبت، پرونده + تسک + مهلت پاسخ + تاریخچه ایجاد می‌شود. مورد تکراری دوباره ساخته نمی‌شود.</p>
  <div className="sco-case-form">
    <label>نوع مسئله<select value={type} onChange={e=>setType(e.target.value)}>{issues.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    <label>شدت / SLA<select value={severity} onChange={e=>setSeverity(e.target.value)}>{['p0','p1','p2','p3'].map(x=><option key={x} value={x}>{priorityName(x)}</option>)}</select></label>
    <label>مسئول<select value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">انتخاب کارشناس</option>{staff.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}</select></label>
    <label>کانال (اختیاری)<input value={channel} onChange={e=>setChannel(e.target.value)} placeholder="B2C / B2B / API OUT"/></label>
    <label>تأمین‌کننده (اختیاری)<input value={provider} onChange={e=>setProvider(e.target.value)}/></label>
    <label>زیان تخمینی، ریال (اختیاری)<input inputMode="numeric" dir="ltr" value={impact} onChange={e=>setImpact(e.target.value.replace(/[^0-9]/g,''))}/></label>
  </div>
  <label className="sco-case-note">شرح واقعی مشکل<textarea value={description} rows={3} onChange={e=>setDescription(e.target.value)} placeholder="چه مشکلی، روی چه تاریخ/اتاق/رزروی و چه اثری؟"/></label>
  <button className="sco-primary" disabled={busy||!assignee||description.trim().length<6} onClick={()=>void submit()}>{busy?'در حال ثبت...':'ثبت پرونده و واگذاری با SLA'}</button>
  {error&&<p className="sco-error">{error}</p>}
 </section>;
}

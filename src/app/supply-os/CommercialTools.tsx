'use client';
import {useEffect,useMemo,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {BadgePercent,CheckCircle2,ShieldAlert,RefreshCw} from 'lucide-react';
type P={id:string;hotel_key:string;name:string;segment:string;starts_on:string;ends_on:string;funding:string;planned_budget_irr:number;discount_percent:number;hypothesis:string;target_kpi:string;status:string;projected_incremental_contribution_irr:number|null;approval_note?:string|null};
type H={hotel_key:string;name:string;city:string};
export default function CommercialTools({db,hotels,isManager,userId}:{db:SupabaseClient;hotels:H[];isManager:boolean;userId:string}){
 const [proposals,setProposals]=useState<P[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[q,setQ]=useState(''),[hotelKey,setHotelKey]=useState(''),[name,setName]=useState(''),[segment,setSegment]=useState('B2C'),[start,setStart]=useState(''),[end,setEnd]=useState(''),[funding,setFunding]=useState('hotel'),[percent,setPercent]=useState('10'),[budget,setBudget]=useState('0'),[projection,setProjection]=useState(''),[hypothesis,setHypothesis]=useState(''),[kpi,setKpi]=useState('رزرو قطعی افزایشی'),[review,setReview]=useState<Record<string,string>>({});
 const hits=useMemo(()=>hotels.filter(h=>(h.name+' '+h.city).includes(q)).slice(0,20),[q,hotels]);
 const load=async()=>{const {data,error:e}=await db.from('sco_promotions').select('*').order('created_at',{ascending:false}).limit(300);if(e)setError(e.message);else setProposals((data||[]) as P[])};
 useEffect(()=>{void load()},[]);
 async function submit(){setError('');setMessage('');if(!hotelKey||name.trim().length<3||hypothesis.trim().length<12||!start||!end)return;setBusy(true);try{
  if(end<start)throw Error('تاریخ پایان پیش از شروع است');
  const {error:e}=await db.from('sco_promotions').insert({hotel_key:hotelKey,name:name.trim(),segment,starts_on:start,ends_on:end,funding,planned_budget_irr:Number(budget||0),discount_percent:Number(percent),hypothesis:hypothesis.trim(),target_kpi:kpi.trim(),status:'proposed',created_by:userId,projected_incremental_contribution_irr:projection?Number(projection):null});
  if(e)throw e;setMessage('پیشنهاد ذخیره شد. هیچ نرخ یا تخفیفی به‌صورت خودکار اعمال نشده است.');setName('');setHypothesis('');await load();
 }catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function decide(id:string,approve:boolean){setError('');setBusy(true);try{
  const {error:e}=await db.rpc('sco_review_promotion',{p_id:id,p_approve:approve,p_reason:(review[id]||'').trim()});
  if(e)throw e;setMessage(approve?'پیشنهاد تأیید شد؛ اعمال روی نرخ‌ها نیاز به اتصال یا اقدام مجاز جداگانه دارد.':'پیشنهاد رد و دلیل ثبت شد.');await load();
 }catch(e:any){setError(e.message)}finally{setBusy(false)}}
 const field=(title:string,value:string,onChange:(v:string)=>void,type='text')=><label>{title}<input value={value} type={type} onChange={e=>onChange(e.target.value)}/></label>;
 return <section className="sco-panel sco-commercial"><div className="sco-panelhead"><div><span>COMMERCIAL GOVERNANCE</span><h3>تخفیف هدفمند، بودجه و سود افزایشی</h3></div><button onClick={()=>void load()}><RefreshCw size={16}/> بروزرسانی</button></div>
 <p className="sco-muted">بر اساس منطق رشد سهم ایران‌هتل: هر پیشنهاد باید برای هتل، تاریخ و سگمنت مشخص باشد؛ نوع تأمین بودجه، فرضیه و شاخص موفقیت داشته باشد. این صفحه قیمت هتل را خودکار تغییر نمی‌دهد.</p>
 <div className="sco-stats"><div className="sco-stat"><span className="sco-stat-icon orange"><BadgePercent size={19}/></span><div><small>پیشنهاد در انتظار بررسی</small><strong>{proposals.filter(p=>p.status==='proposed').length.toLocaleString('fa-IR')}</strong></div></div><div className="sco-stat"><span className="sco-stat-icon green"><CheckCircle2 size={19}/></span><div><small>تأییدشده</small><strong>{proposals.filter(p=>p.status==='approved').length.toLocaleString('fa-IR')}</strong></div></div></div>
 {isManager&&<div className="sco-market-form"><h3>ثبت پیشنهاد تجاری با فرضیه مشخص</h3>{field('جستجوی هتل',q,setQ)}<select value={hotelKey} onChange={e=>setHotelKey(e.target.value)}><option value="">انتخاب هتل</option>{hits.map(h=><option value={h.hotel_key} key={h.hotel_key}>{h.name} · {h.city}</option>)}</select>
 <div className="sco-market-fields">{field('نام کمپین',name,setName)}{field('سگمنت B2C/B2B/API Out',segment,setSegment)}{field('شروع',start,setStart,'date')}{field('پایان',end,setEnd,'date')}
 <label>تأمین‌کننده بودجه<select value={funding} onChange={e=>setFunding(e.target.value)}><option value="hotel">هتل</option><option value="iranhotel">ایران‌هتل</option><option value="shared">مشترک</option></select></label>{field('درصد تخفیف',percent,setPercent,'number')}{field('بودجه ریال',budget,setBudget,'number')}{field('سود افزایشی پیش‌بینی‌شده، ریال',projection,setProjection,'number')}{field('KPI موفقیت',kpi,setKpi)}</div>
 <label>فرضیه قابل‌سنجش (چرا این تخفیف فروش بیشتری می‌آورد؟)<textarea rows={3} value={hypothesis} onChange={e=>setHypothesis(e.target.value)}/></label>
 <button className="sco-primary" onClick={()=>void submit()} disabled={busy||!hotelKey||name.trim().length<3||hypothesis.trim().length<12||!start||!end}>ثبت پیشنهاد برای بررسی</button></div>}
 <div className="sco-market-rows">{proposals.slice(0,60).map(p=><div key={p.id} className="sco-promo-row"><span><b>{p.name}</b><small>{hotels.find(h=>h.hotel_key===p.hotel_key)?.name||p.hotel_key} · {p.starts_on} تا {p.ends_on}</small><small>{p.hypothesis}</small></span><span>تخفیف {p.discount_percent}٪ · بودجه {Number(p.planned_budget_irr).toLocaleString('fa-IR')} ریال</span><span>{p.funding==='hotel'?'با هزینه هتل':p.funding==='iranhotel'?'با هزینه ایران‌هتل':'بودجه مشترک'}</span><b>{p.status==='proposed'?'منتظر بررسی':p.status==='approved'?'تأییدشده':p.status==='rejected'?'ردشده':p.status}</b>{isManager&&p.status==='proposed'&&<div className="sco-promo-review"><input placeholder="دلیل بررسی؛ حداقل ۱۰ کاراکتر" value={review[p.id]||''} onChange={e=>setReview(x=>({...x,[p.id]:e.target.value}))}/><button disabled={busy||(review[p.id]||'').trim().length<10} onClick={()=>void decide(p.id,true)}>تأیید</button><button disabled={busy||(review[p.id]||'').trim().length<10} onClick={()=>void decide(p.id,false)}>رد</button></div>}</div>)}{!proposals.length&&<p className="sco-hint">هنوز پیشنهاد تجاری ثبت نشده است.</p>}</div>
 {message&&<p className="sco-successdata">{message}</p>}{error&&<p className="sco-error">{error}</p>}
 </section>;
}

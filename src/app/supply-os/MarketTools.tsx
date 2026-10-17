'use client';
import {useEffect,useMemo,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {Activity,AlertTriangle,BarChart3,CheckCircle2,RefreshCw,Plus,Search} from 'lucide-react';
type Hotel={hotel_key:string;name:string;city:string;hotel_code?:string};
type Parity={hotel_key:string;room_key:string;checkin_date:string;checkout_date:string;occupancy:number;meal:string;cancellation:string;iho_price:number;best_competitor_price:number;competitors:string;gap_percent:number;newest_at:string};
type Partner={entity_name:string;entity_type:string;qualified_calls:number;booking_attempts:number;confirmed_bookings:number;failed_bookings:number;mismatches:number;profit_irr:number;booking_success_pct:number|null;profit_per_1000_qualified_irr:number|null;worst_recorded_p95_ms:number|null;latest_date:string};
const date=()=>new Date().toLocaleDateString('en-CA');
export default function MarketTools({db,hotels,isManager}:{db:SupabaseClient;hotels:Hotel[];isManager:boolean}){
 const [tab,setTab]=useState<'parity'|'provider'>('parity'),[parity,setParity]=useState<Parity[]>([]),[partners,setPartners]=useState<Partner[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [hotelSearch,setHotelSearch]=useState(''),[hotelKey,setHotelKey]=useState(''),[source,setSource]=useState('IHO'),[room,setRoom]=useState('اتاق استاندارد'),[checkin,setCheckin]=useState(date()),[checkout,setCheckout]=useState(()=>new Date(Date.now()+86400000).toLocaleDateString('en-CA')),[occupancy,setOccupancy]=useState('2'),[meal,setMeal]=useState('بدون صبحانه'),[cancellation,setCancellation]=useState('قابل استرداد'),[price,setPrice]=useState('');
 const [partnerName,setPartnerName]=useState(''),[partnerType,setPartnerType]=useState('provider'),[metricsDate,setMetricsDate]=useState(date()),[partnerCalls,setPartnerCalls]=useState('0'),[partnerAttempts,setPartnerAttempts]=useState('0'),[partnerBooked,setPartnerBooked]=useState('0'),[partnerFailed,setPartnerFailed]=useState('0'),[partnerMismatch,setPartnerMismatch]=useState('0'),[partnerP95,setPartnerP95]=useState(''),[partnerProfit,setPartnerProfit]=useState('0');
 const ready=useMemo(()=>hotels.filter(h=>(h.name+' '+h.city+' '+h.hotel_code).includes(hotelSearch)).slice(0,15),[hotels,hotelSearch]);
 const load=async()=>{setError('');const [a,b]=await Promise.all([db.from('sco_parity_24h').select('*').order('gap_percent',{ascending:false}).limit(250),db.from('sco_partner_quality_30d').select('*').order('confirmed_bookings',{ascending:false}).limit(250)]);if(a.error||b.error)setError(a.error?.message||b.error?.message||'');setParity((a.data||[]) as Parity[]);setPartners((b.data||[]) as Partner[])};
 useEffect(()=>{void load()},[]);
 const saveRate=async()=>{if(!hotelKey||!room||!price||!checkin||!checkout)return;setBusy(true);setError('');try{
   const row={hotel_key:hotelKey,source:source.trim(),room_key:room.trim(),checkin_date:checkin,checkout_date:checkout,occupancy:Number(occupancy),meal,cancellation,price_irr:Number(price),available:true,confidence:1};
   if(row.checkout_date<=row.checkin_date)throw Error('تاریخ خروج باید بعد از تاریخ ورود باشد');
   const {error:e}=await db.from('sco_rate_observations').insert(row);if(e)throw e;setNotice('قیمت با شرایط قابل‌مقایسه ثبت شد. برای مقایسه نرخ IHO و رقیب را با شرایط یکسان وارد کن.');setPrice('');await load();
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 };
 const savePartner=async()=>{if(!partnerName.trim())return;setBusy(true);setError('');try{
  const row={entity_name:partnerName.trim(),entity_type:partnerType,metric_date:metricsDate,qualified_calls:Number(partnerCalls),booking_attempts:Number(partnerAttempts),confirmed_bookings:Number(partnerBooked),failed_bookings:Number(partnerFailed),rate_mismatches:Number(partnerMismatch),latency_p95_ms:partnerP95?Number(partnerP95):null,gross_profit_irr:Number(partnerProfit),source:'manual'};
  const {error:e}=await db.from('sco_partner_daily').upsert(row,{onConflict:'entity_name,entity_type,metric_date'});if(e)throw e;setNotice('کیفیت تأمین‌کننده/شریک برای تاریخ انتخاب‌شده ذخیره شد.');await load();
 }catch(e:any){setError(e.message)}finally{setBusy(false)}
 };
 const inp=(title:string,val:string,set:(x:string)=>void,type='text')=><label>{title}<input type={type} value={val} onChange={e=>set(e.target.value)}/></label>;
 return <section className="sco-panel sco-market">
  <div className="sco-panelhead"><div><span>HOTEL COMMERCE INTELLIGENCE</span><h3>کنترل نرخ رقبا و کیفیت تأمین‌کننده</h3></div><button type="button" onClick={()=>void load()}><RefreshCw size={16}/> به‌روزرسانی</button></div>
  <p className="sco-muted">ارقام این صفحه تنها از داده ثبت‌شده واقعی محاسبه می‌شوند. اتصال زنده به سایت رقبا و API تأمین‌کننده هنوز راه‌اندازی نشده است.</p>
  <div className="sco-market-tabs"><button className={tab==='parity'?'active':''} onClick={()=>setTab('parity')}><BarChart3 size={16}/> نرخ و Parity</button><button className={tab==='provider'?'active':''} onClick={()=>setTab('provider')}><Activity size={16}/> Provider / API OUT / B2B</button></div>
  {tab==='parity'&&<><div className="sco-market-summary"><strong>{parity.length.toLocaleString('fa-IR')}</strong> مقایسه معتبر ۲۴ ساعت اخیر <strong>{parity.filter(p=>p.gap_percent>=3).length.toLocaleString('fa-IR')}</strong> مورد اختلاف ۳٪ یا بیشتر</div>
   {parity.length?<div className="sco-market-rows">{parity.slice(0,35).map((p,i)=><div key={i}><span><b>{hotels.find(h=>h.hotel_key===p.hotel_key)?.name||p.hotel_key}</b><small>{p.room_key} · {p.checkin_date} · {p.occupancy} نفر · {p.meal} · {p.cancellation}</small></span><span>ایران‌هتل: {Number(p.iho_price).toLocaleString('fa-IR')} ریال</span><span>رقبا: {Number(p.best_competitor_price).toLocaleString('fa-IR')} ریال</span><b className={p.gap_percent>=3?'bad':'good'}>{p.gap_percent.toLocaleString('fa-IR')}٪</b></div>)}</div>:<p className="sco-hint">مقایسه معتبری نداریم. نرخ IHO و رقیب باید در ۲۴ ساعت اخیر با تاریخ، اتاق، ظرفیت نفرات، وعده غذا و کنسلی یکسان ثبت شوند.</p>}
   {isManager&&<div className="sco-market-form"><h3>ثبت نمونه نرخ قابل‌مقایسه</h3>{inp('جستجوی هتل',hotelSearch,setHotelSearch)}<select value={hotelKey} onChange={e=>setHotelKey(e.target.value)}><option value="">انتخاب هتل</option>{ready.map(h=><option key={h.hotel_key} value={h.hotel_key}>{h.name} — {h.city}</option>)}</select>
   <div className="sco-market-fields">{inp('منبع: IHO یا نام رقیب',source,setSource)}{inp('نوع اتاق یکسان',room,setRoom)}{inp('تاریخ ورود',checkin,setCheckin,'date')}{inp('تاریخ خروج',checkout,setCheckout,'date')}{inp('تعداد نفرات',occupancy,setOccupancy,'number')}
   <label>وعده غذایی<select value={meal} onChange={e=>setMeal(e.target.value)}><option>بدون صبحانه</option><option>صبحانه</option><option>صبحانه و ناهار</option><option>فولبرد</option></select></label>
   <label>شرط کنسلی<select value={cancellation} onChange={e=>setCancellation(e.target.value)}><option>قابل استرداد</option><option>غیرقابل استرداد</option><option>نامشخص</option></select></label>{inp('قیمت نهایی، ریال',price,setPrice,'number')}</div>
   <button className="sco-primary" disabled={busy||!hotelKey||!price} onClick={()=>void saveRate()}>ثبت قیمت و به‌روزرسانی مقایسه <Plus size={15}/></button></div>}
  </>}
  {tab==='provider'&&<><div className="sco-market-summary"><strong>{partners.length.toLocaleString('fa-IR')}</strong> شریک/تأمین‌کننده دارای شاخص ۳۰روزه</div>
   {partners.length?<div className="sco-market-rows">{partners.map(p=><div key={p.entity_type+p.entity_name}><span><b>{p.entity_name}</b><small>{p.entity_type} · به‌روزرسانی: {p.latest_date}</small></span><span>موفقیت رزرو: {p.booking_success_pct==null?'نامشخص':p.booking_success_pct+'٪'}</span><span>سود/۱۰۰۰ فراخوان واجدشرایط: {p.profit_per_1000_qualified_irr==null?'نامشخص':Number(p.profit_per_1000_qualified_irr).toLocaleString('fa-IR')} ریال</span><span>مغایرت‌ها: {p.mismatches.toLocaleString('fa-IR')}</span></div>)}</div>:<p className="sco-hint">آمار تأمین‌کننده/شریک هنوز وارد نشده؛ حجم درخواست به‌تنهایی معیار ارزیابی نیست. موفقیت رزرو، سود، خطا و سرعت پاسخ را ثبت می‌کنیم.</p>}
   {isManager&&<div className="sco-market-form"><h3>ثبت شاخص روزانه تأمین‌کننده/شریک</h3>{inp('نام تأمین‌کننده یا شریک',partnerName,setPartnerName)}
   <div className="sco-market-fields"><label>نوع<select value={partnerType} onChange={e=>setPartnerType(e.target.value)}><option value="provider">Provider</option><option value="api_out_partner">شریک API Out</option><option value="b2b_partner">شریک B2B</option></select></label>
   {inp('تاریخ',metricsDate,setMetricsDate,'date')}{inp('فراخوان واجدشرایط',partnerCalls,setPartnerCalls,'number')}{inp('تلاش رزرو',partnerAttempts,setPartnerAttempts,'number')}{inp('رزرو موفق',partnerBooked,setPartnerBooked,'number')}{inp('رزرو ناموفق',partnerFailed,setPartnerFailed,'number')}{inp('مغایرت نرخ',partnerMismatch,setPartnerMismatch,'number')}{inp('تاخیر p95 میلی‌ثانیه',partnerP95,setPartnerP95,'number')}{inp('سود ناخالص، ریال',partnerProfit,setPartnerProfit,'number')}</div>
   <button className="sco-primary" disabled={busy||!partnerName.trim()} onClick={()=>void savePartner()}>ثبت عملکرد روزانه <CheckCircle2 size={15}/></button></div>}
  </>}
 {notice&&<p className="sco-successdata">{notice}</p>}{error&&<p className="sco-error">{error}</p>}
 </section>;
}

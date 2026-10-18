'use client';
import {AlertTriangle,ArrowLeft,CheckCircle2,Database,FileSpreadsheet,Link2Off,RefreshCw} from 'lucide-react';

type LegacySource={file_key:string;uploaded_file_name?:string|null;rows_count?:number|null;updated_at?:string|null};
type Props={legacy:LegacySource[];hotels:number;metrics:number;tasks:number;onImport:()=>void;compact?:boolean};
const sources=[
 {id:'hotelData',title:'بانک هتل‌ها'},
 {id:'assignment',title:'تخصیص کارشناسان'},
 {id:'reserveList',title:'ریز رزروها'},
 {id:'confirmed',title:'فروش قطعی'},
 {id:'unconfirmed',title:'رزرو غیرقطعی'},
 {id:'traffic',title:'ترافیک و تبدیل'},
 {id:'mehr',title:'فهرست تکمیلی مهر'}
];
export default function DataHealth({legacy,hotels,metrics,tasks,onImport,compact=false}:Props){
 const latest=new Map<string,LegacySource>();
 for(const entry of [...legacy].sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')))){
  if(!latest.has(entry.file_key))latest.set(entry.file_key,entry);
 }
 const discovered=sources.filter(s=>latest.has(s.id)).length;
 return <section className={'sco-health '+(compact?'compact':'')} aria-label="وضعیت واقعی داده‌ها">
  <header className="sco-health-head"><div><span><Database size={18}/> نقشه اتصال داده‌ها</span><h3>چه چیزی واقعاً به سیستم عملیاتی متصل است؟</h3><p>منابع تاریخی را از شاخص‌های تأییدشده عملیاتی جدا نگه می‌داریم؛ وجود فایل به معنای صحت KPI یا اتصال خودکار آن نیست.</p></div><button type="button" onClick={onImport}><RefreshCw size={15}/> تکمیل داده عملیاتی</button></header>
  <div className="sco-health-kpis">
   <div><small>هتل‌های موتور عملیاتی</small><b>{hotels.toLocaleString('fa-IR')}</b><span><CheckCircle2 size={13}/> در بانک مرکزی</span></div>
   <div><small>منابع تاریخی شناسایی‌شده</small><b>{discovered.toLocaleString('fa-IR')} / ۷</b><span>در مخزن فایل‌های پیشین</span></div>
   <div className={metrics===0?'warning':''}><small>ردیف شاخص معتبر در موتور جدید</small><b>{metrics.toLocaleString('fa-IR')}</b><span>{metrics?'با تاریخ واقعی گزارش':'نیازمند ورود و تطبیق معتبر'}</span></div>
   <div><small>تسک ثبت‌شده عملیاتی</small><b>{tasks.toLocaleString('fa-IR')}</b><span>از واگذاری تا نتیجه</span></div>
  </div>
  {!compact&&<div className="sco-health-sources">{sources.map(s=>{const f=latest.get(s.id);return <div key={s.id}><span className={'sco-health-dot '+(f?'found':'')}/><div><b>{s.title}</b><small>{f?f.uploaded_file_name||'فایل ثبت‌شده':'ورودی هنوز ثبت نشده'}{f?.updated_at?' · '+new Date(f.updated_at).toLocaleDateString('fa-IR'):''}</small></div><em>{f?'در مخزن تاریخی':'فاقد منبع'}</em></div>})}</div>}
  {metrics===0&&<div className="sco-health-caution"><AlertTriangle size={18}/><div><b>هشدار صحت شاخص‌های فروش</b><p>بعضی داده‌های تاریخی نگاشت هتل یا تعداد رزرو ناسازگار دارند. تا تطبیق و اعتبارسنجی، از تبدیل خودکار آنها به KPI فروش و اولویت‌بندی قطعی پرهیز می‌شود.</p></div></div>}
  <div className="sco-health-actions"><button onClick={onImport} type="button">ورود نرخ، ظرفیت و عملکرد با تاریخ واقعی <ArrowLeft size={15}/></button><a href="/reservation-intelligence">بررسی داده‌های رزرو و فایل‌های قبلی <FileSpreadsheet size={15}/></a></div>
 </section>;
}
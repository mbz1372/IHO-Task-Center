'use client';
import {useMemo,useState} from 'react';
import {AlertTriangle,CheckCircle2,Download,Search,ShieldAlert} from 'lucide-react';
import {csv,clean,norm} from './engine';
type AuditHotel={hotel_key:string;hotel_code?:string|null;name:string;city?:string;provider?:string;category?:string;capacity_owner?:string|null;rate_owner?:string|null;capacity_owner_id?:string|null;rate_owner_id?:string|null;has_rate?:boolean|null;is_online?:boolean|null;rate_verified_at?:string|null;capacity_verified_at?:string|null;phone?:string|null;reservation_phone?:string|null};
type Issue='no_owners'|'unknown_online'|'unknown_rate'|'stale_online'|'stale_rate'|'missing_caring'|'missing_provider'|'no_contact';
const types:{id:Issue;title:string;why:string;action:string}[]=[
{id:'no_owners',title:'مالک نرخ یا ظرفیت مشخص نیست',why:'هیچ شخص پاسخگوی ثبت‌شده‌ای برای این وظیفه وجود ندارد',action:'تخصیص مسئول نرخ و ظرفیت'},
{id:'unknown_online',title:'وضعیت آنلاین ظرفیت نامشخص',why:'نمی‌توانیم فعال‌بودن ظرفیت فروش را تأیید کنیم',action:'استعلام و تأیید ظرفیت آنلاین'},
{id:'unknown_rate',title:'وضعیت آنلاین نرخ نامشخص',why:'وجود نرخ قابل فروش برای هتل تأیید نشده است',action:'استعلام و تأیید نرخ آنلاین'},
{id:'stale_online',title:'تأیید ظرفیت قدیمی',why:'آخرین تأیید ظرفیت بیش از ۴۸ ساعت قبل بوده است',action:'تأیید مجدد ظرفیت و تاریخ‌های فروش'},
{id:'stale_rate',title:'تأیید نرخ قدیمی',why:'آخرین تأیید نرخ بیش از ۴۸ ساعت قبل بوده است',action:'تأیید مجدد نرخ و شرایط فروش'},
{id:'missing_caring',title:'دسته اهمیت هتل نامشخص',why:'اولویت تجاری را نمی‌توان درست طبقه‌بندی کرد',action:'تعیین CaringCategory'},
{id:'missing_provider',title:'تأمین‌کننده مشخص نیست',why:'مسیر رفع مغایرت یا تامین ظرفیت روشن نیست',action:'بررسی و ثبت Provider'},
{id:'no_contact',title:'شماره تماس ثبت نشده',why:'کارشناس برای تماس مستقیم اطلاعات لازم را ندارد',action:'ثبت شماره رزرو هتل'}
];
function issue(h:AuditHotel,k:Issue,now:number){
 const old=(stamp?:string|null)=>!!stamp&&now-new Date(stamp).getTime()>48*3600000;
 switch(k){
 case 'no_owners':return !h.capacity_owner_id||!h.rate_owner_id;
 case 'unknown_online':return h.is_online==null;
 case 'unknown_rate':return h.has_rate==null;
 case 'stale_online':return h.is_online!=null&&(!h.capacity_verified_at||old(h.capacity_verified_at));
 case 'stale_rate':return h.has_rate!=null&&(!h.rate_verified_at||old(h.rate_verified_at));
 case 'missing_caring':return !clean(h.category);
 case 'missing_provider':return !clean(h.provider);
 case 'no_contact':return !clean(h.phone)&&!clean(h.reservation_phone);
 }
}
const tier=(h:AuditHotel)=>/پیشران/.test(h.category||'')?5:/کلیدی/.test(h.category||'')?4:/در حال توسعه/.test(h.category||'')?3:/پشتیبان/.test(h.category||'')?2:1;
export default function OperationalAudit({hotels,onSelect}:{hotels:AuditHotel[];onSelect:(key:string)=>void}){
 const [category,setCategory]=useState<Issue>('no_owners'),[search,setSearch]=useState(''),[includeInactive,setIncludeInactive]=useState(false);
 const now=Date.now();
 const eligible=useMemo(()=>hotels.filter(h=>includeInactive||!['خارج از سرویس','حذف تستی'].includes(h.category||'')),[hotels,includeInactive]);
 const totals=types.map(t=>({...t,count:eligible.filter(h=>issue(h,t.id,now)).length}));
 const selected=types.find(t=>t.id===category)!;
 const rows=eligible.filter(h=>issue(h,category,now)).filter(h=>!search||norm([h.name,h.city,h.hotel_code,h.provider].join(' ')).includes(norm(search))).sort((a,b)=>tier(b)-tier(a)||a.name.localeCompare(b.name,'fa'));
 function download(){csv(rows.map(h=>({'کد هتل':h.hotel_code||'','هتل':h.name,'شهر':h.city||'','Provider':h.provider||'','CaringCategory':h.category||'','مسئول ظرفیت':h.capacity_owner||'','مسئول نرخ':h.rate_owner||'','تماس':h.reservation_phone||h.phone||'','وضعیت آنلاین':h.is_online==null?'نامشخص':h.is_online?'فعال':'غیرفعال','نرخ آنلاین':h.has_rate==null?'نامشخص':h.has_rate?'فعال':'غیرفعال','آخرین تأیید ظرفیت':h.capacity_verified_at||'','آخرین تأیید نرخ':h.rate_verified_at||'','اقدام لازم':selected.action})), 'IHO_Data_Quality_'+category+'.csv')}
 return <section className="sco-panel sco-audit"><div className="sco-panelhead"><div><span>SUPPLY READINESS & DATA QUALITY</span><h3>ممیزی اجرایی اطلاعات هتل‌ها</h3></div><button onClick={download} disabled={!rows.length}><Download size={16}/> خروجی اقدامات</button></div>
 <p className="sco-muted">موارد «نامشخص» ریسک اثبات‌شده فروش نیستند؛ لیست زیر مشخص می‌کند کدام هتل‌ها نیاز به تکمیل یا تأیید اطلاعات دارند. هتل‌های خارج از سرویس در حالت پیش‌فرض کنار گذاشته شده‌اند.</p>
 <div className="sco-audit-grid">{totals.map(t=><button type="button" key={t.id} className={category===t.id?'active':''} onClick={()=>{setCategory(t.id);setSearch('')}}><span>{t.count===0?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>}</span><strong>{t.count.toLocaleString('fa-IR')}</strong><small>{t.title}</small></button>)}</div>
 <div className="sco-audit-detail"><div><b>{selected.title}</b><p>{selected.why}</p><small>اقدام لازم: {selected.action}</small></div><label><input type="checkbox" checked={includeInactive} onChange={e=>setIncludeInactive(e.target.checked)}/> نمایش هتل‌های خارج از سرویس</label></div>
 <div className="sco-search sco-audit-search"><Search size={17}/><input value={search} placeholder="جستجوی نام، کد یا شهر..." onChange={e=>setSearch(e.target.value)}/></div>
 <div className="sco-audit-list">{rows.slice(0,120).map(h=><button key={h.hotel_key} type="button" onClick={()=>onSelect(h.hotel_key)}><span><b>{h.name}</b><small>{h.city||'بدون شهر'} · {h.provider||'Provider نامشخص'} · {h.category||'دسته نامشخص'}</small></span><em>بازکردن پرونده و اصلاح</em></button>)}{!rows.length&&<p className="sco-hint"><CheckCircle2 size={18}/> برای این شاخص هیچ هتلی نیازمند تکمیل نیست.</p>}</div>
 {rows.length>120&&<p className="sco-muted">۱۲۰ مورد نخست نمایش داده شده است؛ برای مشاهده همه موارد خروجی CSV بگیر.</p>}
 </section>;
}

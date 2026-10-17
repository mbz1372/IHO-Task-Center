export type Mode='hotels'|'performance'|'confirmed'|'unconfirmed'|'traffic'|'owners'|'availability';
export type Column='code'|'name'|'city'|'provider'|'category'|'cooperation_status'|'capacity_owner'|'rate_owner'|'owner'|'owner_type'|'is_online'|'has_rate'|'capacity'|'confirmed'|'unconfirmed'|'lost'|'visits'|'nights'|'revenue'|'profit';
export type Hotel={hotel_key:string;hotel_code?:string;name:string;city:string;provider?:string;category?:string;cooperation_status?:string;capacity_owner?:string;rate_owner?:string;is_online?:boolean|null;has_rate?:boolean|null;capacity?:number|null;last_action_at?:string|null};
export type Rollup={hotel_key:string;confirmed_30:number;previous_confirmed:number;unconfirmed_30:number;lost_30:number;visits_30:number;nights_30:number;revenue_30:number;profit_30:number};
export type Score={risk:number;opportunity:number;reasons:string[];suggestion:string;movement:number|null;needsAction:boolean};
export const MODES:{id:Mode;label:string;help:string;required?:boolean}[]=[
{id:'hotels',label:'فهرست هتل‌ها',help:'یک‌بار برای شروع؛ کد/نام هتل و شهر',required:true},
{id:'performance',label:'عملکرد روزانه',help:'تعداد رزرو، فروش، بازدید و رزرو ناموفق — در یک فایل'},
{id:'confirmed',label:'رزرو قطعی',help:'فایل خروجی فروش قطعی یا ریز رزروها'},
{id:'unconfirmed',label:'رزرو غیرقطعی/از دست‌رفته',help:'فرصت‌های پیگیری و Lost'},
{id:'traffic',label:'ترافیک هتل‌ها',help:'بازدید سایت یا آمار Analytics'},
{id:'availability',label:'نرخ و ظرفیت آنلاین',help:'آنلاین بودن، وضعیت نرخ و ظرفیت'},
{id:'owners',label:'مسئول هتل‌ها',help:'مالک نرخ، مالک ظرفیت یا فایل تخصیص کارشناسان'}
];
export const FIELDS:{key:Column;label:string;aliases:string[]}[]=[
{key:'code',label:'کد یکتای هتل',aliases:['کد هتل','شناسه هتل','hotelcode','hotelid','hotel id','hotel code','کد مرکز']},
{key:'name',label:'نام هتل',aliases:['نام هتل','نام اقامتگاه','hotel name','hotelname','نام مرکز','نام واحد']},
{key:'city',label:'شهر',aliases:['شهر','نام شهر','city','cityname']},
{key:'provider',label:'تأمین‌کننده',aliases:['provider','پروایدر','تامین کننده','تأمین کننده']},
{key:'category',label:'دسته / Caring',aliases:['caringcategory','caring category','دسته بندی','طبقه بندی','رده','category']},
{key:'cooperation_status',label:'وضعیت همکاری',aliases:['وضعیت همکاری','وضعیت قرارداد','همکاری','cooperationstatus']},
{key:'capacity_owner',label:'مسئول ظرفیت',aliases:['مسئول ظرفیت','کارشناس ظرفیت','capacity owner']},
{key:'rate_owner',label:'مسئول نرخ',aliases:['مسئول نرخ','کارشناس نرخ','rate owner']},
{key:'owner',label:'نام کارشناس',aliases:['کارشناس','نام کارشناس','assigned to','assignee','expert','owner']},
{key:'owner_type',label:'نقش کارشناس',aliases:['نوع تسک','taskid','task id','نوع مسئولیت','role','نوع کار']},
{key:'is_online',label:'ظرفیت آنلاین؟',aliases:['آنلاین','وضعیت آنلاین','is online','online','ظرفیت آنلاین']},
{key:'has_rate',label:'نرخ آنلاین؟',aliases:['نرخ آنلاین','has rate','rate online','وضعیت نرخ']},
{key:'capacity',label:'ظرفیت',aliases:['ظرفیت','capacity','capacity_total','موجودی']},
{key:'confirmed',label:'تعداد رزرو قطعی',aliases:['تعداد رزرو قطعی','confirmed bookings','تعداد قطعی','confirmed','تعداد رزرو']},
{key:'unconfirmed',label:'رزرو غیرقطعی',aliases:['تعداد رزرو غیرقطعی','unconfirmed bookings','رزرو غیرقطعی','unconfirmed']},
{key:'lost',label:'رزرو از دست رفته',aliases:['رزرو از دست رفته','lost','لغو شده','عدم تایید','عدم تأیید']},
{key:'visits',label:'بازدید',aliases:['بازدید','visit','views','sessions','pageviews','users']},
{key:'nights',label:'شب اقامت',aliases:['شب اقامت','night','room nights','roomnights']},
{key:'revenue',label:'مبلغ فروش (ریال)',aliases:['مبلغ فروش','مبلغ کل','فروش','revenue','gross sale','amount']},
{key:'profit',label:'سود (ریال)',aliases:['سود','profit','margin','سود ناخالص']}
];
export const FIELD_SETS:Record<Mode,Column[]>={
 hotels:['code','name','city','provider','category','cooperation_status','capacity_owner','rate_owner'],
 performance:['code','name','city','confirmed','unconfirmed','lost','visits','nights','revenue','profit'],
 confirmed:['code','name','city','confirmed','nights','revenue','profit'],
 unconfirmed:['code','name','city','unconfirmed','lost'],
 traffic:['code','name','city','visits'],
 availability:['code','name','city','is_online','has_rate','capacity'],
 owners:['code','name','city','capacity_owner','rate_owner','owner','owner_type']
};
export function clean(v:unknown){return String(v??'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim();}
export function norm(v:unknown){return clean(v).toLowerCase().replace(/[\s\-/.,()（）:]+/g,'');}
export function num(v:unknown){if(typeof v==='number')return Number.isFinite(v)?v:0;const x=clean(v).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[٬,\s]/g,'').replace(/[^0-9.+-]/g,'');return Number(x)||0;}
export function booleanish(v:unknown):boolean|null{
 if(v===null||v===undefined||clean(v)==='')return null;
 if(typeof v==='boolean')return v;
 const s=norm(v);
 if(['1','true','yes','فعال','بله','آنلاین','online','موجود','دارد'].includes(s))return true;
 if(['0','false','no','غیرفعال','خیر','آفلاین','offline','ناموجود','ندارد'].includes(s))return false;
 return null;
}
export function keyOf(code:unknown,name:unknown,city:unknown){
 const c=norm(code),n=norm(name),t=norm(city);
 return c?'code:'+c:n?'name:'+n+'@'+t:'';
}
export function autoMap(headers:string[],mode:Mode):Partial<Record<Column,string>>{
 const used=new Set<string>();const result:Partial<Record<Column,string>>={};
 for(const field of FIELD_SETS[mode]){
  const aliases=FIELDS.find(f=>f.key===field)?.aliases||[];
  const candidates=[field,...aliases].map(norm);
  const found=headers.find(h=>!used.has(h)&&candidates.includes(norm(h)))||headers.find(h=>!used.has(h)&&candidates.some(a=>a.length>=4&&norm(h).includes(a)));
  if(found){result[field]=found;used.add(found)}
 }
 return result;
}
export function score(h:Hotel,m?:Partial<Rollup>,lastAction?:string|null,open=0):Score{
 let risk=0,opportunity=0;const reasons:string[]=[];let suggestion='تماس و به‌روزرسانی وضعیت هتل';
 const conf=Number(m?.confirmed_30||0),prev=Number(m?.previous_confirmed||0),un=Number(m?.unconfirmed_30||0),lost=Number(m?.lost_30||0),vis=Number(m?.visits_30||0),revenue=Number(m?.revenue_30||0);
 if(h.is_online===false){risk+=24;opportunity+=20;reasons.push('ظرفیت آنلاین غیرفعال');suggestion='فعال‌سازی ظرفیت آنلاین'}
 if(h.has_rate===false){risk+=20;opportunity+=17;reasons.push('نرخ آنلاین غیرفعال');suggestion='اصلاح و آنلاین‌سازی نرخ'}
 if(h.capacity===0){risk+=15;reasons.push('ظرفیت صفر');suggestion='دریافت ظرفیت جدید'}
 if(!h.capacity_owner){risk+=13;reasons.push('مسئول ظرفیت ثبت نشده')}
 if(!h.rate_owner){risk+=12;reasons.push('مسئول نرخ ثبت نشده')}
 if(un>0){risk+=Math.min(22,Math.ceil(un/2));opportunity+=Math.min(30,un*2);reasons.push(un.toLocaleString('fa-IR')+' رزرو غیرقطعی');if(h.is_online!==false)suggestion='پیگیری رزروهای غیرقطعی'}
 if(lost>0){risk+=Math.min(20,lost*3);opportunity+=Math.min(20,lost*2);reasons.push(lost.toLocaleString('fa-IR')+' رزرو از دست‌رفته');suggestion='رفع علت رزروهای از دست‌رفته'}
 if(vis>=40&&conf/vis<0.025){risk+=17;opportunity+=27;reasons.push('بازدید بالا، تبدیل پایین');if(!lost&&!un)suggestion='بررسی رقابت‌پذیری نرخ و ظرفیت'}
 if(prev>=4&&conf<prev*.65){risk+=14;reasons.push('افت محسوس رزرو نسبت به دوره قبل');suggestion='بررسی افت فروش'}
 if(open>0){risk+=Math.min(10,open*4);reasons.push('پیگیری باز: '+open)}
 if(lastAction){const days=Math.floor((Date.now()-new Date(lastAction).getTime())/86400000);if(days>7&&risk>15){risk+=7;reasons.push('بدون پیگیری تازه در ۷ روز گذشته')}}
 if(vis>0)opportunity+=Math.min(15,Math.round(vis/20));
 if(conf>0)opportunity+=Math.min(18,conf*2);
 if(revenue>0)opportunity+=Math.min(15,Math.round(revenue/200000000));
 if(norm(h.category).includes('پیشران')||norm(h.category).includes('کلیدی'))opportunity+=12;
 const movement=prev>0?Math.round((conf-prev)/prev*100):null;
 return {risk:Math.min(100,risk),opportunity:Math.min(100,opportunity),reasons,suggestion,movement,needsAction:risk>=25||opportunity>=55};
}
export function csv(rows:Record<string,unknown>[],file:string){
 const headers=Object.keys(rows[0]||{empty:''});
 const body='\ufeff'+[headers.map(h=>'"'+h.replaceAll('"','""')+'"').join(','),...rows.map(r=>headers.map(h=>'"'+String(r[h]??'').replaceAll('"','""')+'"').join(','))].join('\r\n');
 const blob=new Blob([body],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}

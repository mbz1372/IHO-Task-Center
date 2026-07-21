'use client';

import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,BookOpen,CheckCircle2,CircleAlert,Database,Search} from 'lucide-react';

type GuideTopic={
  id:string;
  title:string;
  group:string;
  summary:string;
  sources:string[];
  steps:string[];
  tips?:string[];
};

const topic=(id:string,title:string,group:string,summary:string,sources:string[],steps:string[],tips:string[]=[]):GuideTopic=>({id,title,group,summary,sources,steps,tips});

export const SYSTEM_GUIDE_TOPICS:GuideTopic[]=[
  topic('dashboard','داشبورد عملیاتی','فضای کاری','نمای روزانه وضعیت تسک‌ها، فعالیت‌ها، اهداف، پروژه‌ها و عملکرد تیم است. همه اعداد از داده‌های همگام‌شده همین سیستم محاسبه می‌شوند.',['ihos_tasks','ihos_task_activities','ihos_users','ihos_goals','ihos_projects'],['کارت‌های وضعیت را مرور کنید.','روی بخش نیازمند اقدام کلیک کنید.','از میان‌برها وارد صفحه عملیاتی مربوط شوید.']),
  topic('inbox','میزکار من','فضای کاری','کارهایی را نشان می‌دهد که مسئول آن‌ها هستید، در آن‌ها همکاری دارید یا موعد پیگیری‌شان رسیده است.',['ihos_tasks','ihos_reminders','ihos_task_activities'],['موارد فوری و عقب‌افتاده را اول بررسی کنید.','وضعیت یا فعالیت بعدی را ثبت کنید.','پس از پایان، تسک را برای تأیید ارسال کنید.']),
  topic('executive','داشبورد مدیرعامل','فضای کاری','نمای تجمیعی برای رصد سلامت اجرا، ریسک‌ها و بار کاری سازمان است.',['ihos_tasks','ihos_hotels','ihos_users','ihos_activity_logs'],['روندها را با دوره قبل مقایسه کنید.','روی ریسک‌های بحرانی تمرکز کنید.','برای هر مسئله مالک و اقدام بعدی تعیین کنید.']),
  topic('controlTower','مرکز فرمان اقدام','فضای کاری','هتل‌هایی را که به علت ظرفیت، قرارداد، Provider، مالکیت یا تسک معوق نیازمند اقدام‌اند در یک صف واحد قرار می‌دهد.',['ihos_hotels','ihos_tasks','ihos_hotel_assignments','ihos_hotel_daily_metrics'],['فیلتر شدت یا نوع هشدار را انتخاب کنید.','دلیل هشدار و مسئول فعلی را ببینید.','مستقیماً برای همان هتل تسک بسازید.']),
  topic('hotelSuperApp','سوپر اپ هتل','عملیات هتل','مرکز داده عملیاتی هتل‌ها، وضعیت آنلاین نرخ و ظرفیت، Provider، کارشناس و پیشنهاد مهاجرت است.',['ihos_hotels','ihos_hotel_automation','ihos_provider_rules','ihos_provider_coverage'],['اطلاعات هتل و Provider را همگام کنید.','وضعیت نرخ و ظرفیت را بررسی کنید.','پیشنهاد مهاجرت یا پیگیری را به تسک تبدیل کنید.']),
  topic('crm360','چرخه و سلامت هتل','عملیات هتل','چرخه و امتیاز سلامت هر هتل فقط از داده‌های واقعی سیستم محاسبه می‌شود. مرحله ثبت‌شده در crm_stage اولویت دارد؛ در نبود آن، مرحله از قرارداد، همکاری، آنلاین‌بودن و تسک‌های معوق نتیجه‌گیری می‌شود.',['ihos_hotels و crm_stage','ihos_hotel_status_v','ihos_hotel_daily_metrics','ihos_tasks','ihos_documents','ihos_hotel_assignments'],['روی امتیاز هر هتل کلیک کنید تا سهم هر منبع را ببینید.','برای تغییر مرحله، آن را انتخاب و در Supabase ذخیره کنید.','هتل‌های کم‌امتیاز یا بدون داده را پیگیری کنید.'],['وزن امتیاز: ظرفیت ۲۵، قرارداد ۲۰، آنلاین‌بودن ۲۰، مالکیت ۱۵، اجرای تسک ۱۵ و اسناد ۵.','هیچ امتیازی از localStorage یا داده ساختگی خوانده نمی‌شود.']),
  topic('hotelOwnership','مالکیت پرونده هتل','عملیات هتل','چهار مسئول اصلی هر هتل را مشخص و تاریخچه تغییر مسئولیت را نگهداری می‌کند.',['ihos_hotel_assignments','ihos_users','ihos_hotels'],['هتل را جستجو کنید.','برای هر نقش کاربر فعال انتخاب کنید.','ذخیره کنید؛ تخصیص قبلی بسته و در تاریخچه باقی می‌ماند.']),
  topic('contracts','قرارداد مالی و پرداخت','عملیات هتل','نوع قرارداد، مدل تسویه، دوره خرید و پرداخت، سقف اعتبار و دسته ریسک مالی هتل را مدیریت می‌کند.',['ihos_hotel_financial_profiles','ihos_hotels'],['هتل را پیدا کنید.','پروفایل مالی را تکمیل کنید.','دسته ریسک و شرایط تسویه را بازبینی کنید.']),
  topic('communications','ارتباطات هتل','عملیات هتل','تماس، پیام یا جلسه با هتل را در تایم‌لاین پرونده ذخیره و پیگیری بعدی را به تسک تبدیل می‌کند.',['ihos_hotel_communications','ihos_hotel_events','ihos_tasks'],['هتل و کانال ارتباط را انتخاب کنید.','موضوع، نتیجه و پیگیری بعدی را ثبت کنید.','در صورت نیاز Follow-up Task بسازید.']),
  topic('tasks','تسک سنتر','جریان کار','تمام کارهای اجرایی را با مسئول، اولویت، مهلت، فعالیت‌های خرد و گردش تأیید مدیریت می‌کند.',['ihos_tasks','ihos_task_activities','ihos_notifications'],['تسک را با هتل و مسئول بسازید.','فعالیت‌های خرد و Deadline را مشخص کنید.','کارت را در مراحل گردش کار جابه‌جا کنید.']),
  topic('approvals','تأیید و کنترل کیفیت','جریان کار','Quality Gate تسک‌هاست؛ مدیر خروجی کار را تأیید می‌کند یا با توضیح برای اصلاح برمی‌گرداند.',['ihos_tasks'],['تسک‌های در انتظار را باز کنید.','شواهد انجام کار را بررسی کنید.','تأیید یا دلیل اصلاح را ثبت کنید.']),
  topic('reminders','یادآورها','جریان کار','پیگیری‌های زمان‌دار شخصی یا متصل به تسک را نگهداری و اعلان می‌کند.',['ihos_reminders','ihos_notifications'],['زمان و مخاطب یادآور را تعیین کنید.','در موعد، اعلان را بررسی کنید.','پس از اقدام، یادآور را انجام‌شده کنید.']),
  topic('calendar','تقویم عملیاتی','جریان کار','تسک‌ها، رویدادها و یادآورها را در نمای ماه، هفته یا فهرست کنار هم نشان می‌دهد.',['ihos_calendar_events','ihos_tasks','ihos_reminders'],['نمای مناسب را انتخاب کنید.','بر اساس کارشناس یا نوع فیلتر کنید.','رویداد جدید را با تاریخ صحیح ثبت کنید.']),
  topic('messages','پیام‌رسان داخلی','جریان کار','گفت‌وگوی سازمانی، تیمی و مستقیم را به شکل کانال‌های جدا نمایش می‌دهد و هر پیام می‌تواند به هتل متصل شود.',['ihos_messages','ihos_users','ihos_hotels'],['از فهرست، سازمان، تیم یا شخص را انتخاب کنید.','در صورت نیاز هتل مرتبط را مشخص کنید.','با Enter ارسال و با Shift+Enter خط جدید ایجاد کنید.']),
  topic('sla','SLA و زمان استاندارد','جریان کار','زمان استاندارد پاسخ و هشدار را برای نوع، دسته و اولویت تسک تعریف می‌کند.',['ihos_sla_rules','ihos_tasks'],['قانون SLA را تعریف کنید.','تسک‌های خارج از SLA را پایش کنید.','زمان یا فرایند نامناسب را اصلاح کنید.']),
  topic('playbooks','فرایندهای استاندارد','جریان کار','مراحل تکرارشونده عملیات را به دستورالعمل قابل اجرای تیم تبدیل می‌کند.',['ihos_tasks','ihos_task_activities'],['فرایند را انتخاب کنید.','مراحل استاندارد را اجرا کنید.','نتیجه و استثناها را ثبت کنید.']),
  topic('team','کارشناسان و نقشه پوشش','تیم و پروژه','پوشش واقعی ۳۱ استان، تعداد هتل، تسک باز و کارشناسان هر منطقه را روی نقشه ایران نشان می‌دهد.',['ihos_hotels','ihos_hotel_assignments','ihos_users','ihos_tasks'],['روی استان کلیک کنید.','هتل‌ها، تسک‌ها و کارشناسان پوشش‌دهنده را ببینید.','برای استان بدون پوشش، مسئول تعیین کنید.']),
  topic('kpiCenter','مرکز KPI کارشناسان','تیم و پروژه','نرخ تکمیل، انجام به‌موقع، سلامت Backlog و فعالیت‌های انجام‌شده هر کارشناس را محاسبه می‌کند.',['ihos_tasks','ihos_task_activities','ihos_users','ihos_goals'],['دوره ارزیابی را انتخاب کنید.','علت امتیاز هر کارشناس را بررسی کنید.','هدف متناسب با نقش تعریف کنید.']),
  topic('projects','پروژه‌ها','تیم و پروژه','کارهای چندنفره را با مالک، اعضا، مهلت و تسک‌های وابسته مدیریت می‌کند.',['ihos_projects','ihos_tasks','ihos_users'],['پروژه و مالک را ثبت کنید.','اعضا و تسک‌ها را متصل کنید.','پیشرفت و موانع را به‌روزرسانی کنید.']),
  topic('goals','هدف‌گذاری','تیم و پروژه','هدف عددی برای تسک یا فعالیت انجام‌شده در یک بازه زمانی تعریف می‌کند.',['ihos_goals','ihos_tasks','ihos_task_activities'],['معیار و دوره را تعیین کنید.','هدف را به فرد یا تیم نسبت دهید.','پیشرفت واقعی را دوره‌ای بازبینی کنید.']),
  topic('roles','نقش‌ها و دسترسی‌ها','تیم و پروژه','مشخص می‌کند هر نقش کدام صفحه و عملیات را مشاهده یا ویرایش کند.',['ihos_roles','ihos_users'],['نقش را ایجاد یا انتخاب کنید.','فقط دسترسی‌های لازم را فعال کنید.','کاربران را به نقش صحیح متصل کنید.']),
  topic('automations','اتوماسیون','تیم و پروژه','شرایط عملیاتی را اسکن و بدون ساخت رکورد تکراری، تسک استاندارد ایجاد می‌کند.',['ihos_automations','ihos_automation_runs','ihos_tasks','ihos_hotels'],['قانون، شرط و قالب تسک را تعریف کنید.','پیش‌نمایش یا اجرای قانون را بررسی کنید.','تاریخچه اجرا و موارد ردشده را ببینید.']),
  topic('reports','گزارش‌ساز','داده و گزارش','گزارش تسک، فعالیت، زمان و عملکرد را با فیلتر کاربر و تاریخ تولید می‌کند.',['ihos_tasks','ihos_activity_logs','ihos_task_activities','ihos_users'],['فیلتر دوره و کاربر را تنظیم کنید.','نمودارها و جزئیات را بررسی کنید.','در صورت نیاز CSV بگیرید.']),
  topic('dailyReport','گزارش روزانه','داده و گزارش','خلاصه روزانه کارهای انجام‌شده، عقب‌افتاده و اقدام بعدی تیم را آماده می‌کند.',['ihos_tasks','ihos_activity_logs','ihos_reminders'],['روز موردنظر را انتخاب کنید.','موارد بدون مسئول یا عقب‌افتاده را اصلاح کنید.','گزارش را برای جلسه روزانه استفاده کنید.']),
  topic('savedViews','نماهای کاری','داده و گزارش','ترکیب فیلترها را برای استفاده دوباره ذخیره می‌کند.',['تنظیمات محلی نمای کاربر','ihos_tasks'],['فیلترهای موردنیاز را اعمال کنید.','نما را با نام واضح ذخیره کنید.','برای شروع سریع روز کاری آن را باز کنید.']),
  topic('bulkActions','عملیات گروهی','داده و گزارش','ویرایش مسئول، وضعیت، اولویت یا برچسب چند تسک را هم‌زمان انجام می‌دهد.',['ihos_tasks','ihos_users'],['رکوردها را انتخاب کنید.','تغییر گروهی را مشخص کنید.','پیش از ذخیره دامنه تغییر را بازبینی کنید.']),
  topic('logs','تاریخچه تغییرات','داده و گزارش','ثبت می‌کند چه کاربری، چه زمانی و روی چه موجودیتی اقدام انجام داده است.',['ihos_activity_logs'],['کاربر یا دوره را فیلتر کنید.','رخداد موردنظر را پیدا کنید.','برای بررسی خطا یا ممیزی از آن استفاده کنید.']),
  topic('documents','اسناد','داده و گزارش','قرارداد، الحاقیه، اکسل و سایر فایل‌ها را به هتل یا پرونده عملیاتی متصل می‌کند.',['ihos_documents','Supabase Storage'],['نوع سند و هتل را انتخاب کنید.','فایل و توضیحات را ثبت کنید.','اسناد مهم را پین کنید.']),
  topic('aiAssistant','دستیار هوشمند','داده و گزارش','برای خلاصه‌سازی و پیشنهاد اقدام از داده‌ای که در همان صفحه در دسترس است استفاده می‌کند؛ خروجی باید توسط کاربر بازبینی شود.',['داده‌های قابل مشاهده در صفحه جاری'],['درخواست مشخص بنویسید.','پیشنهاد را با داده اصلی تطبیق دهید.','پس از تأیید، اقدام را در سیستم ثبت کنید.']),
  topic('settings','تنظیمات','سیستم','برند، ظاهر، اعلان‌ها، دسته‌ها و مقادیر پیش‌فرض سیستم را مدیریت می‌کند.',['ihos_settings'],['تنظیمات را تغییر دهید.','ذخیره کنید.','در حالت روشن و تیره نتیجه را بررسی کنید.']),
  topic('notifications','اعلان‌ها','سیستم','تغییرات تسک، تخصیص‌ها و یادآورها را برای مخاطب مربوط نمایش می‌دهد.',['ihos_notifications','ihos_reminders'],['اجازه اعلان مرورگر را فعال کنید.','اعلان را باز و اقدام کنید.','پس از مشاهده آن را خوانده‌شده کنید.']),
  topic('help','راهنمای سیستم','سیستم','مرجع واحد توضیح صفحات، منبع داده‌ها و روش صحیح انجام کار در IHO Task Center است.',['تعاریف نسخه جاری محصول'],['موضوع را جستجو کنید.','منبع داده و مراحل استفاده را بخوانید.','از علامت تعجب هر صفحه مستقیماً به همین موضوع برگردید.'])
];

export const GUIDE_TOPIC_MAP=Object.fromEntries(SYSTEM_GUIDE_TOPICS.map(item=>[item.id,item])) as Record<string,GuideTopic>;

export function GuideHint({topic:topicId,className=''}:{topic:string;className?:string}){
  const item=GUIDE_TOPIC_MAP[topicId]||GUIDE_TOPIC_MAP.help;
  function open(){window.dispatchEvent(new CustomEvent('ihos-open-guide',{detail:{topic:item.id}}))}
  return <span className={`guideHintV19 ${className}`.trim()}>
    <button type="button" onClick={open} aria-label={`راهنمای ${item.title}`}><CircleAlert/></button>
    <span role="tooltip"><b>{item.title}</b>{item.summary}<em>کلیک برای راهنمای کامل</em></span>
  </span>
}

export function SystemGuide({topic:initialTopic='help',onTopicChange}:{topic?:string;onTopicChange?:(topic:string)=>void}){
  const [selected,setSelected]=useState(GUIDE_TOPIC_MAP[initialTopic]?initialTopic:'help');
  const [query,setQuery]=useState('');
  useEffect(()=>{if(GUIDE_TOPIC_MAP[initialTopic])setSelected(initialTopic)},[initialTopic]);
  const filtered=useMemo(()=>SYSTEM_GUIDE_TOPICS.filter(item=>!query.trim()||`${item.title} ${item.summary} ${item.group}`.includes(query.trim())),[query]);
  const groups=useMemo(()=>[...new Set(filtered.map(item=>item.group))],[filtered]);
  const current=GUIDE_TOPIC_MAP[selected]||GUIDE_TOPIC_MAP.help;
  function choose(id:string){setSelected(id);onTopicChange?.(id);requestAnimationFrame(()=>document.querySelector('.systemGuideDetailV19')?.scrollTo({top:0,behavior:'smooth'}))}
  return <div className="systemGuideV19">
    <header className="systemGuideHeroV19"><div><span>PRODUCT KNOWLEDGE BASE</span><h2><BookOpen/> راهنمای سیستم IHO Task Center</h2><p>توضیح هر بخش، منبع دقیق داده‌ها و مسیر صحیح انجام کار؛ مطابق نسخه فعلی سیستم.</p></div><div className="systemGuideSearchV19"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در راهنما..."/></div></header>
    <div className="systemGuideLayoutV19"><aside>{groups.map(group=><section key={group}><h3>{group}</h3>{filtered.filter(item=>item.group===group).map(item=><button className={selected===item.id?'active':''} key={item.id} onClick={()=>choose(item.id)}><span>{item.title}</span><ArrowLeft/></button>)}</section>)}</aside>
      <main className="systemGuideDetailV19"><div className="guideDetailTitleV19"><span>{current.group}</span><h1>{current.title}</h1><p>{current.summary}</p></div>
        <section><header><Database/><div><h3>منبع داده</h3><p>این صفحه اطلاعات را از این بخش‌های سیستم می‌خواند.</p></div></header><ul>{current.sources.map(source=><li key={source}><code>{source}</code></li>)}</ul></section>
        <section><header><CheckCircle2/><div><h3>روش استفاده</h3><p>مسیر پیشنهادی برای انجام درست کار.</p></div></header><ol>{current.steps.map(step=><li key={step}>{step}</li>)}</ol></section>
        {!!current.tips?.length&&<section className="guideNotesV19"><header><CircleAlert/><div><h3>نکات مهم</h3><p>تعریف‌ها و محدودیت‌هایی که باید بدانید.</p></div></header><ul>{current.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></section>}
      </main>
    </div>
  </div>
}

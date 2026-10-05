'use client';

import {useEffect,useMemo,useState} from 'react';
import {
  AlertTriangle,BarChart3,CalendarClock,CheckCircle2,Clock3,FileText,Hotel,MessageSquareText,
  Phone,Plus,RefreshCcw,Search,Send,ShieldAlert,Sparkles,Target,Timer,Users2
} from 'lucide-react';
import {loadRows,makeId,normalizeFa,nowIso,saveRow} from './storage';

type Props={hotels?:any[];users?:any[];tasks?:any[];me?:any;onCreateTask?:(hotel:any,input?:any)=>void;setView?:(view:any)=>void};
const fa=(value:number)=>Number(value||0).toLocaleString('fa-IR');
const dateOnly=(value:any)=>String(value||'').slice(0,10);
const today=()=>dateOnly(nowIso());
const asNumber=(value:any)=>{const n=Number(value);return Number.isFinite(n)?n:0};

const DEFAULT_ACTIONS=[
  ['rate_update','🔄 آپدیت نرخ','نرخ',2,12,false],['promotion','🎁 دریافت پروموشن','نرخ',3,20,false],['panel_access','🔓 دسترسی نرخ و ظرفیت به هتل','آنلاین‌سازی',4,30,false],
  ['rate_scrape','🔍 اسکرپ نرخی','نرخ',2,15,false],['rate_mismatch','⚠️ پیگیری مغایرت نرخ','نرخ',4,25,true],['foreign_rate','🌍 نرخ مهمان خارجی','نرخ',3,20,false],
  ['extra_profit','💰 دریافت سود مازاد','تجاری',4,30,true],['review_response','💬 پاسخ به در انتظار بررسی کارشناس','پیگیری',2,10,false],['cancel','❌ کنسلی','رزرو',3,18,true],
  ['half_charge','🕒 نیم‌شارژ','رزرو',3,18,true],['yellow_rate','🟡 نرخ زرد','نرخ',2,12,false],['capacity_update','🔁 آپدیت ظرفیت','ظرفیت',3,15,false],
  ['over_capacity','⚠️ اوور ظرفیت','ظرفیت',5,30,true],['extra_capacity','➕ ظرفیت مازاد','ظرفیت',3,18,false],['capacity_cover','🧩 پوش ظرفیت','ظرفیت',3,18,false],
  ['other','⚙️ سایر','سایر',1,10,false],['sheba','💳 تغییر شبا','مالی',4,30,false],['panel_training','🎓 آموزش پنل','آنلاین‌سازی',5,45,false],
  ['hotel_suggestion','🏨 پیشنهاد هتل','تجاری',2,12,false],['hotel_contact','📞 ارتباط با هتل','ارتباط',2,10,false],['hotel_mapping','📍 مپ کردن هتل','آنلاین‌سازی',4,25,false],
  ['agency','🧭 تعیین آژانس','عملیات',3,20,false],['dashboard_review','📊 بررسی داشبورد','تحلیل',2,15,false],['payment_followup','💰 پیگیری واریزی','مالی',3,20,true],
  ['package','🎁 پکیج','تجاری',3,20,false],['minimum_stay','🛏️ حداقل اقامت','نرخ',3,15,false],['reservation_rate_fix','اصلاح نرخ رزرو','رزرو',4,25,true],
  ['club_offer','آفر باشگاه','تجاری',3,20,false],['seasonal_notes','نکات فصلی','تحلیل',2,15,false]
].map(([code,title,group,weight,minutes,requiresReservation])=>({id:`action-${code}`,code,title,group_name:group,weight,default_minutes:minutes,requires_reservation_code:requiresReservation,active:true}));

export default function WorkReportCenter({hotels=[],users=[],tasks=[],me,onCreateTask,setView}:Props){
  const [actions,setActions]=useState<any[]>(DEFAULT_ACTIONS),[reports,setReports]=useState<any[]>([]),[blockers,setBlockers]=useState<any[]>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [query,setQuery]=useState(''),[hotelQuery,setHotelQuery]=useState(''),[selectedHotel,setSelectedHotel]=useState<any>(null),[selectedAction,setSelectedAction]=useState<any>(DEFAULT_ACTIONS[0]);
  const [form,setForm]=useState<any>({note:'',result:'انجام شد',reservation_code:'',channel:'بدون ارتباط',spent_minutes:12,follow_up_at:'',create_task:false,blocker:false,blocker_severity:'بالا'});
  const [period,setPeriod]=useState('30'),[expert,setExpert]=useState('all'),[group,setGroup]=useState('all');

  async function load(){setLoading(true);try{const [storedActions,storedReports,storedBlockers]=await Promise.all([loadRows('ihos_work_action_types'),loadRows('ihos_work_reports'),loadRows('ihos_hotel_blockers')]);if(storedActions.length)setActions(storedActions.filter(row=>row.active!==false));setReports(storedReports.sort((a,b)=>String(b.occurred_at||b.created_at).localeCompare(String(a.occurred_at||a.created_at))));setBlockers(storedBlockers);setMessage('')}catch(e:any){setMessage(`دریافت گزارش‌ها ناموفق بود: ${e.message}`)}finally{setLoading(false)}}
  useEffect(()=>{void load()},[]);
  useEffect(()=>{if(selectedAction)setForm((current:any)=>({...current,spent_minutes:selectedAction.default_minutes||current.spent_minutes,reservation_code:selectedAction.requires_reservation_code?current.reservation_code:''}))},[selectedAction]);

  const hotelMatches=useMemo(()=>{
    const q=normalizeFa(hotelQuery);if(!q)return[];
    return hotels.filter(hotel=>normalizeFa(`${hotel.title} ${hotel.hotel_code} ${hotel.city} ${hotel.provider}`).includes(q)).slice(0,12);
  },[hotels,hotelQuery]);
  const groups=useMemo(()=>[...new Set(actions.map(action=>action.group_name).filter(Boolean))],[actions]);
  const filteredActions=actions.filter(action=>group==='all'||action.group_name===group);
  const filteredReports=useMemo(()=>{
    const from=period==='all'?'':new Date(Date.now()-Number(period)*86400000).toISOString();
    return reports.filter(row=>(!from||String(row.occurred_at||row.created_at)>=from)&&(expert==='all'||row.user_id===expert)&&(!query||normalizeFa(`${row.hotel_title} ${row.user_name} ${row.action_title} ${row.note} ${row.reservation_code}`).includes(normalizeFa(query))));
  },[reports,period,expert,query]);
  const stats=useMemo(()=>({
    count:filteredReports.length,hotels:new Set(filteredReports.map(row=>row.hotel_id)).size,
    points:filteredReports.reduce((sum,row)=>sum+asNumber(row.weight||1),0),minutes:filteredReports.reduce((sum,row)=>sum+asNumber(row.spent_minutes),0),
    today:filteredReports.filter(row=>dateOnly(row.occurred_at||row.created_at)===today()).length
  }),[filteredReports]);
  const people=useMemo(()=>users.filter(user=>user.is_active!==false).map(user=>{const mine=filteredReports.filter(row=>row.user_id===user.id||normalizeFa(row.user_name)===normalizeFa(user.full_name));return{user,count:mine.length,points:mine.reduce((sum,row)=>sum+asNumber(row.weight||1),0),minutes:mine.reduce((sum,row)=>sum+asNumber(row.spent_minutes),0),hotels:new Set(mine.map(row=>row.hotel_id)).size}}).sort((a,b)=>b.points-a.points),[users,filteredReports]);

  function chooseAction(action:any){setSelectedAction(action);setMessage('')}
  function reset(){setForm({note:'',result:'انجام شد',reservation_code:'',channel:'بدون ارتباط',spent_minutes:selectedAction?.default_minutes||12,follow_up_at:'',create_task:false,blocker:false,blocker_severity:'بالا'});setSelectedHotel(null);setHotelQuery('')}
  async function saveReport(startCall=false){
    if(!selectedHotel||!selectedAction){setMessage('هتل و نوع اقدام را انتخاب کن');return}
    if(selectedAction.requires_reservation_code&&!String(form.reservation_code).trim()){setMessage('برای این اقدام، کد رزرو الزامی است');return}
    if(!form.note.trim()){setMessage('نتیجه کوتاه کار را بنویس تا گزارش قابل استفاده باشد');return}
    setBusy(true);setMessage('');
    try{
      const report={id:makeId('work-report'),user_id:me?.id,user_name:me?.full_name||'کاربر',department_id:me?.department_id||null,department_name:me?.department_name||null,hotel_id:selectedHotel.id,hotel_code:selectedHotel.hotel_code||null,hotel_title:selectedHotel.title,action_type_id:selectedAction.id,action_code:selectedAction.code,action_title:selectedAction.title,action_group:selectedAction.group_name,weight:asNumber(selectedAction.weight||1),reservation_code:form.reservation_code||null,channel:form.channel,note:form.note.trim(),result:form.result,spent_minutes:asNumber(form.spent_minutes),occurred_at:nowIso(),follow_up_at:form.follow_up_at||null,source:'app',created_at:nowIso(),updated_at:nowIso()};
      await saveRow('ihos_work_reports',report);
      if(form.channel!=='بدون ارتباط'||selectedAction.code==='hotel_contact'||startCall){
        await saveRow('ihos_hotel_communications',{id:makeId('communication'),hotel_id:selectedHotel.id,hotel_title:selectedHotel.title,channel:startCall?'تماس EyeBeam':form.channel,contact_person:null,subject:selectedAction.title,body:form.note.trim(),result:form.result,next_followup_at:form.follow_up_at||null,created_by:me?.id,created_by_name:me?.full_name,pinned:false,duration_minutes:asNumber(form.spent_minutes),created_at:nowIso(),updated_at:nowIso()});
      }
      if(form.blocker){await saveRow('ihos_hotel_blockers',{id:makeId('blocker'),hotel_id:selectedHotel.id,hotel_code:selectedHotel.hotel_code||null,hotel_title:selectedHotel.title,blocker_type:selectedAction.group_name,title:`مانع: ${selectedAction.title}`,description:form.note.trim(),severity:form.blocker_severity,status:'باز',owner_id:me?.id,owner_name:me?.full_name,department_id:me?.department_id,department_name:me?.department_name,opened_at:nowIso(),due_at:form.follow_up_at||null,created_by:me?.id,created_at:nowIso(),updated_at:nowIso()})}
      if((form.create_task||form.blocker)&&onCreateTask)onCreateTask(selectedHotel,{title:form.blocker?`رفع مانع: ${selectedAction.title}`:`پیگیری: ${selectedAction.title}`,reason:form.note,category:selectedAction.group_name,priority:form.blocker?form.blocker_severity:'متوسط',deadline:form.follow_up_at?dateOnly(form.follow_up_at):today(),source_type:'work_report',source_id:report.id});
      setReports(current=>[report,...current]);setMessage('گزارش کار، زمان و امتیاز آن ثبت شد');
      const phone=String(selectedHotel.reservation_phone||selectedHotel.phone||'').replace(/[^\d+]/g,'');
      reset();
      if(startCall){if(phone)window.location.href=`callto:${phone}`;else setMessage('گزارش ثبت شد؛ اما شماره تماس هتل در داده اصلی موجود نیست')}
    }catch(e:any){setMessage(`ثبت گزارش ناموفق بود: ${e.message}`)}finally{setBusy(false)}
  }

  return <div className="workReportV23">
    <section className="workHeroV23"><div><span>FAST WORK JOURNAL</span><h1>گزارش کار سریع کارشناسان</h1><p>جایگزین ساده و قابل تحلیل Google Sheet؛ هر اقدام با هتل، زمان، وزن، نتیجه، کد رزرو و پیگیری بعدی ثبت می‌شود.</p></div><div><b>{fa(stats.today)}</b><span>گزارش امروز</span><small>{me?.full_name}</small></div></section>
    <section className="workMetricsV23"><Metric icon={FileText} label="گزارش" value={stats.count}/><Metric icon={Hotel} label="هتل یکتا" value={stats.hotels}/><Metric icon={Target} label="امتیاز وزنی" value={stats.points}/><Metric icon={Timer} label="زمان ثبت‌شده" value={Math.round(stats.minutes/60)} suffix=" ساعت"/><Metric icon={ShieldAlert} label="مانع باز" value={blockers.filter(row=>!['حل شد','بسته شد','resolved','closed'].includes(row.status)).length}/></section>
    <section className="workLayoutV23">
      <article className="workComposerV23">
        <header><div><Plus/><span><b>ثبت اقدام جدید</b><small>هدف: ثبت کامل در کمتر از ۳۰ ثانیه</small></span></div>{selectedHotel&&<button onClick={()=>setSelectedHotel(null)}>تغییر هتل</button>}</header>
        {!selectedHotel?<div className="hotelQuickSearchV23"><label>هتل</label><div><Search/><input autoFocus value={hotelQuery} onChange={e=>setHotelQuery(e.target.value)} placeholder="نام یا کد هتل را بنویس..."/></div>{hotelQuery&&<section>{hotelMatches.map(hotel=><button key={hotel.id} onClick={()=>{setSelectedHotel(hotel);setHotelQuery('')}}><Hotel/><span><b>{hotel.title}</b><small>{hotel.hotel_code||'بدون کد'} · {hotel.city||'بدون شهر'} · {hotel.provider||'IHO Provider'}</small></span></button>)}{!hotelMatches.length&&<p>هتلی پیدا نشد؛ نام یا کد دقیق‌تر را وارد کن.</p>}</section>}</div>:<div className="selectedHotelV23"><Hotel/><span><b>{selectedHotel.title}</b><small>{selectedHotel.hotel_code||'بدون کد'} · {selectedHotel.city||'بدون شهر'} · {selectedHotel.provider||'IHO Provider'}</small></span><div><button disabled={busy} onClick={()=>void saveReport(true)}><Phone/> ثبت و تماس EyeBeam</button></div></div>}
        <div className="actionGroupFilterV23"><button className={group==='all'?'active':''} onClick={()=>setGroup('all')}>همه</button>{groups.map(item=><button key={item} className={group===item?'active':''} onClick={()=>setGroup(item)}>{item}</button>)}</div>
        <div className="actionPickerV23">{filteredActions.map(action=><button key={action.id} className={selectedAction?.id===action.id?'active':''} onClick={()=>chooseAction(action)}><span>{action.title}</span><small>وزن {fa(action.weight)} · {fa(action.default_minutes)} دقیقه{action.requires_reservation_code?' · کد رزرو':''}</small></button>)}</div>
        <div className="workFormV23"><label className="span2">نتیجه کوتاه کار<textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="چه کاری انجام شد، نتیجه چه بود و قدم بعدی چیست؟"/></label>{selectedAction?.requires_reservation_code&&<label>کد رزرو<input value={form.reservation_code} onChange={e=>setForm({...form,reservation_code:e.target.value})} placeholder="الزامی"/></label>}<label>نتیجه<select value={form.result} onChange={e=>setForm({...form,result:e.target.value})}>{['انجام شد','نیازمند پیگیری','منتظر پاسخ هتل','عدم پاسخ','ارجاع شد','بلاک شد'].map(item=><option key={item}>{item}</option>)}</select></label><label>کانال ارتباط<select value={form.channel} onChange={e=>setForm({...form,channel:e.target.value})}>{['بدون ارتباط','تماس','پیامک','بله','واتساپ','تلگرام','ایمیل','جلسه حضوری','جلسه آنلاین'].map(item=><option key={item}>{item}</option>)}</select></label><label>زمان صرف‌شده (دقیقه)<input type="number" min="1" value={form.spent_minutes} onChange={e=>setForm({...form,spent_minutes:e.target.value})}/></label><label>پیگیری بعدی<input type="datetime-local" value={form.follow_up_at} onChange={e=>setForm({...form,follow_up_at:e.target.value})}/></label><div className="workChecksV23 span2"><label><input type="checkbox" checked={form.create_task} onChange={e=>setForm({...form,create_task:e.target.checked})}/> پیگیری را به تسک تبدیل کن</label><label><input type="checkbox" checked={form.blocker} onChange={e=>setForm({...form,blocker:e.target.checked})}/> به‌عنوان مانع هتل ثبت کن</label>{form.blocker&&<select value={form.blocker_severity} onChange={e=>setForm({...form,blocker_severity:e.target.value})}><option>متوسط</option><option>بالا</option><option>فوری</option><option>بحرانی</option></select>}</div></div>
        {message&&<div className={message.includes('ناموفق')||message.includes('الزامی')?'workNoticeV23 danger':'workNoticeV23'}>{message}</div>}
        <button className="btn primary full workSubmitV23" disabled={busy||!selectedHotel} onClick={()=>void saveReport()}>{busy?<RefreshCcw className="spin"/>:<Send/>} ثبت گزارش کار</button>
      </article>

      <aside className="workInsightV23">
        <section><header><div><BarChart3/><span><b>کیفیت و خروجی تیم</b><small>امتیاز وزنی گزارش‌ها</small></span></div><button onClick={()=>setView?.('kpiCenter')}>KPI</button></header><div className="workRankingV23">{people.slice(0,8).map((row,index)=><div key={row.user.id}><i>{row.user.avatar?<img src={row.user.avatar} alt=""/>:row.user.full_name?.slice(0,1)}</i><span><b>{index===0&&row.points?'🏆 ':''}{row.user.full_name}</b><small>{fa(row.count)} اقدام · {fa(row.hotels)} هتل</small></span><strong>{fa(row.points)}</strong></div>)}</div></section>
        <section><header><div><AlertTriangle/><span><b>موانع تازه</b><small>نیازمند تصمیم یا ارجاع</small></span></div></header><div className="miniBlockersV23">{blockers.filter(row=>!['حل شد','بسته شد','resolved','closed'].includes(row.status)).slice(0,6).map(row=><article key={row.id}><span><b>{row.hotel_title}</b><small>{row.title}</small></span><em>{row.severity}</em></article>)}{!blockers.length&&<div className="emptyMiniV23"><CheckCircle2/><span>مانع بازی ثبت نشده است</span></div>}</div></section>
      </aside>
    </section>
    <section className="workHistoryV23"><header><div><MessageSquareText/><span><b>تاریخچه گزارش‌ها</b><small>قابل جستجو، فیلتر و پیگیری</small></span></div><div><div className="historySearchV23"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="هتل، اقدام، کارشناس یا کد رزرو..."/></div><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="7">۷ روز</option><option value="30">۳۰ روز</option><option value="90">۹۰ روز</option><option value="all">همه</option></select><select value={expert} onChange={e=>setExpert(e.target.value)}><option value="all">همه کارشناسان</option>{users.map(user=><option key={user.id} value={user.id}>{user.full_name}</option>)}</select></div></header><div className="workHistoryRowsV23">{filteredReports.slice(0,300).map(row=><article key={row.id}><i>{String(row.action_title||'⚙️').split(' ')[0]}</i><div><b>{row.action_title}</b><small>{row.hotel_title} · {row.user_name}</small><p>{row.note}</p></div><span><em>{fa(row.weight||1)} امتیاز</em><small>{fa(row.spent_minutes)} دقیقه</small>{row.reservation_code&&<code>{row.reservation_code}</code>}</span><time>{new Intl.DateTimeFormat('fa-IR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(row.occurred_at||row.created_at))}</time></article>)}{loading&&<div className="workLoadingV23"><RefreshCcw className="spin"/> در حال دریافت گزارش‌ها...</div>}{!loading&&!filteredReports.length&&<div className="workLoadingV23"><Sparkles/> هنوز گزارشی در این بازه ثبت نشده است.</div>}</div></section>
  </div>
}

function Metric({icon:Icon,label,value,suffix=''}:any){return <article><Icon/><span><small>{label}</small><b>{fa(value)}{suffix}</b></span></article>}

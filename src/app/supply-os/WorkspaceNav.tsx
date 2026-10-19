'use client';
import {useState} from 'react';
import {Activity, BarChart3, Building2, CalendarClock, ChevronDown, ClipboardCheck, Radar, Database, FileBarChart2, Hotel, LogOut, Megaphone, Menu, ShieldCheck, Users, X} from 'lucide-react';

export type WorkspaceView='today'|'hotels'|'tasks'|'team'|'data'|'report'|'market'|'commercial'|'control';
type Props={view:WorkspaceView;onView:(v:WorkspaceView)=>void;manager:boolean;userName:string;openCount:number;lateCount:number;onLogout:()=>void};
const primary=[
 {id:'today',label:'میز کار امروز',Icon:Activity,help:'از اینجا شروع کن'},
 {id:'tasks',label:'پیگیری‌ها و تسک‌ها',Icon:ClipboardCheck,help:'از اقدام تا نتیجه'},
 {id:'hotels',label:'هتل‌ها و فرصت‌ها',Icon:Hotel,help:'جستجو و پرونده ۳۶۰'}
] as const;
const managers=[
 {id:'control',label:'رادار و اعتبار هتل‌ها',Icon:Radar},
 {id:'team',label:'تیم و مسئولیت‌ها',Icon:Users},
 {id:'data',label:'فایل‌ها و سلامت داده',Icon:Database},
 {id:'report',label:'گزارش مدیرعامل',Icon:FileBarChart2},
 {id:'market',label:'بازار و تأمین‌کنندگان',Icon:BarChart3},
 {id:'commercial',label:'تخفیف و کمپین‌ها',Icon:Megaphone}
] as const;
export default function WorkspaceNav({view,onView,manager,userName,openCount,lateCount,onLogout}:Props){
 const [more,setMore]=useState(false);
 const choose=(next:WorkspaceView)=>{onView(next);setMore(false);window.scrollTo({top:0,behavior:'smooth'})};
 const item=(entry:{id:WorkspaceView;label:string;Icon:any;help?:string})=><button key={entry.id} type="button" aria-current={view===entry.id?'page':undefined} className={'sco-hub-link '+(view===entry.id?'active':'')} onClick={()=>choose(entry.id)}>
  <entry.Icon size={19}/><span><b>{entry.label}</b>{entry.help&&<small>{entry.help}</small>}</span>
  {entry.id==='tasks'&&openCount>0&&<em>{openCount.toLocaleString('fa-IR')}</em>}
 </button>;
 return <>
  <aside className="sco-hub-side" aria-label="بخش‌های سامانه">
   <div className="sco-hub-brand"><div className="sco-hub-brand-mark"><Building2 size={22}/></div><div><b>ایران‌هتل</b><span>Supply Chain OS</span></div></div>
   <div className="sco-hub-side-main">
    <p className="sco-hub-group">میز کار روزانه</p>
    {primary.map(e=>item(e))}
    {manager&&<><p className="sco-hub-group">مدیریت و تحلیل</p>{managers.map(e=>item(e))}</>}
    <p className="sco-hub-group">سامانه‌های تخصصی</p>
    <a className="sco-hub-link" href="/reservation-intelligence"><CalendarClock size={19}/><span><b>هوشمندی رزرو</b><small>فایل و تحلیل رزرو</small></span></a>
   </div>
   <div className="sco-hub-foot">
    {lateCount>0&&<button className="sco-hub-late" type="button" onClick={()=>choose('tasks')}><ShieldCheck size={17}/> {lateCount.toLocaleString('fa-IR')} کار معوق نیازمند رسیدگی</button>}
    <div className="sco-hub-profile"><span>{userName.trim().slice(0,1)||'ت'}</span><div><b>{userName}</b><small>{manager?'مدیر زنجیره تأمین':'کارشناس تأمین'}</small></div><button type="button" aria-label="خروج" title="خروج" onClick={onLogout}><LogOut size={17}/></button></div>
   </div>
  </aside>
  <nav className="sco-hub-mobile" aria-label="ناوبری موبایل">
   {primary.map(e=><button key={e.id} type="button" className={view===e.id?'active':''} onClick={()=>choose(e.id)}><e.Icon size={20}/><span>{e.id==='today'?'امروز':e.id==='tasks'?'کارها':'هتل‌ها'}</span></button>)}
   <button type="button" className={more?'active':''} aria-expanded={more} onClick={()=>setMore(!more)}>{more?<X size={20}/>:<Menu size={20}/>}<span>بیشتر</span></button>
  </nav>
  {more&&<div className="sco-hub-mobile-menu" role="dialog" aria-label="بخش‌های بیشتر"><div><b>سایر بخش‌ها</b><button type="button" onClick={()=>setMore(false)}><X size={19}/></button></div>
   {manager&&managers.map(e=>item(e))}
   <a className="sco-hub-link" href="/reservation-intelligence"><CalendarClock size={19}/> هوشمندی رزرو</a>
   <button className="sco-hub-link" type="button" onClick={onLogout}><LogOut size={19}/> خروج از حساب</button>
  </div>}
 </>;
}
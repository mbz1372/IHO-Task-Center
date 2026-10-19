'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,Building2,CheckSquare,Command,Database,FileBarChart2,Home,Search,Users,X} from 'lucide-react';
import type {WorkspaceView} from './WorkspaceNav';
type Result={id:WorkspaceView;title:string;hint:string;Icon:any};
const results:Result[]=[
{id:'today',title:'میز کار امروز',hint:'فرصت‌های فوری، پرونده‌ها و برنامه امروز',Icon:Home},
{id:'tasks',title:'تسک‌ها و پیگیری‌ها',hint:'کارهای باز، معوق، منتظر هتل و تکمیل‌شده',Icon:CheckSquare},
{id:'hotels',title:'بانک و پرونده هتل‌ها',hint:'جستجوی هتل و اقدام از پرونده ۳۶۰',Icon:Building2},
{id:'team',title:'تیم و واگذاری',hint:'دسترسی، مسئولیت کارشناسان و تخصیص هتل',Icon:Users},
{id:'data',title:'مرکز داده',hint:'فایل‌های رزرو، نرخ، ظرفیت و اعتبارسنجی',Icon:Database},
{id:'report',title:'گزارش مدیرعامل',hint:'شاخص‌های واقعی و جمع‌بندی قابل ارائه',Icon:FileBarChart2},
];
export default function WorkspaceSearch({onNavigate,manager}:{onNavigate:(id:WorkspaceView)=>void;manager:boolean}){
const [opened,setOpened]=useState(false),[q,setQ]=useState('');
useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpened(x=>!x)}if(e.key==='Escape')setOpened(false)};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler)},[]);
const matches=useMemo(()=>results.filter(x=>(manager||['today','tasks','hotels'].includes(x.id))&&(x.title+' '+x.hint).includes(q.trim())),[q,manager]);
return <><button type="button" className="sco-pane-search-trigger" onClick={()=>setOpened(true)} aria-label="باز کردن جستجوی سریع"><Search size={18}/><span>جستجوی سریع در بخش‌های سامانه</span><kbd>⌘ K</kbd></button>
{opened&&<div className="sco-pane-command-backdrop" onMouseDown={()=>setOpened(false)}><section className="sco-pane-command" role="dialog" aria-modal="true" aria-label="جستجوی سریع" onMouseDown={e=>e.stopPropagation()}><div className="sco-pane-command-field"><Search size={21}/><input autoFocus placeholder="به کدام بخش می‌خواهی بروی؟" value={q} onChange={e=>setQ(e.target.value)}/><button type="button" aria-label="بستن" onClick={()=>setOpened(false)}><X size={18}/></button></div><p>دسترسی سریع به ابزارهای زنجیره تأمین</p><div className="sco-pane-command-list">{matches.map(({id,title,hint,Icon})=><button type="button" key={id} onClick={()=>{onNavigate(id);setOpened(false);setQ('')}}><Icon size={19}/><span><b>{title}</b><small>{hint}</small></span><ArrowLeft size={16}/></button>)}{matches.length===0&&<span className="sco-pane-command-empty">بخشی با این عنوان پیدا نشد.</span>}</div><footer><Command size={13}/> برای جستجو از Ctrl+K یا ⌘K استفاده کن</footer></section></div>}</>
}

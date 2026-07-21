'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const ModuleLoading=({label='در حال آماده‌سازی ماژول...'}:{label?:string})=><div className="moduleLoadingV16" role="status" aria-live="polite"><span/><b>{label}</b></div>;
const HotelSuperApp=dynamic(()=>import('@/components/superapp/HotelSuperApp'),{ssr:false,loading:()=> <ModuleLoading label="در حال بارگذاری سوپر اپ هتل..."/>});
const OperationsDashboard=dynamic(()=>import('@/components/dashboard/OperationsDashboard'),{ssr:false,loading:()=> <ModuleLoading label="در حال آماده‌سازی داشبورد..."/>});

const ReviewCenterV17=dynamic(()=>import('@/components/enterprise/V17Modules').then(m=>m.ReviewCenterV17),{ssr:false,loading:()=> <ModuleLoading/>});
const SlaCenterV17=dynamic(()=>import('@/components/enterprise/V17Modules').then(m=>m.SlaCenterV17),{ssr:false,loading:()=> <ModuleLoading/>});
const MessageCenterV17=dynamic(()=>import('@/components/enterprise/V17Modules').then(m=>m.MessageCenterV17),{ssr:false,loading:()=> <ModuleLoading/>});
const CalendarPlusV17=dynamic(()=>import('@/components/enterprise/V17Modules').then(m=>m.CalendarPlusV17),{ssr:false,loading:()=> <ModuleLoading/>});
const FinancialContractsV17=dynamic(()=>import('@/components/enterprise/V17Modules').then(m=>m.FinancialContractsV17),{ssr:false,loading:()=> <ModuleLoading/>});
const TeamCoverageV17=dynamic(()=>import('@/components/enterprise/V17Modules').then(m=>m.TeamCoverageV17),{ssr:false,loading:()=> <ModuleLoading/>});
const ControlTowerV18=dynamic(()=>import('@/components/enterprise/V18ExecutionIntelligence').then(m=>m.ControlTowerV18),{ssr:false,loading:()=> <ModuleLoading label="در حال تحلیل وضعیت عملیات..."/>});
const HotelOwnershipV18=dynamic(()=>import('@/components/enterprise/V18ExecutionIntelligence').then(m=>m.HotelOwnershipV18),{ssr:false,loading:()=> <ModuleLoading/>});
const KpiCenterV18=dynamic(()=>import('@/components/enterprise/V18ExecutionIntelligence').then(m=>m.KpiCenterV18),{ssr:false,loading:()=> <ModuleLoading/>});
const CommunicationsCenterV18=dynamic(()=>import('@/components/enterprise/V18ExecutionIntelligence').then(m=>m.CommunicationsCenterV18),{ssr:false,loading:()=> <ModuleLoading/>});
const AutomationOperationsV18=dynamic(()=>import('@/components/enterprise/V18ExecutionIntelligence').then(m=>m.AutomationOperationsV18),{ssr:false,loading:()=> <ModuleLoading/>});
const HotelLifecycleHealthV19=dynamic(()=>import('@/components/enterprise/V19DataTruth').then(m=>m.HotelLifecycleHealthV19),{ssr:false,loading:()=> <ModuleLoading label="در حال تحلیل صحت داده‌های هتل..."/>});
import { createClient } from '@supabase/supabase-js';
import { Activity, AlarmClock, Archive, ArrowLeft, Bell, BookOpen, Building2, CalendarDays, CheckCircle2, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock3, Database, Download, Edit3, Eye, FileCheck2, FileText, Filter, Flag, FolderKanban, FolderOpen, Hotel, KeyRound, LayoutDashboard, ListChecks, LogOut, Menu, Moon, MoreHorizontal, Palette, PanelRightClose, PanelRightOpen, Pin, Plus, RefreshCw, Rocket, Save, Search, Settings, Shield, ShieldAlert, SlidersHorizontal, Sparkles, Square, Sun, Tag, Target, Trash2, Upload, UserPlus, Users, Wifi, WifiOff, X } from 'lucide-react';
import {GuideHint,SystemGuide} from '@/components/help/SystemGuide';

declare global { interface Window { __IHOS_ERROR__?: any; } }

let sbClient:any = null;
async function getSupabaseClient(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key || typeof window === 'undefined') return null;
  if(sbClient) return sbClient;
  try {
    sbClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-client-info': 'iran-hotel-os-web' } }
    });
    return sbClient;
  } catch (e) {
    console.error('Supabase client init failed', e);
    return null;
  }
}
async function loadXLSX(){ return await import('xlsx'); }

const uid=()=> globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;
const nowIso=()=>new Date().toISOString();
const today=()=>new Date().toISOString().slice(0,10);
const cn=(...v:(string|false|null|undefined)[])=>v.filter(Boolean).join(' ');
const norm=(v:any)=>String(v??'').replace(/\u200c/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
const safeArr=<T,>(v:any):T[]=>Array.isArray(v)?v:[];
function toast(msg:string){ if(typeof window!=='undefined') window.dispatchEvent(new CustomEvent('ihos-toast',{detail:msg})); }
function csv(rows:any[], name:string){
  const headers=Object.keys(rows[0]||{empty:''});
  const body='\ufeff'+[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(r[h]??'').replaceAll('"','""')}"`).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));a.download=name;a.click();
}

// Jalali conversion - inline, dependency-free
function div(a:number,b:number){return ~~(a/b)}
function g2d(gy:number,gm:number,gd:number){let d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*((gm+9)%12)+2,5)+gd-34840408;d=d-div(div(gy+100100+div(gm-8,6),100)*3,4)+752;return d}
function d2g(jdn:number){let j=4*jdn+139361631;j=j+div(div(4*jdn+183187720,146097)*3,4)*4-3908;let i=div((j%1461),4)*5+308;let gd=div((i%153),5)+1;let gm=(div(i,153)%12)+1;let gy=div(j,1461)-100100+div(8-gm,6);return {gy,gm,gd}}
function jalCal(jy:number){const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];let gy=jy+621,leapJ=-14,jp=breaks[0],jm=0,jump=0;for(let i=1;i<breaks.length;i++){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ=leapJ+div(jump,33)*8+div((jump%33),4);jp=jm}let n=jy-jp;leapJ=leapJ+div(n,33)*8+div(((n%33)+3),4);if(jump%33===4&&jump-n===4)leapJ+=1;const leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150;const march=20+leapJ-leapG;if(jump-n<6)n=n-jump+div(jump+4,33)*33;let leap=((n+1)%33-1)%4;if(leap===-1)leap=4;return {leap,gy,march}}
function j2d(jy:number,jm:number,jd:number){const r=jalCal(jy);return g2d(r.gy,3,r.march)+(jm-1)*31-div(jm,7)*(jm-7)+jd-1}
function d2j(jdn:number){const gy=d2g(jdn).gy;let jy=gy-621;let r=jalCal(jy);let jdn1f=g2d(gy,3,r.march);let k=jdn-jdn1f;if(k>=0){if(k<=185)return {jy,jm:1+div(k,31),jd:(k%31)+1};k-=186}else{jy-=1;k+=179;if(jalCal(jy).leap===1)k+=1}return {jy,jm:7+div(k,30),jd:(k%30)+1}}
function toJalali(date?:string|Date){const d=date?new Date(date):new Date();return d2j(g2d(d.getFullYear(),d.getMonth()+1,d.getDate()))}
function toGregorianISO(jy:number,jm:number,jd:number){const g=d2g(j2d(jy,jm,jd));return `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`}
function jalaliMonthLength(jy:number,jm:number){if(jm<=6)return 31;if(jm<=11)return 30;return jalCal(jy).leap===0?29:30}
function gDayIndexForJalali(jy:number,jm:number,jd:number){const date=new Date(toGregorianISO(jy,jm,jd)+'T12:00:00');return (date.getDay()+1)%7}
const jMonths=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const weekdays=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
function normalizedDateParts(d?:string){const raw=String(d||'').trim();const m=raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);return m?{year:Number(m[1]),month:Number(m[2]),day:Number(m[3]),raw}:null}
function dateToIso(d?:string){const p=normalizedDateParts(d);if(p&&p.year>=1300&&p.year<1500)return toGregorianISO(p.year,p.month,p.day);if(!d)return '';const dt=new Date(d);return Number.isNaN(dt.getTime())?'':dt.toISOString().slice(0,10)}
function faDate(d?:string){if(!d)return '—';const p=normalizedDateParts(d);if(p&&p.year>=1300&&p.year<1500)return `${p.year}/${String(p.month).padStart(2,'0')}/${String(p.day).padStart(2,'0')}`;const dt=new Date(d);if(Number.isNaN(dt.getTime()))return String(d);const j=toJalali(dt);return `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`}
function faDateTime(d?:string){if(!d)return '—';const dt=new Date(d);if(Number.isNaN(dt.getTime()))return faDate(d);return `${faDate(d)} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`}

// Types
type PermissionKey = 'dashboard'|'inbox'|'executive'|'controlTower'|'crm360'|'reports'|'riskRadar'|'tasks'|'tasks_create'|'tasks_edit'|'tasks_delete'|'assignments'|'approvals'|'sla'|'playbooks'|'messages'|'hotels'|'hotels_import'|'hotelOwnership'|'contracts'|'communications'|'calendar'|'documents'|'documents_upload'|'team'|'kpiCenter'|'roles'|'logs'|'reminders'|'automations'|'goals'|'projects'|'savedViews'|'bulkActions'|'aiAssistant'|'dailyReport'|'settings'|'notifications'|'hotelSuperApp'|'help';
type User={id:string;full_name:string;username:string;password_hash:string;role:string;role_id?:string;team?:string;zone?:string;mobile?:string;email?:string;avatar?:string;is_active:boolean;created_at?:string;updated_at?:string};
type Role={id:string;title:string;description?:string;permissions:Record<string,boolean>;is_system?:boolean;created_at?:string;updated_at?:string};
type HotelT={id:string;hotel_code?:string;title:string;city?:string;province?:string;country?:string;hotel_group?:string;caring_category?:string;hotel_type?:string;star?:number;grade?:string;status?:string;contract_status?:string;cooperation_status?:string;risk_status?:string;hotel_category?:string;provider?:string;pms?:string;capacity_total?:number;purchase_period?:number;payment_period?:number;status_end_date?:string;status_start_date?:string;contract_date?:string;site_visible?:boolean;search_visible?:boolean;manager_name?:string;manager_mobile?:string;phone?:string;reservation_phone?:string;address?:string;created_at?:string;updated_at?:string};
type Task={id:string;title:string;description?:string;hotel_id?:string;hotel_title?:string;city?:string;priority:string;status:string;category:string;assigned_to?:string;assigned_name?:string;created_by?:string;deadline?:string;due_time?:string;completed_at?:string;created_at?:string;updated_at?:string;labels?:string[];collaborator_ids?:string[];project_id?:string;pinned_note?:string;estimated_minutes?:number;spent_minutes?:number;source_type?:string;source_id?:string;automation_id?:string};
type TaskActivity={id:string;task_id:string;title:string;description?:string;assigned_to?:string;is_done:boolean;done_at?:string;done_by?:string;due_date?:string;due_time?:string;estimated_minutes?:number;spent_minutes?:number;created_at?:string;updated_at?:string};
type Doc={id:string;title:string;type?:string;hotel_id?:string;hotel_title?:string;file_url?:string;storage_path?:string;notes?:string;uploaded_by?:string;pinned?:boolean;created_at?:string;updated_at?:string};
type EventT={id:string;title:string;description?:string;start_date:string;end_date?:string;user_id?:string;hotel_id?:string;color?:string;created_at?:string;updated_at?:string};
type Notif={id:string;title:string;body?:string;user_id?:string;is_read:boolean;entity_type?:string;entity_id?:string;created_at?:string};
type ActivityLog={id:string;user_id?:string;user_name?:string;action:string;entity:string;entity_id?:string;title?:string;duration_minutes?:number;created_at:string};
type HotelEvent={id:string;hotel_id:string;hotel_title?:string;event_type:string;title:string;description?:string;severity?:string;actor_id?:string;actor_name?:string;entity_type?:string;entity_id?:string;payload?:Record<string,any>;occurred_at:string;created_at?:string};
type Reminder={id:string;title:string;body?:string;user_id?:string;task_id?:string;notify_at:string;is_done:boolean;is_sent?:boolean;created_at?:string;updated_at?:string};
type Automation={id:string;title:string;enabled:boolean;trigger_type:string;trigger_category?:string;condition_days?:number;action_type?:string;task_template?:string;max_per_run?:number;assign_to?:string;priority?:string;status?:string;reminder_minutes?:number;label?:string;created_at?:string;updated_at?:string};
type Goal={id:string;title:string;user_id?:string;category?:string;target_count:number;start_date:string;end_date:string;metric:'activities_done'|'tasks_done';created_at?:string;updated_at?:string};
type Project={id:string;title:string;description?:string;owner_id?:string;member_ids?:string[];status?:string;deadline?:string;pinned_note?:string;created_at?:string;updated_at?:string};
type AppSettings={orgName:string;appSubtitle:string;brandColor:string;logoUrl:string;faviconUrl:string;theme:'light'|'dark'|'system';notifications:boolean;documentsEnabled:boolean;defaultPriority:string;defaultTaskStatus:string;calendarFirstDay:string;allowUserDelete:boolean;taskCategories:string;taskStatuses:string;labels:string;contractTypes:string};

const ALL_PERMS:PermissionKey[]=['dashboard','inbox','executive','controlTower','crm360','reports','riskRadar','tasks','tasks_create','tasks_edit','tasks_delete','assignments','approvals','sla','playbooks','messages','hotels','hotels_import','hotelOwnership','contracts','communications','calendar','documents','documents_upload','team','kpiCenter','roles','logs','reminders','automations','goals','projects','savedViews','bulkActions','aiAssistant','dailyReport','settings','notifications','hotelSuperApp','help'];
const PERM_LABEL:Record<PermissionKey,string>={dashboard:'داشبورد',inbox:'میزکار من',executive:'داشبورد مدیرعامل',controlTower:'مرکز فرمان اقدام',crm360:'CRM 360',reports:'گزارش‌ساز',riskRadar:'هتل‌های پرریسک',tasks:'مشاهده تسک‌ها',tasks_create:'ایجاد تسک',tasks_edit:'ویرایش تسک',tasks_delete:'حذف تسک',assignments:'تغییر مسئول',approvals:'تایید و Review',sla:'SLA و زمان استاندارد',playbooks:'فرایند استاندارد',messages:'پیام داخلی و منشن',hotels:'هتل‌ها',hotels_import:'ورود اکسل هتل',hotelOwnership:'مالکیت پرونده هتل',contracts:'مدیریت قرارداد',communications:'ارتباطات هتل',calendar:'تقویم',documents:'اسناد',documents_upload:'آپلود سند',team:'مدیریت تیم',kpiCenter:'مرکز KPI کارشناسان',roles:'نقش‌ها و دسترسی',logs:'لاگ اتفاق‌ها',reminders:'یادآورها',automations:'اتوماسیون',goals:'هدف‌گذاری',projects:'پروژه‌ها',savedViews:'نماهای کاری',bulkActions:'عملیات گروهی',aiAssistant:'دستیار هوشمند',dailyReport:'گزارش روزانه',settings:'تنظیمات',notifications:'اعلان‌ها',hotelSuperApp:'سوپر اپ مدیریت هتل',help:'راهنمای سیستم'};
const defaultPerms=(all=false)=>Object.fromEntries(ALL_PERMS.map(p=>[p,all]));
const DEFAULT_SETTINGS:AppSettings={orgName:'IranHotel Operations System',appSubtitle:'سامانه عملیاتی زنجیره تأمین ایران‌هتل',brandColor:'#2563eb',logoUrl:'',faviconUrl:'',theme:'light',notifications:true,documentsEnabled:true,defaultPriority:'متوسط',defaultTaskStatus:'جدید',calendarFirstDay:'شنبه',allowUserDelete:true,taskCategories:'ظرفیت،قیمت،قرارداد،پنل،محتوا،مالی،پیگیری',taskStatuses:'جدید،در حال انجام،منتظر پاسخ،ارسال برای تایید،نیازمند اصلاح،تایید شده،انجام شد،بسته شده',labels:'فوری،پیک،قرارداد،ظرفیت،قیمت،هتل VIP،نیازمند تماس',contractTypes:'قرارداد،الحاقیه،تصویر،اکسل،نامه،سایر'};
const initialRoles:Role[]=[{id:'role-admin',title:'مدیر سیستم',description:'دسترسی کامل',permissions:defaultPerms(true),is_system:true},{id:'role-city',title:'سیتی منیجر',description:'مدیریت منطقه و تیم',permissions:{...defaultPerms(false),dashboard:true,inbox:true,controlTower:true,crm360:true,reports:true,riskRadar:true,tasks:true,tasks_create:true,tasks_edit:true,assignments:true,approvals:true,sla:true,hotels:true,hotelOwnership:true,contracts:true,communications:true,calendar:true,documents:true,documents_upload:true,team:true,kpiCenter:true,reminders:true,projects:true,goals:true,notifications:true,logs:true,help:true},is_system:true},{id:'role-expert',title:'کارشناس',description:'اجرای تسک‌های شخصی',permissions:{...defaultPerms(false),dashboard:true,inbox:true,tasks:true,tasks_create:true,tasks_edit:true,hotels:true,communications:true,calendar:true,documents:true,reminders:true,notifications:true,help:true},is_system:true}];
const initialUsers:User[]=[{id:'u-admin',full_name:'محمدباقر ذوالفقاری',username:'admin',password_hash:'123456',role:'مدیر سیستم',role_id:'role-admin',team:'مدیریت تأمین',zone:'کل کشور',is_active:true},{id:'u-1',full_name:'فاطمه رنجبر',username:'ranjbar',password_hash:'123456',role:'کارشناس',role_id:'role-expert',team:'شرق و جنوب',zone:'شرق و جنوب',is_active:true},{id:'u-2',full_name:'پگاه واعظین',username:'vaezin',password_hash:'123456',role:'کارشناس',role_id:'role-expert',team:'شمال و غرب',zone:'شمال و غرب',is_active:true},{id:'u-3',full_name:'فائزه سالاری',username:'salari',password_hash:'123456',role:'سیتی منیجر',role_id:'role-city',team:'مرکز',zone:'مرکز',is_active:true}];
const initialHotels:HotelT[]=[];
const initialTasks:Task[]=[];
const initialActivities:TaskActivity[]=[];

function normalizeLocalValue<T>(parsed:any,fallback:T):T{
  try{
    if(Array.isArray(fallback)) return (Array.isArray(parsed)?parsed:fallback) as T;
    if(fallback && typeof fallback==='object'){
      if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) return fallback;
      return {...(fallback as any),...parsed} as T;
    }
    return (parsed ?? fallback) as T;
  }catch{return fallback}
}
function removeLegacyDemoRows(key:string,value:any){
  if(!Array.isArray(value))return value;
  if(key==='ihos-hotels')return value.filter((row:any)=>!((row.id==='h-1'&&row.title==='هتل درویشی')||(row.id==='h-2'&&row.title==='هتل پارس')||(row.id==='h-3'&&row.title==='هتل آریان کیش')));
  if(key==='ihos-tasks')return value.filter((row:any)=>!(row.id==='t-1'&&row.title==='دریافت ظرفیت آخر هفته'));
  if(key==='ihos-activities')return value.filter((row:any)=>!(['a-1','a-2'].includes(row.id)&&row.task_id==='t-1'));
  return value;
}
function useLocal<T>(key:string,fallback:T){
  const [v,setV]=useState<T>(fallback);
  useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const clean=removeLegacyDemoRows(key,JSON.parse(raw));setV(normalizeLocalValue(clean,fallback));if(JSON.stringify(clean)!==raw)localStorage.setItem(key,JSON.stringify(clean))}}catch{setV(fallback)}},[key]);
  const save=(next:T)=>{const safe=normalizeLocalValue(next,fallback);setV(safe);try{localStorage.setItem(key,JSON.stringify(safe))}catch{}};
  return [v,save] as const;
}
function upsertLocal<T extends {id:string}>(arr:T[], row:T){return arr.some(x=>x.id===row.id)?arr.map(x=>x.id===row.id?row:x):[row,...arr]}

class ClientErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean; message: string; stack?: string}> {
  constructor(props:{children:ReactNode}){ super(props); this.state={hasError:false,message:''}; }
  static getDerivedStateFromError(error:any){ return {hasError:true, message: error?.message || String(error || 'خطای ناشناخته')}; }
  componentDidCatch(error:any, info:ErrorInfo){
    console.error('IHOS runtime error:', error, info);
    if(typeof window !== 'undefined') window.__IHOS_ERROR__ = { error: String(error?.stack || error), componentStack: info.componentStack };
  }
  render(){
    if(this.state.hasError){
      return <div dir="rtl" className="fatalScreen">
        <div className="fatalCard">
          <div className="fatalLogo">IH</div>
          <h1>خطای برنامه کنترل شد</h1>
          <p>برنامه کرش نکرد؛ یک خطای Runtime گرفته شد. برای ادامه، حالت امن را اجرا کن یا اطلاعات خطا را برای بررسی بفرست.</p>
          <pre>{this.state.message}</pre>
          <div className="fatalActions">
            <button onClick={()=>{localStorage.clear(); location.reload();}}>پاک‌سازی کامل داده مرورگر و اجرای مجدد</button>
            <button onClick={()=>location.reload()}>بارگذاری دوباره</button>
            <button onClick={()=>navigator.clipboard?.writeText(JSON.stringify(window.__IHOS_ERROR__||{}, null, 2))}>کپی گزارش خطا</button>
          </div>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

export default function App(){ return <ClientErrorBoundary><IHOSApp/></ClientErrorBoundary> }

function IHOSApp(){
  const [me,setMe]=useLocal<User|null>('ihos-session',null);
  const [settingsRaw,setSettingsRaw]=useLocal<Partial<AppSettings>>('ihos-settings-local',DEFAULT_SETTINGS);
  const [roles,setRoles]=useLocal<Role[]>('ihos-roles',initialRoles);
  const [users,setUsers]=useLocal<User[]>('ihos-users',initialUsers);
  const [hotels,setHotels]=useLocal<HotelT[]>('ihos-hotels',initialHotels);
  const [tasks,setTasks]=useLocal<Task[]>('ihos-tasks',initialTasks);
  const [activities,setActivities]=useLocal<TaskActivity[]>('ihos-activities',initialActivities);
  const [docs,setDocs]=useLocal<Doc[]>('ihos-docs',[]);
  const [events,setEvents]=useLocal<EventT[]>('ihos-events',[]);
  const [notifs,setNotifs]=useLocal<Notif[]>('ihos-notifs',[]);
  const [logs,setLogs]=useLocal<ActivityLog[]>('ihos-logs',[]);
  const [hotelEvents,setHotelEvents]=useLocal<HotelEvent[]>('ihos-hotel-events',[]);
  const [reminders,setReminders]=useLocal<Reminder[]>('ihos-reminders',[]);
  const [automations,setAutomations]=useLocal<Automation[]>('ihos-automations',[]);
  const [goals,setGoals]=useLocal<Goal[]>('ihos-goals',[]);
  const [projects,setProjects]=useLocal<Project[]>('ihos-projects',[]);

  const [online,setOnline]=useState(false),[busy,setBusy]=useState(false),[toastMsg,setToastMsg]=useState(''),[view,setView]=useState<PermissionKey>('dashboard'),[q,setQ]=useState(''),[guideTopic,setGuideTopic]=useState('help');
  const [sidebarCollapsed,setSidebarCollapsed]=useLocal<boolean>('ihos-sidebar-collapsed',false);
  const [modal,setModal]=useState<string|null>(null),[editing,setEditing]=useState<any>(null),[ownershipFocus,setOwnershipFocus]=useState<HotelT|null>(null);
  const settings = {...DEFAULT_SETTINGS, ...(settingsRaw||{})} as AppSettings;
  const isDarkTheme=settings.theme==='dark';
  const setSettings = (next:Partial<AppSettings>) => setSettingsRaw({...DEFAULT_SETTINGS, ...(next||{})});
  const safeRoles = Array.isArray(roles) ? roles : initialRoles;
  const safeUsers = Array.isArray(users) ? users : initialUsers;
  const safeHotels = Array.isArray(hotels) ? hotels : initialHotels;
  const safeTasks = Array.isArray(tasks) ? tasks : initialTasks;
  const safeActivities = Array.isArray(activities) ? activities : initialActivities;
  const safeDocs = Array.isArray(docs) ? docs : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeNotifs = Array.isArray(notifs) ? notifs : [];
  const safeLogs = Array.isArray(logs) ? logs : [];
  const safeHotelEvents = Array.isArray(hotelEvents) ? hotelEvents : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const safeAutomations = Array.isArray(automations) ? automations : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const currentRole=safeRoles.find(r=>r.id===me?.role_id)||safeRoles.find(r=>r.title===me?.role);
  const rolePerms = (currentRole && typeof currentRole.permissions === 'object' && currentRole.permissions) ? currentRole.permissions : defaultPerms(false);
  const isSuperAdmin=!!me && (me.username==='admin' || me.role_id==='role-super-admin' || ['سوپر ادمین','super admin','super_admin'].includes((me.role||'').trim().toLowerCase()));
  const admin=!!me && (isSuperAdmin || (me.role||'').includes('مدیر') || (rolePerms.roles===true && rolePerms.settings===true));
  const can=(p:PermissionKey)=> p==='help' || admin || !!rolePerms[p];
  const categories=String(settings.taskCategories||DEFAULT_SETTINGS.taskCategories).split(/[،,]/).map(x=>x.trim()).filter(Boolean);
  const statuses=String(settings.taskStatuses||DEFAULT_SETTINGS.taskStatuses).split(/[،,]/).map(x=>x.trim()).filter(Boolean);
  const labels=String(settings.labels||DEFAULT_SETTINGS.labels).split(/[،,]/).map(x=>x.trim()).filter(Boolean);
  const syncingHistoryView=useRef(false);
  const currentViewRef=useRef(view);

  useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;const h=(e:any)=>{setToastMsg(e.detail);if(timer)clearTimeout(timer);timer=setTimeout(()=>setToastMsg(''),3600)};window.addEventListener('ihos-toast',h);return()=>{window.removeEventListener('ihos-toast',h);if(timer)clearTimeout(timer)}},[]);
  useEffect(()=>{const openGuide=(e:any)=>{setGuideTopic(e.detail?.topic||'help');setView('help')};window.addEventListener('ihos-open-guide',openGuide);return()=>window.removeEventListener('ihos-open-guide',openGuide)},[]);
  useEffect(()=>{const applyLocation=()=>{const key=window.location.hash.replace(/^#/,'') as PermissionKey;if(ALL_PERMS.includes(key)&&key!==currentViewRef.current){syncingHistoryView.current=true;currentViewRef.current=key;setView(key)}};applyLocation();window.addEventListener('popstate',applyLocation);return()=>window.removeEventListener('popstate',applyLocation)},[]);
  useEffect(()=>{currentViewRef.current=view;if(typeof window==='undefined')return;if(syncingHistoryView.current){syncingHistoryView.current=false;return}const next=`#${view}`;if(window.location.hash!==next)window.history.pushState({view},'',next)},[view]);
  useEffect(()=>{document.documentElement.dir='rtl';const dark=settings.theme==='dark'||(settings.theme==='system'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.body.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';document.documentElement.style.setProperty('--brand',settings.brandColor||'#2563eb');if(settings.faviconUrl){let link=document.querySelector("link[rel~='icon']") as HTMLLinkElement|null;if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link)}link.href=settings.faviconUrl}},[settings.theme,settings.brandColor,settings.faviconUrl]);
  useEffect(()=>{syncAll(); if(typeof navigator!=='undefined' && 'serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{});} },[]);
  useEffect(()=>{if(!me)return;const timer=setInterval(checkReminders,30000);checkReminders();return()=>clearInterval(timer)},[me,reminders,tasks,settings.notifications]);
  useEffect(()=>{
    if(!me||!online) return;
    let channel:any;
    let polling:any;
    const refreshMap:Record<string,()=>void>={
      ihos_tasks:()=>syncTable('ihos_tasks',setTasks),
      ihos_task_activities:()=>syncTable('ihos_task_activities',setActivities),
      ihos_hotels:()=>syncTable('ihos_hotels',setHotels),
      ihos_users:()=>syncTable('ihos_users',setUsers),
      ihos_documents:()=>syncTable('ihos_documents',setDocs),
      ihos_calendar_events:()=>syncTable('ihos_calendar_events',setEvents),
      ihos_activity_logs:()=>syncTable('ihos_activity_logs',setLogs),
      ihos_hotel_events:()=>syncTable('ihos_hotel_events',setHotelEvents),
      ihos_reminders:()=>syncTable('ihos_reminders',setReminders),
      ihos_projects:()=>syncTable('ihos_projects',setProjects),
      ihos_notifications:()=>syncTable('ihos_notifications',setNotifs)
    };
    getSupabaseClient().then(db=>{
      if(!db) return;
      channel=db.channel('ihos-live-v64')
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_tasks'},(payload:any)=>{
          refreshMap.ihos_tasks();
          const row:any=payload.new||payload.old||{};
          if(row.assigned_to===me.id || safeArr<string>(row.collaborator_ids).includes(me.id)) browserNotify(payload.eventType==='INSERT'?'تسک جدید برای شما':'تسک شما بروزرسانی شد', row.title||'');
        })
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_task_activities'},()=>refreshMap.ihos_task_activities())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_hotels'},()=>refreshMap.ihos_hotels())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_users'},()=>refreshMap.ihos_users())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_documents'},()=>refreshMap.ihos_documents())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_calendar_events'},()=>refreshMap.ihos_calendar_events())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_activity_logs'},()=>refreshMap.ihos_activity_logs())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_hotel_events'},()=>refreshMap.ihos_hotel_events())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_reminders'},()=>refreshMap.ihos_reminders())
        .on('postgres_changes',{event:'*',schema:'public',table:'ihos_projects'},()=>refreshMap.ihos_projects())
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'ihos_notifications',filter:`user_id=eq.${me.id}`},(payload:any)=>{
          const n=payload.new as Notif; setNotifs([n,...notifs.filter(x=>x.id!==n.id)]); browserNotify(n.title,n.body||'');
        })
        .subscribe();
      polling=setInterval(()=>syncAll(),90000);
    }).catch(e=>console.error('Realtime init failed', e));
    return()=>{ if(polling) clearInterval(polling); if(channel) getSupabaseClient().then(db=>db?.removeChannel(channel)).catch(()=>{}) }
  },[me,online]);

  async function syncTable(table:string,setter:(rows:any)=>void){
    const db=await getSupabaseClient();
    if(!db)return;
    // Supabase/PostgREST normally returns at most 1000 rows per request.
    // Large tables (especially hotels) must be fetched page by page.
    const pageSize=1000;
    let from=0;
    let all:any[]=[];
    while(true){
      let query=db.from(table).select('*').range(from,from+pageSize-1);
      query=table==='ihos_hotels'?query.order('title',{ascending:true}):query.order('created_at',{ascending:false});
      const {data,error}=await query;
      if(error){console.error(`Sync ${table} failed`,error);return}
      const batch=data||[];
      all=all.concat(batch);
      if(batch.length<pageSize)break;
      from+=pageSize;
    }
    setter(all);
  }
  async function syncSettings(){const db=await getSupabaseClient();if(!db)return;const {data}=await db.from('ihos_settings').select('*');if(data?.length){const next={...DEFAULT_SETTINGS};data.forEach((r:any)=>(next as any)[r.key]=r.value);setSettings(next)}}
  async function syncAll(){setBusy(true);try{const db=await getSupabaseClient();if(!db){setOnline(false);return}setOnline(true);await Promise.all([syncTable('ihos_roles',setRoles),syncTable('ihos_users',setUsers),syncTable('ihos_hotels',setHotels),syncTable('ihos_tasks',setTasks),syncTable('ihos_task_activities',setActivities),syncTable('ihos_documents',setDocs),syncTable('ihos_calendar_events',setEvents),syncTable('ihos_notifications',setNotifs),syncTable('ihos_activity_logs',setLogs),syncTable('ihos_hotel_events',setHotelEvents),syncTable('ihos_reminders',setReminders),syncTable('ihos_automations',setAutomations),syncTable('ihos_goals',setGoals),syncTable('ihos_projects',setProjects),syncSettings()]);toast('داده‌ها با Supabase سینک شد');}catch(e:any){setOnline(false);toast('اتصال آنلاین برقرار نشد: '+e.message)}finally{setBusy(false)}}
  async function dbUpsert(table:string,row:any){const db=await getSupabaseClient();if(db){const {error}=await db.from(table).upsert(row);if(error) throw error}}
  async function dbDelete(table:string,id:string){const db=await getSupabaseClient();if(db){const {error}=await db.from(table).delete().eq('id',id);if(error) throw error}}
  async function saveSettings(next:AppSettings){setSettings(next);const db=await getSupabaseClient();if(db){for(const key of Object.keys(next)){await db.from('ihos_settings').upsert({key,value:(next as any)[key],updated_at:nowIso()})}}toast('تنظیمات ذخیره شد')}
  async function toggleTheme(){const darkNow=document.documentElement.classList.contains('dark');const nextTheme:AppSettings['theme']=darkNow?'light':'dark';const next={...settings,theme:nextTheme};setSettings(next);document.documentElement.classList.toggle('dark',nextTheme==='dark');document.body.classList.toggle('dark',nextTheme==='dark');document.documentElement.style.colorScheme=nextTheme==='dark'?'dark':'light';try{const db=await getSupabaseClient();if(db)await db.from('ihos_settings').upsert({key:'theme',value:nextTheme,updated_at:nowIso()})}catch{}toast(nextTheme==='dark'?'حالت شب فعال شد':'حالت روشن فعال شد')}
  async function log(action:string,entity:string,entity_id?:string,title?:string,duration_minutes?:number){const row:ActivityLog={id:uid(),user_id:me?.id,user_name:me?.full_name,action,entity,entity_id,title,duration_minutes,created_at:nowIso()};setLogs([row,...logs]);try{await dbUpsert('ihos_activity_logs',row)}catch{}}
  async function notifyUser(user_id:string,title:string,body?:string,entity_type?:string,entity_id?:string){const n:Notif={id:uid(),title,body,user_id,is_read:false,entity_type,entity_id,created_at:nowIso()};setNotifs([n,...notifs]);try{await dbUpsert('ihos_notifications',n)}catch{} if(user_id===me?.id) browserNotify(title,body||'')}
  function browserNotify(title:string,body:string){if(!settings.notifications || typeof Notification==='undefined')return;if(Notification.permission==='granted') new Notification(title,{body,icon:settings.faviconUrl||settings.logoUrl||undefined});}
  async function requestNotifications(){if(typeof Notification==='undefined'){toast('مرورگر از Notification پشتیبانی نمی‌کند');return}const p=await Notification.requestPermission();toast(p==='granted'?'نوتیفیکیشن مرورگر فعال شد':'دسترسی نوتیفیکیشن داده نشد')}
  async function uploadFile(file:File,folder:string){const db=await getSupabaseClient();if(!db)return URL.createObjectURL(file);const path=`${folder}/${Date.now()}-${file.name.replace(/\s+/g,'-')}`;const {error}=await db.storage.from('ihos-documents').upload(path,file,{upsert:true});if(error){toast('خطای آپلود: '+error.message);return URL.createObjectURL(file)}const {data}=db.storage.from('ihos-documents').getPublicUrl(path);return data.publicUrl}
  async function remove(table:string,id:string,local:()=>void){
    // Only the master hotel database is protected by super-admin deletion rules.
    // Operational records such as reminders, tasks, events and documents follow their normal module permissions.
    const protectedTables=new Set(['ihos_hotels','ihos_hotel_automation','ihos_provider_rules']);
    if(protectedTables.has(table)){
      if(!isSuperAdmin){toast('حذف از دیتابیس اصلی فقط برای سوپر ادمین مجاز است');return}
      if(!confirm('این رکورد از دیتابیس اصلی حذف و در سطل بازیافت ثبت شود؟'))return;
      setBusy(true);
      try{
        const res=await fetch('/api/admin/delete',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete-row',table,id,actor:{id:me?.id,username:me?.username,name:me?.full_name,isSuperAdmin:true}})});
        const out=await res.json();
        if(!res.ok)throw new Error(out.error||'حذف ناموفق بود');
        local();await log('delete',table,id,'حذف رکورد دیتابیس اصلی توسط سوپر ادمین');toast('حذف شد و در سطل بازیافت ثبت شد');
      }catch(e:any){alert(e.message)}finally{setBusy(false)}
      return;
    }
    if(!confirm('این مورد حذف شود؟'))return;
    setBusy(true);
    try{await dbDelete(table,id);local();await log('delete',table,id,'حذف رکورد عملیاتی');toast('حذف شد')}
    catch(e:any){alert(e.message)}finally{setBusy(false)}
  }

  async function saveTask(task:Task, acts?:TaskActivity[], reminder?:Partial<Reminder>){
    if(!can(task.id && tasks.some(t=>t.id===task.id)?'tasks_edit':'tasks_create')) return toast('دسترسی کافی نداری');
    const isNew=!tasks.some(t=>t.id===task.id);let t={...task,updated_at:nowIso(),created_at:task.created_at||nowIso()};
    if(isNew){automations.filter(a=>a.enabled&&a.trigger_type==='task_created'&&(!a.trigger_category||a.trigger_category===t.category)).forEach(a=>{if(a.assign_to){const u=users.find(x=>x.id===a.assign_to);t.assigned_to=u?.id;t.assigned_name=u?.full_name} if(a.priority)t.priority=a.priority;if(a.status)t.status=a.status;if(a.label)t.labels=[...new Set([...(t.labels||[]),a.label])];});}
    setTasks(upsertLocal(tasks,t)); await dbUpsert('ihos_tasks',t); await log(isNew?'create':'update','task',t.id,t.title);
    if(acts){let nextActs=[...activities]; for(const a of acts){const row={...a,task_id:t.id,updated_at:nowIso(),created_at:a.created_at||nowIso()}; nextActs=upsertLocal(nextActs,row); await dbUpsert('ihos_task_activities',row)} setActivities(nextActs)}
    if(reminder?.notify_at){const r:Reminder={id:uid(),title:reminder.title||`یادآوری: ${t.title}`,body:reminder.body||t.hotel_title,user_id:t.assigned_to,task_id:t.id,notify_at:reminder.notify_at,is_done:false,is_sent:false,created_at:nowIso()};setReminders([r,...reminders]);await dbUpsert('ihos_reminders',r)}
    if(t.assigned_to) await notifyUser(t.assigned_to,isNew?'تسک جدید برای شما':'تسک شما بروزرسانی شد',`${t.title} — ${t.hotel_title||''}`,'task',t.id);
    for(const cid of safeArr<string>(t.collaborator_ids)) await notifyUser(cid,isNew?'شما به یک تسک اضافه شدید':'تسک مشترک بروزرسانی شد',t.title,'task',t.id);
    toast('تسک ذخیره شد');setModal(null);
  }
  async function bulkCreateTasks(rows:Task[]){
    const unique=rows.filter(r=>!tasks.some(t=>t.automation_id===r.automation_id&&t.source_type===r.source_type&&t.source_id===r.source_id&&!['انجام شد','بسته شده','تایید شده'].includes(t.status)));
    if(!unique.length)return 0;
    setTasks([...unique,...tasks]);
    const db=await getSupabaseClient();
    if(db){
      for(let i=0;i<unique.length;i+=300){const {error}=await db.from('ihos_tasks').upsert(unique.slice(i,i+300),{onConflict:'id'});if(error)throw error}
    }
    await log('automation_bulk_create','task',undefined,`ساخت خودکار ${unique.length} تسک`);
    for(const row of unique){if(row.assigned_to)await notifyUser(row.assigned_to,'تسک خودکار جدید',`${row.title} — ${row.hotel_title||''}`,'task',row.id)}
    toast(`${unique.length.toLocaleString('fa-IR')} تسک خودکار ساخته شد`);
    return unique.length;
  }
  function draftTaskForHotel(h:HotelT,input:any={}){
    setEditing({id:uid(),title:input.title||`پیگیری ${h.title}`,description:input.reason||input.description||'',hotel_id:h.id,hotel_title:h.title,city:h.city,priority:input.severity==='critical'?'فوری':input.priority||'بالا',status:settings.defaultTaskStatus,category:input.category||'پیگیری',assigned_to:input.assigned_to,assigned_name:input.assigned_name,deadline:input.deadline||today(),due_time:input.due_time||'12:00',labels:[input.type||input.label||'پیگیری'].filter(Boolean),collaborator_ids:[],source_type:input.source_type,source_id:input.source_id,created_at:nowIso()});
    setModal('task');
  }
  async function saveUser(u:User){const exists=users.some(x=>x.id===u.id);const row={...u,updated_at:nowIso(),created_at:u.created_at||nowIso()};setUsers(exists?users.map(x=>x.id===u.id?row:x):[row,...users]);await dbUpsert('ihos_users',row);await log(exists?'update':'create','user',row.id,row.full_name);toast('کاربر ذخیره شد');setModal(null)}
  async function importExperts(file:File){
    const XLSX=await loadXLSX();
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false,blankrows:false}) as Record<string,any>[];
    if(!data.length)throw new Error('فایل کارشناس‌ها خالی است');
    const pick=(row:Record<string,any>,names:string[])=>{for(const [key,value] of Object.entries(row)){if(names.some(name=>norm(name)===norm(key))&&String(value??'').trim())return String(value).trim()}return ''};
    const existingByUsername=new Map(users.map(u=>[norm(u.username),u]));
    const existingByEmail=new Map(users.filter(u=>u.email).map(u=>[norm(u.email),u]));
    const rows:User[]=data.map((raw,index)=>{
      const fullName=pick(raw,['نام و نام خانوادگی','نام کارشناس','نام','full_name','name']);
      const email=pick(raw,['ایمیل','email']);
      const mobile=pick(raw,['موبایل','شماره موبایل','mobile','phone']);
      const fallbackUsername=email.split('@')[0]||mobile.replace(/\D/g,'')||`expert-${index+1}`;
      const username=pick(raw,['نام کاربری','username','user name'])||fallbackUsername;
      const previous=existingByUsername.get(norm(username))||existingByEmail.get(norm(email));
      const roleText=pick(raw,['نقش','سمت','role'])||'کارشناس';
      const role=roles.find(r=>norm(r.title)===norm(roleText))||roles.find(r=>r.id==='role-expert');
      if(!fullName)return null as any;
      return {...previous,id:previous?.id||uid(),full_name:fullName,username,password_hash:pick(raw,['رمز عبور','password'])||previous?.password_hash||'123456',role:role?.title||roleText,role_id:role?.id||'role-expert',team:pick(raw,['تیم','team'])||previous?.team||'',zone:pick(raw,['منطقه','زون','استان','zone','region'])||previous?.zone||'',mobile:mobile||previous?.mobile||'',email:email||previous?.email||'',is_active:!['خیر','غیرفعال','false','0'].includes(norm(pick(raw,['فعال','وضعیت','active']))),created_at:previous?.created_at||nowIso(),updated_at:nowIso()};
    }).filter(Boolean);
    if(!rows.length)throw new Error('ستون نام کارشناس پیدا نشد');
    const db=await getSupabaseClient();if(!db)throw new Error('اتصال Supabase در دسترس نیست');
    for(let i=0;i<rows.length;i+=300){const {error}=await db.from('ihos_users').upsert(rows.slice(i,i+300),{onConflict:'id'});if(error)throw error}
    setUsers(current=>{const map=new Map(current.map(u=>[u.id,u]));rows.forEach(u=>map.set(u.id,u));return [...map.values()]});
    await log('import','user',undefined,`ورود گروهی ${rows.length} کارشناس`);toast(`${rows.length.toLocaleString('fa-IR')} کارشناس اعمال شد`);
  }
  async function importHotelAssignments(file:File){
    const XLSX=await loadXLSX(),wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false}),ws=wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false,blankrows:false}) as Record<string,any>[];
    if(!data.length)throw new Error('فایل تخصیص‌ها خالی است');
    const pick=(row:Record<string,any>,names:string[])=>{for(const [key,value] of Object.entries(row)){if(names.some(name=>norm(name)===norm(key))&&String(value??'').trim())return String(value).trim()}return ''};
    const db=await getSupabaseClient();if(!db)throw new Error('اتصال Supabase در دسترس نیست');
    const allHotels:any[]=[];for(let from=0;;from+=1000){const {data:batch,error}=await db.from('ihos_hotels').select('id,title,hotel_code').range(from,from+999);if(error)throw error;allHotels.push(...(batch||[]));if((batch||[]).length<1000)break}
    const cleanName=(value:any)=>norm(value).replace(/خانم|آقای|جناب|سرکار|محترم|دکتر/g,'').replace(/[،,.()]/g,' ').trim();
    const hotelMap=new Map(allHotels.map(h=>[cleanName(h.title),h]));
    const findHotel=(name:string)=>hotelMap.get(cleanName(name))||allHotels.find(h=>{const a=cleanName(h.title),b=cleanName(name);return a.length>8&&b.length>8&&(a.includes(b)||b.includes(a))});
    const findUser=(name:string)=>{const needle=cleanName(name);return users.find(u=>{const candidate=cleanName(u.full_name);return candidate===needle||candidate.includes(needle)||needle.includes(candidate)||candidate.split(' ').some(token=>token.length>2&&needle.split(' ').includes(token))})};
    const missingHotels:string[]=[],missingUsers:string[]=[];const map=new Map<string,any>();
    data.forEach(row=>{const hotelName=pick(row,['نام هتل','hotel','hotel_name','hotel title']),expertName=pick(row,['First name','نام کارشناس','کارشناس','expert','assignee','مسئول']);if(!hotelName||!expertName)return;const hotel=findHotel(hotelName),user=findUser(expertName);if(!hotel){missingHotels.push(hotelName);return}if(!user){missingUsers.push(expertName);return}map.set(hotel.id,{id:`assignment-import-${hotel.id}-account_manager`,hotel_id:hotel.id,hotel_title:hotel.title,user_id:user.id,user_name:user.full_name,assignment_role:'account_manager',is_primary:true,active:true,started_at:today(),created_at:nowIso(),updated_at:nowIso()})});
    const rows=[...map.values()];if(!rows.length)throw new Error(`هیچ تطبیق معتبری پیدا نشد. هتل‌های پیدا نشده: ${missingHotels.slice(0,3).join('، ')||'—'}؛ کارشناسان پیدا نشده: ${missingUsers.slice(0,3).join('، ')||'—'}`);
    const ids=rows.map(r=>r.hotel_id);for(let i=0;i<ids.length;i+=250){const {error}=await db.from('ihos_hotel_assignments').update({active:false,ended_at:today(),updated_at:nowIso()}).in('hotel_id',ids.slice(i,i+250)).eq('assignment_role','account_manager').eq('active',true);if(error)throw error}
    for(let i=0;i<rows.length;i+=250){const {error}=await db.from('ihos_hotel_assignments').upsert(rows.slice(i,i+250),{onConflict:'id'});if(error)throw error}
    await log('import','hotel_assignment',undefined,`تخصیص ${rows.length} هتل به کارشناس`);
    const notes=[`${rows.length.toLocaleString('fa-IR')} تخصیص اعمال شد`];if(missingHotels.length)notes.push(`${missingHotels.length.toLocaleString('fa-IR')} نام هتل تطبیق نداشت`);if(missingUsers.length)notes.push(`${missingUsers.length.toLocaleString('fa-IR')} نام کارشناس تطبیق نداشت`);toast(notes.join(' · '));
  }
  async function saveRole(r:Role){const exists=roles.some(x=>x.id===r.id);const row={...r,updated_at:nowIso(),created_at:r.created_at||nowIso()};setRoles(exists?roles.map(x=>x.id===r.id?row:x):[row,...roles]);await dbUpsert('ihos_roles',row);await log(exists?'update':'create','role',row.id,row.title);toast('نقش ذخیره شد');setModal(null)}
  async function saveHotel(h:HotelT){const exists=hotels.some(x=>x.id===h.id);const row={...h,updated_at:nowIso(),created_at:h.created_at||nowIso()};setHotels(exists?hotels.map(x=>x.id===h.id?row:x):[row,...hotels]);await dbUpsert('ihos_hotels',row);await log(exists?'update':'create','hotel',row.id,row.title);toast('هتل ذخیره شد');setModal(null)}
  async function saveGeneric<T extends {id:string}>(table:string,row:T,list:T[],setter:(v:T[])=>void,entity:string,title?:string){const exists=list.some((x:any)=>x.id===row.id);const final:any={...row,updated_at:nowIso(),created_at:(row as any).created_at||nowIso()};setter(exists?list.map((x:any)=>x.id===final.id?final:x):[final,...list]);await dbUpsert(table,final);await log(exists?'update':'create',entity,final.id,title||final.title);toast('ذخیره شد');setModal(null)}
  async function checkReminders(){const due=reminders.filter(r=>!r.is_sent&&!r.is_done&&new Date(r.notify_at)<=new Date()&&(r.user_id===me?.id||!r.user_id));for(const r of due){browserNotify(r.title,r.body||'');const next={...r,is_sent:true};setReminders(reminders.map(x=>x.id===r.id?next:x));try{await dbUpsert('ihos_reminders',next)}catch{}}}

  const visibleTasks=useMemo(()=>tasks.filter(t=>admin||t.assigned_to===me?.id||safeArr<string>(t.collaborator_ids).includes(me?.id||'')||can('assignments')), [tasks,me,admin,roles]);
  const filteredTasks=visibleTasks.filter(t=>(t.title+t.category+(t.hotel_title||'')+(t.assigned_name||'')+safeArr<string>(t.labels).join(' ')).includes(q));
  const unread=notifs.filter(n=>!n.is_read&&(n.user_id===me?.id||!n.user_id)).length;
  const kpi={open:visibleTasks.filter(t=>t.status!=='انجام شد').length,urgent:visibleTasks.filter(t=>t.priority==='فوری').length,over:visibleTasks.filter(t=>t.deadline&&t.deadline<today()&&t.status!=='انجام شد').length,done:visibleTasks.filter(t=>t.status==='انجام شد').length,hotels:hotels.length,users:users.filter(u=>u.is_active).length};

  if(!me) return <Login users={users} roles={roles} setMe={setMe} online={online} syncAll={syncAll} settings={settings} registerUser={saveUser}/>;
  const openModal=(m:string,obj:any=null)=>{setEditing(obj);setModal(m)};

  return <div className={cn("appShell",sidebarCollapsed&&"sidebarCollapsed")}>
    <a className="skipLink" href="#main-content" onClick={event=>{event.preventDefault();document.getElementById('main-content')?.focus()}}>رفتن به محتوای اصلی</a>
    <Sidebar view={view} setView={setView as any} can={can} settings={settings} collapsed={sidebarCollapsed} toggle={()=>setSidebarCollapsed(!sidebarCollapsed)}/>
    <main className="main" aria-busy={busy}>
      <header className="topbar v15Topbar"><div className="topbarPrimaryV15"><button type="button" className="navToggleTopV15" onClick={()=>setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed?'باز کردن منو':'جمع کردن منو'} aria-label={sidebarCollapsed?'باز کردن منو':'جمع کردن منو'}>{sidebarCollapsed?<PanelRightOpen/>:<PanelRightClose/>}</button><div className="search"><Search size={18}/><input aria-label="جستجوی سراسری" placeholder="جستجو در هتل، تسک، کارشناس، برچسب..." value={q} onChange={e=>setQ(e.target.value)}/></div></div><div className="actions"><GuideHint topic={view}/><span className={cn('statusPill',online?'on':'off')} role="status" aria-label={online?'اتصال آنلاین برقرار است':'سیستم در حالت محلی است'}>{online?<Wifi/>:<WifiOff/>}{online?'آنلاین':'محلی'}</span>{can('tasks_create')&&<button className="btn primary" onClick={()=>openModal('task')}><Plus/> تسک جدید</button>}<button type="button" className="iconBtn themeToggleV15" onClick={toggleTheme} title={isDarkTheme?'حالت روشن':'حالت شب'} aria-label={isDarkTheme?'فعال‌کردن حالت روشن':'فعال‌کردن حالت شب'}>{isDarkTheme?<Sun/>:<Moon/>}</button><button className="iconBtn notifBtn" onClick={()=>setView('notifications')} aria-label={`اعلان‌ها؛ ${unread} خوانده‌نشده`}>{unread>0&&<i/>}<Bell/></button><button className="iconBtn" onClick={syncAll} disabled={busy} aria-label={busy?'در حال همگام‌سازی اطلاعات':'همگام‌سازی اطلاعات'}><RefreshCw className={busy?'spin':''}/></button><div className="userMini"><b>{me.full_name}</b><small>{currentRole?.title||me.role}</small></div><button className="iconBtn" onClick={()=>setMe(null)} aria-label="خروج از حساب"><LogOut/></button></div></header>
      <section className="content" id="main-content" tabIndex={-1} aria-label="محتوای اصلی">
        {view==='dashboard'&&<Dashboard kpi={kpi} tasks={visibleTasks} activities={activities} users={users} goals={goals} projects={projects} logs={logs} settings={settings} setView={setView}/>}
        {view==='inbox'&&can('inbox')&&<OpsModule kind='inbox' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>}
        {view==='executive'&&can('executive')&&<OpsModule kind='executive' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>} 
        {view==='controlTower'&&can('controlTower')&&<ControlTowerV18 seedHotels={hotels} tasks={visibleTasks} users={users} onCreateTask={draftTaskForHotel} onOpenOwnership={(h:HotelT)=>{setOwnershipFocus(h);setView('hotelOwnership')}}/>}

        {view==='hotelSuperApp'&&can('hotelSuperApp')&&<HotelSuperApp isSuperAdmin={isSuperAdmin} actor={{id:me.id,username:me.username,name:me.full_name}} onCreateTask={(h:any)=>{setEditing({id:uid(),title:`پیگیری ${h.title}`,hotel_id:h.id,hotel_title:h.title,city:h.city,priority:'متوسط',status:settings.defaultTaskStatus,category:'پیگیری',deadline:today(),due_time:'12:00',labels:['هتل'],collaborator_ids:[],created_at:nowIso()});setModal('task')}}/>}
        {view==='crm360'&&can('crm360')&&<HotelLifecycleHealthV19 seedHotels={hotels} seedTasks={visibleTasks} seedDocuments={docs} onOpenHotels={()=>setView('hotels')} onCreateTask={draftTaskForHotel}/>}
        {view==='reports'&&can('reports')&&<Reports tasks={visibleTasks} logs={logs} users={users} hotels={hotels} activities={activities} exportTasks={()=>csv(visibleTasks,'ihos-tasks.csv')} exportLogs={()=>csv(logs,'ihos-activity-logs.csv')}/>} 
        {view==='riskRadar'&&can('riskRadar')&&<OpsModule kind='riskRadar' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>} 
        {view==='approvals'&&can('approvals')&&<ReviewCenterV17 tasks={visibleTasks} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)}/>}
        {view==='sla'&&can('sla')&&<SlaCenterV17 tasks={visibleTasks} categories={categories}/>}
        {view==='playbooks'&&can('playbooks')&&<OpsModule kind='playbooks' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>}
        {view==='messages'&&can('messages')&&<MessageCenterV17 me={me} users={users} hotels={hotels}/>}
        {view==='tasks'&&can('tasks')&&<Tasks tasks={filteredTasks} users={users} statuses={statuses} activities={activities} can={can} saveTask={(t:Task)=>saveTask(t)} edit={(t:Task)=>openModal('task',t)} remove={(id:string)=>remove('ihos_tasks',id,()=>setTasks(tasks.filter(t=>t.id!==id)))} openDetails={(t:Task)=>openModal('task',t)}/>} 
        {view==='hotels'&&can('hotels')&&<HotelSuperApp initialTab="hotels" isSuperAdmin={isSuperAdmin} actor={{id:me.id,username:me.username,name:me.full_name}} onCreateTask={(h:any)=>{setEditing({id:uid(),title:`پیگیری ${h.title}`,hotel_id:h.id,hotel_title:h.title,city:h.city,priority:'متوسط',status:settings.defaultTaskStatus,category:'پیگیری',deadline:today(),due_time:'12:00',labels:['هتل'],collaborator_ids:[],created_at:nowIso()});setModal('task')}}/>} 
        {view==='hotelOwnership'&&can('hotelOwnership')&&<HotelOwnershipV18 seedHotels={hotels} users={users} initialHotel={ownershipFocus}/>}
        {view==='contracts'&&can('contracts')&&<FinancialContractsV17 hotels={hotels}/>}
        {view==='communications'&&can('communications')&&<CommunicationsCenterV18 me={me} hotels={hotels} users={users} onCreateTask={draftTaskForHotel}/>}
        {view==='calendar'&&can('calendar')&&<CalendarPlusV17 tasks={visibleTasks} events={events} reminders={reminders} users={users} hotels={hotels} add={()=>openModal('event')} edit={(e:EventT)=>openModal('event',e)} remove={(id:string)=>remove('ihos_calendar_events',id,()=>setEvents(events.filter(e=>e.id!==id)))}/>} 
        {view==='documents'&&can('documents')&&<Docs docs={docs} hotels={hotels} can={can} add={()=>openModal('doc')} edit={(d:Doc)=>openModal('doc',d)} remove={(id:string)=>remove('ihos_documents',id,()=>setDocs(docs.filter(d=>d.id!==id)))}/>} 
        {view==='team'&&can('team')&&<><ExpertImporter run={importExperts} runAssignments={importHotelAssignments}/><Team users={users} roles={roles} tasks={tasks} activities={activities} logs={logs} profile={(u:User)=>openModal('employeeProfile',u)} edit={(u:User)=>openModal('user',u)} add={()=>openModal('user')} remove={(id:string)=>remove('ihos_users',id,()=>setUsers(users.filter(u=>u.id!==id)))}/><TeamCoverageV17 users={users} tasks={tasks} hotels={hotels}/></>}
        {view==='kpiCenter'&&can('kpiCenter')&&<KpiCenterV18 users={users} tasks={tasks} activities={activities} goals={goals}/>}
        {view==='roles'&&can('roles')&&<Roles roles={roles} edit={(r:Role)=>openModal('role',r)} add={()=>openModal('role')} remove={(id:string)=>remove('ihos_roles',id,()=>setRoles(roles.filter(r=>r.id!==id)))}/>} 
        {view==='logs'&&can('logs')&&<ActivityLogs logs={logs} users={users}/>} 
        {view==='reminders'&&can('reminders')&&<Reminders reminders={reminders} users={users} tasks={visibleTasks} setView={setView} edit={(r:Reminder)=>openModal('reminder',r)} add={()=>openModal('reminder')} done={async(r:Reminder)=>saveGeneric('ihos_reminders',{...r,is_done:true,is_sent:true},reminders,setReminders,'reminder',r.title)} remove={(id:string)=>remove('ihos_reminders',id,()=>setReminders(reminders.filter(r=>r.id!==id)))}/>} 
        {view==='automations'&&can('automations')&&<div className="v18Stack"><Automations automations={automations} users={users} categories={categories} edit={(a:Automation)=>openModal('automation',a)} add={()=>openModal('automation')} remove={(id:string)=>remove('ihos_automations',id,()=>setAutomations(automations.filter(a=>a.id!==id)))}/><AutomationOperationsV18 automations={automations} tasks={tasks} hotels={hotels} users={users} onBulkCreate={bulkCreateTasks}/></div>}
        {view==='goals'&&can('goals')&&<Goals goals={goals} users={users} tasks={tasks} activities={activities} edit={(g:Goal)=>openModal('goal',g)} add={()=>openModal('goal')} remove={(id:string)=>remove('ihos_goals',id,()=>setGoals(goals.filter(g=>g.id!==id)))}/>} 
        {view==='projects'&&can('projects')&&<Projects projects={projects} users={users} tasks={tasks} edit={(p:Project)=>openModal('project',p)} add={()=>openModal('project')} remove={(id:string)=>remove('ihos_projects',id,()=>setProjects(projects.filter(p=>p.id!==id)))}/>} 
        {view==='notifications'&&can('notifications')&&<Notifications notifs={notifs.filter(n=>n.user_id===me?.id||!n.user_id)} request={requestNotifications} markRead={async(n:Notif)=>saveGeneric('ihos_notifications',{...n,is_read:true},notifs,setNotifs,'notification',n.title)}/>} 
        {view==='savedViews'&&can('savedViews')&&<OpsModule kind='savedViews' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>}
        {view==='bulkActions'&&can('bulkActions')&&<OpsModule kind='bulkActions' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>}
        {view==='aiAssistant'&&can('aiAssistant')&&<OpsModule kind='aiAssistant' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>}
        {view==='dailyReport'&&can('dailyReport')&&<OpsModule kind='dailyReport' me={me} tasks={visibleTasks} hotels={hotels} users={users} logs={logs} reminders={reminders} activities={activities} saveTask={saveTask} openTask={(t:Task)=>openModal('task',t)} setView={setView}/>}
        {view==='settings'&&can('settings')&&<SettingsPage settings={settings} save={saveSettings} uploadFile={(f:File)=>uploadFile(f,'settings')} isSuperAdmin={isSuperAdmin} actor={{id:me.id,username:me.username,name:me.full_name}}/>} 
        {view==='help'&&<SystemGuide topic={guideTopic} onTopicChange={setGuideTopic}/>}
      </section>
    </main>
    <div className="srOnly" aria-live="polite" aria-atomic="true">{toastMsg}</div>{toastMsg&&<div className="toast" role="status">{toastMsg}</div>}{busy&&<div className="saving" role="status" aria-live="polite">در حال پردازش...</div>}
    {modal==='task'&&<TaskModal task={editing} users={users} hotels={hotels} projects={projects} settings={settings} labels={labels} statuses={statuses} categories={categories} activities={activities.filter(a=>a.task_id===editing?.id)} close={()=>setModal(null)} save={saveTask}/>} 
    {modal==='user'&&<UserModal user={editing} roles={roles} close={()=>setModal(null)} save={saveUser}/>} 
    {modal==='role'&&<RoleModal role={editing} close={()=>setModal(null)} save={saveRole}/>} 
    {modal==='hotel'&&<HotelModal hotel={editing} close={()=>setModal(null)} save={saveHotel}/>} 
    {modal==='event'&&<EventModal event={editing} users={users} hotels={hotels} close={()=>setModal(null)} save={(e:EventT)=>saveGeneric('ihos_calendar_events',e,events,setEvents,'event',e.title)}/>} 
    {modal==='doc'&&<DocModal doc={editing} hotels={hotels} close={()=>setModal(null)} uploadFile={(f:File)=>uploadFile(f,'contracts')} save={(d:Doc)=>saveGeneric('ihos_documents',d,docs,setDocs,'document',d.title)}/>} 
    {modal==='reminder'&&<ReminderModal reminder={editing} users={users} tasks={visibleTasks} close={()=>setModal(null)} save={(r:Reminder)=>saveGeneric('ihos_reminders',r,reminders,setReminders,'reminder',r.title)}/>} 
    {modal==='automation'&&<AutomationModal automation={editing} users={users} categories={categories} statuses={statuses} labels={labels} close={()=>setModal(null)} save={(a:Automation)=>saveGeneric('ihos_automations',a,automations,setAutomations,'automation',a.title)}/>} 
    {modal==='goal'&&<GoalModal goal={editing} users={users} categories={categories} close={()=>setModal(null)} save={(g:Goal)=>saveGeneric('ihos_goals',g,goals,setGoals,'goal',g.title)}/>} 
    {modal==='project'&&<ProjectModal project={editing} users={users} close={()=>setModal(null)} save={(p:Project)=>saveGeneric('ihos_projects',p,projects,setProjects,'project',p.title)}/>} 

    {modal==='hotelProfile'&&<HotelProfileModal hotel={editing} tasks={tasks.filter(t=>t.hotel_id===editing?.id)} docs={docs.filter(d=>d.hotel_id===editing?.id)} events={events.filter(e=>e.hotel_id===editing?.id)} systemEvents={safeHotelEvents.filter(e=>e.hotel_id===editing?.id)} logs={logs.filter(l=>l.entity_id===editing?.id || (l.title||'').includes(editing?.title||''))} users={users} close={()=>setModal(null)} editHotel={()=>setModal('hotel')} newTask={()=>{setEditing({id:uid(),title:`پیگیری ${editing?.title||'هتل'}`,hotel_id:editing?.id,hotel_title:editing?.title,city:editing?.city,priority:'متوسط',status:settings.defaultTaskStatus,category:'پیگیری',deadline:today(),due_time:'12:00',labels:[],collaborator_ids:[],created_at:nowIso()});setModal('task')}}/>}
    {modal==='employeeProfile'&&<EmployeeProfileModal user={editing} role={roles.find(r=>r.id===editing?.role_id)} tasks={tasks.filter(t=>t.assigned_to===editing?.id || safeArr<string>(t.collaborator_ids).includes(editing?.id))} activities={activities.filter(a=>a.assigned_to===editing?.id || a.done_by===editing?.id)} logs={logs.filter(l=>l.user_id===editing?.id || l.user_name===editing?.full_name)} projects={projects.filter(p=>p.owner_id===editing?.id || safeArr<string>(p.member_ids).includes(editing?.id))} close={()=>setModal(null)} editUser={()=>setModal('user')}/>}
    {modal==='importHotels'&&<ImportHotelsModal close={()=>setModal(null)} save={async(rows:HotelT[])=>{const merged=[...hotels];rows.forEach(r=>{const idx=merged.findIndex(h=>h.id===r.id||(h.hotel_code&&r.hotel_code&&h.hotel_code===r.hotel_code));idx>=0?merged[idx]={...merged[idx],...r}:merged.unshift(r)});setHotels(merged);const db=await getSupabaseClient();if(db){
      const chunkSize=500;
      let saved=0;
      for(let i=0;i<rows.length;i+=chunkSize){
        const chunk=rows.slice(i,i+chunkSize);
        const {error}=await db.from('ihos_hotels').upsert(chunk as any,{onConflict:'id'});
        if(error){alert(`ذخیره در ردیف‌های ${i+1} تا ${Math.min(i+chunkSize,rows.length)} ناموفق بود: ${error.message}`);throw error}
        saved+=chunk.length;
      }
      toast(`${saved.toLocaleString('fa-IR')} هتل در Supabase ذخیره شد`);
    }await log('import','hotel',undefined,`ورود ${rows.length} هتل از اکسل`);await syncTable('ihos_hotels',setHotels);setModal(null)}}/>}
  </div>
}

function Sidebar({view,setView,can,settings,collapsed,toggle}:any){
  const sections:{id:string;title:string;items:[PermissionKey,string,any][]}[]=[
    {id:'workspace',title:'میزکار',items:[['dashboard','داشبورد',LayoutDashboard],['controlTower','مرکز فرمان اقدام',ShieldAlert],['inbox','میزکار من',ClipboardList],['executive','نمای مدیرعامل',Rocket]]},
    {id:'hotel',title:'عملیات هتل',items:[['hotelSuperApp','سوپر اپ هتل',Hotel],['crm360','چرخه و سلامت هتل',Activity],['hotelOwnership','مالکیت پرونده هتل',UserPlus],['contracts','قرارداد مالی و پرداخت',FileText],['communications','ارتباطات هتل',Bell]]},
    {id:'workflow',title:'تسک و جریان کار',items:[['tasks','تسک سنتر',ListChecks],['approvals','تأیید و کنترل کیفیت',CheckCircle2],['reminders','یادآورها',AlarmClock],['calendar','تقویم عملیاتی',CalendarDays],['messages','پیام‌رسان داخلی',Bell],['sla','SLA و زمان استاندارد',Clock3],['playbooks','فرایندهای استاندارد',FolderKanban]]},
    {id:'team',title:'تیم و پروژه',items:[['team','کارشناسان و نقشه پوشش',Users],['kpiCenter','مرکز KPI کارشناسان',Target],['projects','پروژه‌ها',FolderKanban],['goals','هدف‌گذاری',Target],['roles','نقش‌ها و دسترسی‌ها',Shield],['automations','اتوماسیون',Sparkles]]},
    {id:'data',title:'داده و گزارش',items:[['reports','گزارش‌ساز',Activity],['dailyReport','گزارش روزانه',FileText],['savedViews','نماهای کاری',Eye],['bulkActions','عملیات گروهی',SlidersHorizontal],['logs','تاریخچه تغییرات',Archive],['documents','اسناد',FileText],['aiAssistant','دستیار هوشمند',Sparkles],['settings','تنظیمات',Settings],['help','راهنمای سیستم',BookOpen]]},
  ];
  const [open,setOpen]=useState<Record<string,boolean>>(()=>{if(typeof window==='undefined')return{workspace:true,hotel:true,workflow:true,team:true,data:true};try{return JSON.parse(localStorage.getItem('ihos-nav-groups-v17')||'{"workspace":true,"hotel":true,"workflow":true,"team":true,"data":true}')}catch{return{workspace:true,hotel:true,workflow:true,team:true,data:true}}});
  function toggleGroup(id:string){const next={...open,[id]:!(open[id]!==false)};setOpen(next);try{localStorage.setItem('ihos-nav-groups-v17',JSON.stringify(next))}catch{}}
  return <aside className={cn('sidebar v6Sidebar dynamicSidebar v17Sidebar',collapsed&&'collapsed')}>
    <div className="brand"><div className="appLogo">{settings.logoUrl?<img src={settings.logoUrl} alt={`نشان ${settings.orgName}`}/>:<span>IH</span>}</div>{!collapsed&&<div className="brandCopy"><b>{settings.orgName}</b><small>Enterprise OS</small></div>}<button className="sidebarToggle" onClick={toggle} title={collapsed?'باز کردن منو':'جمع کردن منو'} aria-label={collapsed?'باز کردن منو':'جمع کردن منو'}>{collapsed?<ChevronLeft size={18}/>:<ChevronRight size={18}/>}</button></div>
    <nav className="navScroll" aria-label="منوی اصلی">{sections.map(sec=>{const its=sec.items.filter(([p])=>can(p));if(!its.length)return null;const expanded=open[sec.id]!==false;return <section className={cn('navSection v17NavSection',!expanded&&'closed')} key={sec.id}>{!collapsed&&<button className="navGroupHead" onClick={()=>toggleGroup(sec.id)} aria-expanded={expanded}><span>{sec.title}</span><ChevronDown size={16}/></button>}{(collapsed||expanded)&&<div className="navGroupItems">{its.map(([id,label,Icon])=><button title={collapsed?label:undefined} aria-label={collapsed?label:undefined} aria-current={view===id?'page':undefined} key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={18}/>{!collapsed&&<span>{label}</span>}</button>)}</div>}</section>})}</nav>
    <button className="logoutSide" title={collapsed?'خروج':undefined} aria-label={collapsed?'خروج':undefined} onClick={()=>{localStorage.removeItem('ihos-session');location.reload()}}><LogOut size={17}/>{!collapsed&&<span>خروج</span>}</button>
  </aside>
}
function Login({users,roles,setMe,online,syncAll,settings,registerUser}:any){
  const [mode,setMode]=useState<'signin'|'signup'|'success'>('signin');
  const [step,setStep]=useState(1);
  const [username,setUsername]=useState('admin'),[password,setPassword]=useState('123456'),[err,setErr]=useState('');
  const [form,setForm]=useState<any>({phone:'',code:['','','',''],email:'',name:'',pass:'123456',purpose:'work',role:'مدیر محصول',company:'IranHotelOnline',business:'Hospitality / Travel',teamSize:'41 - 50',invite:''});
  function go(){const u=users.find((x:User)=>x.username===username&&x.password_hash===password&&x.is_active);if(!u){setErr('نام کاربری یا رمز عبور اشتباه است');return}setMe(u);toast('خوش آمدید')}
  async function completeSignup(){const role=roles.find((r:Role)=>r.id==='role-expert')||roles[0]; const u:User={id:uid(),full_name:form.name||form.email||'کاربر جدید',username:(form.email||`user${Date.now()}`).split('@')[0],password_hash:form.pass||'123456',role:'کارشناس',role_id:role?.id,team:form.company||'IranHotel',zone:'عمومی',mobile:form.phone,email:form.email,is_active:true,created_at:nowIso()}; await registerUser(u); setMode('success'); setTimeout(()=>setMe(u),700)}
  if(mode==='success') return <div className="authPage"><div className="successPanel"><div className="authIllustration" aria-hidden="true"><ClipboardList/></div><h2>ثبت‌نام با موفقیت انجام شد</h2><p>اکانت شما در IranHotel OS ساخته شد.</p><button className="btn primary" onClick={()=>setMe(users.find((u:User)=>u.username==='admin')||null)}>شروع</button></div></div>
  if(mode==='signup') return <div className="authPage signupFlow"><aside className="authSteps"><div className="appLogo big"><span>IH</span></div><h1>Get started</h1>{['تأیید موبایل','درباره شما','درباره شرکت','دعوت اعضای تیم'].map((x,i)=><button key={x} className={step===i+1?'active':step>i+1?'done':''} onClick={()=>setStep(i+1)}><i>{step>i+1?'✓':''}</i>{x}</button>)}</aside><main className="signupCard"><div className="stepBadge">STEP {step}/4</div>{step===1&&<div className="authForm slim"><h2>تأیید موبایل</h2><label>شماره موبایل</label><div className="phoneRow"><select><option>+98</option><option>+1</option></select><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0915 000 0000"/></div><label>کد پیامک</label><div className="otpRow">{[0,1,2,3].map(i=><input key={i} maxLength={1} value={form.code[i]||''} onChange={e=>{const c=[...form.code];c[i]=e.target.value;setForm({...form,code:c})}}/> )}</div><div className="notice">کد دمو برای تست: 1234</div><label>ایمیل</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@iranhotelonline.com"/><label>رمز عبور</label><input type="password" value={form.pass} onChange={e=>setForm({...form,pass:e.target.value})}/></div>}{step===2&&<div className="authForm slim"><h2>درباره خودت</h2><label>نام و نام خانوادگی</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><label>برای چه استفاده می‌کنی؟</label><select value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}><option value="work">کار سازمانی</option><option value="team">مدیریت تیم</option></select><label>نقش شما</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option>مدیر محصول</option><option>مدیر زنجیره تأمین</option><option>کارشناس</option></select><div className="radioLine"><span>اکانت مدیریتی؟</span><label><input type="radio" checked/> بله</label><label><input type="radio"/> خیر</label></div></div>}{step===3&&<div className="authForm slim"><h2>درباره شرکت</h2><label>نام شرکت</label><input value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/><label>حوزه فعالیت</label><select value={form.business} onChange={e=>setForm({...form,business:e.target.value})}><option>Hospitality / Travel</option><option>Operations</option><option>Supply Chain</option></select><label>تعداد اعضای تیم</label><div className="sizeGrid">{['Only me','2 - 5','6 - 10','11-20','21 - 40','41 - 50','51 - 100','101 - 500'].map(x=><button type="button" className={form.teamSize===x?'selected':''} onClick={()=>setForm({...form,teamSize:x})} key={x}>{x}</button>)}</div></div>}{step===4&&<div className="authForm slim"><h2>دعوت اعضای تیم</h2><label>ایمیل عضو تیم</label><input value={form.invite} onChange={e=>setForm({...form,invite:e.target.value})} placeholder="member@company.com"/><button className="btn ghost" onClick={()=>toast('دعوت دمو ثبت شد')}><Plus/> افزودن عضو دیگر</button></div>}<div className="authNav"><button className="btn ghost" onClick={()=>step===1?setMode('signin'):setStep(step-1)}><ChevronRight/> Previous</button><button className="btn primary" onClick={()=>step<4?setStep(step+1):completeSignup()}>{step<4?'Next Step':'Finish'}<ChevronLeft/></button></div></main></div>
  return <div className="authPage"><div className="signinShell"><section className="signinArt"><div className="appLogo big"><span>IH</span></div><h1>Your place to work<br/>Plan. Create. Control.</h1><div className="kanbanIllo"><span>To Do</span><span>In Progress</span><span>Review</span><span>Done</span><i></i><i></i><i></i></div></section><section className="signinForm"><h2>ورود به IranHotel OS</h2><p className="muted">ورود سازمانی برای تیم تأمین و عملیات ایران‌هتل</p><label>نام کاربری</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin"/><label>رمز عبور</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()}/><div className="loginOptions"><label><input type="checkbox" defaultChecked/> مرا به خاطر بسپار</label><button onClick={()=>toast('بعداً به بازیابی رمز وصل می‌شود')}>فراموشی رمز؟</button></div>{err&&<p className="danger">{err}</p>}<button className="btn primary loginBtn" onClick={go}>ورود <ChevronLeft/></button><button className="linkBtn" onClick={()=>setMode('signup')}>اکانت نداری؟ ثبت‌نام مرحله‌ای</button><button className="btn ghost full" onClick={syncAll}>{online?'Online / Supabase Connected':'Sync Supabase'}</button></section></div></div>
}
function Dashboard({kpi,tasks,activities,users,goals,projects,logs,settings,setView}:any){
  return <OperationsDashboard tasks={tasks} activities={activities} users={users} goals={goals} projects={projects} logs={logs} settings={settings} setView={setView}/>;
}

function K({title,val,icon:Icon}:any){return <div className="card kpi"><Icon/><span>{title}</span><b>{val}</b></div>}
function Badge({text}:{text?:string}){return <span className={cn('badge',text==='فوری'?'urgent':text==='بالا'?'high':text==='پایین'?'low':'normal')}>{text||'—'}</span>}
function Progress({value}:{value:number}){const safe=Math.max(0,Math.min(100,value));return <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safe)}><i style={{width:`${safe}%`}}/><em>{Math.round(safe)}٪</em></div>}
function progressFor(taskId:string,acts:TaskActivity[]){const list=acts.filter(a=>a.task_id===taskId);if(!list.length)return 0;return list.filter(a=>a.is_done).length/list.length*100}
function chipList(vals?:string[]){return safeArr<string>(vals).map(v=><span className="chip" key={v}><Tag size={12}/>{v}</span>)}
function PersianMini({iso}:{iso?:string}){return <span className="pdate"><CalendarDays size={14}/>{faDate(iso)}</span>}
function Field({label,value,onChange,type='text',required=false}:any){const id=useId();const inputMode=type==='tel'?'tel':type==='number'?'numeric':type==='email'?'email':undefined;const autoComplete=type==='email'?'email':type==='tel'?'tel':type==='password'?'current-password':undefined;return <div><label htmlFor={id}>{label}{required&&<span aria-hidden="true"> *</span>}</label><input id={id} type={type} inputMode={inputMode} autoComplete={autoComplete} required={required} value={value??''} onChange={e=>onChange(e.target.value)}/></div>}

function Tasks({tasks,users,statuses,activities,can,saveTask,edit,remove}:any){
  const [statusFilter,setStatusFilter]=useState('همه');
  const [dragged,setDragged]=useState<Task|null>(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const cols=statuses.length?statuses:['جدید','در حال انجام','منتظر پاسخ','انجام شد'];
  const list=statusFilter==='همه'?tasks:tasks.filter((t:Task)=>t.status===statusFilter);
  function drop(status:string){if(!dragged||dragged.status===status){setDragged(null);setDragOver(null);return}saveTask({...dragged,status,completed_at:status==='انجام شد'?nowIso():undefined,updated_at:nowIso()});setDragged(null);setDragOver(null);toast(`تسک به «${status}» منتقل شد`)}
  return <div className="taskCenterPro"><div className="pageHead"><div><h2>مرکز تسک IHO</h2><p className="muted">وضعیت را با کشیدن کارت یا انتخاب مستقیم تغییر بده؛ تغییر بلافاصله ذخیره می‌شود.</p></div><div className="actions"><select aria-label="فیلتر وضعیت تسک‌ها" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>همه</option>{cols.map((s:string)=><option key={s}>{s}</option>)}</select><button className="btn ghost" onClick={()=>csv(tasks,'tasks.csv')}><Download/> خروجی CSV</button></div></div><div className="kanban kanbanPro">{cols.map((s:string)=>{const colTasks=list.filter((t:Task)=>t.status===s);return <section aria-label={`ستون ${s}، ${colTasks.length} تسک`} className={cn('column kanbanColumn',dragOver===s&&'dropActive')} key={s} onDragOver={e=>{e.preventDefault();setDragOver(s)}} onDragLeave={()=>setDragOver(null)} onDrop={e=>{e.preventDefault();drop(s)}}><header className="kanbanColHead"><div><i className={cn('statusDot',s==='انجام شد'&&'done',s.includes('انجام')&&'doing',s.includes('منتظر')&&'waiting')}/><h3>{s}</h3></div><span>{colTasks.length}</span></header><div className="kanbanDropHint">برای انتقال اینجا رها کن</div>{colTasks.map((t:Task)=><article className={cn('task taskPro',dragged?.id===t.id&&'dragging')} draggable onDragStart={e=>{setDragged(t);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',t.id)}} onDragEnd={()=>{setDragged(null);setDragOver(null)}} key={t.id}><div className="taskTop"><h4>{t.title}</h4><Badge text={t.priority}/></div><p>{t.description||'بدون توضیح'}</p><div className="chips small">{chipList(t.labels)}</div><div className="taskMeta"><span>{t.hotel_title||'بدون هتل'}</span><span>{t.assigned_name||'بدون مسئول'}</span></div><Progress value={progressFor(t.id,activities)}/><div className="taskFoot"><PersianMini iso={t.deadline}/><select aria-label={`وضعیت تسک ${t.title}`} value={t.status} onChange={e=>saveTask({...t,status:e.target.value,completed_at:e.target.value==='انجام شد'?nowIso():undefined,updated_at:nowIso()})}>{cols.map((status:string)=><option key={status}>{status}</option>)}</select>{can('assignments')&&<select aria-label={`مسئول تسک ${t.title}`} value={t.assigned_to||''} onChange={e=>{const u=users.find((x:User)=>x.id===e.target.value);saveTask({...t,assigned_to:u?.id,assigned_name:u?.full_name})}}><option value="">مسئول</option>{users.filter((u:User)=>u.is_active).map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select>}<button className="iconBtn" aria-label={`مشاهده تسک ${t.title}`} onClick={()=>edit(t)}><Eye size={16}/></button>{can('tasks_delete')&&<button className="iconBtn dangerBtn" aria-label={`حذف تسک ${t.title}`} onClick={()=>remove(t.id)}><Trash2 size={16}/></button>}</div></article>)}</section>})}</div></div>}
function Hotels({hotels,tasks,can,edit,profile,remove,importExcel}:any){
  const [mode,setMode]=useState<'pipeline'|'list'|'cards'>('pipeline');
  const openTasks=(id:string)=>tasks.filter((t:Task)=>t.hotel_id===id&&t.status!=='انجام شد').length;
  const health=(h:HotelT)=>Math.min(100,(Number(h.capacity_total||0)>0?34:0)+((h.contract_status||'').includes('فعال')?33:12)+(openTasks(h.id)===0?33:14));
  const lanes=['VIP قراردادی','نیازمند پیگیری','بدون ظرفیت','قرارداد / اسناد'];
  const laneData=(lane:string)=>hotels.filter((h:HotelT)=> lane==='بدون ظرفیت'?Number(h.capacity_total||0)===0: lane==='نیازمند پیگیری'?openTasks(h.id)>0||(h.risk_status||'').includes('ریسک'): lane==='قرارداد / اسناد'?(h.contract_status||'').includes('تمدید')||(h.contract_status||'').includes('نیاز'): (h.hotel_category||'').includes('VIP')||health(h)>70);
  return <div className="hotelCrmPage"><div className="pageHead crmHead"><div><h2>Hotel CRM</h2><p className="muted">پرونده ۳۶۰ درجه هتل‌ها، ظرفیت، قرارداد، Provider، ریسک و تسک‌های فعال</p></div><div className="actions"><div className="seg"><button className={mode==='pipeline'?'on':''} onClick={()=>setMode('pipeline')}>Pipeline</button><button className={mode==='cards'?'on':''} onClick={()=>setMode('cards')}>Cards</button><button className={mode==='list'?'on':''} onClick={()=>setMode('list')}>List</button></div>{can('hotels_import')&&<button className="btn ghost" onClick={importExcel}><Upload/> ورود اکسل</button>}<button className="btn ghost" onClick={()=>csv(hotels,'hotels.csv')}><Download/> CSV</button><button className="btn primary" onClick={()=>edit(null)}><Plus/> هتل جدید</button></div></div><div className="crmSummary"><div><b>{hotels.length}</b><span>کل هتل‌ها</span></div><div><b>{hotels.filter((h:HotelT)=>Number(h.capacity_total||0)===0).length}</b><span>بدون ظرفیت</span></div><div><b>{hotels.filter((h:HotelT)=>(h.contract_status||'').includes('تمدید')).length}</b><span>نیازمند تمدید</span></div><div><b>{tasks.filter((t:Task)=>t.hotel_id&&t.status!=='انجام شد').length}</b><span>تسک باز</span></div></div>{mode==='pipeline'&&<div className="crmPipeline">{lanes.map(l=><section className="crmStage" key={l}><h3>{l}<span>{laneData(l).length}</span></h3>{laneData(l).map((h:HotelT)=><article className="hotelCardPro" key={h.id}><div className="hotelAvatar">{(h.title||'ه').slice(0,1)}</div><div className="hotelInfo"><b>{h.title}</b><small>{h.city||'—'} • {h.grade||'بدون درجه'} • {h.provider||'بدون Provider'}</small></div><div className="hotelChips"><span>ظرفیت {h.capacity_total||0}</span><span>تسک {openTasks(h.id)}</span><span>{h.cooperation_status||'نامشخص'}</span></div><Progress value={health(h)}/><div className="hotelActions"><button className="btn ghost" onClick={()=>edit(h)}><Eye/> پرونده</button><button className="iconBtn dangerBtn" onClick={()=>remove(h.id)}><Trash2/></button></div></article>)}</section>)}</div>}{mode==='cards'&&<div className="hotelGrid">{hotels.map((h:HotelT)=><article className="hotelBigCard" key={h.id}><div className="hotelBigTop"><div className="hotelAvatar lg">{(h.title||'ه').slice(0,1)}</div><div><h3>{h.title}</h3><p>{h.city} • {h.province}</p></div></div><div className="hotelMetrics"><span><b>{h.capacity_total||0}</b>ظرفیت</span><span><b>{openTasks(h.id)}</b>تسک باز</span><span><b>{health(h)}٪</b>سلامت</span></div><div className="hotelChips"><span>{h.hotel_category||'دسته نامشخص'}</span><span>{h.contract_status||'قرارداد نامشخص'}</span></div><Progress value={health(h)}/><div className="actions"><button className="btn primary" onClick={()=>edit(h)}>ویرایش پرونده</button><button className="btn ghost dangerText" onClick={()=>remove(h.id)}>حذف</button></div></article>)}</div>}{mode==='list'&&<div className="card softTable"><table className="table"><thead><tr><th>کد</th><th>هتل</th><th>شهر</th><th>درجه</th><th>Provider</th><th>ظرفیت</th><th>تسک باز</th><th>سلامت</th><th></th></tr></thead><tbody>{hotels.map((h:HotelT)=><tr key={h.id}><td>{h.hotel_code}</td><td><b>{h.title}</b><small>{h.cooperation_status}</small></td><td>{h.city}</td><td>{h.grade||`${h.star||0} ستاره`}</td><td>{h.provider}</td><td>{h.capacity_total||0}</td><td>{openTasks(h.id)}</td><td><Progress value={health(h)}/></td><td><button className="iconBtn" onClick={()=>profile(h)}><Eye/></button><button className="iconBtn" onClick={()=>edit(h)}><Edit3/></button><button className="iconBtn dangerBtn" onClick={()=>remove(h.id)}><Trash2/></button></td></tr>)}</tbody></table></div>}</div>
}
function ExpertImporter({run,runAssignments}:any){
  const [busy,setBusy]=useState(false);const ref=useRef<HTMLInputElement|null>(null),assignmentRef=useRef<HTMLInputElement|null>(null);
  const upload=async(file:File,action:any,label:string)=>{setBusy(true);try{await action(file)}catch(error:any){toast(`${label} ناموفق بود: ${error.message}`)}finally{setBusy(false)}};
  return <div className="card expertImportBar"><div><b>ورود کارشناسان و تخصیص هتل</b><small>فایل کارشناسان: نام، نام کاربری، تیم و منطقه · فایل تخصیص: نام هتل و First name</small></div><div className="actions"><button className="btn ghost" disabled={busy} onClick={()=>ref.current?.click()}><Upload/> فایل کارشناسان</button><button className="btn primary" disabled={busy} onClick={()=>assignmentRef.current?.click()}><Upload/> {busy?'در حال اعمال...':'فایل تخصیص هتل'}</button></div><input ref={ref} hidden type="file" accept=".xlsx,.xls,.csv" onClick={e=>{e.currentTarget.value=''}} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file,run,'اعمال فایل کارشناسان')}}/><input ref={assignmentRef} hidden type="file" accept=".xlsx,.xls,.csv" onClick={e=>{e.currentTarget.value=''}} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file,runAssignments,'اعمال تخصیص هتل‌ها')}}/></div>
}
function Team({users,roles,tasks,activities,logs,profile,edit,add,remove}:any){
  const [view,setView]=useState<'activity'|'list'>('activity');
  const active=users.filter((u:User)=>u.is_active).length;
  const roleTitle=(u:User)=>roles.find((r:Role)=>r.id===u.role_id)?.title||u.role||'کاربر';
  const workStats=(u:User)=>{const owned=tasks.filter((t:Task)=>t.assigned_to===u.id||(!t.assigned_to&&norm(t.assigned_name)===norm(u.full_name)));return{backlog:owned.filter((t:Task)=>['جدید','باز','در انتظار شروع'].includes(t.status)).length,inProgress:owned.filter((t:Task)=>['در حال انجام','منتظر پاسخ','نیازمند اصلاح'].includes(t.status)).length,inReview:owned.filter((t:Task)=>['ارسال برای تایید','در انتظار تایید','بازبینی'].includes(t.status)).length}};
  return <div className="employeesPage"><div className="employeesHead"><div><h2>کارشناسان ({users.length.toLocaleString('fa-IR')})</h2><p className="muted">مدیریت کارشناسان، نقش‌ها، تیم‌ها و سطح دسترسی</p></div><div className="actions"><div className="seg" role="group" aria-label="نوع نمایش کارشناسان"><button aria-pressed={view==='list'} className={view==='list'?'on':''} onClick={()=>setView('list')}>فهرست</button><button aria-pressed={view==='activity'} className={view==='activity'?'on':''} onClick={()=>setView('activity')}>عملکرد</button></div><button className="btn primary" onClick={add}><Plus/> افزودن کارشناس</button></div></div>{view==='activity'?<div className="employeeCards">{users.map((u:User)=>{const stats=workStats(u);return <article className={cn('employeeCard',!u.is_active&&'sleep')} key={u.id}><div className="profileBand"><div className="avatar ring">{u.full_name.slice(0,1)}</div><h3>{u.full_name}</h3><p>{roleTitle(u)}</p><span>{u.zone||'عمومی'}</span></div><div className="employeeStats"><div><b>{stats.backlog}</b><small>صف انتظار</small></div><div><b>{stats.inProgress}</b><small>در حال انجام</small></div><div><b>{stats.inReview}</b><small>در حال بازبینی</small></div></div><div className="actions center"><button className="btn primary" onClick={()=>profile(u)}><Eye/> پروفایل</button><button className="btn ghost" onClick={()=>edit(u)}><Edit3/> ویرایش</button><button className="iconBtn dangerBtn" aria-label={`حذف کارشناس ${u.full_name}`} onClick={()=>remove(u.id)}><Trash2/></button></div></article>})}</div>:<div className="employeeList">{users.map((u:User)=><div className="employeeRow" key={u.id}><div className="avatar mini">{u.full_name.slice(0,1)}</div><div><b>{u.full_name}</b><small>{u.email||u.username}</small></div><span>جنسیت<br/><b>—</b></span><span>تیم<br/><b>{u.team||'—'}</b></span><span>منطقه<br/><b>{u.zone||'—'}</b></span><span>سمت<br/><b>{roleTitle(u)}</b></span><button className="iconBtn" aria-label={`مشاهده پروفایل ${u.full_name}`} onClick={()=>profile(u)}><Eye/></button><button className="iconBtn" aria-label={`ویرایش ${u.full_name}`} onClick={()=>edit(u)}><MoreHorizontal/></button></div>)}</div>}<div className="profilePreview card"><div><h3>پروفایل کارشناس</h3><p>برای هر کاربر می‌توان نقش، تیم، زون، رمز، ایمیل و دسترسی را مدیریت کرد.</p></div><div className="profileMetrics"><span><b>{active}</b>فعال</span><span><b>{roles.length}</b>نقش</span><span><b>{users.length-active}</b>غیرفعال</span></div></div></div>
}
function CRM360({hotels,tasks,docs,users,setView,exportHotels,onCreateTask}:any){
  const lanes=['فعال','نیازمند پیگیری','نیازمند تمدید','آنلاین‌سازی','رشد'];
  const [totalHotels,setTotalHotels]=useState<number>(hotels.length);
  const [dragged,setDragged]=useState<HotelT|null>(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const [stageMap,setStageMap]=useState<Record<string,string>>({});

  useEffect(()=>{
    (async()=>{const db=await getSupabaseClient();if(!db)return;const {count,error}=await db.from('ihos_hotels').select('id',{count:'exact',head:true});if(!error&&typeof count==='number')setTotalHotels(count)})();
  },[]);

  const fallbackStage=(h:HotelT)=>(h.contract_status||'').includes('تمدید')||(h.contract_status||'').includes('منقضی')?'نیازمند تمدید':((h.risk_status||'').includes('ریسک')||(h.cooperation_status||'').includes('قطع'))?'نیازمند پیگیری':(!h.site_visible||!h.search_visible||Number(h.capacity_total||0)<=0)?'آنلاین‌سازی':(Number((h as any).sales_amount||0)>0||Number((h as any).bookings_count||0)>0)?'رشد':'فعال';
  const stageOf=(h:HotelT)=>stageMap[h.id]||(h as any).crm_stage||fallbackStage(h);
  const byLane=(lane:string)=>hotels.filter((h:HotelT)=>stageOf(h)===lane);
  const hotOpen=(id:string)=>tasks.filter((t:Task)=>t.hotel_id===id&&t.status!=='انجام شد').length;
  const docsCount=(id:string)=>docs.filter((d:Doc)=>d.hotel_id===id).length;
  const topCities=Object.entries(hotels.reduce((a:any,h:HotelT)=>{a[h.city||'نامشخص']=(a[h.city||'نامشخص']||0)+1;return a},{})).sort((a:any,b:any)=>b[1]-a[1]).slice(0,8);

  async function moveHotel(lane:string){
    if(!dragged||stageOf(dragged)===lane){setDragged(null);setDragOver(null);return}
    const previous=stageMap[dragged.id];const next={...stageMap,[dragged.id]:lane};setStageMap(next);
    const db=await getSupabaseClient();
    if(!db){setStageMap(current=>{const rollback={...current};if(previous)rollback[dragged.id]=previous;else delete rollback[dragged.id];return rollback});toast('اتصال Supabase در دسترس نیست؛ مرحله ذخیره نشد.');setDragged(null);setDragOver(null);return}
    const {error}=await db.from('ihos_hotels').update({crm_stage:lane,updated_at:nowIso()}).eq('id',dragged.id);if(error){setStageMap(current=>{const rollback={...current};if(previous)rollback[dragged.id]=previous;else delete rollback[dragged.id];return rollback});toast(`ذخیره مرحله ناموفق بود: ${error.message}`);setDragged(null);setDragOver(null);return}
    toast(`${dragged.title} به «${lane}» منتقل شد`);setDragged(null);setDragOver(null);
  }

  return <div><div className="pageHead"><div><h2>CRM 360 هتل‌ها</h2><p className="muted">کارت هتل را بین ستون‌ها بکش؛ با دکمه + برای همان هتل تسک بساز.</p></div><div className="actions"><button className="btn ghost" onClick={exportHotels}><Download/> خروجی هتل‌ها</button><button className="btn primary" onClick={()=>setView('hotels')}><Hotel/> رفتن به پرونده هتل‌ها</button></div></div>
  <div className="grid kpis"><K title="کل هتل‌ها" val={totalHotels} icon={Hotel}/><K title="هتل‌های نمایش‌داده‌شده" val={hotels.length} icon={Building2}/><K title="نیازمند آنلاین‌سازی" val={byLane('آنلاین‌سازی').length} icon={Wifi}/><K title="تسک‌های باز مرتبط" val={tasks.filter((t:Task)=>t.hotel_id&&t.status!=='انجام شد').length} icon={ClipboardList}/><K title="اسناد ثبت‌شده" val={docs.length} icon={FileText}/><K title="کارشناسان فعال" val={users.filter((u:User)=>u.is_active).length} icon={Users}/></div>
  <div className="crmBoard">{lanes.map(l=><section className={cn('crmLane',dragOver===l&&'dropActive')} key={l} onDragOver={e=>{e.preventDefault();setDragOver(l)}} onDragLeave={()=>setDragOver(null)} onDrop={e=>{e.preventDefault();moveHotel(l)}}><h3>{l}<span>{byLane(l).length}</span></h3><div className="kanbanDropHint">برای انتقال هتل اینجا رها کن</div>{byLane(l).slice(0,25).map((h:HotelT)=><article className={cn('hotelDeal',dragged?.id===h.id&&'dragging')} key={h.id} draggable onDragStart={e=>{setDragged(h);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',h.id)}} onDragEnd={()=>{setDragged(null);setDragOver(null)}}><div className="hotelDealHead"><div><b>{h.title}</b><small>{h.city||'—'} • {h.provider||'بدون Provider'}</small></div><button className="iconBtn taskPlusBtn" title="ایجاد تسک برای این هتل" onClick={e=>{e.stopPropagation();onCreateTask?.(h)}}><Plus size={17}/></button></div><div className="chips small"><span className="chip">تسک {hotOpen(h.id)}</span><span className="chip">سند {docsCount(h.id)}</span><span className="chip">{h.cooperation_status||'نامشخص'}</span></div><Progress value={Math.min(100,(h.contract_status==='فعال'?35:20)+(hotOpen(h.id)===0?25:10)+(docsCount(h.id)>0?15:5)+(h.site_visible?15:5)+(h.search_visible?10:0))}/></article>)}</section>)}</div>
  <div className="grid two"><div className="card"><h3>پراکندگی شهرها در داده‌های بارگذاری‌شده</h3>{topCities.map(([city,count]:any)=><div className="barRow" key={city}><span>{city}</span><div className="bar"><i style={{width:`${Math.min(100,count*8)}%`}}/></div><b>{count}</b><small>هتل</small></div>)}</div><div className="card"><h3>راهنمای کار با CRM</h3><div className="timeline"><div className="tl"><b>انتقال مرحله</b><span>کارت هتل را بگیر و در ستون مقصد رها کن.</span></div><div className="tl"><b>تسک سریع</b><span>روی + کنار نام هتل بزن تا فرم تسک با هتل انتخاب‌شده باز شود.</span></div><div className="tl"><b>تعداد کل</b><span>عدد کل مستقیماً از Count واقعی جدول ihos_hotels خوانده می‌شود.</span></div></div></div></div></div>
}
function Reports({tasks,logs,users,hotels,activities,exportTasks,exportLogs}:any){
 const [user,setUser]=useState('all'),[from,setFrom]=useState(''),[to,setTo]=useState('');
 const inRange=(d?:string)=>!d || ((!from||d.slice(0,10)>=from)&&(!to||d.slice(0,10)<=to));
 const flogs=logs.filter((l:ActivityLog)=>(user==='all'||l.user_id===user)&&inRange(l.created_at));
 const ftasks=tasks.filter((t:Task)=>(user==='all'||t.assigned_to===user)&&inRange(t.created_at));
 const userBars=users.map((u:User)=>({u,count:flogs.filter((l:ActivityLog)=>l.user_id===u.id).length,done:ftasks.filter((t:Task)=>t.assigned_to===u.id&&t.status==='انجام شد').length})).sort((a:any,b:any)=>b.count-a.count);
 const catBars=Object.entries(ftasks.reduce((a:any,t:Task)=>{a[t.category||'بدون دسته']=(a[t.category||'بدون دسته']||0)+1;return a},{})).sort((a:any,b:any)=>b[1]-a[1]);
 return <div><div className="pageHead"><div><h2>گزارش‌ساز مدیریتی</h2><p className="muted">گزارش فعالیت، عملکرد، زمان، دسته‌بندی‌ها و خروجی مدیریتی</p></div><div className="actions"><button className="btn ghost" onClick={exportTasks}><Download/> خروجی تسک‌ها</button><button className="btn ghost" onClick={exportLogs}><Download/> خروجی لاگ‌ها</button></div></div><div className="card reportFilters"><label>کاربر<select value={user} onChange={e=>setUser(e.target.value)}><option value="all">همه کاربران</option>{users.map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></label><PersianDatePicker label="از تاریخ" value={from} onChange={setFrom}/><PersianDatePicker label="تا تاریخ" value={to} onChange={setTo}/></div><div className="grid kpis"><K title="فعالیت‌ها" val={flogs.length} icon={Activity}/><K title="تسک‌ها" val={ftasks.length} icon={ClipboardList}/><K title="فعالیت انجام‌شده" val={activities.filter((a:TaskActivity)=>a.is_done).length} icon={ListChecks}/><K title="هتل‌ها" val={hotels.length} icon={Hotel}/><K title="تسک فوری" val={ftasks.filter((t:Task)=>t.priority==='فوری').length} icon={Bell}/><K title="انجام‌شده" val={ftasks.filter((t:Task)=>t.status==='انجام شد').length} icon={CheckCircle2}/></div><div className="grid two"><div className="card"><h3>فعالیت کاربران</h3>{userBars.map(({u,count,done}:any)=><div className="barRow" key={u.id}><span>{u.full_name}</span><div className="bar"><i style={{width:`${Math.min(100,count*12)}%`}}/></div><b>{count}</b><small>{done} تسک</small></div>)}</div><div className="card"><h3>دسته‌بندی تسک‌ها</h3>{catBars.map(([cat,count]:any)=><div className="barRow" key={cat}><span>{cat}</span><div className="bar"><i style={{width:`${Math.min(100,count*10)}%`}}/></div><b>{count}</b><small>مورد</small></div>)}</div></div><div className="card"><h3>آخرین رخدادها</h3><div className="timeline">{flogs.slice(0,18).map((l:ActivityLog)=><div className="tl" key={l.id}><b>{l.title||l.action}</b><span>{l.user_name||'سیستم'} • {l.entity}</span><small>{faDateTime(l.created_at)}</small></div>)}</div></div></div>
}


function ActivityChart({logs,users}:any){
  const rows=(users||[]).map((u:User)=>({user:u,count:(logs||[]).filter((l:ActivityLog)=>l.user_id===u.id||l.user_name===u.full_name).length})).sort((a:any,b:any)=>b.count-a.count).slice(0,8);
  const max=Math.max(1,...rows.map((r:any)=>r.count));
  return <div className="card activityChart"><div className="sectionTitle"><h3>نمودار فعالیت کاربران</h3><small>{logs?.length||0} رویداد ثبت‌شده</small></div>{rows.length?rows.map((r:any)=><div className="barRow" key={r.user.id}><span>{r.user.full_name}</span><div><i style={{width:`${(r.count/max)*100}%`}}/></div><b>{r.count}</b></div>):<div className="emptyState"><Activity/><b>هنوز لاگی ثبت نشده</b><small>بعد از انجام اکشن‌ها نمودار تکمیل می‌شود.</small></div>}</div>
}
function GoalsMini({goals,users,tasks,activities}:any){
  return <div className="card"><div className="sectionTitle"><h3>هدف‌گذاری‌ها</h3><small>{goals?.length||0} هدف فعال</small></div>{(goals||[]).slice(0,5).map((g:Goal)=>{const user=users.find((u:User)=>u.id===g.user_id);const done=g.metric==='tasks_done'?tasks.filter((t:Task)=>(!g.user_id||t.assigned_to===g.user_id)&&t.status==='انجام شد').length:activities.filter((a:TaskActivity)=>(!g.user_id||a.assigned_to===g.user_id)&&a.is_done).length;return <div className="miniItem" key={g.id}><div><b>{g.title}</b><small>{user?.full_name||'همه کاربران'} • تا {faDate(g.end_date)}</small></div><Progress value={(done/Math.max(1,g.target_count))*100}/></div>})}{!(goals||[]).length&&<p className="muted">هدف جدید تعریف کن تا پیشرفت تیم را ببینی.</p>}</div>
}
function ProjectsMini({projects,tasks}:any){
  return <div className="card"><div className="sectionTitle"><h3>پروژه‌های فعال</h3><small>{projects?.length||0} پروژه</small></div>{(projects||[]).slice(0,5).map((p:Project)=>{const ts=tasks.filter((t:Task)=>t.project_id===p.id);const done=ts.filter((t:Task)=>t.status==='انجام شد').length;return <div className="projectRow" key={p.id}><div><b>{p.title}</b><small>{p.status||'فعال'} • {faDate(p.deadline)}</small></div><Progress value={(done/Math.max(1,ts.length))*100}/></div>})}{!(projects||[]).length&&<p className="muted">پروژه‌ای ثبت نشده است.</p>}</div>
}
function CalendarView({tasks,events,reminders,add,edit,remove}:any){
  const base=toJalali(); const [jy,setJy]=useState(base.jy),[jm,setJm]=useState(base.jm); const days=jalaliMonthLength(jy,jm); const first=gDayIndexForJalali(jy,jm,1);
  const isoFor=(d:number)=>toGregorianISO(jy,jm,d); const dayItems=(d:number)=>{const iso=isoFor(d);return {tasks:tasks.filter((t:Task)=>t.deadline===iso),events:events.filter((e:EventT)=>e.start_date?.slice(0,10)===iso),reminders:reminders.filter((r:Reminder)=>r.notify_at?.slice(0,10)===iso)}};
  function move(n:number){let m=jm+n,y=jy;if(m<1){m=12;y--}if(m>12){m=1;y++}setJm(m);setJy(y)}
  return <div><div className="pageHead"><div><h2>تقویم شمسی عملیات</h2><p className="muted">نمای ماهانه تسک‌ها، رویدادها و یادآورها</p></div><div className="actions"><button className="iconBtn" aria-label="ماه قبل" onClick={()=>move(-1)}><ChevronRight/></button><b aria-live="polite">{jMonths[jm-1]} {jy}</b><button className="iconBtn" aria-label="ماه بعد" onClick={()=>move(1)}><ChevronLeft/></button><button className="btn primary" onClick={add}><Plus/> رویداد</button></div></div><div className="calendarGrid"><div className="weekHeader">{weekdays.map(w=><b key={w}>{w}</b>)}</div><div className="monthGrid">{[...Array(first).fill(0),...Array.from({length:days},(_,i)=>i+1)].map((d,i)=>{const items=d?dayItems(d):null;return <div className={cn('dayCell',!d&&'empty')} key={i}>{d&&<><strong>{d}</strong>{items!.tasks.slice(0,3).map((t:Task)=><span className="calTask" key={t.id}>{t.title}</span>)}{items!.events.map((e:EventT)=><button className="calEvent" aria-label={`ویرایش رویداد ${e.title}`} key={e.id} onClick={()=>edit(e)}>{e.title}</button>)}{items!.reminders.slice(0,2).map((r:Reminder)=><span className="calReminder" key={r.id}><AlarmClock aria-hidden="true" size={12}/> {r.title}</span>)}</>}</div>})}</div></div></div>
}
function Docs({docs,hotels,can,add,edit,remove}:any){
  const [q,setQ]=useState('');
  const [type,setType]=useState('all');
  const [onlyPinned,setOnlyPinned]=useState(false);
  const types:string[]=['all',...Array.from(new Set<string>((docs||[]).map((d:Doc)=>String(d.type||'سایر'))))];
  const rows=(docs||[]).filter((d:Doc)=>{
    const hotel=d.hotel_title||hotels.find((h:HotelT)=>h.id===d.hotel_id)?.title||'';
    return (!q||`${d.title} ${d.type||''} ${hotel}`.toLowerCase().includes(q.toLowerCase()))&&(type==='all'||(d.type||'سایر')===type)&&(!onlyPinned||d.pinned)
  });
  const contracts=(docs||[]).filter((d:Doc)=>(d.type||'').includes('قرارداد')).length;
  const pinned=(docs||[]).filter((d:Doc)=>d.pinned).length;
  return <div className="documentsV15">
    <div className="pageHead"><div><span className="sectionEyebrow">DOCUMENT CENTER</span><h2>مرکز اسناد و قراردادها</h2><p className="muted">جستجو، دسته‌بندی و دسترسی سریع به فایل‌های هتل‌ها</p></div>{can('documents_upload')&&<button className="btn primary" onClick={add}><Upload/> افزودن سند</button>}</div>
    <div className="docsMetricsV15"><article><FileText/><div><span>کل اسناد</span><b>{(docs||[]).length.toLocaleString('fa-IR')}</b></div></article><article><FileCheck2/><div><span>قراردادها</span><b>{contracts.toLocaleString('fa-IR')}</b></div></article><article><Pin/><div><span>پین‌شده</span><b>{pinned.toLocaleString('fa-IR')}</b></div></article></div>
    <div className="filterToolbarV15"><div className="searchV15"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو در عنوان سند یا نام هتل..."/></div><select value={type} onChange={e=>setType(e.target.value)}>{types.map(x=><option key={x} value={x}>{x==='all'?'همه نوع‌ها':x}</option>)}</select><label className="checkPillV15"><input type="checkbox" checked={onlyPinned} onChange={e=>setOnlyPinned(e.target.checked)}/><Pin/> فقط پین‌شده‌ها</label><span className="resultCountV15">{rows.length.toLocaleString('fa-IR')} نتیجه</span></div>
    <div className="docsGridV15">{rows.map((d:Doc)=>{const hotel=d.hotel_title||hotels.find((h:HotelT)=>h.id===d.hotel_id)?.title||'بدون هتل';return <article className="documentCardV15" key={d.id}><div className="documentIconV15"><FileText/></div><div className="documentContentV15"><div><span className="docTypeV15">{d.type||'سند'}</span>{d.pinned&&<span className="pinBadgeV15"><Pin/> پین‌شده</span>}</div><h3>{d.title}</h3><p>{hotel}</p><small>{faDate(d.created_at)} {d.notes?`· ${d.notes}`:''}</small></div><div className="documentActionsV15"><button title="ویرایش" onClick={()=>edit(d)}><Edit3/></button>{d.file_url&&<a title="مشاهده فایل" href={d.file_url} target="_blank" rel="noreferrer"><Eye/></a>}<button className="danger" title="حذف" onClick={()=>remove(d.id)}><Trash2/></button></div></article>})}</div>
    {!rows.length&&<div className="emptyV15"><FolderOpen/><h3>سندی مطابق فیلتر پیدا نشد</h3><p>فیلترها را تغییر بده یا یک سند جدید اضافه کن.</p>{can('documents_upload')&&<button className="btn primary" onClick={add}><Plus/> افزودن سند</button>}</div>}
  </div>
}

function Roles({roles,edit,add,remove}:any){
  const systemCount=roles.filter((r:Role)=>r.is_system).length;
  const customCount=roles.length-systemCount;
  return <div className="rolesPage">
    <div className="pageHead rolesHead"><div><span className="sectionEyebrow">ACCESS CONTROL</span><h2>نقش‌ها و سطح دسترسی</h2><p className="muted">تعیین کنید هر گروه از کاربران به کدام بخش‌ها و عملیات سیستم دسترسی داشته باشد.</p></div><button className="btn primary" onClick={add}><Plus/> ایجاد نقش جدید</button></div>
    <div className="rolesSummary"><div><Shield/><span>کل نقش‌ها</span><b>{roles.length}</b></div><div><KeyRound/><span>نقش‌های سیستمی</span><b>{systemCount}</b></div><div><Users/><span>نقش‌های سفارشی</span><b>{customCount}</b></div></div>
    <div className="roleGrid refinedRoleGrid">{roles.map((r:Role)=>{const count=Object.values(r.permissions||{}).filter(Boolean).length;return <article className="roleCard refinedRoleCard" key={r.id}><div className="roleCardTop"><div className="roleIcon"><Shield/></div><div><h3>{r.title}</h3><span className={cn('roleType',r.is_system&&'system')}>{r.is_system?'نقش سیستمی':'نقش سفارشی'}</span></div></div><p>{r.description||'بدون توضیح'}</p><div className="permissionMeter"><div><span>دسترسی فعال</span><b>{count}</b></div><i><em style={{width:`${Math.min(100,(count/Math.max(1,ALL_PERMS.length))*100)}%`}}/></i></div><div className="roleActions"><button className="btn ghost" onClick={()=>edit(r)}><Edit3/> مدیریت دسترسی‌ها</button>{!r.is_system&&<button className="iconBtn dangerBtn" title="حذف نقش" onClick={()=>remove(r.id)}><Trash2/></button>}</div></article>})}</div>
  </div>
}
function HotelProfileModal({hotel,tasks,docs,events,systemEvents=[],logs,users,close,editHotel,newTask}:any){
  const open=tasks.filter((t:Task)=>t.status!=='انجام شد').length;
  const done=tasks.filter((t:Task)=>t.status==='انجام شد').length;
  const urgent=tasks.filter((t:Task)=>t.priority==='فوری').length;
  const health=Math.min(100,(Number(hotel?.capacity_total||0)>0?32:0)+((hotel?.contract_status||'').includes('فعال')?30:12)+(open===0?24:10)+(docs.length?14:4));
  return <Modal title="پرونده ۳۶۰ هتل" close={close}><div className="profile360 hotelProfile360"><section className="profileHero"><div className="hotelAvatar xl">{hotel?.title?.slice(0,1)||'H'}</div><div><h2>{hotel?.title}</h2><p>{hotel?.city||'—'} • {hotel?.province||'—'} • {hotel?.provider||'بدون Provider'}</p><div className="chips small"><span className="chip">کد {hotel?.hotel_code||'—'}</span><span className="chip">ظرفیت {hotel?.capacity_total||0}</span><span className="chip">{hotel?.cooperation_status||'وضعیت نامشخص'}</span></div></div><div className="profileHeroActions"><button className="btn primary" onClick={newTask}><Plus/> تسک برای این هتل</button><button className="btn ghost" onClick={editHotel}><Edit3/> ویرایش اطلاعات</button></div></section><div className="profileKpis"><K title="Health Score" val={`${health}%`} icon={Activity}/><K title="تسک باز" val={open} icon={ClipboardList}/><K title="فوری" val={urgent} icon={Bell}/><K title="اسناد" val={docs.length} icon={FileText}/></div><div className="grid two"><div className="card"><h3>Timeline وقایع هتل</h3><div className="timeline">{[...systemEvents.map((e:HotelEvent)=>({t:e.title,s:e.actor_name||e.event_type||'سیستم',d:e.occurred_at})),...logs.map((l:ActivityLog)=>({t:l.title||l.action,s:l.user_name||'سیستم',d:l.created_at})),...tasks.map((t:Task)=>({t:t.title,s:t.assigned_name||'بدون مسئول',d:t.updated_at||t.created_at})),...events.map((e:EventT)=>({t:e.title,s:'رویداد تقویم',d:e.start_date}))].sort((a:any,b:any)=>String(b.d).localeCompare(String(a.d))).slice(0,32).map((x:any,i:number)=><div className="tl" key={`${x.d}-${i}`}><b>{x.t}</b><span>{x.s}</span><small>{faDateTime(x.d)}</small></div>)}</div></div><div className="card"><h3>تسک‌ها و اسناد</h3>{tasks.slice(0,8).map((t:Task)=><div className="miniEntity" key={t.id}><div><b>{t.title}</b><small>{t.assigned_name||'بدون مسئول'} • {faDate(t.deadline)}</small></div><Badge text={t.priority}/></div>)}{docs.slice(0,8).map((d:Doc)=><a className="miniEntity" href={d.file_url||'#'} target="_blank" key={d.id}><div><b>{d.title}</b><small>{d.type||'سند'} • {faDate(d.created_at)}</small></div><FileText/></a>)}</div></div></div></Modal>
}
function EmployeeProfileModal({user,role,tasks,activities,logs,projects,close,editUser}:any){
  const open=tasks.filter((t:Task)=>t.status!=='انجام شد').length, done=tasks.filter((t:Task)=>t.status==='انجام شد').length;
  const doneActs=activities.filter((a:TaskActivity)=>a.is_done).length;
  const onTime=tasks.length?Math.round((tasks.filter((t:Task)=>!t.deadline||t.status==='انجام شد'||t.deadline>=today()).length/tasks.length)*100):100;
  return <Modal title="پروفایل کارشناس" close={close}><div className="profile360 employeeProfile360"><section className="profileHero"><div className="avatar xl">{user?.full_name?.slice(0,1)||'U'}</div><div><h2>{user?.full_name}</h2><p>{role?.title||user?.role||'کاربر'} • {user?.team||'بدون تیم'} • {user?.zone||'بدون زون'}</p><div className="chips small"><span className="chip">{user?.username}</span><span className="chip">{user?.mobile||'بدون موبایل'}</span><span className="chip">{user?.is_active?'فعال':'غیرفعال'}</span></div></div><div className="profileHeroActions"><button className="btn ghost" onClick={editUser}><Edit3/> ویرایش کاربر</button></div></section><div className="profileKpis"><K title="تسک باز" val={open} icon={ClipboardList}/><K title="تکمیل‌شده" val={done} icon={CheckCircle2}/><K title="فعالیت انجام‌شده" val={doneActs} icon={ListChecks}/><K title="On-time KPI" val={`${onTime}%`} icon={Target}/></div><div className="grid two"><div className="card"><h3>KPI و فعالیت‌ها</h3><div className="kpiStack"><div><span>پیشرفت تسک‌های فعال</span><Progress value={tasks.length?done/tasks.length*100:0}/></div><div><span>نرخ انجام به‌موقع</span><Progress value={onTime}/></div><div><span>فعالیت‌های بسته‌شده</span><Progress value={activities.length?doneActs/activities.length*100:0}/></div></div><div className="timeline">{logs.slice(0,18).map((l:ActivityLog)=><div className="tl" key={l.id}><b>{l.title||l.action}</b><span>{l.entity}</span><small>{faDateTime(l.created_at)}</small></div>)}</div></div><div className="card"><h3>پروژه‌ها و تسک‌ها</h3>{projects.map((p:Project)=><div className="miniEntity" key={p.id}><div><b>{p.title}</b><small>{p.status||'فعال'} • {faDate(p.deadline)}</small></div><FolderKanban/></div>)}{tasks.slice(0,12).map((t:Task)=><div className="miniEntity" key={t.id}><div><b>{t.title}</b><small>{t.hotel_title||'بدون هتل'} • {faDate(t.deadline)}</small></div><Badge text={t.priority}/></div>)}</div></div></div></Modal>
}

function ActivityLogs({logs,users}:any){const [filter,setFilter]=useState('');const list=filter?logs.filter((l:ActivityLog)=>l.user_id===filter):logs;return <div><div className="pageHead"><div><h2>لاگ اتفاق‌ها</h2><p className="muted">تاریخچه همه اکشن‌ها و زمان انجام کارها</p></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">همه کاربران</option>{users.map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div><ActivityChart logs={list} users={users}/><div className="card"><table className="table"><thead><tr><th>زمان</th><th>کاربر</th><th>اکشن</th><th>موجودیت</th><th>عنوان</th></tr></thead><tbody>{list.map((l:ActivityLog)=><tr key={l.id}><td>{faDateTime(l.created_at)}</td><td>{l.user_name||users.find((u:User)=>u.id===l.user_id)?.full_name||'سیستم'}</td><td>{l.action}</td><td>{l.entity}</td><td>{l.title}</td></tr>)}</tbody></table></div></div>}
function Reminders({reminders,users,tasks,edit,add,done,remove,setView}:any){return <div><div className="pageHead"><div><h2>یادآورها</h2><p className="muted">یادآوری‌های شخصی و تسک‌ها؛ نمای تقویم در همین مسیر در دسترس است.</p></div><div className="actions"><button className="btn ghost" onClick={()=>setView('calendar')}><CalendarDays/> نمای تقویم</button><button className="btn primary" onClick={add}><Plus/> یادآور جدید</button></div></div><div className="listCards compactList">{reminders.map((r:Reminder)=><article className="card rowCard" key={r.id}><AlarmClock/><div><b>{r.title}</b><small>{faDateTime(r.notify_at)} • {users.find((u:User)=>u.id===r.user_id)?.full_name||'عمومی'} • {tasks.find((t:Task)=>t.id===r.task_id)?.title||''}</small><p>{r.body}</p></div><Badge text={r.is_done?'انجام شد':r.is_sent?'ارسال شد':'فعال'}/><div className="actions"><button className="iconBtn" aria-label={`ویرایش یادآور ${r.title}`} onClick={()=>edit(r)}><Edit3/></button><button className="iconBtn" aria-label={`علامت‌گذاری ${r.title} به‌عنوان انجام‌شده`} onClick={()=>done(r)}><CheckCircle2/></button><button className="iconBtn dangerBtn" aria-label={`حذف یادآور ${r.title}`} onClick={()=>remove(r.id)}><Trash2/></button></div></article>)}</div></div>}
function Automations({automations,users,categories,edit,add,remove}:any){return <div><div className="pageHead"><div><h2>اتوماسیون</h2><p className="muted">قوانین خودکار برای تخصیص، اولویت، وضعیت و برچسب‌ها</p></div><button className="btn primary" onClick={add}><Rocket/> قانون جدید</button></div><div className="listCards">{automations.map((a:Automation)=><article className="card rowCard" key={a.id}><Rocket/><div><b>{a.title}</b><small>{a.enabled?'فعال':'غیرفعال'} • دسته: {a.trigger_category||'همه'} • مسئول: {users.find((u:User)=>u.id===a.assign_to)?.full_name||'بدون تغییر'}</small></div><Badge text={a.priority||a.status||a.label||'قانون'}/><div className="actions"><button className="iconBtn" aria-label={`ویرایش قانون ${a.title}`} onClick={()=>edit(a)}><Edit3/></button><button className="iconBtn dangerBtn" aria-label={`حذف قانون ${a.title}`} onClick={()=>remove(a.id)}><Trash2/></button></div></article>)}</div></div>}
function Goals({goals,users,tasks,activities,edit,add,remove}:any){return <div><div className="pageHead"><div><h2>هدف‌گذاری</h2><p className="muted">تعریف KPI روی فعالیت‌ها و تسک‌های انجام‌شده</p></div><button className="btn primary" onClick={add}><Target/> هدف جدید</button></div><div className="grid two">{goals.map((g:Goal)=>{const user=users.find((u:User)=>u.id===g.user_id);const done=g.metric==='tasks_done'?tasks.filter((t:Task)=>(!g.user_id||t.assigned_to===g.user_id)&&t.status==='انجام شد').length:activities.filter((a:TaskActivity)=>(!g.user_id||a.assigned_to===g.user_id)&&a.is_done).length;return <article className="card" key={g.id}><div className="sectionTitle"><h3>{g.title}</h3><small>{user?.full_name||'همه کاربران'}</small></div><Progress value={(done/Math.max(1,g.target_count))*100}/><p>{done} از {g.target_count} • {faDate(g.start_date)} تا {faDate(g.end_date)}</p><div className="actions"><button className="btn ghost" onClick={()=>edit(g)}>ویرایش</button><button className="btn ghost dangerText" onClick={()=>remove(g.id)}>حذف</button></div></article>})}</div></div>}
function Projects({projects,users,tasks,edit,add,remove}:any){return <div><div className="pageHead"><div><h2>پروژه‌ها</h2><p className="muted">پروژه‌های چندکاربره و مشارکت تیمی</p></div><button className="btn primary" onClick={add}><FolderKanban/> پروژه جدید</button></div><div className="projectGrid">{projects.map((p:Project)=>{const ts=tasks.filter((t:Task)=>t.project_id===p.id);return <article className="card projectCard" key={p.id}><h3>{p.title}</h3><p>{p.description}</p><small>مالک: {users.find((u:User)=>u.id===p.owner_id)?.full_name||'—'} • {p.member_ids?.length||0} عضو</small><Progress value={(ts.filter((t:Task)=>t.status==='انجام شد').length/Math.max(1,ts.length))*100}/>{p.pinned_note&&<div className="pinned"><Pin size={14}/>{p.pinned_note}</div>}<div className="actions"><button className="btn ghost" onClick={()=>edit(p)}>ویرایش</button><button className="btn ghost dangerText" onClick={()=>remove(p.id)}>حذف</button></div></article>})}</div></div>}
function Notifications({notifs,request,markRead}:any){return <div><div className="pageHead"><div><h2>اعلان‌ها</h2><p className="muted">اعلان‌های داخلی و Chrome Notification</p></div><button className="btn primary" onClick={request}><Bell/> فعال‌سازی Chrome</button></div><div className="listCards">{notifs.map((n:Notif)=><article className={cn('card rowCard',!n.is_read&&'unread')} key={n.id}><Bell/><div><b>{n.title}</b><small>{faDateTime(n.created_at)}</small><p>{n.body}</p></div>{!n.is_read&&<button className="btn ghost" onClick={()=>markRead(n)}>خواندم</button>}</article>)}</div></div>}
function SettingsPage({settings,save,uploadFile,isSuperAdmin,actor}:any){
  const [s,setS]=useState<AppSettings>(settings);
  const [tab,setTab]=useState<'general'|'appearance'|'workflow'|'data'>('general');
  const [uploading,setUploading]=useState('');
  const [deletePassword,setDeletePassword]=useState('');
  const [deletePassword2,setDeletePassword2]=useState('');
  const [securityMsg,setSecurityMsg]=useState('');
  const [resetPassword,setResetPassword]=useState('');
  const [resetPhrase,setResetPhrase]=useState('');
  const [resetBusy,setResetBusy]=useState(false);
  useEffect(()=>setS(settings),[settings]);
  async function up(kind:'logoUrl'|'faviconUrl',file?:File){if(!file)return;setUploading(kind);try{const url=await uploadFile(file);setS({...s,[kind]:url})}finally{setUploading('')}}
  async function saveDeletePassword(){if(!isSuperAdmin)return setSecurityMsg('فقط سوپر ادمین مجاز است');if(deletePassword.length<8)return setSecurityMsg('رمز باید حداقل ۸ کاراکتر باشد');if(deletePassword!==deletePassword2)return setSecurityMsg('تکرار رمز یکسان نیست');setSecurityMsg('در حال ذخیره...');try{const res=await fetch('/api/admin/delete-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:deletePassword,actor:{...actor,isSuperAdmin:true}})});const out=await res.json();if(!res.ok)throw new Error(out.error);setDeletePassword('');setDeletePassword2('');setSecurityMsg('رمز حذف کامل با موفقیت تغییر کرد')}catch(e:any){setSecurityMsg(e.message||'خطا در ذخیره رمز')}}
  async function resetOperationalData(){if(!isSuperAdmin)return;if(resetPhrase!=='پاکسازی کامل')return setSecurityMsg('عبارت «پاکسازی کامل» را دقیق وارد کن');if(!resetPassword)return setSecurityMsg('رمز حذف کامل را وارد کن');if(!confirm('تمام اطلاعات عملیاتی و پرونده هتل‌ها پاک شود؟ کاربران، نقش‌ها و تنظیمات حفظ می‌شوند.'))return;setResetBusy(true);setSecurityMsg('در حال پاک‌سازی اطلاعات...');try{const res=await fetch('/api/admin/reset-operational-data',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:resetPassword,actor:{...actor,isSuperAdmin:true}})});const out=await res.json();if(!res.ok)throw new Error(out.error);setSecurityMsg(`پاک‌سازی انجام شد؛ ${(out.deleted||0).toLocaleString('fa-IR')} رکورد حذف شد`);setResetPassword('');setResetPhrase('');sessionStorage.clear();setTimeout(()=>location.reload(),1400)}catch(e:any){setSecurityMsg(e.message||'خطا در پاک‌سازی')}finally{setResetBusy(false)}}
  const tabs=[['general','عمومی',Settings],['appearance','ظاهر و برند',Palette],['workflow','جریان کار',SlidersHorizontal],...(isSuperAdmin?[['data','مدیریت داده',Database]]:[])] as any[];
  return <div className="settingsV15">
    <div className="pageHead"><div><span className="sectionEyebrow">SYSTEM CONFIGURATION</span><h2>تنظیمات سیستم</h2><p className="muted">تنظیمات به بخش‌های روشن و قابل‌دسترسی تقسیم شده‌اند.</p></div><button className="btn primary" onClick={()=>save(s)}><Save/> ذخیره تغییرات</button></div>
    <nav className="settingsTabsV15">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon/>{label}{id==='data'&&<span>سوپر ادمین</span>}</button>)}</nav>
    {tab==='general'&&<div className="settingsLayoutV15"><section className="settingsCardV15"><header><Settings/><div><h3>اطلاعات سازمان</h3><p>نام و توضیحی که در نوار کناری و صفحه ورود دیده می‌شود.</p></div></header><div className="form"><Field label="نام سازمان" value={s.orgName} onChange={(v:string)=>setS({...s,orgName:v})}/><Field label="زیرعنوان سیستم" value={s.appSubtitle} onChange={(v:string)=>setS({...s,appSubtitle:v})}/></div></section><section className="settingsCardV15"><header><Bell/><div><h3>اعلان‌ها و ماژول‌ها</h3><p>قابلیت‌های عمومی قابل استفاده برای تیم.</p></div></header><label className="settingToggleV15"><input type="checkbox" checked={s.notifications} onChange={e=>setS({...s,notifications:e.target.checked})}/><i/><span><b>اعلان مرورگر</b><small>یادآوری‌ها و تسک‌های جدید را نمایش بده</small></span></label><label className="settingToggleV15"><input type="checkbox" checked={s.documentsEnabled} onChange={e=>setS({...s,documentsEnabled:e.target.checked})}/><i/><span><b>ماژول اسناد</b><small>مدیریت قرارداد و مستندات فعال باشد</small></span></label></section></div>}
    {tab==='appearance'&&<div className="settingsLayoutV15"><section className="settingsCardV15"><header><Palette/><div><h3>تم و رنگ سازمانی</h3><p>تغییرات تم پس از ذخیره در کل سیستم اعمال می‌شوند.</p></div></header><div className="form"><Field label="رنگ برند" type="color" value={s.brandColor} onChange={(v:string)=>setS({...s,brandColor:v})}/><label>حالت نمایش</label><select value={s.theme} onChange={e=>setS({...s,theme:e.target.value as any})}><option value="light">روشن</option><option value="dark">تیره</option><option value="system">هماهنگ با سیستم</option></select></div><div className="themePreviewV15"><span style={{background:s.brandColor}}/><div><b>پیش‌نمایش رنگ برند</b><small>{s.theme==='dark'?'حالت تیره':s.theme==='light'?'حالت روشن':'حالت سیستمی'}</small></div></div></section><section className="settingsCardV15"><header><Upload/><div><h3>لوگو و آیکون</h3><p>فایل‌های سبک PNG، SVG یا ICO پیشنهاد می‌شود.</p></div></header><div className="brandUploadGridV15"><label><span>لوگوی سازمان</span><input type="file" accept="image/*" onChange={e=>up('logoUrl',e.target.files?.[0])}/>{s.logoUrl?<img src={s.logoUrl}/>:<div>IH</div>}<small>{uploading==='logoUrl'?'در حال آپلود...':'انتخاب فایل'}</small></label><label><span>Favicon</span><input type="file" accept="image/*,.ico" onChange={e=>up('faviconUrl',e.target.files?.[0])}/>{s.faviconUrl?<img src={s.faviconUrl}/>:<div>IH</div>}<small>{uploading==='faviconUrl'?'در حال آپلود...':'انتخاب فایل'}</small></label></div></section></div>}
    {tab==='workflow'&&<div className="settingsLayoutV15"><section className="settingsCardV15 wide"><header><ListChecks/><div><h3>پیش‌فرض‌های تسک</h3><p>مقادیر اولیه هنگام ایجاد یک تسک جدید.</p></div></header><div className="form"><Field label="اولویت پیش‌فرض" value={s.defaultPriority} onChange={(v:string)=>setS({...s,defaultPriority:v})}/><Field label="وضعیت پیش‌فرض" value={s.defaultTaskStatus} onChange={(v:string)=>setS({...s,defaultTaskStatus:v})}/><div className="full"><label>دسته‌بندی تسک‌ها</label><textarea value={s.taskCategories} onChange={e=>setS({...s,taskCategories:e.target.value})}/></div><div className="full"><label>وضعیت‌های جریان کار</label><textarea value={s.taskStatuses} onChange={e=>setS({...s,taskStatuses:e.target.value})}/></div><div className="full"><label>برچسب‌ها</label><textarea value={s.labels} onChange={e=>setS({...s,labels:e.target.value})}/></div><div className="full"><label>نوع اسناد</label><textarea value={s.contractTypes} onChange={e=>setS({...s,contractTypes:e.target.value})}/></div></div></section></div>}
    {tab==='data'&&isSuperAdmin&&<div className="dataSettingsV15"><section className="settingsCardV15"><header><KeyRound/><div><h3>رمز پاک‌سازی کامل</h3><p>این رمز فقط برای حذف تمام داده‌های یک ماژول یا پروژه استفاده می‌شود.</p></div></header><div className="form"><Field label="رمز جدید" type="password" value={deletePassword} onChange={setDeletePassword}/><Field label="تکرار رمز" type="password" value={deletePassword2} onChange={setDeletePassword2}/><button className="btn ghost full" onClick={saveDeletePassword}><KeyRound/> تغییر رمز حذف کامل</button></div></section><section className="dangerZoneV15"><div className="dangerZoneTitleV15"><Trash2/><div><span>DANGER ZONE</span><h3>پاک‌سازی کامل دیتای فعلی</h3><p>پرونده هتل‌ها، آنلاین‌سازی، تسک‌ها، یادآورها، اسناد و داده‌های عملیاتی حذف می‌شوند. کاربران، نقش‌ها و تنظیمات باقی می‌مانند.</p></div></div><div className="form"><Field label="عبارت تأیید: پاکسازی کامل" value={resetPhrase} onChange={setResetPhrase}/><Field label="رمز حذف کامل" type="password" value={resetPassword} onChange={setResetPassword}/><button className="btn danger full" disabled={resetBusy} onClick={resetOperationalData}>{resetBusy?'در حال پاک‌سازی...':'پاک کردن تمام دیتای فعلی'}</button></div></section></div>}
    {securityMsg&&<div className="notice settingsNoticeV15">{securityMsg}</div>}
  </div>
}

function OpsModule({kind,me,tasks,hotels,users,logs,reminders,activities,saveTask,openTask,setView}:any){
  const todayTasks=tasks.filter((t:Task)=>t.assigned_to===me?.id && (!t.deadline || t.deadline<=today()) && t.status!=='انجام شد');
  const overdue=tasks.filter((t:Task)=>t.deadline && t.deadline<today() && t.status!=='انجام شد');
  const doneToday=tasks.filter((t:Task)=>t.status==='انجام شد' && (t.completed_at||'').slice(0,10)===today());
  const riskyHotels=hotels.map((h:HotelT)=>({h, score:(Number(h.capacity_total||0)>0?30:0)+((h.contract_status||'').includes('فعال')?30:8)+(tasks.filter((t:Task)=>t.hotel_id===h.id&&t.status!=='انجام شد').length===0?30:10)+((h.provider||'')?10:0)})).filter((x:any)=>x.score<70).sort((a:any,b:any)=>a.score-b.score);
  const activityByUser=users.map((u:User)=>({u, count:logs.filter((l:ActivityLog)=>l.user_id===u.id).length, done:tasks.filter((t:Task)=>t.assigned_to===u.id&&t.status==='انجام شد').length, open:tasks.filter((t:Task)=>t.assigned_to===u.id&&t.status!=='انجام شد').length})).sort((a:any,b:any)=>b.count-a.count);
  const titleMap:any={inbox:'میزکار عملیاتی من',executive:'Executive Dashboard',riskRadar:'Hotel Risk Radar',approvals:'مرکز تایید و Review',sla:'SLA و زمان استاندارد',playbooks:'فرایندهای استاندارد کاری',messages:'پیام داخلی و Mention',contracts:'مدیریت قرارداد واقعی',communications:'ارتباطات هتل',savedViews:'نماهای کاری',bulkActions:'عملیات گروهی',aiAssistant:'AI Assistant داخلی',dailyReport:'گزارش روزانه خودکار'};
  if(kind==='inbox') return <div><div className="pageHead"><div><h2>{titleMap[kind]}</h2><p className="muted">تمرکز امروز، بدون مسیرهای تکراری</p></div></div><div className="grid kpis"><K title="تسک‌های امروز" val={todayTasks.length} icon={ClipboardList}/><K title="عقب‌افتاده" val={overdue.filter((t:Task)=>t.assigned_to===me?.id).length} icon={Clock3}/><K title="یادآور باز" val={reminders.filter((r:Reminder)=>!r.is_done&&(r.user_id===me?.id||!r.user_id)).length} icon={AlarmClock}/><K title="انجام‌شده امروز" val={doneToday.filter((t:Task)=>t.assigned_to===me?.id).length} icon={CheckCircle2}/></div><div className="grid two"><div className="card"><h3>اولویت امروز</h3>{todayTasks.map((t:Task)=><ActionRow key={t.id} t={t} openTask={openTask}/>)}</div><div className="card"><h3>نیازمند توجه</h3>{overdue.slice(0,8).map((t:Task)=><ActionRow key={t.id} t={t} openTask={openTask}/>)}</div></div></div>;
  if(kind==='executive') return <div><div className="pageHead"><h2>{titleMap[kind]}</h2><button className="btn ghost" onClick={()=>csv(tasks,'executive-tasks.csv')}><Download/> خروجی</button></div><div className="grid kpis"><K title="کل هتل‌ها" val={hotels.length} icon={Hotel}/><K title="هتل‌های پرریسک" val={riskyHotels.length} icon={Flag}/><K title="تسک باز" val={tasks.filter((t:Task)=>t.status!=='انجام شد').length} icon={ListChecks}/><K title="SLA Miss" val={overdue.length} icon={Clock3}/></div><div className="grid two"><ActivityChart logs={logs} users={users}/><div className="card"><h3>Leaderboard تیم</h3>{activityByUser.map((x:any)=><div className="smartRow" key={x.u.id}><span>{x.u.full_name}</span><Progress value={Math.min(100,x.count*10)}/><b>{x.count}</b></div>)}</div></div></div>;
  if(kind==='riskRadar') return <div><div className="pageHead"><h2>{titleMap[kind]}</h2><p className="muted">هتل‌هایی که ظرفیت، قرارداد، Provider یا پیگیری آن‌ها نیاز به توجه دارد.</p></div><div className="riskGrid">{riskyHotels.map((x:any)=><div className="card riskCard" key={x.h.id}><div><h3>{x.h.title}</h3><p>{x.h.city} • {x.h.provider||'بدون Provider'}</p></div><Progress value={x.score}/><div className="chips"><Badge text={x.score<45?'بحرانی':'نیازمند پیگیری'}/><span className="chip">ظرفیت: {x.h.capacity_total||0}</span><span className="chip">قرارداد: {x.h.contract_status||'—'}</span></div><button className="btn primary" onClick={()=>setView('tasks')}><Plus/> ساخت تسک پیگیری</button></div>)}</div></div>;
  if(kind==='approvals') return <WorkflowModule tasks={tasks} saveTask={saveTask} openTask={openTask}/>;
  if(kind==='sla') return <SlaModule tasks={tasks} activities={activities}/>;
  if(kind==='playbooks') return <PlaybookModule/>;
  if(kind==='messages') return <MessageModule users={users} me={me}/>;
  if(kind==='contracts') return <ContractsModule hotels={hotels}/>;
  if(kind==='communications') return <CommunicationsModule hotels={hotels} users={users}/>;
  if(kind==='savedViews') return <SavedViewsModule setView={setView}/>;
  if(kind==='bulkActions') return <BulkActionsModule tasks={tasks} users={users} saveTask={saveTask}/>;
  if(kind==='aiAssistant') return <AIAssistantModule tasks={tasks} hotels={hotels} setView={setView}/>;
  if(kind==='dailyReport') return <DailyReportModule tasks={tasks} hotels={hotels} users={users} logs={logs}/>;
  return <div className="card"><h2>{titleMap[kind]}</h2><p>ماژول آماده استفاده است.</p></div>;
}
function ActionRow({t,openTask}:any){return <div className="actionRow"><div><b>{t.title}</b><small>{t.hotel_title||'بدون هتل'} • {faDate(t.deadline)} {t.due_time||''}</small></div><Badge text={t.priority}/><button className="btn ghost" onClick={()=>openTask(t)}>جزئیات</button></div>}
function WorkflowModule({tasks,saveTask,openTask}:any){const waiting=tasks.filter((t:Task)=>['ارسال برای تایید','نیازمند تایید','Review'].includes(t.status));return <div><div className="pageHead"><h2>مرکز تایید و Review</h2></div><div className="grid two"><div className="card"><h3>ارسال‌شده برای تایید</h3>{waiting.map((t:Task)=><ActionRow key={t.id} t={t} openTask={openTask}/>)}</div><div className="card"><h3>Workflow استاندارد</h3>{['در انتظار انجام','در حال انجام','ارسال برای تایید','نیازمند اصلاح','تایید شده','بسته شده'].map((s,i)=><div className="processStep" key={s}><b>{i+1}</b><span>{s}</span></div>)}</div></div></div>}
function SlaModule({tasks,activities}:any){const rules=[['دریافت ظرفیت',2],['اصلاح قیمت',1],['پیگیری قرارداد',24],['دریافت عکس',72],['فعال‌سازی پنل',24]];return <div><div className="pageHead"><h2>SLA و زمان استاندارد</h2></div><div className="grid two"><div className="card"><h3>قوانین SLA</h3>{rules.map(r=><div className="smartRow" key={r[0]}><span>{r[0]}</span><b>{r[1]} ساعت</b></div>)}</div><div className="card"><h3>تسک‌های خارج از SLA</h3>{tasks.filter((t:Task)=>t.deadline&&t.deadline<today()&&t.status!=='انجام شد').slice(0,10).map((t:Task)=><ActionRow key={t.id} t={t} openTask={()=>{}}/> )}</div></div></div>}
function PlaybookModule(){const pb:any={'فعال‌سازی پنل':['تماس با هتل','معرفی پنل','ارسال دسترسی','آموزش اولیه','تست ورود','تأیید نهایی'],'تمدید قرارداد':['بررسی قرارداد قبلی','ارسال نسخه جدید','پیگیری امضا','دریافت نسخه مهرشده','آپلود قرارداد','اطلاع به مالی'],'دریافت موجودی آنلاین':['تماس با هتل','دریافت تاریخ‌های باز','دریافت نوع اتاق','ثبت در پنل','تست نمایش در سایت']};return <div><div className="pageHead"><div><h2>فرایندهای استاندارد کاری</h2><p className="muted">مراحل آماده و قابل‌تکرار برای انجام صحیح کارهای پرتکرار تیم</p></div></div><div className="grid three playbookGrid">{Object.keys(pb).map(k=><div className="card playbookCard" key={k}><div className="playbookTitle"><FolderKanban/><div><h3>{k}</h3><small>{pb[k].length} مرحله</small></div></div>{pb[k].map((x:string,i:number)=><div className="processStep" key={x}><b>{i+1}</b><span>{x}</span></div>)}</div>)}</div></div>}
function MessageModule({users,me}:any){const [txt,setTxt]=useState('');return <div><div className="pageHead"><h2>پیام داخلی و Mention</h2></div><div className="card"><textarea placeholder="مثلاً: @فاطمه لطفاً ظرفیت آخر هفته را بگیر" value={txt} onChange={e=>setTxt(e.target.value)}/><div className="chips">{users.map((u:User)=><span className="chip" key={u.id}>@{u.full_name}</span>)}</div><button className="btn primary" onClick={()=>{toast('پیام داخلی ثبت شد و اعلان ارسال می‌شود')}}><Bell/> ارسال پیام</button></div></div>}
function ContractsModule({hotels}:any){
  const [all,setAll]=useState<HotelT[]>(hotels||[]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');
  const [mode,setMode]=useState<'all'|'risk'|'missing'>('all');
  const [page,setPage]=useState(1);
  const pageSize=30;
  useEffect(()=>{(async()=>{try{const db=await getSupabaseClient();if(!db)return;const out:HotelT[]=[];for(let from=0;;from+=1000){const{data,error}=await db.from('ihos_hotels').select('id,hotel_code,title,city,provider,contract_status,contract_date,status_end_date,cooperation_status,risk_status').range(from,from+999);if(error)throw error;out.push(...((data||[]) as HotelT[]));if(!data||data.length<1000)break}setAll(out)}catch{}finally{setLoading(false)}})()},[]);
  const todayIso=today();
  const riskDate=new Date(Date.now()+45*86400000).toISOString().slice(0,10);
  const cooperating=all.filter(h=>String(h.cooperation_status||'').includes('در حال همکاری'));
  const missing=cooperating.filter(h=>!h.contract_date);
  const risky=cooperating.filter(h=>{const end=dateToIso(h.status_end_date);return !h.contract_date||Boolean(end&&end>=todayIso&&end<=riskDate)||Boolean(h.risk_status&&!String(h.risk_status).includes('غیر ریسکی'))});
  const base=mode==='risk'?risky:mode==='missing'?missing:cooperating;
  const filtered=base.filter(h=>!q||`${h.title} ${h.hotel_code||''} ${h.city||''} ${h.provider||''}`.toLowerCase().includes(q.toLowerCase()));
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const rows=filtered.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>setPage(1),[q,mode]);
  return <div className="contractsV15"><div className="pageHead"><div><span className="sectionEyebrow">CONTRACT OPERATIONS</span><h2>مرکز قراردادها و ریسک</h2><p className="muted">یک نمای واحد برای قراردادهای فعال، ناقص و نزدیک به انقضا</p></div></div>
    <div className="contractMetricsV15"><article><FileCheck2/><div><span>هتل‌های در حال همکاری</span><b>{cooperating.length.toLocaleString('fa-IR')}</b></div></article><article className="warning"><ShieldAlert/><div><span>نیازمند پیگیری</span><b>{risky.length.toLocaleString('fa-IR')}</b></div></article><article className="danger"><FileText/><div><span>بدون اطلاعات قرارداد</span><b>{missing.length.toLocaleString('fa-IR')}</b></div></article></div>
    <div className="filterToolbarV15"><div className="searchV15"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="نام، کد یا شهر هتل..."/></div><div className="segV15"><button className={mode==='all'?'active':''} onClick={()=>setMode('all')}>همه</button><button className={mode==='risk'?'active':''} onClick={()=>setMode('risk')}>پرریسک <b>{risky.length.toLocaleString('fa-IR')}</b></button><button className={mode==='missing'?'active':''} onClick={()=>setMode('missing')}>ناقص <b>{missing.length.toLocaleString('fa-IR')}</b></button></div><span className="resultCountV15">{filtered.length.toLocaleString('fa-IR')} نتیجه</span></div>
    <div className="contractTableV15"><div className="contractTableHeadV15"><span>هتل</span><span>Provider</span><span>وضعیت قرارداد</span><span>تاریخ قرارداد</span><span>پایان وضعیت</span><span>ریسک</span></div>{rows.map(h=>{const risk=risky.some(x=>x.id===h.id);return <article key={h.id}><div><b>{h.title}</b><small>{h.hotel_code||'بدون کد'} · {h.city||'بدون شهر'}</small></div><span>{h.provider||'IHO Provider'}</span><span>{h.contract_date?'ثبت شده':'اطلاعات ناقص'}</span><span>{faDate(h.contract_date)}</span><span>{faDate(h.status_end_date)}</span><span className={risk?'contractRiskV15':'contractOkV15'}>{!h.contract_date?'فاقد تاریخ قرارداد':risk?'نیازمند بررسی':'عادی'}</span></article>})}</div>
    {loading&&<div className="loadingLineV15"><RefreshCw className="spin"/> در حال دریافت همه قراردادها...</div>}
    <div className="paginationV15"><button disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronRight/></button><span>صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}</span><button disabled={page>=pages} onClick={()=>setPage(page+1)}><ChevronLeft/></button></div>
  </div>
}

function CommunicationsModule({hotels,users}:any){return <div><div className="pageHead"><h2>ارتباطات هتل</h2></div><div className="grid two"><div className="card"><h3>ثبت ارتباط سریع</h3><select>{hotels.map((h:HotelT)=><option key={h.id}>{h.title}</option>)}</select><select><option>تماس</option><option>پیامک</option><option>بله</option><option>تلگرام</option><option>جلسه حضوری</option></select><textarea placeholder="نتیجه مکالمه"/><button className="btn primary" onClick={()=>toast('ارتباط در Timeline هتل ثبت شد')}>ثبت ارتباط</button></div><div className="card"><h3>آخرین ارتباطات</h3>{hotels.slice(0,6).map((h:HotelT)=><div className="smartRow" key={h.id}><span>{h.title}</span><small>آخرین تماس: امروز</small></div>)}</div></div></div>}
function SavedViewsModule({setView}:any){
  const views=[
    {title:'تسک‌های عملیاتی',desc:'کانبان تسک‌ها، اولویت‌ها و وضعیت انجام',target:'tasks',icon:ListChecks,tone:'blue'},
    {title:'سوپر اپ هتل',desc:'پرونده، آنلاین‌سازی، Provider و کارشناسان',target:'hotelSuperApp',icon:Hotel,tone:'cyan'},
    {title:'قراردادها و ریسک',desc:'قراردادهای فعال، ناقص و نزدیک به انقضا',target:'contracts',icon:FileCheck2,tone:'orange'},
    {title:'یادآورها و تقویم',desc:'موعدهای شخصی و پیگیری‌های زمان‌دار',target:'reminders',icon:AlarmClock,tone:'purple'},
    {title:'مرکز اسناد',desc:'قراردادها، الحاقیه‌ها و فایل‌های هتل',target:'documents',icon:FolderOpen,tone:'green'},
    {title:'گزارش‌های مدیریتی',desc:'عملکرد تیم، تسک‌ها و خروجی‌های قابل دانلود',target:'reports',icon:Activity,tone:'red'}
  ];
  return <div className="savedViewsV15"><div className="pageHead"><div><span className="sectionEyebrow">QUICK WORKSPACES</span><h2>نماهای کاری ذخیره‌شده</h2><p className="muted">میانبرهای مرتب برای رفتن به پرکاربردترین بخش‌های سیستم</p></div></div><div className="savedViewGridV15">{views.map(v=>{const Icon=v.icon;return <button className={`savedViewCardV15 ${v.tone}`} key={v.title} onClick={()=>setView(v.target as any)}><span className="savedViewIconV15"><Icon/></span><div><span>نمای آماده</span><h3>{v.title}</h3><p>{v.desc}</p></div><ArrowLeft/></button>})}</div></div>
}

function BulkActionsModule({tasks,users,saveTask}:any){
  const [q,setQ]=useState('');
  const [status,setStatus]=useState('all');
  const [selected,setSelected]=useState<string[]>([]);
  const [assignee,setAssignee]=useState('');
  const [priority,setPriority]=useState('');
  const [nextStatus,setNextStatus]=useState('');
  const [working,setWorking]=useState(false);
  const taskStatuses:string[]=Array.from(new Set<string>(tasks.map((t:Task)=>String(t.status||'بدون وضعیت'))));
  const rows=tasks.filter((t:Task)=>(!q||`${t.title} ${t.hotel_title||''} ${t.assigned_name||''}`.toLowerCase().includes(q.toLowerCase()))&&(status==='all'||t.status===status)).slice(0,100);
  const allVisible=rows.length>0&&rows.every((t:Task)=>selected.includes(t.id));
  function toggle(id:string){setSelected(selected.includes(id)?selected.filter(x=>x!==id):[...selected,id])}
  async function apply(){if(!selected.length)return toast('حداقل یک تسک را انتخاب کن');setWorking(true);try{const u=users.find((x:User)=>x.id===assignee);for(const t of tasks.filter((x:Task)=>selected.includes(x.id))){await saveTask({...t,priority:priority||t.priority,status:nextStatus||t.status,assigned_to:u?.id||t.assigned_to,assigned_name:u?.full_name||t.assigned_name})}toast(`تغییرات روی ${selected.length.toLocaleString('fa-IR')} تسک اعمال شد`);setSelected([])}finally{setWorking(false)}}
  return <div className="bulkV15"><div className="pageHead"><div><span className="sectionEyebrow">BULK OPERATIONS</span><h2>عملیات گروهی تسک‌ها</h2><p className="muted">تسک‌های مشخص را انتخاب و تغییرات را فقط روی همان موارد اعمال کن.</p></div><span className="selectionBadgeV15">{selected.length.toLocaleString('fa-IR')} انتخاب‌شده</span></div>
    <div className="bulkActionBarV15"><div className="searchV15"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجوی تسک یا هتل..."/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">همه وضعیت‌ها</option>{taskStatuses.map((x:string)=><option key={x}>{x}</option>)}</select><button className="btn ghost" onClick={()=>setSelected(allVisible?selected.filter(id=>!rows.some((r:Task)=>r.id===id)):[...new Set([...selected,...rows.map((r:Task)=>r.id)])])}>{allVisible?<CheckSquare/>:<Square/>}{allVisible?'لغو انتخاب صفحه':'انتخاب همه صفحه'}</button></div>
    <section className="bulkWorkspaceV15"><aside className="bulkEditorV15"><header><SlidersHorizontal/><div><h3>تغییرات گروهی</h3><p>فیلد خالی، مقدار فعلی را حفظ می‌کند.</p></div></header><label>مسئول جدید</label><select value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">بدون تغییر</option>{users.filter((u:User)=>u.is_active).map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><label>اولویت</label><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="">بدون تغییر</option><option>فوری</option><option>بالا</option><option>متوسط</option><option>پایین</option></select><label>وضعیت جدید</label><select value={nextStatus} onChange={e=>setNextStatus(e.target.value)}><option value="">بدون تغییر</option>{taskStatuses.map((x:string)=><option key={x}>{x}</option>)}</select><button className="btn primary full" disabled={!selected.length||working} onClick={apply}>{working?'در حال اعمال تغییرات...':`اعمال روی ${selected.length.toLocaleString('fa-IR')} تسک`}</button><button className="btn ghost full" onClick={()=>setSelected([])}>پاک کردن انتخاب‌ها</button></aside><div className="bulkTableV15"><div className="bulkTableHeadV15"><span/><span>تسک</span><span>مسئول</span><span>وضعیت</span><span>اولویت</span><span>موعد</span></div>{rows.map((t:Task)=><label className={selected.includes(t.id)?'selected':''} key={t.id}><input type="checkbox" checked={selected.includes(t.id)} onChange={()=>toggle(t.id)}/><div><b>{t.title}</b><small>{t.hotel_title||'بدون هتل'}</small></div><span>{t.assigned_name||'بدون مسئول'}</span><span>{t.status}</span><Badge text={t.priority}/><span>{faDate(t.deadline)}</span></label>)}{!rows.length&&<div className="emptyV15"><Filter/><h3>تسکی مطابق فیلتر پیدا نشد</h3></div>}</div></section>
  </div>
}

function AIAssistantModule({tasks,hotels,setView}:any){const [q,setQ]=useState(''),[ans,setAns]=useState('');function run(){const noCap=hotels.filter((h:HotelT)=>Number(h.capacity_total||0)===0).length;const over=tasks.filter((t:Task)=>t.deadline&&t.deadline<today()&&t.status!=='انجام شد').length;setAns(`تحلیل سریع: ${noCap} هتل بدون ظرفیت شناسایی شد و ${over} تسک عقب‌افتاده وجود دارد. پیشنهاد: برای هتل‌های بدون ظرفیت، تسک فوری با Playbook دریافت ظرفیت بساز.`)}return <div><div className="pageHead"><h2>AI Assistant داخلی</h2></div><div className="card aiBox"><textarea placeholder="مثلاً: کدام هتل‌ها بیشترین ریسک را دارند؟" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn primary" onClick={run}><Sparkles/> تحلیل کن</button>{ans&&<div className="notice">{ans}</div>}<button className="btn ghost" onClick={()=>setView('riskRadar')}>رفتن به هتل‌های پرریسک</button></div></div>}
function DailyReportModule({tasks,hotels,users,logs}:any){const report={done:tasks.filter((t:Task)=>t.status==='انجام شد').length,over:tasks.filter((t:Task)=>t.deadline&&t.deadline<today()&&t.status!=='انجام شد').length,hotels:hotels.length,logs:logs.length};return <div><div className="pageHead"><h2>گزارش روزانه خودکار</h2><button className="btn ghost" onClick={()=>navigator.clipboard?.writeText(JSON.stringify(report,null,2))}>کپی گزارش</button></div><div className="card reportCard"><h3>گزارش امروز تیم تأمین</h3><p>تسک‌های انجام‌شده: {report.done}</p><p>تسک‌های عقب‌افتاده: {report.over}</p><p>هتل‌های تحت پایش: {report.hotels}</p><p>فعالیت‌های ثبت‌شده: {report.logs}</p><p>کارشناس برتر: {users[0]?.full_name||'—'}</p></div></div>}
function Modal({title,children,close,className}:{title:string;children:any;close:()=>void;className?:string}){const titleId=useId();const dialogRef=useRef<HTMLDivElement>(null);useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const dialog=dialogRef.current;const originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog?.focus();const keydown=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close();return}if(event.key!=='Tab'||!dialog)return;const focusable=Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>!el.hasAttribute('hidden'));if(!focusable.length){event.preventDefault();return}const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};document.addEventListener('keydown',keydown);return()=>{document.removeEventListener('keydown',keydown);document.body.style.overflow=originalOverflow;previous?.focus()}},[]);return <div className="modalWrap" role="presentation"><div ref={dialogRef} className={cn('modal',className)} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><div className="modalHead"><div><span className="modalEyebrow">IRANHOTEL OPERATIONS</span><h2 id={titleId}>{title}</h2></div><button className="iconBtn" onClick={close} aria-label="بستن پنجره"><X/></button></div>{children}</div></div>}
function PersianDatePicker({label,value,onChange}:{label:string;value?:string;onChange:(v:string)=>void}){const [open,setOpen]=useState(false);const popoverId=useId();const j=toJalali(value||today());const [jy,setJy]=useState(j.jy),[jm,setJm]=useState(j.jm);const days=jalaliMonthLength(jy,jm),first=gDayIndexForJalali(jy,jm,1);function move(d:number){let m=jm+d,y=jy;if(m<1){m=12;y--}if(m>12){m=1;y++}setJm(m);setJy(y)}return <div className="dateWrap"><label>{label}</label><button type="button" className="dateInput" aria-haspopup="dialog" aria-expanded={open} aria-controls={popoverId} onClick={()=>setOpen(!open)}>{faDate(value)}<CalendarDays size={16}/></button>{open&&<div id={popoverId} className="popover" role="dialog" aria-label={`انتخاب ${label}`}><div className="calHead"><button type="button" aria-label="ماه قبل" onClick={()=>move(-1)}><ChevronRight/></button><b aria-live="polite">{jMonths[jm-1]} {jy}</b><button type="button" aria-label="ماه بعد" onClick={()=>move(1)}><ChevronLeft/></button></div><div className="dateGrid">{[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)].map((d,i)=><button type="button" key={i} disabled={!d} aria-label={d?`${d} ${jMonths[jm-1]} ${jy}`:undefined} aria-pressed={!!d&&value===toGregorianISO(jy,jm,d)} onClick={()=>{if(d){onChange(toGregorianISO(jy,jm,d));setOpen(false)}}}>{d}</button>)}</div></div>}</div>}
function MultiUsers({users,value,onChange}:{users:User[];value?:string[];onChange:(v:string[])=>void}){const vals=safeArr<string>(value);return <div className="multi">{users.filter(u=>u.is_active).map(u=><label key={u.id}><input type="checkbox" checked={vals.includes(u.id)} onChange={e=>onChange(e.target.checked?[...vals,u.id]:vals.filter(x=>x!==u.id))}/>{u.full_name}</label>)}</div>}
function HotelSearchPicker({value,onChange,seedHotels=[]}:any){
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [results,setResults]=useState<HotelT[]>([]);
  const listId=useId();
  const selected=[...seedHotels,...results].find((h:HotelT)=>h.id===value);
  useEffect(()=>{
    const timer=setTimeout(async()=>{
      if(!open)return;
      const term=query.trim();
      if(!term){setResults(seedHotels.slice(0,12));return}
      setLoading(true);
      try{
        const db=await getSupabaseClient();
        if(db){
          const safe=term.replace(/[,%()]/g,' ');
          const {data,error}=await db.from('ihos_hotels').select('id,hotel_code,title,city,province,provider,grade').or(`title.ilike.%${safe}%,hotel_code.ilike.%${safe}%,city.ilike.%${safe}%`).limit(20);
          if(error)throw error;
          setResults(data||[]);
        }else{
          const q=term.toLowerCase();
          setResults(seedHotels.filter((h:HotelT)=>`${h.title} ${h.hotel_code||''} ${h.city||''}`.toLowerCase().includes(q)).slice(0,20));
        }
      }catch{
        const q=term.toLowerCase();
        setResults(seedHotels.filter((h:HotelT)=>`${h.title} ${h.hotel_code||''} ${h.city||''}`.toLowerCase().includes(q)).slice(0,20));
      }finally{setLoading(false)}
    },260);
    return()=>clearTimeout(timer)
  },[query,open,seedHotels]);
  function pick(h?:HotelT){onChange(h);setOpen(false);setQuery('')}
  return <div className="hotelPicker">
    <button type="button" className={cn('hotelPickerTrigger',open&&'active')} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onClick={()=>setOpen(!open)}>
      <span className="hotelPickerIcon"><Hotel size={20}/></span>
      <span className="hotelPickerText">{selected?<><b>{selected.title}</b><small>{selected.hotel_code||'بدون کد'} • {selected.city||'بدون شهر'} • {selected.provider||'بدون Provider'}</small></>:<><b>انتخاب هتل</b><small>جستجو با نام، کد هتل یا شهر</small></>}</span>
      <Search size={18}/>
    </button>
    {open&&<div className="hotelPickerPanel">
      <div className="hotelPickerSearch"><Search aria-hidden="true" size={18}/><input autoFocus aria-label="جستجوی هتل" role="combobox" aria-expanded="true" aria-controls={listId} value={query} onChange={e=>setQuery(e.target.value)} placeholder="مثلاً درویشی، 1025 یا مشهد..."/></div>
      <div id={listId} className="hotelPickerResults" role="listbox" aria-label="نتایج جستجوی هتل">
        <button type="button" role="option" aria-selected={!value} className="hotelResult empty" onClick={()=>pick(undefined)}><span className="hotelResultAvatar">—</span><span><b>بدون هتل</b><small>تسک عمومی و بدون ارتباط با هتل</small></span></button>
        {loading&&<div className="hotelPickerLoading" role="status"><RefreshCw className="spin" size={18}/> در حال جستجو در تمام هتل‌ها...</div>}
        {!loading&&results.map(h=><button type="button" role="option" aria-selected={h.id===value} className={cn('hotelResult',h.id===value&&'selected')} key={h.id} onClick={()=>pick(h)}><span className="hotelResultAvatar">{h.title?.slice(0,1)||'H'}</span><span><b>{h.title}</b><small>{h.hotel_code||'بدون کد'} • {h.city||'بدون شهر'} • {h.provider||'بدون Provider'}</small></span>{h.id===value&&<CheckCircle2 aria-hidden="true" size={18}/>}</button>)}
        {!loading&&query&&results.length===0&&<div className="hotelPickerEmpty" role="status">هتلی پیدا نشد. نام یا کد دیگری امتحان کن.</div>}
      </div>
    </div>}
  </div>
}
function TaskModal({task,users,hotels,projects,settings,labels,statuses,categories,activities,close,save}:any){
  const [t,setT]=useState<Task>(task||{id:uid(),title:'',description:'',priority:settings.defaultPriority,status:settings.defaultTaskStatus,category:categories[0]||'پیگیری',deadline:today(),due_time:'12:00',labels:[],collaborator_ids:[],created_at:nowIso()});
  const [acts,setActs]=useState<TaskActivity[]>(activities?.length?activities:[]);
  const [newAct,setNewAct]=useState('');
  const [remDate,setRemDate]=useState(''),[remTime,setRemTime]=useState('09:00');
  const [saving,setSaving]=useState(false);
  const [slaHint,setSlaHint]=useState<string>('');
  useEffect(()=>{if(task)return;(async()=>{try{const db=await getSupabaseClient();if(!db)return;const {data}=await db.from('ihos_sla_rules').select('*').eq('active',true).or(`category.eq.${t.category},task_type.eq.${t.category}`).order('sla_hours',{ascending:true}).limit(1);const rule=data?.[0];if(!rule)return;const due=new Date(Date.now()+Number(rule.sla_hours||24)*3600000);setT(x=>({...x,deadline:due.toISOString().slice(0,10),due_time:`${String(due.getHours()).padStart(2,'0')}:${String(due.getMinutes()).padStart(2,'0')}`}));setSlaHint(`SLA پیشنهادی: ${rule.sla_hours} ساعت`)}catch{}})()},[t.category]);
  function setHotel(h?:HotelT){setT({...t,hotel_id:h?.id,hotel_title:h?.title,city:h?.city})}
  function setUser(id:string){const u=users.find((x:User)=>x.id===id);setT({...t,assigned_to:id,assigned_name:u?.full_name})}
  function addAct(){if(!newAct.trim())return;setActs([{id:uid(),task_id:t.id,title:newAct.trim(),is_done:false,due_date:t.deadline,due_time:t.due_time,assigned_to:t.assigned_to,created_at:nowIso()},...acts]);setNewAct('')}
  function toggleLabel(l:string){const arr=safeArr<string>(t.labels);setT({...t,labels:arr.includes(l)?arr.filter(x=>x!==l):[...arr,l]})}
  async function submit(){if(!t.title.trim()){toast('عنوان تسک را وارد کن');return}setSaving(true);try{await save(t,acts,remDate?{notify_at:`${remDate}T${remTime}:00`,title:`یادآوری: ${t.title}`}:undefined)}finally{setSaving(false)}}
  return <Modal title={task?'ویرایش و مدیریت تسک':'ایجاد تسک جدید'} close={close} className="taskComposerModal">
    <div className="taskComposer">
      <section className="taskComposerMain">
        <div className="taskIntro">
          <span className="taskIntroIcon"><ClipboardList/></span>
          <div><h3>جزئیات اصلی تسک</h3><p>عنوان واضح، هتل مرتبط و مسئول اجرا را مشخص کن.</p></div>
        </div>
        <div className="taskTitleField"><label>عنوان تسک <i>*</i></label><input autoFocus value={t.title} onChange={e=>setT({...t,title:e.target.value})} placeholder="مثلاً دریافت ظرفیت آخر هفته هتل..."/></div>
        <div className="taskField"><label>هتل مرتبط</label><HotelSearchPicker value={t.hotel_id} onChange={setHotel} seedHotels={hotels}/></div>
        <div className="taskGrid2">
          <div className="taskField"><label>مسئول اصلی</label><select value={t.assigned_to||''} onChange={e=>setUser(e.target.value)}><option value="">انتخاب مسئول</option>{users.filter((u:User)=>u.is_active).map((u:User)=><option key={u.id} value={u.id}>{u.full_name} — {u.team||u.role}</option>)}</select></div>
          <div className="taskField"><label>پروژه</label><select value={t.project_id||''} onChange={e=>setT({...t,project_id:e.target.value})}><option value="">بدون پروژه</option>{projects.map((p:Project)=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
          <div className="taskField"><label>دسته‌بندی {slaHint&&<small className="slaHintV17">{slaHint}</small>}</label><select value={t.category} onChange={e=>setT({...t,category:e.target.value})}>{categories.map((x:string)=><option key={x}>{x}</option>)}</select></div>
          <div className="taskField"><label>وضعیت</label><select value={t.status} onChange={e=>setT({...t,status:e.target.value})}>{statuses.map((x:string)=><option key={x}>{x}</option>)}</select></div>
        </div>
        <div className="taskField"><label>شرح و نتیجه مورد انتظار</label><textarea className="taskDescription" value={t.description||''} onChange={e=>setT({...t,description:e.target.value})} placeholder="شرح دقیق اقدام، اطلاعات موردنیاز و خروجی مورد انتظار را بنویس..."/></div>
        <div className="taskField"><label>همکاران مشارکت‌کننده</label><MultiUsers users={users} value={t.collaborator_ids} onChange={v=>setT({...t,collaborator_ids:v})}/></div>
        <div className="taskField"><label>برچسب‌ها</label><div className="chips taskLabelChips">{labels.map((l:string)=><button type="button" className={cn('chipBtn',safeArr<string>(t.labels).includes(l)&&'selected')} key={l} onClick={()=>toggleLabel(l)}>{l}</button>)}</div></div>
        <div className="taskSection activityEditor taskActivities"><div className="taskSectionHead"><div><h3>چک‌لیست فعالیت‌ها</h3><p>فعالیت‌های قابل اندازه‌گیری برای اجرای تسک</p></div><span>{Math.round(progressFor(t.id,acts))}٪</span></div><div className="addLine"><input aria-label="عنوان فعالیت جدید" value={newAct} onChange={e=>setNewAct(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addAct()} placeholder="یک فعالیت جدید بنویس..."/><button type="button" className="btn ghost" disabled={!newAct.trim()} onClick={addAct}><Plus/> افزودن</button></div>{acts.map(a=><div className="actItem" key={a.id}><input type="checkbox" aria-label={`وضعیت فعالیت ${a.title}`} checked={a.is_done} onChange={e=>setActs(acts.map(x=>x.id===a.id?{...x,is_done:e.target.checked,done_at:e.target.checked?nowIso():undefined,done_by:t.assigned_to}:x))}/><input aria-label="عنوان فعالیت" value={a.title} onChange={e=>setActs(acts.map(x=>x.id===a.id?{...x,title:e.target.value}:x))}/><input className="actMinutes" aria-label={`زمان تخمینی ${a.title} به دقیقه`} type="number" min="0" inputMode="numeric" value={a.estimated_minutes||0} onChange={e=>setActs(acts.map(x=>x.id===a.id?{...x,estimated_minutes:+e.target.value}:x))}/><button type="button" className="iconBtn dangerBtn" aria-label={`حذف فعالیت ${a.title}`} onClick={()=>setActs(acts.filter(x=>x.id!==a.id))}><Trash2 size={15}/></button></div>)}</div>
        <div className="taskField"><label>یادداشت پین‌شده مهم</label><textarea className="compactTextarea" value={t.pinned_note||''} onChange={e=>setT({...t,pinned_note:e.target.value})} placeholder="نکته‌ای که باید همیشه بالای تسک دیده شود..."/></div>
      </section>
      <aside className="taskComposerAside">
        <div className="taskSideCard"><h3><Clock3 size={18}/> زمان‌بندی</h3><PersianDatePicker label="ددلاین شمسی" value={t.deadline} onChange={v=>setT({...t,deadline:v})}/><Field label="ساعت ددلاین" type="time" value={t.due_time||''} onChange={(v:string)=>setT({...t,due_time:v})}/></div>
        <div className="taskSideCard"><h3><Flag size={18}/> اولویت</h3><div className="priorityPicker">{['فوری','بالا','متوسط','پایین'].map(x=><button type="button" key={x} className={cn('priorityOption',x,t.priority===x&&'selected')} onClick={()=>setT({...t,priority:x})}>{x}</button>)}</div></div>
        <div className="taskSideCard"><h3><AlarmClock size={18}/> یادآوری اختیاری</h3><PersianDatePicker label="روز یادآوری" value={remDate} onChange={setRemDate}/><Field label="ساعت یادآوری" type="time" value={remTime} onChange={setRemTime}/>{remDate&&<button type="button" className="linkBtn dangerText" onClick={()=>setRemDate('')}>حذف یادآوری</button>}</div>
        <div className="taskSideSummary"><span>هتل</span><b>{t.hotel_title||'بدون هتل'}</b><span>مسئول</span><b>{t.assigned_name||'تعیین نشده'}</b><span>ددلاین</span><b>{faDate(t.deadline)} — {t.due_time||'بدون ساعت'}</b></div>
      </aside>
    </div>
    <footer className="taskComposerFooter"><button type="button" className="btn ghost" onClick={close}>انصراف</button><button type="button" className="btn primary taskSaveBtn" disabled={saving||!t.title.trim()} onClick={submit}><Save/>{saving?'در حال ذخیره...':task?'ذخیره تغییرات':'ایجاد تسک'}</button></footer>
  </Modal>
}
function UserModal({user,roles,close,save}:any){const [u,setU]=useState<User>(user||{id:uid(),full_name:'',username:'',password_hash:'123456',role:'کارشناس',role_id:'role-expert',team:'',zone:'',mobile:'',email:'',is_active:true,created_at:nowIso()});function setRole(id:string){const r=roles.find((x:Role)=>x.id===id);setU({...u,role_id:id,role:r?.title||u.role})}return <Modal title={user?'ویرایش کاربر':'افزودن کاربر جدید'} close={close}><div className="form"><Field label="نام کامل" value={u.full_name} onChange={(v:string)=>setU({...u,full_name:v})}/><Field label="نام کاربری" value={u.username} onChange={(v:string)=>setU({...u,username:v})}/><Field label="رمز عبور" value={u.password_hash} onChange={(v:string)=>setU({...u,password_hash:v})}/><label>نقش</label><select value={u.role_id||''} onChange={e=>setRole(e.target.value)}>{roles.map((r:Role)=><option key={r.id} value={r.id}>{r.title}</option>)}</select><Field label="تیم" value={u.team} onChange={(v:string)=>setU({...u,team:v})}/><Field label="زون" value={u.zone} onChange={(v:string)=>setU({...u,zone:v})}/><Field label="موبایل" value={u.mobile} onChange={(v:string)=>setU({...u,mobile:v})}/><Field label="ایمیل" value={u.email} onChange={(v:string)=>setU({...u,email:v})}/><label><input type="checkbox" checked={u.is_active} onChange={e=>setU({...u,is_active:e.target.checked})}/> فعال</label><button className="btn primary full" onClick={()=>save(u)}><Save/> ذخیره کاربر</button></div></Modal>}
function RoleModal({role,close,save}:any){
  const [r,setR]=useState<Role>(role||{id:uid(),title:'',description:'',permissions:defaultPerms(false),created_at:nowIso()});
  const groups:[string,PermissionKey[]][]=[
    ['داشبورد و گزارش',['dashboard','inbox','executive','controlTower','reports','dailyReport','aiAssistant']],
    ['هتل و تأمین',['hotelSuperApp','crm360','hotels','hotels_import','hotelOwnership','contracts','communications','riskRadar']],
    ['تسک و جریان کار',['tasks','tasks_create','tasks_edit','tasks_delete','assignments','approvals','sla','playbooks','messages','reminders']],
    ['تیم و پروژه',['team','kpiCenter','roles','projects','goals','automations']],
    ['داده و سیستم',['documents','documents_upload','calendar','logs','savedViews','bulkActions','settings','notifications']]
  ];
  function setGroup(perms:PermissionKey[],checked:boolean){setR({...r,permissions:{...r.permissions,...Object.fromEntries(perms.map(p=>[p,checked]))}})}
  return <Modal title={role?'ویرایش نقش و دسترسی':'ایجاد نقش جدید'} close={close} className="roleModalV15"><div className="roleModalIntroV15"><Shield/><div><h3>تعریف نقش سازمانی</h3><p>دسترسی‌ها را براساس حوزه کاری انتخاب کن. نقش‌های سیستمی را با احتیاط تغییر بده.</p></div></div><div className="form roleIdentityV15"><Field label="عنوان نقش" value={r.title} onChange={(v:string)=>setR({...r,title:v})}/><Field label="توضیح کوتاه" value={r.description} onChange={(v:string)=>setR({...r,description:v})}/></div><div className="permissionGroupsV15">{groups.map(([title,perms])=>{const active=perms.filter(p=>!!r.permissions?.[p]).length;const all=active===perms.length;return <section key={title}><header><div><h4>{title}</h4><span>{active.toLocaleString('fa-IR')} از {perms.length.toLocaleString('fa-IR')} دسترسی فعال</span></div><button type="button" onClick={()=>setGroup(perms,!all)}>{all?'لغو همه':'انتخاب همه'}</button></header><div>{perms.map(p=><label className={r.permissions?.[p]?'active':''} key={p}><input type="checkbox" checked={!!r.permissions?.[p]} onChange={e=>setR({...r,permissions:{...r.permissions,[p]:e.target.checked}})}/><span>{r.permissions?.[p]?<CheckSquare/>:<Square/>}</span><b>{PERM_LABEL[p]}</b></label>)}</div></section>})}</div><div className="modalFooterV15"><button className="btn ghost" onClick={close}>انصراف</button><button className="btn primary" onClick={()=>save(r)}><Save/> ذخیره نقش و دسترسی‌ها</button></div></Modal>
}

function HotelModal({hotel,close,save}:any){const [h,setH]=useState<HotelT>(hotel||{id:uid(),title:'',city:'',province:'',status:'فعال',site_visible:true,search_visible:true,created_at:nowIso()});return <Modal title={hotel?'ویرایش هتل':'هتل جدید'} close={close}><div className="form"><Field label="کد هتل" value={h.hotel_code} onChange={(v:string)=>setH({...h,hotel_code:v})}/><Field label="نام هتل" value={h.title} onChange={(v:string)=>setH({...h,title:v})}/><Field label="استان" value={h.province} onChange={(v:string)=>setH({...h,province:v})}/><Field label="شهر" value={h.city} onChange={(v:string)=>setH({...h,city:v})}/><Field label="درجه" value={h.grade} onChange={(v:string)=>setH({...h,grade:v})}/><Field label="Provider" value={h.provider} onChange={(v:string)=>setH({...h,provider:v})}/><Field label="ظرفیت کلی" type="number" value={h.capacity_total||0} onChange={(v:string)=>setH({...h,capacity_total:+v})}/><Field label="تلفن" value={h.phone} onChange={(v:string)=>setH({...h,phone:v})}/><label><input type="checkbox" checked={!!h.site_visible} onChange={e=>setH({...h,site_visible:e.target.checked})}/> نمایش در سایت</label><label><input type="checkbox" checked={!!h.search_visible} onChange={e=>setH({...h,search_visible:e.target.checked})}/> نمایش در نتایج</label><button className="btn primary full" onClick={()=>save(h)}><Save/> ذخیره هتل</button></div></Modal>}
function EventModal({event,users,hotels,close,save}:any){const [e,setE]=useState<EventT>(event||{id:uid(),title:'',description:'',start_date:today(),color:'#2563eb',created_at:nowIso()});return <Modal title={event?'ویرایش رویداد':'رویداد تقویم'} close={close}><div className="form"><Field label="عنوان" value={e.title} onChange={(v:string)=>setE({...e,title:v})}/><PersianDatePicker label="تاریخ شمسی" value={e.start_date} onChange={v=>setE({...e,start_date:v})}/><label>کاربر مرتبط</label><select value={e.user_id||''} onChange={x=>setE({...e,user_id:x.target.value})}><option value="">بدون کاربر</option>{users.map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><label>هتل مرتبط</label><select value={e.hotel_id||''} onChange={x=>setE({...e,hotel_id:x.target.value})}><option value="">بدون هتل</option>{hotels.map((h:HotelT)=><option key={h.id} value={h.id}>{h.title}</option>)}</select><Field label="رنگ" type="color" value={e.color} onChange={(v:string)=>setE({...e,color:v})}/><div className="full"><label>توضیح</label><textarea value={e.description||''} onChange={x=>setE({...e,description:x.target.value})}/></div><button className="btn primary full" onClick={()=>save(e)}><Save/> ذخیره رویداد</button></div></Modal>}
function DocModal({doc,hotels,close,save,uploadFile}:any){
  const [d,setD]=useState<Doc>(doc||{id:uid(),title:'',type:'قرارداد',pinned:false,created_at:nowIso()});
  const [uploading,setUploading]=useState(false);
  const selectedHotel=hotels.find((h:HotelT)=>h.id===d.hotel_id);
  function setHotel(h?:HotelT){setD({...d,hotel_id:h?.id,hotel_title:h?.title})}
  return <Modal title={doc?'ویرایش سند':'افزودن سند یا قرارداد'} close={close} className="docModalV15"><div className="docModalLayoutV15"><section><div className="form"><Field label="عنوان سند" value={d.title} onChange={(v:string)=>setD({...d,title:v})}/><label>نوع سند</label><select value={d.type} onChange={e=>setD({...d,type:e.target.value})}>{['قرارداد','الحاقیه','تصویر','اکسل','نامه','صورتجلسه','سایر'].map(x=><option key={x}>{x}</option>)}</select><div className="full"><label>هتل مرتبط</label><HotelSearchPicker value={d.hotel_id} onChange={setHotel} seedHotels={hotels}/></div><label className="settingToggleV15 full"><input type="checkbox" checked={!!d.pinned} onChange={e=>setD({...d,pinned:e.target.checked})}/><i/><span><b>پین کردن سند</b><small>سند در بالای نتایج نمایش داده شود</small></span></label><div className="full"><label>یادداشت</label><textarea value={d.notes||''} onChange={e=>setD({...d,notes:e.target.value})} placeholder="توضیح یا نکته مرتبط با سند..."/></div></div></section><aside className="docUploadPanelV15"><Upload/><h3>{d.file_url?'فایل آماده است':'فایل را انتخاب کن'}</h3><p>{selectedHotel?`مرتبط با ${selectedHotel.title}`:'می‌توانی سند را بدون هتل نیز ذخیره کنی.'}</p><label className="btn ghost">{uploading?'در حال آپلود...':'انتخاب فایل'}<input type="file" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;setUploading(true);try{const url=await uploadFile(f);setD({...d,file_url:url,title:d.title||f.name})}finally{setUploading(false)}}}/></label>{d.file_url&&<a className="docUploadedV15" href={d.file_url} target="_blank" rel="noreferrer"><CheckCircle2/> فایل آپلود شد — مشاهده</a>}</aside></div><div className="modalFooterV15"><button className="btn ghost" onClick={close}>انصراف</button><button className="btn primary" disabled={uploading||!d.title} onClick={()=>save(d)}><Save/> ذخیره سند</button></div></Modal>
}

function ReminderModal({reminder,users,tasks,close,save}:any){const [r,setR]=useState<Reminder>(reminder||{id:uid(),title:'',body:'',notify_at:`${today()}T09:00:00`,is_done:false,is_sent:false,created_at:nowIso()});const [d,setD]=useState(r.notify_at?.slice(0,10)||today()),[tm,setTm]=useState(r.notify_at?.slice(11,16)||'09:00');return <Modal title="یادآور" close={close}><div className="form"><Field label="عنوان" value={r.title} onChange={(v:string)=>setR({...r,title:v})}/><label>کاربر</label><select value={r.user_id||''} onChange={e=>setR({...r,user_id:e.target.value})}><option value="">عمومی</option>{users.map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><label>تسک مرتبط</label><select value={r.task_id||''} onChange={e=>setR({...r,task_id:e.target.value})}><option value="">بدون تسک</option>{tasks.map((t:Task)=><option key={t.id} value={t.id}>{t.title}</option>)}</select><PersianDatePicker label="روز یادآوری" value={d} onChange={setD}/><Field label="ساعت" type="time" value={tm} onChange={setTm}/><div className="full"><label>متن</label><textarea value={r.body||''} onChange={e=>setR({...r,body:e.target.value})}/></div><button className="btn primary full" onClick={()=>save({...r,notify_at:`${d}T${tm}:00`})}><Save/> ذخیره یادآور</button></div></Modal>}
function AutomationModal({automation,users,categories,statuses,labels,close,save}:any){
  const [a,setA]=useState<Automation>(automation||{id:uid(),title:'',enabled:true,trigger_type:'hotel_no_capacity',action_type:'create_task',condition_days:45,max_per_run:25,task_template:'پیگیری {hotel}',created_at:nowIso()});
  return <Modal title={automation?'ویرایش قانون اتوماسیون':'قانون اتوماسیون جدید'} close={close} className="automationModalV18"><div className="form">
    <div className="full"><Field label="عنوان قانون" value={a.title} onChange={(v:string)=>setA({...a,title:v})}/></div>
    <label>شرط اجرا<select value={a.trigger_type} onChange={e=>setA({...a,trigger_type:e.target.value})}><option value="hotel_no_capacity">هتل بدون ظرفیت</option><option value="contract_expiring">قرارداد نزدیک پایان یا ناقص</option><option value="hotel_unassigned">هتل بدون مسئول</option><option value="task_overdue">تسک عقب‌افتاده</option><option value="task_created">تسک ایجادشده در ۲۴ ساعت اخیر</option></select></label>
    <label>حداکثر ساخت در هر اجرا<input type="number" min="1" max="100" value={a.max_per_run||25} onChange={e=>setA({...a,max_per_run:+e.target.value})}/></label>
    {a.trigger_type==='contract_expiring'&&<label>هشدار چند روز قبل<input type="number" min="1" max="365" value={a.condition_days||45} onChange={e=>setA({...a,condition_days:+e.target.value})}/></label>}
    <label>دسته تسک<select value={a.trigger_category||''} onChange={e=>setA({...a,trigger_category:e.target.value})}><option value="">براساس رویداد</option>{categories.map((c:string)=><option key={c}>{c}</option>)}</select></label>
    <div className="full"><Field label="قالب عنوان تسک — از {hotel} برای نام هتل استفاده کن" value={a.task_template||''} onChange={(v:string)=>setA({...a,task_template:v})}/></div>
    <label>مسئول تسک<select value={a.assign_to||''} onChange={e=>setA({...a,assign_to:e.target.value})}><option value="">بدون مسئول</option>{users.filter((u:User)=>u.is_active).map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select></label>
    <label>اولویت<select value={a.priority||'بالا'} onChange={e=>setA({...a,priority:e.target.value})}>{['فوری','بالا','متوسط','پایین'].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>وضعیت اولیه<select value={a.status||'جدید'} onChange={e=>setA({...a,status:e.target.value})}>{statuses.map((x:string)=><option key={x}>{x}</option>)}</select></label>
    <label>برچسب<select value={a.label||'اتوماسیون'} onChange={e=>setA({...a,label:e.target.value})}><option value="اتوماسیون">اتوماسیون</option>{labels.map((x:string)=><option key={x}>{x}</option>)}</select></label>
    <label className="settingToggleV15 full"><input type="checkbox" checked={a.enabled} onChange={e=>setA({...a,enabled:e.target.checked})}/><i/><span><b>قانون فعال باشد</b><small>قانون در اسکن و اجرای اتوماسیون شرکت کند</small></span></label>
    <button className="btn primary full" disabled={!a.title.trim()} onClick={()=>save({...a,action_type:'create_task'})}><Save/> ذخیره قانون اتوماسیون</button>
  </div></Modal>
}
function GoalModal({goal,users,categories,close,save}:any){const [g,setG]=useState<Goal>(goal||{id:uid(),title:'',target_count:20,start_date:today(),end_date:today(),metric:'activities_done',created_at:nowIso()});return <Modal title="هدف‌گذاری" close={close}><div className="form"><Field label="عنوان" value={g.title} onChange={(v:string)=>setG({...g,title:v})}/><label>کاربر</label><select value={g.user_id||''} onChange={e=>setG({...g,user_id:e.target.value})}><option value="">همه</option>{users.map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><label>معیار</label><select value={g.metric} onChange={e=>setG({...g,metric:e.target.value as any})}><option value="activities_done">فعالیت انجام‌شده</option><option value="tasks_done">تسک بسته‌شده</option></select><label>دسته</label><select value={g.category||''} onChange={e=>setG({...g,category:e.target.value})}><option value="">همه</option>{categories.map((c:string)=><option key={c}>{c}</option>)}</select><Field label="تعداد هدف" type="number" value={g.target_count} onChange={(v:string)=>setG({...g,target_count:+v})}/><PersianDatePicker label="شروع" value={g.start_date} onChange={v=>setG({...g,start_date:v})}/><PersianDatePicker label="پایان" value={g.end_date} onChange={v=>setG({...g,end_date:v})}/><button className="btn primary full" onClick={()=>save(g)}><Save/> ذخیره هدف</button></div></Modal>}
function ProjectModal({project,users,close,save}:any){const [p,setP]=useState<Project>(project||{id:uid(),title:'',description:'',member_ids:[],status:'فعال',created_at:nowIso()});return <Modal title="پروژه" close={close}><div className="form"><Field label="عنوان" value={p.title} onChange={(v:string)=>setP({...p,title:v})}/><label>مالک</label><select value={p.owner_id||''} onChange={e=>setP({...p,owner_id:e.target.value})}><option value="">بدون مالک</option>{users.map((u:User)=><option key={u.id} value={u.id}>{u.full_name}</option>)}</select><label>وضعیت</label><select value={p.status||'فعال'} onChange={e=>setP({...p,status:e.target.value})}><option>فعال</option><option>متوقف</option><option>تکمیل</option></select><PersianDatePicker label="ددلاین" value={p.deadline} onChange={v=>setP({...p,deadline:v})}/><div className="full"><label>اعضای پروژه</label><MultiUsers users={users} value={p.member_ids} onChange={v=>setP({...p,member_ids:v})}/></div><div className="full"><label>توضیح</label><textarea value={p.description||''} onChange={e=>setP({...p,description:e.target.value})}/></div><div className="full"><label>یادداشت پین‌شده</label><textarea value={p.pinned_note||''} onChange={e=>setP({...p,pinned_note:e.target.value})}/></div><button className="btn primary full" onClick={()=>save(p)}><Save/> ذخیره پروژه</button></div></Modal>}
function ImportHotelsModal({close,save}:any){
  const [rows,setRows]=useState<HotelT[]>([]);
  const [err,setErr]=useState('');
  const [fileName,setFileName]=useState('');
  const [rawCount,setRawCount]=useState(0);
  const [headers,setHeaders]=useState<string[]>([]);
  const [parsing,setParsing]=useState(false);
  const [saving,setSaving]=useState(false);
  const normalizeHeader=(v:any)=>String(v??'').replace(/\u200c/g,' ').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\s_\-]+/g,'').trim().toLowerCase();
  const pick=(r:any,names:string[])=>{const keys=Object.keys(r);for(const n of names){const k=keys.find(x=>normalizeHeader(x)===normalizeHeader(n));if(k!==undefined&&r[k]!==undefined&&r[k]!==null&&String(r[k]).trim()!=='')return r[k]}return undefined};
  const asText=(v:any)=>String(v??'').trim();
  const asBool=(v:any)=>['1','true','yes','بله','بلی','فعال'].includes(String(v??'').trim().toLowerCase());
  const asNumber=(v:any)=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0};
  async function parse(file:File){
    setParsing(true);setErr('');setRows([]);setFileName(file.name);setRawCount(0);setHeaders([]);
    try{
      const buf=await file.arrayBuffer();
      const XLSX=await loadXLSX();
      const wb=XLSX.read(buf,{type:'array',cellDates:false});
      const ws=wb.Sheets[wb.SheetNames[0]];
      if(!ws) throw new Error('هیچ شیت قابل خواندنی در فایل پیدا نشد.');
      const data:any[]=XLSX.utils.sheet_to_json(ws,{defval:null,raw:false,blankrows:false});
      setRawCount(data.length);setHeaders(Object.keys(data[0]||{}));
      if(!data.length) throw new Error('فایل خالی است یا سطر عنوان ستون‌ها درست تشخیص داده نشد.');
      const parsed=data.map((r)=>{
        const rawTitle=asText(pick(r,['نام هتل','hotel name','hotel_name','title','نام']));
        const code=asText(pick(r,['کد هتل','hotel code','hotel_code','hotelcode','کدهتل']));
        if(!code)return null;
        const title=rawTitle||`هتل بدون نام — کد ${code}`;
        return {id:`hotel-${code}`,country:asText(pick(r,['کشور','country'])),province:asText(pick(r,['استان','province'])),city:asText(pick(r,['شهر','city'])),hotel_group:asText(pick(r,['گروه نوع هتل','hotel_group'])),caring_category:asText(pick(r,['CaringCategory','caring category','caring_category'])),hotel_type:asText(pick(r,['نوع هتل','hotel_type'])),title,phone:asText(pick(r,['تلفن هتل','phone'])),reservation_phone:asText(pick(r,['تلن رزرواسیون','تلفن رزرواسیون','reservation_phone'])),capacity_total:asNumber(pick(r,['ظرفیت کلی هتل','ظرفیت','capacity_total'])),hotel_code:code,provider:asText(pick(r,['نام پروایدر','provider','Provider']))||'IHO Provider',pms:asText(pick(r,['PMS','pms'])),cooperation_status:asText(pick(r,['وضعیت همکاری','cooperation_status'])),risk_status:asText(pick(r,['وضعیت ریسکی','risk_status'])),hotel_category:asText(pick(r,['دسته بندی هتل','hotel_category'])),grade:asText(pick(r,['درجه هتل','grade'])),purchase_period:asNumber(pick(r,['دوره خرید','purchase_period']))||undefined,payment_period:asNumber(pick(r,['دوره پرداخت','payment_period']))||undefined,status_end_date:asText(pick(r,['تاریخ پایان وضعیت','status_end_date'])),status_start_date:asText(pick(r,['تاریخ شروع وضعیت','status_start_date'])),contract_date:asText(pick(r,['تاریخ قرارداد','contract_date'])),site_visible:asBool(pick(r,['نمایش در سایت','site_visible'])),search_visible:asBool(pick(r,['نمایش در نتایج جستجو','search_visible'])),status:'فعال',updated_at:nowIso()} as HotelT;
      }).filter(Boolean) as HotelT[];
      if(!parsed.length) throw new Error(`هیچ هتل معتبری پیدا نشد. ستون‌های لازم «نام هتل» و «کد هتل» هستند. ستون‌های شناسایی‌شده: ${Object.keys(data[0]||{}).join('، ')}`);
      setRows(parsed);
    }catch(e:any){setErr(e?.message||'خطای ناشناخته در خواندن فایل');}
    finally{setParsing(false);}
  }
  async function submit(){if(!rows.length||saving)return;setSaving(true);setErr('');try{await save(rows)}catch(e:any){setErr(e?.message||'ذخیره اطلاعات ناموفق بود');setSaving(false)}}
  return <Modal title="ورود گروهی هتل‌ها از اکسل" close={close}><div className="uploadBox importHotelsBox"><Upload/><h3>{fileName?`فایل انتخاب‌شده: ${fileName}`:'فایل Excel هتل‌ها را انتخاب کن'}</h3><p>ستون‌های نام هتل و کد هتل الزامی‌اند؛ نام ستون‌های فارسی و انگلیسی پشتیبانی می‌شود.</p><label className="filePickerBtn">انتخاب فایل<input type="file" accept=".xlsx,.xls,.csv" onClick={e=>{(e.currentTarget as HTMLInputElement).value=''}} onChange={e=>{const f=e.target.files?.[0];if(f)void parse(f)}}/></label>{parsing&&<div className="notice">در حال خواندن و پردازش فایل…</div>}{err&&<p className="danger importError">{err}</p>}{!!fileName&&!parsing&&!err&&<div className="importSummary"><b>{rows.length.toLocaleString('fa-IR')} هتل آماده ذخیره است</b><span>از {rawCount.toLocaleString('fa-IR')} ردیف فایل</span><small>{headers.length} ستون شناسایی شد</small></div>}<div className="previewTable">{rows.slice(0,5).map(r=><div key={r.id}><b>{r.title}</b><span>{r.hotel_code} • {r.city||'بدون شهر'} • {r.provider||'IHO Provider'} • ظرفیت {r.capacity_total||0}</span></div>)}</div><button className="btn primary full" disabled={!rows.length||parsing||saving} onClick={submit}><Save/>{saving?'در حال ذخیره در Supabase…':rows.length?`ذخیره ${rows.length.toLocaleString('fa-IR')} هتل در Supabase`:'ابتدا فایل را انتخاب کن'}</button></div></Modal>
}

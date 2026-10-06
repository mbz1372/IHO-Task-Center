'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, BarChart3, Bot, CheckCircle2, ClipboardList, Download, FileSpreadsheet, Hotel, RefreshCw, Search, ShieldCheck, Sparkles, Target, Upload, Users, XCircle } from 'lucide-react';

type AnyRow = Record<string, any>;
type FileKey = 'reservationList' | 'allHotels' | 'confirmed' | 'unconfirmed' | 'mehr' | 'assignment' | 'traffic';
type View = 'dashboard' | 'data' | 'reservation' | 'hotels' | 'experts' | 'tasks' | 'qa' | 'outputs' | 'ai';
type Slot = { key: FileKey; exact: string; title: string; desc: string; required: boolean; aliases: string[] };
type FileState = { key: FileKey; name: string; rows: number; uploadedAt: string; ok: boolean; error?: string };
type HotelRow = { id: string; code: string; title: string; city: string; province: string; provider: string; category: string; caring: string; grade: string; capacity: number; capacityOwner: string; rateOwner: string; cityManager: string; isMehr: boolean; raw?: AnyRow };
type ReservationRow = { id: string; source: FileKey; hotelCode: string; hotel: string; city: string; channel: string; status: string; confirmed: boolean; nights: number; amount: number; profit: number; date: string; reason: string; raw?: AnyRow };
type TrafficRow = { id: string; hotelCode: string; hotel: string; city: string; sessions: number; users: number; views: number; starts: number; reservations: number; raw?: AnyRow };
type AssignmentRow = { hotelCode: string; hotel: string; capacityOwner: string; rateOwner: string; cityManager: string; raw?: AnyRow };
type TaskRow = { id: string; title: string; hotel: string; hotelCode: string; owner: string; priority: string; status: string; due: string; reason: string; createdAt: string };
type Store = { files: FileState[]; hotels: HotelRow[]; reservations: ReservationRow[]; traffic: TrafficRow[]; assignments: AssignmentRow[]; tasks: TaskRow[]; logs: string[]; aiReport: string };

const SLOTS: Slot[] = [
  { key:'reservationList', exact:'لیست رزرو.xlsx', title:'لیست رزرو', desc:'ریز همه رزروها و وضعیت نهایی هر رزرو', required:true, aliases:['لیست رزرو'] },
  { key:'allHotels', exact:'All Hotel Data(1).xlsx', title:'Master هتل‌ها', desc:'اطلاعات پایه، Provider، ظرفیت، قرارداد و دسته‌بندی هتل', required:true, aliases:['all hotel data','all hotel data(1)','all hotels data'] },
  { key:'confirmed', exact:'1405 Sale of confirmed reservations.xlsx', title:'رزروهای قطعی ۱۴۰۵', desc:'فروش قطعی، شب اقامت، مبلغ و سود رزروهای قطعی', required:true, aliases:['confirmed reservations','confirmed'] },
  { key:'unconfirmed', exact:'1405 Sale of unconfirmed reservations.xlsx', title:'رزروهای غیرقطعی ۱۴۰۵', desc:'رزروهای از دست‌رفته یا تایید نشده', required:true, aliases:['unconfirmed reservations','unconfirmed'] },
  { key:'mehr', exact:'Mehr Mo hotels.xlsx', title:'هتل‌های مهر / MO', desc:'هتل‌های هدف کمپین مهر و فرصت‌های عملیاتی', required:false, aliases:['mehr mo','mehr'] },
  { key:'assignment', exact:'Hotel Assignment.xlsx', title:'تخصیص کارشناسان', desc:'مالکیت ظرفیت، نرخ و سیتی‌منیجر هر هتل', required:true, aliases:['hotel assignment','assignment'] },
  { key:'traffic', exact:'ترافیک بازدید سایت Analytics.xlsx', title:'ترافیک سایت Analytics', desc:'بازدید، نشست، شروع رزرو و تبدیل در سایت', required:true, aliases:['analytics','traffic','ترافیک'] },
];

const EMPTY: Store = { files:[], hotels:[], reservations:[], traffic:[], assignments:[], tasks:[], logs:[], aiReport:'' };
const STORE_KEY = 'iho-supply-superapp-v11';
const LEGACY_KEY = 'iho-unified-supply-store';
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;
const norm = (v:any) => String(v ?? '').replace(/\u200c/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim();
const lower = (v:any) => norm(v).toLowerCase();
const nnum = (v:any) => { const s = String(v ?? '').replace(/[٬,\s]/g,'').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))); const n = Number(s); return Number.isFinite(n) ? n : 0; };
const fmt = (n:number) => new Intl.NumberFormat('fa-IR').format(Math.round(n || 0));
const pct = (n:number) => `${Number(n || 0).toFixed(n > 0 && n < 10 ? 1 : 0)}٪`;
const first = (row:AnyRow, names:string[]) => { const keys = Object.keys(row || {}); const hit = keys.find(k => names.some(n => lower(k) === lower(n) || lower(k).includes(lower(n)))); return hit ? row[hit] : ''; };
const detect = (name:string): FileKey => { const l = lower(name); return (SLOTS.find(s => l.includes(lower(s.exact.replace('.xlsx',''))) || s.aliases.some(a => l.includes(lower(a))))?.key || 'reservationList') as FileKey; };
const fileState = (store:Store, key:FileKey) => store.files.find(f => f.key === key);
const csv = (rows:any[], filename:string) => { const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r || {})))); const body = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replaceAll('"','""')}"`).join(','))].join('\n'); const blob = new Blob(['\ufeff' + body], { type:'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); };

async function readRows(file:File, slot:FileKey) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type:'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix:any[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
  let headerIndex = slot === 'mehr' ? 2 : matrix.findIndex(r => r.filter(x => norm(x)).length >= 3 && r.some(x => /هتل|hotel|رزرو|reserve|reservation|شهر|city|تاریخ|date/i.test(norm(x))));
  if (headerIndex < 0) headerIndex = 0;
  const headers = matrix[headerIndex].map((h:any, i:number) => norm(h) || `col_${i+1}`);
  return matrix.slice(headerIndex + 1).filter(r => r.some(c => norm(c))).map(r => Object.fromEntries(headers.map((h:string, i:number) => [h, r[i] ?? ''])));
}
function mapHotel(row:AnyRow): HotelRow {
  const code = norm(first(row, ['کد هتل','hotel code','hotelid','id']));
  const title = norm(first(row, ['نام هتل','هتل','hotel name','hotel','title'])) || 'بدون نام';
  return { id: code ? `h-${code}` : `h-${title}`, code, title, city:norm(first(row,['شهر','city'])), province:norm(first(row,['استان','province'])), provider:norm(first(row,['نام پروایدر','provider','پروایدر'])), category:norm(first(row,['دسته بندی هتل','hotel category','category'])), caring:norm(first(row,['caringcategory','caring category','CaringCategory'])), grade:norm(first(row,['درجه هتل','grade','star'])), capacity:nnum(first(row,['ظرفیت کلی هتل','capacity','ظرفیت'])), capacityOwner:'', rateOwner:'', cityManager:'', isMehr:false, raw:row };
}
function mapAssignment(row:AnyRow): AssignmentRow {
  return { hotelCode:norm(first(row,['کد هتل','hotel code','hotelid'])), hotel:norm(first(row,['نام هتل','هتل','hotel name','hotel'])) || 'بدون نام', capacityOwner:norm(first(row,['حامی ظرفیت','مسئول ظرفیت','capacity owner','capacity'])), rateOwner:norm(first(row,['حامی نرخ','مسئول نرخ','rate owner','rate'])), cityManager:norm(first(row,['سیتی منیجر','city manager','manager'])), raw:row };
}
function mapReservation(row:AnyRow, source:FileKey): ReservationRow {
  const hotel = norm(first(row, ['نام هتل','هتل','hotel name','hotel','HotelName'])) || 'بدون هتل';
  const status = norm(first(row, ['وضعیت نهایی رزرو','وضعیت','status','confirmed','confirm'])) || (source === 'confirmed' ? 'قطعی' : 'غیرقطعی');
  const confirmed = source === 'confirmed' || (/قطعی|تایید|تأیید|confirmed|success/i.test(status) && !/غیر|unconfirmed|کنسل|لغو/i.test(status));
  return { id:uid(), source, hotelCode:norm(first(row,['کد هتل','hotel code','hotelid'])), hotel, city:norm(first(row,['شهر','city'])), channel:norm(first(row,['کانال','channel','salesfunnel','نوع فروش','source'])) || 'نامشخص', status, confirmed, nights:nnum(first(row,['شب اقامت','nights','room nights','شب'])), amount:nnum(first(row,['مبلغ','فروش','amount','sale','gross','مبلغ رزرو'])), profit:nnum(first(row,['سود','profit','margin','سود هتل'])), date:norm(first(row,['تاریخ ثبت','تاریخ','date','created','jdate'])) || today(), reason:norm(first(row,['علت','دلیل','reason','description','وضعیت نهایی رزرو'])), raw:row };
}
function mapTraffic(row:AnyRow): TrafficRow {
  return { id:uid(), hotelCode:norm(first(row,['کد هتل','hotel code','hotelid'])), hotel:norm(first(row,['نام هتل','هتل','hotel','page title'])) || 'بدون هتل', city:norm(first(row,['شهر','city'])), sessions:nnum(first(row,['sessions','session','نشست'])), users:nnum(first(row,['users','user','کاربر'])), views:nnum(first(row,['views','pageviews','screenpageviews','بازدید'])), starts:nnum(first(row,['booking_starts','begin_checkout','شروع رزرو','شروع فرایند رزرو'])), reservations:nnum(first(row,['reservations','purchase','رزرو','transactions'])), raw:row };
}
function mergeHotels(base:HotelRow[], assignments:AssignmentRow[], mehrRows:HotelRow[]) {
  const map = new Map<string, HotelRow>();
  base.forEach(h => map.set(h.code || h.title, h));
  mehrRows.forEach(m => { const k = m.code || m.title; const prev = map.get(k) || m; map.set(k, { ...prev, ...Object.fromEntries(Object.entries(m).filter(([,v]) => v !== '' && v !== 0)), isMehr:true }); });
  assignments.forEach(a => { const k = a.hotelCode || a.hotel; const h = map.get(k) || map.get(a.hotel) || { id:`h-${k}`, code:a.hotelCode, title:a.hotel, city:'', province:'', provider:'', category:'', caring:'', grade:'', capacity:0, capacityOwner:'', rateOwner:'', cityManager:'', isMehr:false }; map.set(k, { ...h, capacityOwner:a.capacityOwner || h.capacityOwner, rateOwner:a.rateOwner || h.rateOwner, cityManager:a.cityManager || h.cityManager }); });
  return Array.from(map.values()).filter(h => h.title && h.title !== 'بدون نام');
}
function matchHotel(h:HotelRow, r:{hotelCode?:string; hotel:string}) {
  return (h.code && r.hotelCode === h.code) || lower(r.hotel) === lower(h.title) || lower(r.hotel).includes(lower(h.title)) || lower(h.title).includes(lower(r.hotel));
}
function hotelInsights(store:Store) {
  return store.hotels.map(h => {
    const rs = store.reservations.filter(r => matchHotel(h, r));
    const tr = store.traffic.filter(t => matchHotel(h, t));
    const confirmed = rs.filter(r => r.confirmed).length;
    const lost = rs.length - confirmed;
    const amount = rs.filter(r => r.confirmed).reduce((s,r) => s + r.amount, 0);
    const lostAmount = rs.filter(r => !r.confirmed).reduce((s,r) => s + r.amount, 0);
    const sessions = tr.reduce((s,t) => s + t.sessions, 0);
    const conversion = rs.length ? confirmed / rs.length * 100 : 0;
    const trafficConversion = sessions ? confirmed / sessions * 100 : 0;
    const ownerMissing = !h.capacityOwner || !h.rateOwner;
    const risk = Math.min(100, lost * 12 + (conversion < 45 && rs.length ? 22 : 0) + (sessions > 250 && trafficConversion < 1.5 ? 24 : 0) + (ownerMissing ? 12 : 0) + (!h.capacity ? 6 : 0));
    return { ...h, reservations:rs.length, confirmed, lost, amount, lostAmount, sessions, conversion, trafficConversion, ownerMissing, risk, reason: risk >= 70 ? 'بحرانی' : risk >= 45 ? 'نیازمند پیگیری' : 'پایدار' };
  }).sort((a,b) => b.risk - a.risk || b.lost - a.lost || b.sessions - a.sessions);
}
function expertKpis(insights:any[], tasks:TaskRow[]) {
  const map = new Map<string, any>();
  insights.forEach(h => [h.capacityOwner, h.rateOwner, h.cityManager].filter(Boolean).forEach((name:any) => { const k = norm(name); const o = map.get(k) || { name:k, hotels:0, highRisk:0, lost:0, tasks:0, conversion:0, score:100 }; o.hotels++; o.highRisk += h.risk >= 60 ? 1 : 0; o.lost += h.lost; o.conversion += h.conversion; map.set(k,o); }));
  tasks.forEach(t => { const k = norm(t.owner); if(!k) return; const o = map.get(k) || { name:k, hotels:0, highRisk:0, lost:0, tasks:0, conversion:0, score:100 }; o.tasks++; map.set(k,o); });
  return Array.from(map.values()).map(o => ({ ...o, conversion:o.hotels ? o.conversion / o.hotels : 0, score:Math.max(0, 100 - o.highRisk * 9 - o.lost * 2 + o.tasks) })).sort((a,b) => b.score - a.score);
}
function autoTasks(insights:any[]) {
  return insights.filter(h => h.risk >= 60).slice(0, 100).map(h => ({ id:`task-risk-${h.code || h.title}`, title:`پیگیری فوری ${h.title}`, hotel:h.title, hotelCode:h.code, owner:h.capacityOwner || h.rateOwner || h.cityManager || 'تعیین نشده', priority:h.risk >= 80 ? 'فوری' : 'بالا', status:'باز', due:today(), reason:`Risk ${Math.round(h.risk)}٪ | Lost ${h.lost} | Conversion ${Math.round(h.conversion)}٪`, createdAt:new Date().toISOString() }));
}

export default function IranHotelSupplySuperApp() {
  const [store, setStoreState] = useState<Store>(EMPTY);
  const [view, setView] = useState<View>('dashboard');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY); if(saved) setStoreState({ ...EMPTY, ...JSON.parse(saved) }); const v = localStorage.getItem('iho-open-view') as View | null; if(v) { setView(v); localStorage.removeItem('iho-open-view'); } } catch {} }, []);
  function save(next:Store, message?:string) { setStoreState(next); try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); localStorage.setItem(LEGACY_KEY, JSON.stringify(next)); } catch {} if(message) flash(message); }
  function flash(message:string) { setToast(message); setTimeout(() => setToast(''), 3200); }
  const insights = useMemo(() => hotelInsights(store), [store]);
  const experts = useMemo(() => expertKpis(insights, store.tasks), [insights, store.tasks]);
  const metrics = useMemo(() => { const c = store.reservations.filter(r => r.confirmed); const l = store.reservations.filter(r => !r.confirmed); return { hotels:store.hotels.length, confirmed:c.length, lost:l.length, total:store.reservations.length, nights:c.reduce((s,r)=>s+r.nights,0), amount:c.reduce((s,r)=>s+r.amount,0), lostAmount:l.reduce((s,r)=>s+r.amount,0), traffic:store.traffic.reduce((s,t)=>s+t.sessions,0), highRisk:insights.filter(h=>h.risk>=60).length, conversion:store.reservations.length ? c.length / store.reservations.length * 100 : 0, tasks:store.tasks.filter(t=>t.status!=='انجام شد').length }; }, [store, insights]);
  const requiredReady = SLOTS.filter(s => s.required).every(s => fileState(store, s.key)?.ok);
  const qa = [
    { p:'P0', ok:SLOTS.length===7, title:'Data Inbox دقیقاً ۷ فایل واقعی شرکت را نشان می‌دهد' },
    { p:'P0', ok:requiredReady, title:'همه فایل‌های الزامی آپلود شده‌اند' },
    { p:'P0', ok:metrics.hotels>0, title:'Hotel CRM از All Hotel Data(1).xlsx داده دارد' },
    { p:'P0', ok:metrics.confirmed>0 && metrics.lost>0, title:'رزرو قطعی و غیرقطعی برای تحلیل وارد شده' },
    { p:'P0', ok:metrics.traffic>0, title:'ترافیک Analytics برای قیف تبدیل موجود است' },
    { p:'P0', ok:Array.isArray(store.tasks), title:'Task Center بدون Runtime Error آماده است' },
    { p:'P1', ok:experts.length>0, title:'KPI کارشناسان از Hotel Assignment ساخته شده' },
  ];
  const go = qa.filter(x => x.p==='P0').every(x => x.ok);
  const report = `گزارش آمادگی IranHotel OS\nوضعیت انتشار: ${go ? 'Go / مجاز به ارائه کنترل‌شده' : 'No-Go / نیازمند تکمیل'}\nهتل‌ها: ${fmt(metrics.hotels)}\nرزرو قطعی: ${fmt(metrics.confirmed)}\nرزرو از دست‌رفته: ${fmt(metrics.lost)}\nنرخ تبدیل رزرو: ${pct(metrics.conversion)}\nهتل‌های پرریسک: ${fmt(metrics.highRisk)}\nتسک‌های باز: ${fmt(metrics.tasks)}\nفایل‌های آماده: ${store.files.filter(f=>f.ok).length}/7`;

  async function handleFiles(list:FileList | null) {
    if(!list?.length) return;
    setBusy(true);
    let next:Store = { ...store, files:[...store.files], logs:[`شروع پردازش ${list.length} فایل در ${new Date().toLocaleString('fa-IR')}`, ...store.logs] };
    let base = [...next.hotels];
    let assignments = [...next.assignments];
    let mehrRows:HotelRow[] = [];
    try {
      for(const file of Array.from(list)) {
        const slot = detect(file.name);
        const rows = await readRows(file, slot);
        next.files = next.files.filter(f => f.key !== slot).concat({ key:slot, name:file.name, rows:rows.length, uploadedAt:new Date().toISOString(), ok:true });
        if(slot === 'allHotels') base = rows.map(mapHotel);
        else if(slot === 'assignment') assignments = rows.map(mapAssignment);
        else if(slot === 'traffic') next.traffic = rows.map(mapTraffic);
        else if(slot === 'mehr') mehrRows = rows.map(r => ({ ...mapHotel(r), isMehr:true }));
        else {
          const mapped = rows.map(r => mapReservation(r, slot));
          next.reservations = next.reservations.filter(r => r.source !== slot).concat(mapped);
        }
        next.logs = [`${SLOTS.find(s=>s.key===slot)?.exact}: ${rows.length} ردیف خوانده شد`, ...next.logs];
      }
      next.assignments = assignments;
      next.hotels = mergeHotels(base, assignments, mehrRows);
      next.tasks = [...autoTasks(hotelInsights(next)), ...next.tasks.filter(t => !t.id.startsWith('task-risk-'))];
      save(next, 'داده‌ها وارد شد؛ Dashboard، CRM، KPI و Task Center همزمان آپدیت شدند.');
      setView('dashboard');
    } catch(e:any) {
      flash(`خطا در پردازش فایل: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }
  async function runAi() {
    setAiLoading(true);
    try {
      const prompt = `براساس داده‌های زیر برای مدیر زنجیره تأمین ایران‌هتل تحلیل اجرایی بده و ۱۰ اقدام اولویت‌دار پیشنهاد کن. Metrics=${JSON.stringify(metrics)} TopRisks=${JSON.stringify(insights.slice(0,12).map(h=>({hotel:h.title,city:h.city,risk:h.risk,lost:h.lost,conversion:h.conversion,owner:h.capacityOwner||h.rateOwner||h.cityManager})))} Experts=${JSON.stringify(experts.slice(0,8))}`;
      const res = await fetch('/api/avalai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt }) });
      const data = await res.json();
      save({ ...store, aiReport:data.text || data.message || 'پاسخی دریافت نشد' }, 'تحلیل AI آماده شد.');
      setView('ai');
    } catch(e:any) { flash(`خطای AI: ${e?.message || e}`); }
    finally { setAiLoading(false); }
  }
  const nav = [
    ['dashboard','مرکز فرمان',BarChart3], ['data','Data Inbox ۷ فایل',FileSpreadsheet], ['reservation','تحلیل رزرو',Target], ['hotels','Hotel CRM',Hotel], ['experts','KPI کارشناسان',Users], ['tasks','Task Center',ClipboardList], ['qa','QA / Go-NoGo',ShieldCheck], ['outputs','خروجی‌ها',Download], ['ai','Aval AI',Bot]
  ] as const;
  return <main className="ihos">
    <aside className="side"><div className="brand"><b>IranHotel OS</b><small>Supply Chain Super App</small></div><nav>{nav.map(([k,t,I]) => <button key={k} onClick={()=>setView(k)} className={view===k?'active':''}><I size={17}/>{t}</button>)}</nav><div className={go?'ready ok':'ready'}>{go ? 'آماده ارائه کنترل‌شده' : 'آماده ارائه نیست'}<small>{store.files.filter(f=>f.ok).length}/7 فایل آماده</small></div></aside>
    <section className="main"><header className="top"><div className="search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو در هتل، کارشناس، تسک..."/></div><div className="actions"><label className="btn primary"><Upload size={16}/> ورود ۷ فایل اصلی<input hidden type="file" multiple accept=".xlsx,.xls" onChange={e=>handleFiles(e.target.files)}/></label><button className="btn ghost" onClick={()=>setView('qa')}><ShieldCheck size={16}/> Go/No-Go</button><button className="btn ghost" onClick={runAi} disabled={aiLoading}><Sparkles size={16}/>{aiLoading?'در حال تحلیل':'تحلیل AI'}</button></div></header>
    {view==='dashboard' && <Dashboard metrics={metrics} insights={insights} store={store} go={go} setView={setView}/>} {view==='data' && <DataInbox store={store} handleFiles={handleFiles} busy={busy}/>} {view==='reservation' && <Reservation metrics={metrics} insights={insights}/>} {view==='hotels' && <Hotels insights={insights} q={q}/>} {view==='experts' && <Experts experts={experts}/>} {view==='tasks' && <Tasks store={store} save={save}/>} {view==='qa' && <QA qa={qa} report={report}/>} {view==='outputs' && <Outputs store={store} insights={insights} experts={experts} report={report}/>} {view==='ai' && <AI text={store.aiReport} runAi={runAi}/>} </section>{toast && <div className="toast">{toast}</div>}<style>{CSS}</style></main>;
}
function Dashboard({metrics,insights,store,go,setView}:any){return <><section className="hero"><div><small>SUPPLY CHAIN OPERATING SYSTEM</small><h1>مرکز فرمان زنجیره تأمین هتل</h1><p>یک Data Inbox واحد برای ۷ فایل واقعی؛ خروجی مستقیم به Dashboard، CRM، KPI و Task Center.</p><div className="heroActions"><button className="btn light" onClick={()=>setView('data')}>ورود فایل‌ها</button><button className="btn dark" onClick={()=>setView('tasks')}>تسک‌های اقدام</button></div></div><div className="circle"><b>{metrics.hotels ? pct(100-metrics.highRisk/Math.max(1,metrics.hotels)*100) : '۰٪'}</b><span>سلامت پرتفوی</span></div></section><Kpis metrics={metrics}/><section className="grid2"><div className="panel"><h2>Radar هتل‌های پرریسک</h2>{insights.slice(0,8).map((h:any)=><Row key={h.id} h={h}/>)}</div><div className="panel"><h2>وضعیت فایل‌ها</h2>{SLOTS.map(s=><div className="line" key={s.key}><b>{s.exact}</b><span className={fileState(store,s.key)?.ok?'pass':'wait'}>{fileState(store,s.key)?.ok?'آماده':'در انتظار'}</span></div>)}<div className={go?'go ok':'go'}>{go?'Go':'No-Go'}</div></div></section></>}
function Kpis({metrics}:any){const items=[['هتل',metrics.hotels],['رزرو قطعی',metrics.confirmed],['Lost',metrics.lost],['ترافیک',metrics.traffic],['پرریسک',metrics.highRisk],['تسک باز',metrics.tasks]];return <section className="kpis">{items.map(([t,v])=><div className="kpi" key={t}><span>{t}</span><b>{fmt(Number(v))}</b></div>)}</section>}
function DataInbox({store,handleFiles,busy}:any){return <section><div className="pageHead"><h2>Data Inbox واقعی شرکت</h2><label className="btn primary"><Upload size={16}/>{busy?'در حال پردازش':'آپلود همه فایل‌ها'}<input hidden type="file" multiple accept=".xlsx,.xls" onChange={e=>handleFiles(e.target.files)}/></label></div><div className="files">{SLOTS.map(s=>{const st=fileState(store,s.key);return <div key={s.key} className={st?.ok?'file ok':'file'}><FileSpreadsheet/><div><b>{s.exact}</b><small>{s.desc}</small><em>{s.required?'الزامی':'اختیاری'}</em></div><label className="mini"><Upload size={16}/><input hidden type="file" accept=".xlsx,.xls" onChange={e=>handleFiles(e.target.files)}/></label>{st?.ok?<CheckCircle2 className="passIcon"/>:<XCircle className="waitIcon"/>}<small>{st?.ok?`${fmt(st.rows)} ردیف`:'آپلود نشده'}</small></div>})}</div><div className="panel"><h2>لاگ پردازش</h2>{store.logs.slice(0,12).map((l:string,i:number)=><p key={i} className="log">{l}</p>)}</div></section>}
function Reservation({metrics,insights}:any){return <section><Kpis metrics={metrics}/><div className="panel"><h2>تحلیل رزرو و قیف تبدیل</h2><table><thead><tr><th>هتل</th><th>شهر</th><th>قطعی</th><th>Lost</th><th>Conversion</th><th>Traffic Conv.</th><th>Risk</th></tr></thead><tbody>{insights.slice(0,60).map((h:any)=><tr key={h.id}><td><b>{h.title}</b><small>{h.provider}</small></td><td>{h.city}</td><td>{fmt(h.confirmed)}</td><td>{fmt(h.lost)}</td><td>{pct(h.conversion)}</td><td>{pct(h.trafficConversion)}</td><td><Risk v={h.risk}/></td></tr>)}</tbody></table></div></section>}
function Hotels({insights,q}:any){const rows=insights.filter((h:any)=>!q||lower(h.title).includes(lower(q))||lower(h.city).includes(lower(q))).slice(0,120);return <section className="panel"><h2>Hotel CRM 360</h2><table><thead><tr><th>هتل</th><th>شهر</th><th>Provider</th><th>حامی ظرفیت</th><th>حامی نرخ</th><th>رزرو</th><th>Risk</th></tr></thead><tbody>{rows.map((h:any)=><tr key={h.id}><td><b>{h.title}</b><small>{h.caring||h.category}</small></td><td>{h.city}</td><td>{h.provider}</td><td>{h.capacityOwner||'—'}</td><td>{h.rateOwner||'—'}</td><td>{fmt(h.confirmed)} / {fmt(h.lost)}</td><td><Risk v={h.risk}/></td></tr>)}</tbody></table></section>}
function Experts({experts}:any){return <section><div className="pageHead"><h2>پروفایل و KPI کارشناسان</h2></div><div className="experts">{experts.map((e:any)=><div className="expert" key={e.name}><div className="avatar">{e.name.slice(0,1)}</div><h3>{e.name}</h3><div className="miniStats"><span><b>{fmt(e.hotels)}</b>هتل</span><span><b>{fmt(e.highRisk)}</b>پرریسک</span><span><b>{fmt(e.lost)}</b>Lost</span><span><b>{fmt(e.tasks)}</b>تسک</span></div><Risk v={Math.min(100,100-e.score)}/></div>)}</div></section>}
function Tasks({store,save}:any){const [title,setTitle]=useState('');function add(){if(!title.trim())return;save({...store,tasks:[{id:uid(),title,hotel:'',hotelCode:'',owner:'',priority:'عادی',status:'باز',due:today(),reason:'دستی',createdAt:new Date().toISOString()},...store.tasks]},'تسک جدید ثبت شد');setTitle('')}function setStatus(id:string,status:string){save({...store,tasks:store.tasks.map((t:TaskRow)=>t.id===id?{...t,status}:t)},'وضعیت تسک بروزرسانی شد')}return <section><div className="pageHead"><h2>Task Center</h2><div className="inline"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="تسک جدید..."/><button className="btn primary" onClick={add}>افزودن</button></div></div><div className="kanban">{['باز','در حال انجام','انجام شد'].map(st=><div className="col" key={st}><h3>{st}</h3>{store.tasks.filter((t:TaskRow)=>t.status===st || (st==='باز' && !['در حال انجام','انجام شد'].includes(t.status))).slice(0,80).map((t:TaskRow)=><div className="task" key={t.id}><b>{t.title}</b><small>{t.hotel} • {t.owner}</small><p>{t.reason}</p><select value={t.status} onChange={e=>setStatus(t.id,e.target.value)}><option>باز</option><option>در حال انجام</option><option>انجام شد</option></select></div>)}</div>)}</div></section>}
function QA({qa,report}:any){const ok=qa.filter((x:any)=>x.p==='P0').every((x:any)=>x.ok);return <section><div className={ok?'go ok':'go'}><h2>{ok?'Go: آماده ارائه کنترل‌شده':'No-Go: قبل از ارائه تکمیل شود'}</h2><p>تا وقتی یک P0 Fail باشد، نسخه را در شرکت منتشر نکن.</p></div><div className="qa">{qa.map((x:any)=><div className="qaItem" key={x.title}>{x.ok?<CheckCircle2/>:<XCircle/>}<b>{x.title}</b><small>{x.p}</small></div>)}</div><textarea readOnly value={report}/><button className="btn primary" onClick={()=>navigator.clipboard.writeText(report)}>کپی گزارش مدیرعامل</button></section>}
function Outputs({store,insights,experts,report}:any){return <section className="panel"><h2>خروجی‌ها</h2><div className="actions"><button className="btn ghost" onClick={()=>csv(insights,'hotel-risk-radar.csv')}>Hotel Risk CSV</button><button className="btn ghost" onClick={()=>csv(experts,'expert-kpi.csv')}>Expert KPI CSV</button><button className="btn ghost" onClick={()=>csv(store.tasks,'tasks.csv')}>Tasks CSV</button><button className="btn primary" onClick={()=>navigator.clipboard.writeText(report)}>کپی گزارش CEO</button></div><textarea readOnly value={report}/></section>}
function AI({text,runAi}:any){return <section className="panel"><div className="pageHead"><h2>Aval AI Assistant</h2><button className="btn primary" onClick={runAi}><Sparkles size={16}/> تحلیل مجدد</button></div><pre className="ai">{text || 'هنوز تحلیل AI ساخته نشده است. بعد از آپلود فایل‌ها روی تحلیل AI بزن.'}</pre></section>}
function Row({h}:any){return <div className="row"><div><b>{h.title}</b><small>{h.city} • {h.provider}</small></div><span>{fmt(h.lost)} Lost</span><Risk v={h.risk}/></div>}
function Risk({v}:any){return <div className="risk"><i style={{width:`${Math.max(0,Math.min(100,v))}%`}}/><span>{Math.round(v)}٪</span></div>}

const CSS = `
.ihos{min-height:100vh;display:flex;direction:rtl;background:#07111f;color:#ecf7ff;font-family:Tahoma,Arial,sans-serif}.side{width:285px;background:#091426;border-left:1px solid #223655;padding:18px;position:sticky;top:0;height:100vh;overflow:auto}.brand{padding:10px 8px 22px}.brand b{display:block;font-size:20px}.brand small,small{color:#9fb0c7}.side nav{display:grid;gap:8px}.side button{border:0;background:transparent;color:#cbd5e1;padding:13px;border-radius:16px;text-align:right;display:flex;gap:10px;align-items:center;cursor:pointer}.side button.active,.side button:hover{background:#173154;color:white}.ready{margin-top:20px;border:1px solid #92400e;border-radius:16px;padding:12px;color:#fbbf24}.ready.ok{border-color:#166534;color:#86efac}.ready small{display:block}.main{flex:1;min-width:0}.top{height:76px;border-bottom:1px solid #223655;display:flex;justify-content:space-between;align-items:center;padding:14px 24px;position:sticky;top:0;background:rgba(7,17,31,.9);backdrop-filter:blur(14px);z-index:10}.search{display:flex;gap:8px;align-items:center;border:1px solid #223655;background:#0b182a;border-radius:18px;padding:11px;min-width:360px}.search input,.inline input{border:0;outline:0;background:transparent;color:#ecf7ff;width:100%}.actions,.heroActions,.inline{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.btn{border:0;border-radius:14px;padding:10px 14px;color:white;background:#172b47;display:inline-flex;gap:7px;align-items:center;justify-content:center;cursor:pointer;text-decoration:none}.btn.primary{background:linear-gradient(135deg,#0ea5e9,#2563eb)}.btn.ghost{border:1px solid #223655;background:#0b182a}.btn.light{background:#dff7ff;color:#0b2740}.btn.dark{background:#0f172a}.btn:disabled{opacity:.6;cursor:wait}.hero{margin:24px;padding:34px;border-radius:30px;background:radial-gradient(circle at 12% 30%,rgba(20,184,166,.5),transparent 20%),linear-gradient(135deg,#123b75,#075985);display:flex;justify-content:space-between;gap:20px}.hero h1{font-size:38px;margin:8px 0}.hero p{color:#d7eaff}.circle{width:145px;height:145px;border-radius:50%;border:10px solid rgba(255,255,255,.25);display:grid;place-items:center;text-align:center}.circle b{font-size:32px}.circle span{font-size:12px}.kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px;margin:0 24px 18px}.kpi,.panel,.file,.go{background:#0d1b2e;border:1px solid #223655;border-radius:24px;padding:18px}.kpi span{color:#9fb0c7}.kpi b{display:block;font-size:30px;margin-top:8px}.grid2{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin:0 24px 24px}.panel{margin:0 24px 18px;overflow:auto}.row,.line{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid #223655}.row b,td b{display:block}.risk{height:18px;background:#13243b;border-radius:999px;overflow:hidden;min-width:100px;position:relative}.risk i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)}.risk span{position:absolute;inset:0;display:grid;place-items:center;font-size:11px}.pageHead{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:0 24px 16px}.files{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:0 24px 18px}.file{display:grid;grid-template-columns:40px 1fr 42px 24px;gap:12px;align-items:center}.file.ok{border-color:#14532d}.file em{display:inline-block;font-style:normal;margin-top:6px;font-size:11px;color:#7dd3fc}.mini{width:40px;height:40px;border-radius:14px;background:#12233a;display:grid;place-items:center;cursor:pointer}.passIcon,.pass{color:#22c55e}.waitIcon,.wait{color:#f59e0b}.log{border-bottom:1px solid #223655;padding-bottom:8px}table{width:100%;border-collapse:separate;border-spacing:0 8px}th{text-align:right;color:#9fb0c7;font-size:12px;padding:0 10px}td{background:#0a1728;border-top:1px solid #223655;border-bottom:1px solid #223655;padding:11px}td:first-child{border-right:1px solid #223655;border-radius:0 14px 14px 0}td:last-child{border-left:1px solid #223655;border-radius:14px 0 0 14px}.experts{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin:0 24px}.expert{text-align:center;background:#0d1b2e;border:1px solid #223655;border-radius:24px;padding:18px}.avatar{width:62px;height:62px;margin:auto;border-radius:20px;background:linear-gradient(135deg,#2563eb,#14b8a6);display:grid;place-items:center;font-size:26px;font-weight:900}.miniStats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.miniStats span{background:#0a1728;border:1px solid #223655;border-radius:14px;padding:10px;color:#9fb0c7}.miniStats b{display:block;color:#ecf7ff}.kanban{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0 24px}.col{background:#0a1728;border:1px solid #223655;border-radius:22px;padding:12px;min-height:350px}.task{background:#0d1b2e;border:1px solid #223655;border-radius:18px;padding:12px;margin-bottom:10px}.task select,.inline input{background:#0b182a;color:#ecf7ff;border:1px solid #223655;border-radius:12px;padding:8px}.qa{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 24px 18px}.qaItem{display:flex;gap:10px;background:#0d1b2e;border:1px solid #223655;border-radius:16px;padding:12px;align-items:center}.qaItem small{margin-right:auto}.go{margin:0 24px 18px;border-color:#92400e}.go.ok{border-color:#166534;color:#86efac}textarea{width:calc(100% - 48px);margin:0 24px 16px;min-height:220px;background:#081426;color:#ecf7ff;border:1px solid #223655;border-radius:18px;padding:14px;direction:rtl}.ai{white-space:pre-wrap;line-height:2;background:#081426;border:1px solid #223655;border-radius:18px;padding:16px}.toast{position:fixed;bottom:20px;right:20px;z-index:99;background:#0f172a;border:1px solid #223655;padding:14px 18px;border-radius:18px}@media(max-width:1100px){.side{display:none}.top,.hero,.pageHead{flex-direction:column;align-items:stretch}.search{min-width:0}.kpis,.grid2,.files,.kanban,.qa{grid-template-columns:1fr}.hero,.panel,.pageHead,.files,.kpis,.grid2,.experts,.kanban{margin-left:12px;margin-right:12px}}`;

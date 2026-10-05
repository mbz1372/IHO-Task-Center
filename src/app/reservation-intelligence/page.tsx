'use client';

import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, ArrowRight, BarChart3, Bot, Brain, CheckCircle2, ClipboardList, Download, Hotel, RefreshCw, Sparkles, TrendingUp, Upload } from 'lucide-react';

type ReservationRow = {
  id: string;
  hotel_title: string;
  city?: string;
  channel?: string;
  status?: string;
  confirmed: boolean;
  nights: number;
  amount: number;
  profit: number;
  reason?: string;
  created_at?: string;
  raw?: Record<string, any>;
};

type TrafficRow = {
  id: string;
  hotel_title?: string;
  city?: string;
  channel?: string;
  sessions: number;
  visitors: number;
  searches: number;
  room_views: number;
  booking_starts: number;
  reservations: number;
  date?: string;
  raw?: Record<string, any>;
};

type HotelInsight = {
  hotel: string;
  city: string;
  confirmed: number;
  unconfirmed: number;
  requests: number;
  nights: number;
  amount: number;
  profit: number;
  sessions: number;
  bookingStarts: number;
  conversion: number;
  trafficConversion: number;
  risk: number;
  reason: string;
};

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', direction: 'rtl', background: '#f5f7fb', color: '#0f172a', fontFamily: 'Vazirmatn, IRANSans, Segoe UI, sans-serif' },
  shell: { maxWidth: 1440, margin: '0 auto', padding: 24 },
  hero: { display: 'grid', gridTemplateColumns: '1.5fr .9fr', gap: 18, alignItems: 'stretch' },
  panel: { background: 'rgba(255,255,255,.92)', border: '1px solid #e5e7eb', borderRadius: 28, boxShadow: '0 18px 50px rgba(15,23,42,.07)', padding: 22 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 22, padding: 18, boxShadow: '0 12px 32px rgba(15,23,42,.05)' },
  h1: { fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: '-.02em' },
  muted: { color: '#64748b', lineHeight: 1.9 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 },
  grid2: { display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 16 },
  btn: { border: 0, borderRadius: 16, padding: '11px 15px', fontWeight: 800, cursor: 'pointer', background: '#2563eb', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8 },
  ghost: { border: '1px solid #e5e7eb', borderRadius: 16, padding: '10px 14px', fontWeight: 800, cursor: 'pointer', background: '#fff', color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: 8 },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', fontSize: 13 },
  th: { color: '#64748b', fontWeight: 800, textAlign: 'right', padding: '0 12px' },
  td: { background: '#fff', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: 12 },
  pill: { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900 },
  input: { border: '1px solid #e5e7eb', borderRadius: 16, padding: '12px 14px', background: '#fff', width: '100%' },
  barOuter: { height: 10, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' },
  barInner: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#06b6d4)' }
};

const uid = () => (globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`);
const norm = (s: any) => String(s ?? '').trim();
const toNum = (v: any) => {
  const n = Number(String(v ?? 0).replace(/[٬,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const pick = (row: any, names: string[]) => {
  const keys = Object.keys(row || {});
  const found = keys.find(k => names.some(n => norm(k).toLowerCase() === n.toLowerCase() || norm(k).includes(n)));
  return found ? row[found] : '';
};
const isConfirmed = (row: any) => {
  const text = `${pick(row, ['وضعیت', 'status', 'Confirm', 'confirmed'])} ${JSON.stringify(row)}`.toLowerCase();
  return text.includes('تایید') || text.includes('confirmed') || text.includes('قطعی') || text.includes('success');
};

const demoReservations: ReservationRow[] = [
  { id: 'r-demo-1', hotel_title: 'هتل درویشی مشهد', city: 'مشهد', channel: 'B2C', status: 'تایید شده', confirmed: true, nights: 8, amount: 86000000, profit: 8600000, created_at: new Date().toISOString() },
  { id: 'r-demo-2', hotel_title: 'هتل پارس مشهد', city: 'مشهد', channel: 'B2C', status: 'تایید نشده', confirmed: false, nights: 4, amount: 34000000, profit: 0, reason: 'عدم ظرفیت آنلاین', created_at: new Date().toISOString() },
  { id: 'r-demo-3', hotel_title: 'هتل عباسی اصفهان', city: 'اصفهان', channel: 'B2B', status: 'تایید نشده', confirmed: false, nights: 2, amount: 24000000, profit: 0, reason: 'عدم رقابت نرخ', created_at: new Date().toISOString() }
];
const demoTraffic: TrafficRow[] = [
  { id: 't-demo-1', hotel_title: 'هتل درویشی مشهد', city: 'مشهد', channel: 'Organic', sessions: 920, visitors: 710, searches: 380, room_views: 210, booking_starts: 46, reservations: 18 },
  { id: 't-demo-2', hotel_title: 'هتل پارس مشهد', city: 'مشهد', channel: 'Paid', sessions: 740, visitors: 560, searches: 310, room_views: 170, booking_starts: 34, reservations: 5 },
  { id: 't-demo-3', hotel_title: 'هتل عباسی اصفهان', city: 'اصفهان', channel: 'Organic', sessions: 620, visitors: 480, searches: 220, room_views: 130, booking_starts: 22, reservations: 3 }
];

function Metric({ title, value, sub, icon: Icon, tone = '#2563eb' }: any) {
  return <div style={S.card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
      <div><div style={{ color: '#64748b', fontWeight: 800, fontSize: 13 }}>{title}</div><div style={{ fontSize: 27, fontWeight: 950, marginTop: 6 }}>{value}</div></div>
      <div style={{ width: 44, height: 44, borderRadius: 16, background: `${tone}18`, color: tone, display: 'grid', placeItems: 'center' }}><Icon size={22} /></div>
    </div>
    <div style={{ ...S.muted, fontSize: 12, marginTop: 10 }}>{sub}</div>
  </div>;
}

function RiskPill({ risk }: { risk: number }) {
  const color = risk >= 75 ? '#dc2626' : risk >= 50 ? '#f59e0b' : '#16a34a';
  const bg = risk >= 75 ? '#fee2e2' : risk >= 50 ? '#fef3c7' : '#dcfce7';
  return <span style={{ ...S.pill, background: bg, color }}>{risk >= 75 ? 'بحرانی' : risk >= 50 ? 'نیازمند پیگیری' : 'سالم'} · {risk}%</span>;
}

export default function ReservationIntelligencePage() {
  const [reservations, setReservations] = useState<ReservationRow[]>(demoReservations);
  const [traffic, setTraffic] = useState<TrafficRow[]>(demoTraffic);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiText, setAiText] = useState('');
  const [query, setQuery] = useState('برای مدیر تأمین، وضعیت رزروهای از دست‌رفته و اقدام‌های فوری را خلاصه کن.');

  const insights = useMemo<HotelInsight[]>(() => {
    const map: Record<string, HotelInsight> = {};
    const ensure = (name: string, city = '') => map[name] || (map[name] = { hotel: name, city, confirmed: 0, unconfirmed: 0, requests: 0, nights: 0, amount: 0, profit: 0, sessions: 0, bookingStarts: 0, conversion: 0, trafficConversion: 0, risk: 0, reason: '' });
    reservations.forEach(r => {
      const h = ensure(r.hotel_title || 'نامشخص', r.city || '');
      h.requests += 1; h.nights += r.nights || 0; h.amount += r.amount || 0; h.profit += r.profit || 0;
      if (r.confirmed) h.confirmed += 1; else { h.unconfirmed += 1; h.reason = r.reason || r.status || h.reason || 'نیازمند بررسی'; }
    });
    traffic.forEach(t => {
      const h = ensure(t.hotel_title || 'نامشخص', t.city || '');
      h.sessions += t.sessions || 0; h.bookingStarts += t.booking_starts || 0;
    });
    return Object.values(map).map(h => {
      h.conversion = h.requests ? Math.round((h.confirmed / h.requests) * 100) : 0;
      h.trafficConversion = h.sessions ? Number(((h.confirmed / h.sessions) * 100).toFixed(2)) : 0;
      const lostPressure = h.unconfirmed * 16;
      const trafficPressure = h.sessions > 300 && h.trafficConversion < 1.5 ? 30 : 0;
      const conversionPressure = h.conversion < 45 ? 25 : h.conversion < 65 ? 12 : 0;
      h.risk = Math.min(100, lostPressure + trafficPressure + conversionPressure);
      if (!h.reason) h.reason = h.risk >= 50 ? 'ترافیک بالا / تبدیل پایین' : 'وضعیت قابل قبول';
      return h;
    }).sort((a, b) => b.risk - a.risk || b.unconfirmed - a.unconfirmed);
  }, [reservations, traffic]);

  const totals = useMemo(() => {
    const confirmed = reservations.filter(r => r.confirmed).length;
    const unconfirmed = reservations.length - confirmed;
    const amount = reservations.reduce((s, r) => s + (r.amount || 0), 0);
    const lost = reservations.filter(r => !r.confirmed).reduce((s, r) => s + (r.amount || 0), 0);
    const sessions = traffic.reduce((s, t) => s + (t.sessions || 0), 0);
    const bookingStarts = traffic.reduce((s, t) => s + (t.booking_starts || 0), 0);
    return { confirmed, unconfirmed, amount, lost, sessions, bookingStarts, conversion: reservations.length ? Math.round((confirmed / reservations.length) * 100) : 0, trafficConversion: sessions ? Number(((confirmed / sessions) * 100).toFixed(2)) : 0 };
  }, [reservations, traffic]);

  async function importExcel(file: File, kind: 'reservation' | 'traffic') {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (kind === 'reservation') {
      const mapped = rows.map(row => ({
        id: uid(),
        hotel_title: norm(pick(row, ['نام هتل', 'هتل', 'hotel', 'hotel_title'])) || 'نامشخص',
        city: norm(pick(row, ['شهر', 'city'])),
        channel: norm(pick(row, ['کانال', 'channel', 'source'])),
        status: norm(pick(row, ['وضعیت', 'status'])) || (isConfirmed(row) ? 'تایید شده' : 'تایید نشده'),
        confirmed: isConfirmed(row),
        nights: toNum(pick(row, ['شب اقامت', 'nights', 'room_nights'])),
        amount: toNum(pick(row, ['مبلغ', 'فروش', 'amount', 'gross_sales', 'sale'])),
        profit: toNum(pick(row, ['سود', 'profit', 'margin'])),
        reason: norm(pick(row, ['دلیل', 'reason', 'علت'])),
        created_at: norm(pick(row, ['تاریخ', 'date', 'created_at'])) || new Date().toISOString(),
        raw: row
      }));
      setReservations(mapped);
      localStorage.setItem('ihos_reservation_rows', JSON.stringify(mapped));
    } else {
      const mapped = rows.map(row => ({
        id: uid(),
        hotel_title: norm(pick(row, ['نام هتل', 'هتل', 'hotel', 'hotel_title'])),
        city: norm(pick(row, ['شهر', 'city'])),
        channel: norm(pick(row, ['کانال', 'channel', 'source'])),
        sessions: toNum(pick(row, ['sessions', 'نشست', 'session'])),
        visitors: toNum(pick(row, ['users', 'visitors', 'کاربر', 'بازدیدکننده'])),
        searches: toNum(pick(row, ['searches', 'جستجو'])),
        room_views: toNum(pick(row, ['room_views', 'view', 'بازدید اتاق'])),
        booking_starts: toNum(pick(row, ['booking_starts', 'شروع رزرو', 'begin_checkout'])),
        reservations: toNum(pick(row, ['reservations', 'رزرو', 'purchase'])),
        date: norm(pick(row, ['تاریخ', 'date'])),
        raw: row
      }));
      setTraffic(mapped);
      localStorage.setItem('ihos_site_traffic_rows', JSON.stringify(mapped));
    }
  }

  function createTaskForHotel(h: HotelInsight) {
    const task = { id: uid(), title: `پیگیری ریسک رزرو: ${h.hotel}`, hotel_title: h.hotel, city: h.city, priority: h.risk >= 75 ? 'فوری' : 'بالا', status: 'جدید', category: 'تحلیل رزرو', description: `ریسک ${h.risk}% · رزرو تاییدنشده ${h.unconfirmed} · تبدیل ${h.conversion}% · دلیل: ${h.reason}`, created_at: new Date().toISOString(), labels: ['تحلیل رزرو', 'ریسک'] };
    const prev = JSON.parse(localStorage.getItem('ihos_tasks') || '[]');
    localStorage.setItem('ihos_tasks', JSON.stringify([task, ...(Array.isArray(prev) ? prev : [])]));
    alert('تسک در حافظه مرورگر ساخته شد و در همگام‌سازی بعدی قابل پیگیری است.');
  }

  function exportCsv() {
    const headers = ['hotel', 'city', 'confirmed', 'unconfirmed', 'conversion', 'trafficConversion', 'risk', 'reason'];
    const body = '\ufeff' + [headers.join(','), ...insights.map(r => headers.map(h => `"${String((r as any)[h] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' }));
    a.download = 'reservation-risk-radar.csv';
    a.click();
  }

  async function askAI() {
    setLoadingAI(true);
    setAiText('');
    try {
      const res = await fetch('/api/avalai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `${query}\n\nداده خلاصه:\n${JSON.stringify({ totals, topRisk: insights.slice(0, 10) }, null, 2)}` }) });
      const data = await res.json();
      setAiText(data.text || data.message || 'پاسخی دریافت نشد.');
    } catch (e: any) {
      setAiText(`خطا در ارتباط با Aval AI: ${e?.message || e}`);
    } finally { setLoadingAI(false); }
  }

  return <main style={S.page}>
    <div style={S.shell}>
      <section style={S.hero}>
        <div style={{ ...S.panel, background: 'linear-gradient(135deg,#0f172a,#1d4ed8)', color: '#fff' }}>
          <a href="/" style={{ color: '#bfdbfe', textDecoration: 'none', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8 }}><ArrowRight size={18} /> برگشت به IranHotel OS Pro</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28 }}><Sparkles /><span style={{ fontWeight: 900 }}>Reservation Intelligence Layer</span></div>
          <h1 style={{ ...S.h1, fontSize: 38, marginTop: 10 }}>تحلیل داده رزرو روی نسخه پرو عملیات</h1>
          <p style={{ ...S.muted, color: '#dbeafe', maxWidth: 760 }}>این ماژول به جای ساده‌کردن داشبورد اصلی، کنار سیستم Pro قرار گرفته و داده‌های رزرو قطعی، غیرقطعی و ترافیک سایت را به ریسک هتل، تسک عملیاتی و گزارش مدیریتی تبدیل می‌کند.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            <label style={S.btn}><Upload size={18} /> ورود اکسل رزرو<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && importExcel(e.target.files[0], 'reservation')} /></label>
            <label style={{ ...S.ghost, background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.22)' }}><Upload size={18} /> ورود اکسل ترافیک<input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && importExcel(e.target.files[0], 'traffic')} /></label>
            <button style={{ ...S.ghost, background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'rgba(255,255,255,.22)' }} onClick={exportCsv}><Download size={18} /> خروجی ریسک</button>
          </div>
        </div>
        <div style={S.panel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Brain color="#2563eb" /><b>فرمان مدیریتی پیشنهادی</b></div>
          <p style={S.muted}>هر صبح این سه خروجی را چک کن: هتل‌های پرترافیک کم‌تبدیل، رزروهای تاییدنشده ارزشمند، و علت‌های تکرارشونده از دست رفتن رزرو.</p>
          <div style={{ ...S.barOuter, marginTop: 18 }}><div style={{ ...S.barInner, width: `${Math.min(100, totals.conversion)}%` }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#64748b', fontWeight: 800 }}><span>نرخ تبدیل رزرو</span><span>{totals.conversion}%</span></div>
        </div>
      </section>

      <section style={{ ...S.grid4, marginTop: 16 }}>
        <Metric title="رزرو تاییدشده" value={totals.confirmed.toLocaleString('fa-IR')} sub="از کل ورودی رزرو" icon={CheckCircle2} tone="#16a34a" />
        <Metric title="رزرو تاییدنشده" value={totals.unconfirmed.toLocaleString('fa-IR')} sub="هدف اصلی برای نجات فروش" icon={AlertTriangle} tone="#dc2626" />
        <Metric title="ارزش از دست‌رفته" value={totals.lost.toLocaleString('fa-IR')} sub="بر اساس مبلغ رزروهای غیرقطعی" icon={TrendingUp} tone="#f59e0b" />
        <Metric title="تبدیل ترافیک به رزرو" value={`${totals.trafficConversion}%`} sub={`${totals.sessions.toLocaleString('fa-IR')} نشست سایت`} icon={BarChart3} tone="#2563eb" />
      </section>

      <section style={{ ...S.grid2, marginTop: 16 }}>
        <div style={S.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div><h2 style={{ margin: 0, fontSize: 20 }}>Hotel Risk Radar رزروی</h2><div style={S.muted}>اولویت اقدام برای تیم تأمین بر اساس رزرو از دست‌رفته و ترافیک کم‌تبدیل</div></div>
            <button style={S.ghost} onClick={() => { setReservations(demoReservations); setTraffic(demoTraffic); }}><RefreshCw size={17} /> داده نمونه</button>
          </div>
          <div style={{ overflowX: 'auto' }}><table style={S.table}><thead><tr><th style={S.th}>هتل</th><th style={S.th}>تبدیل</th><th style={S.th}>غیرقطعی</th><th style={S.th}>ترافیک</th><th style={S.th}>ریسک</th><th style={S.th}>اقدام</th></tr></thead><tbody>{insights.map(h => <tr key={h.hotel}><td style={{ ...S.td, borderRight: '1px solid #e5e7eb', borderRadius: '0 14px 14px 0' }}><b>{h.hotel}</b><div style={{ color: '#64748b', fontSize: 12 }}>{h.city || '—'} · {h.reason}</div></td><td style={S.td}>{h.conversion}%</td><td style={S.td}>{h.unconfirmed}</td><td style={S.td}>{h.sessions.toLocaleString('fa-IR')}</td><td style={S.td}><RiskPill risk={h.risk} /></td><td style={{ ...S.td, borderLeft: '1px solid #e5e7eb', borderRadius: '14px 0 0 14px' }}><button style={{ ...S.ghost, padding: '8px 10px' }} onClick={() => createTaskForHotel(h)}><ClipboardList size={16} /> تسک</button></td></tr>)}</tbody></table></div>
        </div>

        <div style={S.panel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bot color="#2563eb" /><h2 style={{ margin: 0, fontSize: 20 }}>Aval AI Assistant</h2></div>
          <p style={S.muted}>خلاصه مدیریتی، علت‌یابی افت تبدیل، و پیشنهاد اقدام را از روی داده‌های همین صفحه تولید می‌کند.</p>
          <textarea style={{ ...S.input, minHeight: 110, resize: 'vertical' }} value={query} onChange={e => setQuery(e.target.value)} />
          <button style={{ ...S.btn, marginTop: 10 }} onClick={askAI} disabled={loadingAI}><Brain size={18} /> {loadingAI ? 'در حال تحلیل...' : 'تحلیل با Aval AI'}</button>
          <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 18, padding: 14, minHeight: 140, whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{aiText || 'هنوز تحلیلی ساخته نشده است.'}</div>
        </div>
      </section>

      <section style={{ ...S.grid3, marginTop: 16 }}>
        <div style={S.card}><Hotel color="#2563eb" /><h3>اتصال به پروفایل هتل</h3><p style={S.muted}>خروجی این صفحه باید در مرحله بعد داخل پرونده هر هتل نمایش داده شود: رزروهای قطعی، غیرقطعی، قیف تبدیل، ریسک و پیشنهاد اقدام.</p></div>
        <div style={S.card}><ClipboardList color="#2563eb" /><h3>تبدیل تحلیل به تسک</h3><p style={S.muted}>برای هر هتل پرریسک می‌توان تسک پیگیری ساخت تا در Task Center و KPI کارشناسان قابل ردیابی باشد.</p></div>
        <div style={S.card}><BarChart3 color="#2563eb" /><h3>داشبورد مدیرعامل</h3><p style={S.muted}>KPIهای اصلی: رزرو نجات‌داده‌شده، ارزش فروش در خطر، نرخ تبدیل شهر/کانال/هتل و تیم مسئول پیگیری.</p></div>
      </section>
    </div>
  </main>;
}

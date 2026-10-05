"use client";

import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, BarChart3, Bot, CheckCircle2, ClipboardList, Download, FileSpreadsheet, Hotel, Loader2, Sparkles, TrendingUp, Upload, Users } from "lucide-react";

type FileKey = "reservationList" | "hotelData" | "confirmedSales" | "unconfirmedSales" | "mehrMo" | "assignment" | "traffic";
type Dataset = Record<FileKey, any[]>;

type Insight = {
  hotel: string;
  city: string;
  category: string;
  provider: string;
  capacityOwner: string;
  rateOwner: string;
  confirmed: number;
  unconfirmed: number;
  requests: number;
  nights: number;
  sale: number;
  profit: number;
  sessions: number;
  conversion: number;
  trafficConversion: number;
  risk: number;
  reason: string;
};

const FILES: { key: FileKey; title: string; hint: string; headerRow?: number }[] = [
  { key: "reservationList", title: "لیست رزرو.xlsx", hint: "لیست خام رزروها / درخواست‌ها" },
  { key: "hotelData", title: "All Hotel Data(1).xlsx", hint: "Master هتل‌ها، Provider، شهر، دسته‌بندی" },
  { key: "confirmedSales", title: "1405 Sale of confirmed reservations.xlsx", hint: "فروش رزروهای قطعی ۱۴۰۵" },
  { key: "unconfirmedSales", title: "1405 Sale of unconfirmed reservations.xlsx", hint: "رزروهای قطعی نشده / از دست‌رفته" },
  { key: "mehrMo", title: "Mehr Mo hotels.xlsx", hint: "فایل مهرمو با Header از ردیف سوم", headerRow: 2 },
  { key: "assignment", title: "Hotel Assignment.xlsx", hint: "مسئول نرخ، ظرفیت، سیتی‌منیجر" },
  { key: "traffic", title: "ترافیک بازدید سایت Analytics.xlsx", hint: "ترافیک، Session، View، Checkout" }
];

const initialData: Dataset = { reservationList: [], hotelData: [], confirmedSales: [], unconfirmedSales: [], mehrMo: [], assignment: [], traffic: [] };

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", direction: "rtl", background: "linear-gradient(180deg,#f6f8fc,#eef3f8)", color: "#0f172a", fontFamily: "Vazirmatn, IRANSans, Segoe UI, sans-serif" },
  wrap: { maxWidth: 1480, margin: "0 auto", padding: 24 },
  hero: { display: "grid", gridTemplateColumns: "1.35fr .8fr", gap: 18, alignItems: "stretch" },
  panel: { background: "rgba(255,255,255,.94)", border: "1px solid #e5e7eb", borderRadius: 28, boxShadow: "0 18px 50px rgba(15,23,42,.07)", padding: 22 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 18, boxShadow: "0 12px 32px rgba(15,23,42,.05)" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 },
  grid2: { display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 16 },
  h1: { margin: 0, fontSize: 31, fontWeight: 950, letterSpacing: "-.03em" },
  muted: { color: "#64748b", lineHeight: 1.9 },
  btn: { border: 0, borderRadius: 16, padding: "11px 15px", fontWeight: 900, cursor: "pointer", background: "#2563eb", color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 },
  ghost: { border: "1px solid #e5e7eb", borderRadius: 16, padding: "10px 14px", fontWeight: 900, cursor: "pointer", background: "#fff", color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 },
  input: { border: "1px solid #e5e7eb", borderRadius: 16, padding: "12px 14px", background: "#fff", width: "100%" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 10px", fontSize: 13 },
  th: { color: "#64748b", fontWeight: 900, padding: "0 12px", textAlign: "right" },
  td: { background: "#fff", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: 12, verticalAlign: "top" },
  pill: { display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 950 },
  barOuter: { height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" },
  barInner: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#2563eb,#06b6d4)" }
};

const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random()}`;
const norm = (v: any) => String(v ?? "").trim();
const lower = (v: any) => norm(v).toLowerCase();
const num = (v: any) => { const n = Number(String(v ?? 0).replace(/[٬,\s]/g, "").replace(/,/g, "")); return Number.isFinite(n) ? n : 0; };
const has = (text: string, words: string[]) => words.some(w => text.includes(w.toLowerCase()));
const pick = (row: any, names: string[]) => {
  const keys = Object.keys(row || {});
  const exact = keys.find(k => names.some(n => lower(k) === lower(n)));
  const contains = keys.find(k => names.some(n => lower(k).includes(lower(n)) || lower(n).includes(lower(k))));
  return row[exact || contains || ""] ?? "";
};
const hotelName = (row: any) => norm(pick(row, ["نام هتل", "هتل", "Hotel", "HotelName", "hotel_title", "عنوان هتل", "Name"])) || "نامشخص";
const cityName = (row: any) => norm(pick(row, ["شهر", "City", "city", "نام شهر"])) || "";
const statusText = (row: any) => `${pick(row, ["وضعیت", "Status", "status", "Confirm", "confirmed"])} ${JSON.stringify(row)}`.toLowerCase();
const isConfirmed = (row: any) => has(statusText(row), ["تایید", "قطعی", "confirmed", "success", "ok"]);
const isUnconfirmed = (row: any) => has(statusText(row), ["عدم", "تایید نشده", "ناموفق", "unconfirmed", "failed", "cancel", "کنسل"]);
const money = (v: number) => v > 999999999 ? `${(v / 1_000_000_000).toFixed(1)}B` : v > 999999 ? `${(v / 1_000_000).toFixed(0)}M` : String(Math.round(v));

async function readXlsx(file: File, headerRow = 0) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "", range: headerRow }) as any[];
}

function detectKey(fileName: string): FileKey | null {
  const n = fileName.toLowerCase();
  if (n.includes("all hotel data")) return "hotelData";
  if (n.includes("confirmed")) return "confirmedSales";
  if (n.includes("unconfirmed")) return "unconfirmedSales";
  if (n.includes("mehr")) return "mehrMo";
  if (n.includes("assignment")) return "assignment";
  if (n.includes("analytics") || n.includes("traffic") || n.includes("ترافیک")) return "traffic";
  if (n.includes("لیست") || n.includes("reserve") || n.includes("رزرو")) return "reservationList";
  return null;
}

function Metric({ title, value, sub, icon: Icon, tone = "#2563eb" }: any) {
  return <div style={s.card}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <div><div style={{ color: "#64748b", fontWeight: 900, fontSize: 13 }}>{title}</div><div style={{ fontSize: 27, fontWeight: 950, marginTop: 6 }}>{value}</div></div>
      <div style={{ width: 44, height: 44, borderRadius: 16, background: `${tone}18`, color: tone, display: "grid", placeItems: "center" }}><Icon size={22} /></div>
    </div>
    <div style={{ ...s.muted, fontSize: 12, marginTop: 10 }}>{sub}</div>
  </div>;
}

function Risk({ risk }: { risk: number }) {
  const color = risk >= 75 ? "#dc2626" : risk >= 50 ? "#d97706" : "#16a34a";
  const bg = risk >= 75 ? "#fee2e2" : risk >= 50 ? "#fef3c7" : "#dcfce7";
  return <span style={{ ...s.pill, background: bg, color }}>{risk >= 75 ? "بحرانی" : risk >= 50 ? "نیازمند پیگیری" : "سالم"} · {risk}%</span>;
}

export default function ReservationIntelligencePage() {
  const [data, setData] = useState<Dataset>(initialData);
  const [names, setNames] = useState<Record<FileKey, string>>({} as any);
  const [aiPrompt, setAiPrompt] = useState("با توجه به فایل‌های آپلود شده، ۲۰ اقدام فوری امروز تیم Supply برای جلوگیری از از دست رفتن رزرو را بده.");
  const [aiText, setAiText] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  async function importFile(file: File, forced?: FileKey) {
    const key = forced || detectKey(file.name);
    if (!key) return alert(`فایل شناسایی نشد: ${file.name}`);
    const cfg = FILES.find(f => f.key === key)!;
    const rows = await readXlsx(file, cfg.headerRow || 0);
    setData(prev => ({ ...prev, [key]: rows }));
    setNames(prev => ({ ...prev, [key]: file.name }));
  }

  async function importMany(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) await importFile(file);
  }

  const insights = useMemo<Insight[]>(() => {
    const map: Record<string, Insight> = {};
    const ensure = (name: string, city = "") => map[name] || (map[name] = { hotel: name, city, category: "", provider: "", capacityOwner: "", rateOwner: "", confirmed: 0, unconfirmed: 0, requests: 0, nights: 0, sale: 0, profit: 0, sessions: 0, conversion: 0, trafficConversion: 0, risk: 0, reason: "" });

    data.hotelData.forEach(r => {
      const h = ensure(hotelName(r), cityName(r));
      h.category = norm(pick(r, ["CaringCategory", "دسته بندی هتل", "دسته‌بندی", "Category"])) || h.category;
      h.provider = norm(pick(r, ["نام پروایدر", "Provider", "provider"])) || h.provider;
    });

    data.assignment.forEach(r => {
      const h = ensure(hotelName(r), cityName(r));
      h.capacityOwner = norm(pick(r, ["حامی ظرفیت", "مسئول ظرفیت", "capacity", "Task1", "تسک۱"])) || h.capacityOwner;
      h.rateOwner = norm(pick(r, ["حامی نرخ", "مسئول نرخ", "rate", "Task2", "تسک۲"])) || h.rateOwner;
    });

    const addReservation = (r: any, forced?: "confirmed" | "unconfirmed") => {
      const h = ensure(hotelName(r), cityName(r));
      h.requests += 1;
      const confirmed = forced === "confirmed" || (!forced && isConfirmed(r));
      const unconfirmed = forced === "unconfirmed" || (!confirmed && (isUnconfirmed(r) || true));
      if (confirmed) h.confirmed += 1;
      if (unconfirmed && !confirmed) h.unconfirmed += 1;
      h.nights += num(pick(r, ["شب اقامت", "RoomNight", "nights", "تعداد شب", "شب"]));
      h.sale += num(pick(r, ["مبلغ", "مبلغ رزرو", "فروش", "Gross", "Sale", "amount"]));
      h.profit += num(pick(r, ["سود", "Profit", "margin", "سود هتل"]));
      if (!confirmed && !h.reason) h.reason = norm(pick(r, ["دلیل", "علت", "Reason", "وضعیت"])) || "رزرو تایید نشده / نیازمند پیگیری";
    };
    data.reservationList.forEach(r => addReservation(r));
    data.confirmedSales.forEach(r => addReservation(r, "confirmed"));
    data.unconfirmedSales.forEach(r => addReservation(r, "unconfirmed"));

    data.traffic.forEach(r => {
      const h = ensure(hotelName(r), cityName(r));
      h.sessions += num(pick(r, ["sessions", "Sessions", "نشست", "بازدید", "Users", "کاربر"]));
    });

    data.mehrMo.forEach(r => {
      const h = ensure(hotelName(r), cityName(r));
      if (!h.category) h.category = norm(pick(r, ["CaringCategory", "دسته", "Category"]));
    });

    return Object.values(map).map(h => {
      h.conversion = h.requests ? Math.round((h.confirmed / h.requests) * 100) : 0;
      h.trafficConversion = h.sessions ? Number(((h.confirmed / h.sessions) * 100).toFixed(2)) : 0;
      const lostPressure = Math.min(45, h.unconfirmed * 8);
      const conversionPressure = h.requests >= 3 && h.conversion < 45 ? 25 : h.conversion < 65 ? 12 : 0;
      const trafficPressure = h.sessions >= 200 && h.trafficConversion < 1 ? 20 : 0;
      const ownershipPressure = !h.capacityOwner || !h.rateOwner ? 10 : 0;
      h.risk = Math.min(100, lostPressure + conversionPressure + trafficPressure + ownershipPressure);
      if (!h.reason) h.reason = h.risk >= 60 ? "تبدیل پایین / رزرو از دست‌رفته" : "وضعیت قابل قبول";
      return h;
    }).filter(h => h.hotel !== "نامشخص" || h.requests || h.sessions).sort((a, b) => b.risk - a.risk || b.unconfirmed - a.unconfirmed || b.sessions - a.sessions);
  }, [data]);

  const totals = useMemo(() => {
    const confirmed = insights.reduce((a, h) => a + h.confirmed, 0);
    const unconfirmed = insights.reduce((a, h) => a + h.unconfirmed, 0);
    const sessions = insights.reduce((a, h) => a + h.sessions, 0);
    const sale = insights.reduce((a, h) => a + h.sale, 0);
    const risky = insights.filter(h => h.risk >= 60).length;
    return { confirmed, unconfirmed, sessions, sale, risky, conversion: confirmed + unconfirmed ? Math.round((confirmed / (confirmed + unconfirmed)) * 100) : 0 };
  }, [insights]);

  function createTask(h: Insight) {
    const task = { id: uid(), title: `پیگیری فوری رزروهای از دست‌رفته ${h.hotel}`, description: `ریسک ${h.risk}٪ - ${h.reason}. مسئول ظرفیت: ${h.capacityOwner || "نامشخص"}، مسئول نرخ: ${h.rateOwner || "نامشخص"}`, hotel_title: h.hotel, priority: h.risk >= 75 ? "فوری" : "بالا", status: "در انتظار انجام", created_at: new Date().toISOString() };
    const old = JSON.parse(localStorage.getItem("ihos_tasks") || "[]");
    localStorage.setItem("ihos_tasks", JSON.stringify([task, ...old]));
    alert("تسک در Local Task Center ساخته شد. بعد از Sync، در تسک‌ها دیده می‌شود.");
  }

  function exportCsv() {
    const rows = insights.map(h => ({ hotel: h.hotel, city: h.city, category: h.category, provider: h.provider, capacityOwner: h.capacityOwner, rateOwner: h.rateOwner, confirmed: h.confirmed, unconfirmed: h.unconfirmed, sessions: h.sessions, conversion: h.conversion, risk: h.risk, reason: h.reason }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservation Intelligence");
    XLSX.writeFile(wb, "reservation-intelligence-risk-radar.xlsx");
  }

  async function askAI() {
    setLoadingAI(true); setAiText("");
    try {
      const top = insights.slice(0, 30).map(h => `${h.hotel} | شهر:${h.city} | ریسک:${h.risk} | قطعی:${h.confirmed} | غیرقطعی:${h.unconfirmed} | ترافیک:${h.sessions} | مسئول ظرفیت:${h.capacityOwner || "-"} | مسئول نرخ:${h.rateOwner || "-"}`).join("\n");
      const res = await fetch("/api/avalai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: `${aiPrompt}\n\nداده خلاصه:\n${top}` }) });
      const json = await res.json();
      setAiText(json.text || json.message || JSON.stringify(json));
    } catch (e: any) { setAiText(e?.message || "خطا در Aval AI"); }
    finally { setLoadingAI(false); }
  }

  return <main style={s.page}>
    <div style={s.wrap}>
      <section style={s.hero}>
        <div style={s.panel}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}><span style={{ ...s.pill, background: "#dbeafe", color: "#1d4ed8" }}><Sparkles size={14}/> V8.2 Exact Upload Profile</span></div>
          <h1 style={s.h1}>تحلیل داده رزرو براساس ساختار واقعی فایل‌های ایران‌هتل</h1>
          <p style={s.muted}>این صفحه دقیقاً با همین ۷ فایل کار می‌کند: لیست رزرو، All Hotel Data، فروش قطعی، فروش غیرقطعی، Mehr Mo، Assignment و Analytics. فایل‌ها را یکجا یا جداگانه آپلود کن.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <label style={s.btn}><Upload size={17}/> آپلود یکجای همه فایل‌ها<input type="file" multiple accept=".xlsx,.xls" onChange={e => importMany(e.target.files)} style={{ display: "none" }}/></label>
            <button style={s.ghost} onClick={exportCsv}><Download size={17}/> خروجی اکسل ریسک</button>
          </div>
        </div>
        <div style={s.panel}>
          <b>وضعیت فایل‌ها</b>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>{FILES.map(f => <div key={f.key} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "9px 0", borderBottom: "1px solid #eef2f7" }}><span style={{ fontSize: 12 }}>{f.title}</span>{data[f.key].length ? <span style={{ ...s.pill, background: "#dcfce7", color: "#15803d" }}><CheckCircle2 size={13}/> {data[f.key].length}</span> : <span style={{ ...s.pill, background: "#f1f5f9", color: "#64748b" }}>خالی</span>}</div>)}</div>
        </div>
      </section>

      <section style={{ ...s.grid4, marginTop: 16 }}>
        <Metric title="رزرو قطعی" value={totals.confirmed} sub="از فایل فروش قطعی و لیست رزرو" icon={CheckCircle2} tone="#16a34a" />
        <Metric title="رزرو غیرقطعی" value={totals.unconfirmed} sub="فرصت‌های از دست‌رفته / نیازمند پیگیری" icon={AlertTriangle} tone="#dc2626" />
        <Metric title="Conversion" value={`${totals.conversion}%`} sub="نسبت قطعی به کل درخواست‌های رزرو" icon={TrendingUp} tone="#2563eb" />
        <Metric title="هتل پرریسک" value={totals.risky} sub={`فروش خوانده‌شده: ${money(totals.sale)}`} icon={Hotel} tone="#f59e0b" />
      </section>

      <section style={{ ...s.grid3, marginTop: 16 }}>
        {FILES.map(f => <div key={f.key} style={s.card}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><FileSpreadsheet size={20} color="#2563eb"/><b>{f.title}</b></div>
          <p style={{ ...s.muted, fontSize: 12, minHeight: 42 }}>{f.hint}</p>
          <label style={{ ...s.ghost, width: "100%", justifyContent: "center" }}><Upload size={16}/> آپلود همین فایل<input type="file" accept=".xlsx,.xls" onChange={e => e.target.files?.[0] && importFile(e.target.files[0], f.key)} style={{ display: "none" }}/></label>
          {names[f.key] && <div style={{ ...s.muted, fontSize: 11, marginTop: 8 }}>فایل: {names[f.key]}</div>}
        </div>)}
      </section>

      <section style={{ ...s.grid2, marginTop: 16 }}>
        <div style={s.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><h2 style={{ margin: 0 }}>Hotel Risk Radar</h2><span style={{ ...s.pill, background: "#eef2ff", color: "#3730a3" }}><BarChart3 size={14}/> {insights.length} هتل</span></div>
          <div style={{ overflowX: "auto", marginTop: 12 }}><table style={s.table}><thead><tr><th style={s.th}>هتل</th><th style={s.th}>مسئول</th><th style={s.th}>رزرو</th><th style={s.th}>ترافیک</th><th style={s.th}>ریسک</th><th style={s.th}>اقدام</th></tr></thead><tbody>{insights.slice(0, 80).map(h => <tr key={h.hotel}><td style={s.td}><b>{h.hotel}</b><div style={{ ...s.muted, fontSize: 12 }}>{h.city || "-"} · {h.category || "بدون دسته"} · {h.provider || "Provider نامشخص"}</div></td><td style={s.td}><div>ظرفیت: {h.capacityOwner || "-"}</div><div>نرخ: {h.rateOwner || "-"}</div></td><td style={s.td}><b>{h.confirmed}</b> قطعی / <b>{h.unconfirmed}</b> غیرقطعی<div style={s.barOuter}><div style={{ ...s.barInner, width: `${Math.min(100, h.conversion)}%` }}/></div><small>{h.conversion}% تبدیل</small></td><td style={s.td}>{h.sessions || 0}<div style={{ ...s.muted, fontSize: 12 }}>{h.trafficConversion}% از ترافیک</div></td><td style={s.td}><Risk risk={h.risk}/><div style={{ ...s.muted, fontSize: 12, marginTop: 6 }}>{h.reason}</div></td><td style={s.td}><button style={s.ghost} onClick={() => createTask(h)}><ClipboardList size={15}/> تسک</button></td></tr>)}</tbody></table></div>
        </div>

        <div style={s.panel}>
          <h2 style={{ marginTop: 0 }}>Aval AI Assistant</h2>
          <p style={s.muted}>از Aval AI برای خلاصه مدیریتی، استخراج اقدام فوری و تحلیل علت افت تبدیل استفاده کن.</p>
          <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} style={{ ...s.input, minHeight: 120, resize: "vertical" }}/>
          <button style={{ ...s.btn, marginTop: 10 }} onClick={askAI} disabled={loadingAI}>{loadingAI ? <Loader2 size={16}/> : <Bot size={16}/>} تحلیل کن</button>
          {aiText && <pre style={{ whiteSpace: "pre-wrap", background: "#0f172a", color: "#e5e7eb", borderRadius: 18, padding: 16, lineHeight: 1.9, marginTop: 12 }}>{aiText}</pre>}
          <div style={{ ...s.card, marginTop: 14, background: "#f8fafc" }}><b><Users size={16}/> پیشنهاد عملیاتی</b><p style={s.muted}>بعد از آپلود فایل‌ها، ۸۰ هتل اول Radar را به‌صورت روزانه بین حامی ظرفیت، حامی نرخ و سیتی‌منیجر تقسیم کن. هر مورد پرریسک باید همان روز تسک و نتیجه تماس داشته باشد.</p></div>
        </div>
      </section>
    </div>
  </main>;
}

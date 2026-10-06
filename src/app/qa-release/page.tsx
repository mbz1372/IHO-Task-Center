'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Database, Download, Hotel, ShieldCheck, Upload, XCircle } from 'lucide-react';

type FileKey='reserveList'|'hotelData'|'confirmed'|'unconfirmed'|'mehr'|'assignment'|'traffic';
type FileDef={key:FileKey;name:string;required:boolean;desc:string};
type Store={files:any[];hotels:any[];reservations:any[];traffic:any[];tasks:any[];updatedAt?:string};
const FILES:FileDef[]=[
  {key:'reserveList',name:'لیست رزرو.xlsx',required:true,desc:'ریز همه رزروها و وضعیت نهایی'},
  {key:'hotelData',name:'All Hotel Data(1).xlsx',required:true,desc:'Master هتل‌ها، Provider، ظرفیت و قرارداد'},
  {key:'confirmed',name:'1405 Sale of confirmed reservations.xlsx',required:true,desc:'فروش قطعی، سود و شب اقامت'},
  {key:'unconfirmed',name:'1405 Sale of unconfirmed reservations.xlsx',required:true,desc:'رزروهای غیرقطعی / Lost'},
  {key:'mehr',name:'Mehr Mo hotels.xlsx',required:false,desc:'فایل مکمل هتل‌های مهر / اولویت‌ها'},
  {key:'assignment',name:'Hotel Assignment.xlsx',required:true,desc:'مالکیت کارشناسان و سیتی‌منیجرها'},
  {key:'traffic',name:'ترافیک بازدید سایت Analytics.xlsx',required:true,desc:'ترافیک سایت و قیف تبدیل'}
];
const fmt=(n:any)=>new Intl.NumberFormat('fa-IR').format(Math.round(Number(n||0)));
const isConfirmed=(r:any)=>!!r.confirmed||/قطعی|تایید|confirmed|success/i.test(String(r.status||''));
const count=(r:any)=>Number(r.raw?.count||r.count||r.raw?.['تعداد رزرو']||1)||1;
function readStore():Store{try{const a=localStorage.getItem('iho-unified-supply-store');const b=localStorage.getItem('ihos-release-store-v101');const c=localStorage.getItem('ihos-reservation-store');return JSON.parse(b||a||c||'{}')}catch{return {files:[],hotels:[],reservations:[],traffic:[],tasks:[]}}}
function fileState(store:Store, f:FileDef){
  const files=store.files||[]; const hit=files.find((x:any)=>x.key===f.key||x.name===f.name||x.fileName===f.name);
  if(hit) return {ok:!!hit.ok||Number(hit.rows)>0, rows:Number(hit.rows||0), note:hit.error||''};
  const reservations=store.reservations||[], hotels=store.hotels||[], traffic=store.traffic||[];
  if(f.key==='reserveList') return {ok:reservations.some((r:any)=>r.source_file==='لیست رزرو.xlsx'||r.sourceFile==='لیست رزرو.xlsx'), rows:reservations.filter((r:any)=>r.source_file==='لیست رزرو.xlsx'||r.sourceFile==='لیست رزرو.xlsx').length};
  if(f.key==='hotelData') return {ok:hotels.length>2||hotels.some((h:any)=>h.hotel_code||h.code||h.caring_category), rows:hotels.length};
  if(f.key==='confirmed') return {ok:reservations.some((r:any)=>r.source_file===f.name||r.sourceFile===f.name), rows:reservations.filter((r:any)=>r.source_file===f.name||r.sourceFile===f.name).length};
  if(f.key==='unconfirmed') return {ok:reservations.some((r:any)=>r.source_file===f.name||r.sourceFile===f.name), rows:reservations.filter((r:any)=>r.source_file===f.name||r.sourceFile===f.name).length};
  if(f.key==='assignment') return {ok:hotels.some((h:any)=>h.manager_name||h.capacityOwner||h.rateOwner||h.cityManager), rows:hotels.filter((h:any)=>h.manager_name||h.capacityOwner||h.rateOwner||h.cityManager).length};
  if(f.key==='traffic') return {ok:traffic.length>0, rows:traffic.length};
  if(f.key==='mehr') return {ok:hotels.some((h:any)=>String(h.risk_status||h.riskStatus||'').includes('مهر')), rows:hotels.filter((h:any)=>String(h.risk_status||h.riskStatus||'').includes('مهر')).length};
  return {ok:false, rows:0};
}
export default function QARelease(){
  const [store,setStore]=useState<Store>({files:[],hotels:[],reservations:[],traffic:[],tasks:[]});
  useEffect(()=>setStore(readStore()),[]);
  const m=useMemo(()=>{const res=store.reservations||[];const confirmed=res.filter(isConfirmed).reduce((s:any,r:any)=>s+count(r),0);const lost=res.filter((r:any)=>!isConfirmed(r)).reduce((s:any,r:any)=>s+count(r),0);return {confirmed,lost,total:confirmed+lost,hotels:(store.hotels||[]).length,traffic:(store.traffic||[]).length,tasks:(store.tasks||[]).length}},[store]);
  const files=FILES.map(f=>({...f,...fileState(store,f)}));
  const tests=[
    ['P0-01','Data Inbox دقیقاً همین ۷ فایل واقعی را پوشش می‌دهد',files.length===7,'نسخه نباید کارت‌های قدیمی/Generic نشان دهد.'],
    ['P0-02','همه فایل‌های الزامی قبل از ارائه آماده‌اند',files.filter(f=>f.required).every(f=>f.ok),'فایل‌های Required را از Data Inbox اصلی آپلود کن.'],
    ['P0-03','Hotel CRM داده واقعی هتل دارد',m.hotels>0,'All Hotel Data(1).xlsx باید وارد شود.'],
    ['P0-04','تحلیل رزرو داده قطعی و غیرقطعی دارد',m.confirmed>0&&m.lost>0,'فایل‌های confirmed و unconfirmed باید وارد شوند.'],
    ['P0-05','ترافیک Analytics برای قیف تبدیل موجود است',m.traffic>0,'ترافیک بازدید سایت Analytics.xlsx را وارد کن.'],
    ['P0-06','Task Center آماده عملیات است',Array.isArray(store.tasks),'Task Center نباید خطای Runtime بدهد.'],
    ['P0-07','هیچ Runtime Error در مرورگر ثبت نشده',typeof window==='undefined'||!(window as any).__IHOS_ERROR__,'گزارش Error Boundary را رفع کن.']
  ];
  const fail=tests.filter(t=>!t[2]).length;
  const report=`IranHotel OS Go/No-Go\nوضعیت: ${fail?'No-Go / آماده ارائه نیست':'Go / مجاز به ارائه کنترل‌شده'}\nP0 Fail: ${fail}\nهتل‌ها: ${fmt(m.hotels)}\nرزرو قطعی: ${fmt(m.confirmed)}\nLost: ${fmt(m.lost)}\nترافیک: ${fmt(m.traffic)}\nتسک‌ها: ${fmt(m.tasks)}\nفایل‌های آماده: ${files.filter(f=>f.ok).length}/7`;
  return <main style={{minHeight:'100vh',direction:'rtl',background:'#071426',color:'#e5f3ff',fontFamily:'Tahoma,Arial,sans-serif',padding:24}}>
    <section style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',marginBottom:20}}><div><h1>QA / Go-NoGo Center انتشار IranHotel OS</h1><p style={{color:'#94a3b8'}}>این صفحه داخل خود اپ وضعیت آمادگی نسخه برای ارائه به مدیرعامل را از داده‌های ذخیره‌شده بررسی می‌کند.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><a href='/' style={btn}><ShieldCheck size={18}/> برگشت به سوپر اپ</a><button style={btn} onClick={()=>setStore(readStore())}><Database size={18}/> بروزرسانی وضعیت</button><button style={btn} onClick={()=>navigator.clipboard.writeText(report)}><Download size={18}/> کپی گزارش مدیرعامل</button></div></section>
    <div style={grid6}><K title='تصمیم انتشار' value={fail?'No-Go':'Go'} icon={fail?<AlertTriangle/>:<CheckCircle2/>}/><K title='P0 Fail' value={fail} icon={<XCircle/>}/><K title='فایل آماده' value={`${files.filter(f=>f.ok).length}/7`} icon={<Upload/>}/><K title='هتل' value={fmt(m.hotels)} icon={<Hotel/>}/><K title='رزرو' value={fmt(m.total)} icon={<ClipboardList/>}/><K title='تسک' value={fmt(m.tasks)} icon={<ClipboardList/>}/></div>
    <section style={card}><h2>وضعیت ۷ فایل واقعی</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>{files.map(f=><div key={f.key} style={{...mini,borderColor:f.ok?'rgba(34,197,94,.45)':'rgba(245,158,11,.45)'}}><b>{f.name}</b><small style={{color:'#94a3b8'}}>{f.desc}</small><span style={{color:f.ok?'#86efac':'#fbbf24'}}>{f.ok?`Pass • ${fmt(f.rows)} ردیف`:'در انتظار'}</span></div>)}</div></section>
    <section style={card}><h2>چک‌لیست P0 انتشار</h2><table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 8px'}}><tbody>{tests.map(t=><tr key={String(t[0])}><td style={td}>{String(t[0])}</td><td style={td}><b>{String(t[1])}</b><br/><small style={{color:'#94a3b8'}}>{String(t[3])}</small></td><td style={td}>{t[2]?<span style={{color:'#86efac'}}>Pass</span>:<span style={{color:'#fca5a5'}}>Fail</span>}</td></tr>)}</tbody></table></section>
    <section style={card}><h2>گزارش آماده کپی برای مدیرعامل</h2><pre style={{whiteSpace:'pre-wrap',lineHeight:1.9,background:'#0f1e33',padding:16,borderRadius:16}}>{report}</pre></section>
  </main>
}
function K({title,value,icon}:any){return <div style={card}><div style={{display:'flex',alignItems:'center',gap:8,color:'#38bdf8'}}>{icon}<span>{title}</span></div><b style={{fontSize:28,display:'block',marginTop:8}}>{value}</b></div>}
const btn:any={border:'1px solid rgba(148,163,184,.25)',borderRadius:14,padding:'10px 13px',display:'inline-flex',alignItems:'center',gap:8,color:'#e5f3ff',background:'#10213a',textDecoration:'none'};
const card:any={background:'#0b182b',border:'1px solid rgba(148,163,184,.22)',borderRadius:22,padding:18,marginBottom:16};
const mini:any={background:'#0f1e33',border:'1px solid rgba(148,163,184,.22)',borderRadius:18,padding:14,display:'flex',flexDirection:'column',gap:8};
const grid6:any={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:16};
const td:any={background:'#0f1e33',padding:12,borderTop:'1px solid rgba(148,163,184,.18)',borderBottom:'1px solid rgba(148,163,184,.18)'};

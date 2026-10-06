'use client';

import { useEffect } from 'react';

export default function ReservationIntelligenceRedirect(){
  useEffect(()=>{
    try{ localStorage.setItem('ihos-open-view','reservationIntelligence'); }catch{}
    window.location.replace('/');
  },[]);
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',direction:'rtl',background:'#071426',color:'#e5f3ff',fontFamily:'Tahoma, Arial, sans-serif'}}>
    <section style={{maxWidth:560,padding:32,border:'1px solid rgba(148,163,184,.25)',borderRadius:24,background:'rgba(15,23,42,.75)'}}>
      <h1>در حال انتقال به سوپر اپ یکپارچه...</h1>
      <p>از این نسخه، تحلیل رزرو دیگر دیتای جدا ندارد و داخل داشبورد اصلی از Data Inbox واحد تغذیه می‌شود.</p>
      <a href="/" style={{color:'#38bdf8'}}>رفتن به داشبورد اصلی</a>
    </section>
  </main>;
}

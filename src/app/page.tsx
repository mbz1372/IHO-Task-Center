'use client';
import SupplyOS from './supply-os/page';
export default function Home(){
 return <>
  <SupplyOS/>
  <a href="/operations" aria-label="ورود به اتاق فرمان عملیاتی" style={{position:'fixed',left:18,bottom:20,zIndex:90,display:'flex',alignItems:'center',gap:9,padding:'12px 17px',background:'#1f64d8',color:'#fff',borderRadius:15,fontWeight:800,fontSize:13,textDecoration:'none',boxShadow:'0 8px 28px #0b255455',fontFamily:'Vazirmatn,Tahoma,sans-serif'}}><span style={{fontSize:19}}>◈</span> اتاق فرمان زنجیره تأمین</a>
 </>;
}

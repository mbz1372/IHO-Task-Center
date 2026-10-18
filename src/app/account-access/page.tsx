'use client';
import {useEffect,useState} from 'react';
import {createClient,Session} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,detectSessionInUrl:true}}):null;
export default function Access(){
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const [forgot,setForgot]=useState(false),[requestSent,setRequestSent]=useState(false);
 useEffect(()=>{if(!supabase){setReady(true);return;}const db=supabase;db.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});
 const {data}=db.auth.onAuthStateChange((_ev,s)=>setSession(s));return ()=>data.subscription.unsubscribe();},[]);
 async function sendReset(e:React.FormEvent){
  e.preventDefault();if(!supabase||requestSent)return;setBusy(true);setError('');setMessage('');
  try{
   const {error:err}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:location.origin+'/account-access'});
   if(err)throw err;
   setRequestSent(true);setMessage('درخواست بازیابی ثبت شد. ایمیل خود را بررسی کن. پس از بازکردن لینک، در همین صفحه می‌توانی رمز جدید تعیین کنی.');
  }catch(e:any){
   const description=String(e?.message||'');
   setError(description.toLowerCase().includes('rate limit')?'سقف ارسال ایمیل Supabase تکمیل شده است. حدود یک ساعت پس از آخرین ارسال موفق صبر کن یا SMTP اختصاصی تنظیم شود.':'ارسال لینک بازیابی ناموفق بود: '+description);
  }finally{setBusy(false)}
 }
 async function submit(e:React.FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');setMessage('');
 try{
  if(session){
   if(password.length<12)throw Error('رمز باید حداقل ۱۲ کاراکتر باشد.');
   if(password!==confirm)throw Error('دو رمز مطابقت ندارند.');
   const {error}=await supabase.auth.updateUser({password});if(error)throw error;
   setPassword('');setConfirm('');setMessage('رمز با موفقیت ثبت شد. از این پس با ایمیل و رمز ورود کن.');
  }else{
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;
   setPassword('');setMessage('ورود موفق. به مرکز فرمان بازگرد.');
  }
 }catch(e:any){setError(e.message||'خطا در احراز هویت');}finally{setBusy(false);}
 }
 return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#10314a',padding:16,direction:'rtl'}}>
 <section style={{width:'min(440px,100%)',background:'white',color:'#19364a',padding:30,borderRadius:20,fontFamily:'Vazirmatn,system-ui',display:'grid',gap:15}}>
 <h1 style={{margin:0,fontSize:23}}>ورود امن ایران‌هتل</h1><p style={{fontSize:13,lineHeight:2,margin:0}}>{session?'حساب شناسایی شد؛ رمز تازه را در همین صفحه تعیین کن.':forgot?'برای بازیابی رمز، ایمیل حساب موجود را وارد کن. Supabase برایت لینک بازیابی ارسال می‌کند.':'با حساب موجودت و رمز عبوری که قبلاً تنظیم کرده‌ای وارد شو.'}</p>
 {session&&<p style={{fontSize:12}}>حساب واردشده: {session.user.email}</p>}
 {!ready&&<p>در حال بررسی حساب...</p>}
 {!supabase&&<p>تنظیمات Supabase در دسترس نیست.</p>}
 <form onSubmit={forgot&&!session?sendReset:submit} style={{display:'grid',gap:12}}>
 {!session&&<label style={{display:'grid',gap:5,fontSize:12}}>ایمیل<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" dir="ltr" style={{padding:12,border:'1px solid #d7e2ea',borderRadius:9}}/></label>}
 {(!forgot||!!session)&&<label style={{display:'grid',gap:5,fontSize:12}}>{session?'رمز جدید (حداقل ۱۲ کاراکتر)':'رمز ورود'}<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={session?'new-password':'current-password'} dir="ltr" style={{padding:12,border:'1px solid #d7e2ea',borderRadius:9}}/></label>}
 {session&&<label style={{display:'grid',gap:5,fontSize:12}}>تکرار رمز جدید<input required type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" dir="ltr" style={{padding:12,border:'1px solid #d7e2ea',borderRadius:9}}/></label>}
 <button type="submit" disabled={busy||!supabase||(forgot&&!session&&requestSent)} style={{padding:13,border:0,borderRadius:10,background:'#0784a1',color:'#fff'}}>{busy?'در حال پردازش':session?'ذخیره رمز دائمی':forgot?'ارسال لینک بازیابی رمز':'ورود با رمز عبور'}</button></form>
 {!session&&<button type="button" onClick={()=>{setForgot(x=>!x);setError('');setMessage('');setRequestSent(false)}} style={{background:'transparent',border:0,color:'#08759b',fontSize:13,cursor:'pointer'}}>{forgot?'بازگشت به ورود با رمز عبور':'رمزم را فراموش کرده‌ام'}</button>}
 {message&&<p style={{color:'#047857'}}>{message}</p>}{error&&<p style={{color:'#b91c1c'}}>{error}</p>}
 <a href="/" style={{fontSize:13,color:'#08759b'}}>بازگشت به مرکز فرمان</a>
 </section></main>;
}
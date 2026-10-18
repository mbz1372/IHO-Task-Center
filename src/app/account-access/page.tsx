'use client';
import {FormEvent,useEffect,useState} from 'react';
import {createClient, type Session} from '@supabase/supabase-js';
import {ArrowLeft,CheckCircle2,KeyRound,Mail,ShieldCheck,LogIn} from 'lucide-react';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
type Mode='login'|'reset'|'code';
const inputStyle:React.CSSProperties={width:'100%',border:'1px solid #d6e0ec',padding:'12px 13px',borderRadius:10,fontFamily:'inherit',fontSize:14,background:'#f9fbff',color:'#162943'};
export default function AccountAccess(){
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false),[mode,setMode]=useState<Mode>('login');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[otp,setOtp]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');

 useEffect(()=>{
  if(!supabase){setReady(true);return}
  let alive=true;
  supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setReady(true)}}).catch(()=>{if(alive)setReady(true)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,updated)=>{
   if(!alive)return;
   setSession(updated);
   if(event==='PASSWORD_RECOVERY'&&updated)setMessage('هویت از طریق لینک بازیابی تأیید شد. رمز جدید خود را وارد کن.');
  });
  return()=>{alive=false;subscription.unsubscribe()};
 },[]);

 function changeMode(next:Mode){setMode(next);setError('');setMessage('');}
 function errText(value:unknown){const s=String(value||'');
  if(/rate limit|too many requests|429/i.test(s))return 'سقف درخواست ایمیل یا تأیید کد موقتاً تکمیل شده است. بعداً دوباره امتحان کن یا SMTP سازمانی را بررسی کن.';
  if(/expired|invalid.*(token|otp)|otp_expired|403/i.test(s))return 'کد نامعتبر یا منقضی شده است. یک کد تازه درخواست کن و آخرین ایمیل را استفاده کن.';
  return s||'ارتباط با سامانه احراز هویت برقرار نشد.';
 }
 async function login(e:FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');setMessage('');
  const {error:authError}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
  if(authError)setError(errText(authError.message));else{setPassword('');setMessage('ورود موفق بود. می‌توانی وارد داشبورد شوی.')}
  setBusy(false);
 }
 async function reset(e:FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');setMessage('');
  const {error:authError}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:window.location.origin+'/account-access'});
  if(authError)setError(errText(authError.message));
  else{setMode('code');setMessage('درخواست ثبت شد. اگر ایمیل به حسابی متصل باشد، پیام بازیابی ارسال می‌شود. کد ۶ رقمی را از ایمیل وارد کن. اگر قالب ایمیل هنوز فقط لینک دارد، مدیر سیستم باید قالب Recovery را برای نمایش کد تنظیم کند.')}
  setBusy(false);
 }
 async function verify(e:FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');setMessage('');
  const {data,error:authError}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:otp.trim(),type:'recovery'});
  if(authError)setError(errText(authError.message));
  else if(data.session){setSession(data.session);setOtp('');setMessage('کد بازیابی تأیید شد. اکنون رمز جدید را ثبت کن.')}
  else setError('تأیید انجام شد اما نشست معتبر ایجاد نشد؛ دوباره تلاش کن.');
  setBusy(false);
 }
 async function savePassword(e:FormEvent){e.preventDefault();if(!supabase||!session)return;setBusy(true);setError('');setMessage('');
  if(password.length<12){setError('رمز جدید باید حداقل ۱۲ کاراکتر داشته باشد.');setBusy(false);return}
  if(password!==confirm){setError('تکرار رمز مطابقت ندارد.');setBusy(false);return}
  const {error:authError}=await supabase.auth.updateUser({password});
  if(authError)setError(errText(authError.message));
  else{setPassword('');setConfirm('');setMessage('رمز جدید با موفقیت ذخیره شد. می‌توانی به پنل ایران‌هتل بروی.')}
  setBusy(false);
 }
 const action={background:'#137fb1',border:'none',color:'white',padding:'13px 17px',borderRadius:11,fontWeight:800,fontSize:13,fontFamily:'inherit',cursor:'pointer',width:'100%'} as React.CSSProperties;
 const secondary={border:'1px solid #d9e6f0',background:'#f0f6fb',color:'#205276',padding:'10px 12px',borderRadius:10,fontFamily:'inherit',cursor:'pointer',fontSize:12} as React.CSSProperties;
 const field=(title:string,element:React.ReactNode)=><label style={{display:'grid',gap:7,fontSize:12,color:'#41546c',fontWeight:750}}>{title}{element}</label>;
 const emailField=field('ایمیل سازمانی',<input type="email" value={email} required autoComplete="username" dir="ltr" style={inputStyle} placeholder="name@company.ir" onChange={e=>setEmail(e.target.value)}/>);
 return <main dir="rtl" style={{minHeight:'100vh',background:'radial-gradient(circle at 20% 12%,#1d5d84 0%,#102741 51%,#0b1a30 100%)',padding:16,display:'grid',placeItems:'center',fontFamily:'Vazirmatn,Tahoma,system-ui,sans-serif'}}>
  <section style={{width:'min(470px,100%)',background:'#fff',color:'#183450',padding:'clamp(22px,4vw,36px)',borderRadius:20,boxShadow:'0 24px 70px #06162955',display:'grid',gap:17}}>
   <div style={{display:'flex',gap:11,alignItems:'center'}}>
    <span style={{background:'#e8f5fa',color:'#117ea6',padding:12,borderRadius:14,display:'grid'}}><ShieldCheck size={24}/></span>
    <div><strong style={{fontSize:21}}>دسترسی امن ایران‌هتل</strong><div style={{fontSize:11,color:'#778da4'}}>IHO SUPPLY OS • ACCOUNT RECOVERY</div></div>
   </div>
   <p style={{fontSize:12,lineHeight:2,color:'#5f748b',margin:0}}>
    {!ready?'در حال بررسی حساب...':session?'حساب تأیید شده است. برای ورودهای بعدی رمز شخصی جدید تعیین کن.':mode==='login'?'برای ورود از رمز خودت استفاده کن. اگر فراموش کرده‌ای، بازیابی را انتخاب کن.':mode==='reset'?'ایمیل حساب را وارد کن؛ سپس می‌توانی با کد یک‌بارمصرف بازیابی کنی.':'کد بازیابی ارسال‌شده به ایمیل را وارد کن. لینک‌های یک‌بارمصرف ممکن است توسط فیلترهای ایمیل باز شوند؛ ورود کد این مشکل را دور می‌زند.'}
   </p>
   {!supabase&&<div style={{background:'#fff0ee',padding:12,borderRadius:10,color:'#a03a2a'}}>اتصال Supabase در محیط انتشار تنظیم نشده است.</div>}
   {session?<>
    <div style={{background:'#eef8f4',color:'#13694c',padding:12,borderRadius:10,fontSize:12,display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={16}/> حساب تأییدشده: <span dir="ltr">{session.user.email}</span></div>
    <form onSubmit={savePassword} style={{display:'grid',gap:14}}>
     {field('رمز جدید (حداقل ۱۲ کاراکتر)',<input required minLength={12} type="password" autoComplete="new-password" dir="ltr" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/>)}
     {field('تکرار رمز جدید',<input required minLength={12} type="password" autoComplete="new-password" dir="ltr" value={confirm} onChange={e=>setConfirm(e.target.value)} style={inputStyle}/>)}
     <button type="submit" disabled={!ready||busy||!supabase} style={action}><KeyRound size={17} style={{verticalAlign:'middle',marginLeft:8}}/>{busy?'در حال ذخیره…':'ثبت رمز جدید'}</button>
    </form>
    <a href="/" style={{color:'#137fa3',fontSize:13,textAlign:'center'}}>ورود به داشبورد <ArrowLeft size={15} style={{verticalAlign:'middle'}}/></a>
   </>:mode==='login'?<form onSubmit={login} style={{display:'grid',gap:14}}>
    {emailField}
    {field('رمز عبور',<input required type="password" autoComplete="current-password" dir="ltr" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/>)}
    <button type="submit" disabled={!ready||busy||!supabase} style={action}><LogIn size={17} style={{verticalAlign:'middle',marginLeft:8}}/>{busy?'در حال ورود…':'ورود'}</button>
    <button type="button" style={secondary} onClick={()=>changeMode('reset')}>رمز را فراموش کرده‌ام</button>
   </form>:mode==='reset'?<form onSubmit={reset} style={{display:'grid',gap:14}}>
    {emailField}
    <button type="submit" disabled={!ready||busy||!supabase} style={action}><Mail size={17} style={{verticalAlign:'middle',marginLeft:8}}/>{busy?'در حال ارسال…':'درخواست کد بازیابی'}</button>
    <button type="button" style={secondary} onClick={()=>changeMode('code')}>از قبل کد بازیابی دارم</button>
    <button type="button" style={secondary} onClick={()=>changeMode('login')}>بازگشت به ورود</button>
   </form>:<form onSubmit={verify} style={{display:'grid',gap:14}}>
    {emailField}
    {field('کد یک‌بارمصرف ۶ رقمی',<input required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" dir="ltr" placeholder="000000" value={otp} onChange={e=>setOtp(e.target.value.replace(/[^0-9]/g,'').slice(0,6))} style={inputStyle}/>)}
    <button type="submit" disabled={!ready||busy||!supabase||otp.length!==6} style={action}>{busy?'در حال تأیید…':'تأیید کد و تعیین رمز جدید'}</button>
    <button type="button" style={secondary} onClick={()=>changeMode('reset')}>دریافت کد جدید</button>
    <button type="button" style={secondary} onClick={()=>changeMode('login')}>بازگشت به ورود</button>
   </form>}
   {message&&<p role="status" style={{border:'1px solid #c2ead9',background:'#eefaf3',color:'#116947',padding:12,borderRadius:10,fontSize:12,lineHeight:1.9,margin:0}}>{message}</p>}
   {error&&<p role="alert" style={{border:'1px solid #f6ceca',background:'#fff2f1',color:'#b33737',padding:12,borderRadius:10,fontSize:12,lineHeight:1.9,margin:0}}>{error}</p>}
   {!session&&<a href="/" style={{textAlign:'center',fontSize:12,color:'#16769a'}}>بازگشت به صفحه اصلی</a>}
  </section>
 </main>;
}

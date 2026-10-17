import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export async function POST(req:NextRequest){
 try{
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'').trim();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!token||!url||!anon)return NextResponse.json({error:'ورود معتبر لازم است'},{status:401});
  const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+token}}});
  const {data:{user},error:userError}=await db.auth.getUser(token);
  if(userError||!user)return NextResponse.json({error:'نشست کاربر معتبر نیست'},{status:401});
  const {data:member,error:roleErr}=await db.from('sco_members').select('role,active').eq('user_id',user.id).maybeSingle();
  if(roleErr||!member?.active||member.role!=='manager')return NextResponse.json({error:'فقط مدیر فعال می‌تواند درخواست تحلیل ثبت کند'},{status:403});
  const body=await req.json().catch(()=>({}));
  const prompt=String(body?.prompt||'');
  if(prompt.length<40||prompt.length>8000)return NextResponse.json({error:'حجم داده تحلیل معتبر نیست'},{status:400});
  const apiKey=process.env.AVALAI_API_KEY;
  if(!apiKey)return NextResponse.json({error:'سرویس تحلیل هوشمند تنظیم نشده است'},{status:503});
  const model=process.env.AVALAI_MODEL||'gpt-4o-mini';
  const base=(process.env.AVALAI_BASE_URL||'https://api.avalai.ir/v1').replace(/\/$/,'');
  const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),22000);
  try{
   const response=await fetch(base+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},signal:abort.signal,body:JSON.stringify({model,temperature:0.2,max_tokens:850,messages:[
    {role:'system',content:'تو دستیار مدیریت تأمین ایران‌هتل هستی. فقط بر اساس داده داده‌شده تحلیل کن، هیچ فروش یا زمان یا وضعیت ساختگی نساز. پاسخ کوتاه و فارسی؛ خروجی شامل ۵ اقدام اولویت‌دار با دلیل و مسئول پیشنهادی، ریسک حیاتی، کیفیت داده و خلاصه قابل ارسال مدیرعامل. مداخله‌ای روی قیمت‌ها/هتل‌ها انجام نده.'},
    {role:'user',content:prompt}]})});
   if(!response.ok)return NextResponse.json({error:'سرویس تحلیل در دسترس نیست ('+response.status+')'},{status:502});
   const json=await response.json();
   return NextResponse.json({text:String(json?.choices?.[0]?.message?.content||'پاسخی دریافت نشد').slice(0,14000)});
  }finally{clearTimeout(timeout)}
 }catch(e:any){return NextResponse.json({error:e?.name==='AbortError'?'زمان پاسخ تحلیل پایان یافت':'خطای تحلیل هوشمند'},{status:500})}
}
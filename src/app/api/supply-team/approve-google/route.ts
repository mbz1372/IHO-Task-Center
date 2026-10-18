import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!anon)return NextResponse.json({error:'نشست معتبر مدیر لازم است.'},{status:401});
  if(!service)return NextResponse.json({error:'پیکربندی مدیریتی سرور کامل نیست.'},{status:503});
  const userClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+token}}});
  const {data:{user},error:authError}=await userClient.auth.getUser(token);
  if(authError||!user?.email_confirmed_at)return NextResponse.json({error:'هویت مدیر تأیید نشد.'},{status:401});
  const {data:manager,error:memberError}=await userClient.from('sco_members').select('role,active').eq('user_id',user.id).maybeSingle();
  if(memberError||manager?.role!=='manager'||manager?.active!==true)return NextResponse.json({error:'تنها مدیر فعال اجازه تأیید کارشناس دارد.'},{status:403});
  const body=await req.json().catch(()=>({}));
  const email=String(body?.email||'').trim().toLowerCase();
  const name=String(body?.name||'').trim().replace(/\s+/g,' ');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<3||name.length>120)return NextResponse.json({error:'ایمیل و نام معتبر وارد کن.'},{status:400});
  if(email===user.email?.toLowerCase())return NextResponse.json({error:'مدیر نمی‌تواند اینجا نقش خودش را تغییر دهد.'},{status:400});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  let match:any=null;
  for(let page=1;page<=30;page++){
   const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
   if(error)return NextResponse.json({error:'خواندن کاربران احراز هویت ناموفق بود.'},{status:503});
   match=data.users.find(x=>x.email?.toLowerCase()===email);
   if(match)break;
   if(data.users.length<1000)break;
  }
  if(!match)return NextResponse.json({error:'این ایمیل هنوز با Google در سامانه وارد نشده است. ابتدا از کارشناس بخواه یک‌بار وارد شود.'},{status:404});
  if(!match.email_confirmed_at)return NextResponse.json({error:'ایمیل این کاربر هنوز تأیید نشده است.'},{status:409});
  if(!(match.app_metadata?.providers||[]).includes('google'))return NextResponse.json({error:'این کاربر با Google ثبت نشده است.'},{status:409});
  const {data:existing,error:checkError}=await admin.from('sco_members').select('user_id,role,active').eq('user_id',match.id).maybeSingle();
  if(checkError)return NextResponse.json({error:'بررسی عضویت فعلی ممکن نیست.'},{status:503});
  if(existing?.role==='manager')return NextResponse.json({error:'تغییر نقش مدیر از مسیر تأیید کارشناسان مجاز نیست.'},{status:409});
  if(existing?.active)return NextResponse.json({approved:true,already_member:true,message:'کارشناس قبلاً فعال شده است.'});
  if(existing){
   const {error}=await admin.from('sco_members').update({full_name:name,email,role:'expert',active:true,must_change_password:false}).eq('user_id',match.id).eq('role','expert');
   if(error)return NextResponse.json({error:'فعال‌سازی عضویت ناموفق بود: '+error.message},{status:500});
  }else{
   const {error}=await admin.from('sco_members').insert({user_id:match.id,full_name:name,email,role:'expert',active:true,must_change_password:false,created_by:user.id});
   if(error)return NextResponse.json({error:'ثبت کارشناس ناموفق بود: '+error.message},{status:500});
  }
  return NextResponse.json({approved:true,message:'کارشناس با موفقیت تأیید شد. اکنون می‌تواند با Google وارد میز کار شود.'},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'خطای داخلی تأیید عضویت؛ دوباره بررسی کن.'},{status:500})}
}

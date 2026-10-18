import {NextRequest, NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

export const runtime='nodejs';

export async function POST(req:NextRequest){
 try{
  const bearer=req.headers.get('authorization')||'';
  const token=bearer.match(/^Bearer (.+)$/i)?.[1];
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!token||!url||!publicKey)return NextResponse.json({error:'ورود معتبر لازم است.'},{status:401});
  if(!serviceKey)return NextResponse.json({error:'ساخت حساب از سمت سرور تنظیم نشده است.'},{status:503});
  const userClient=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+token}}});
  const {data:{user},error:authError}=await userClient.auth.getUser(token);
  if(authError||!user||!user.email_confirmed_at)return NextResponse.json({error:'حساب مدیر باید تأییدشده باشد.'},{status:401});
  const {data:member,error:memberError}=await userClient.from('sco_members').select('role,active').eq('user_id',user.id).maybeSingle();
  if(memberError||!member?.active||member.role!=='manager')return NextResponse.json({error:'فقط مدیر تأمین اجازه ایجاد کاربر دارد.'},{status:403});
  const body=await req.json().catch(()=>({}));
  const email=String(body?.email||'').trim().toLowerCase();
  const fullName=String(body?.name||'').trim().replace(/\s+/g,' ');
  if(!/^[^\s@]{2,100}@[^\s@]{3,150}$/.test(email)||fullName.length<3||fullName.length>120)
   return NextResponse.json({error:'نام و ایمیل کارشناس معتبر نیست.'},{status:400});
  // Limit automated account provisioning, even for a verified manager.
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const today=new Date(Date.now()-24*60*60*1000).toISOString();
  const {count,error:countError}=await admin.from('sco_members').select('user_id',{head:true,count:'exact'}).eq('created_by',user.id).gte('created_at',today);
  if(countError)return NextResponse.json({error:'امکان بررسی سقف ایجاد کاربر وجود ندارد.'},{status:503});
  if((count||0)>=30)return NextResponse.json({error:'سقف ایجاد ۳۰ حساب در ۲۴ ساعت تکمیل شده است.'},{status:429});
  const tempPassword='IHO-'+randomBytes(24).toString('base64url')+'aA7!';
  const {data:created,error:createError}=await admin.auth.admin.createUser({
   email,password:tempPassword,email_confirm:true,user_metadata:{full_name:fullName,source:'iho_supply_manager_provision'}
  });
  if(createError||!created?.user)return NextResponse.json({error:createError?.message||'ایجاد حساب ناموفق بود.'},{status:400});
  const id=created.user.id;
  const {error:insertError}=await admin.from('sco_members').insert({
   user_id:id,full_name:fullName,role:'expert',active:true,email,created_by:user.id,must_change_password:true
  });
  if(insertError){
   // Only delete the new unassigned account this request just created.
   await admin.auth.admin.deleteUser(id);
   return NextResponse.json({error:'ثبت عضویت ناموفق بود؛ حساب آزمایشی پاک شد.'},{status:500});
  }
  // Password is returned once, exclusively to the initiating verified manager.
  return NextResponse.json({email,name:fullName,temporary_password:tempPassword,created:true},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return NextResponse.json({error:'خطای ساخت کاربر؛ لطفاً دوباره تلاش کن.'},{status:500});
 }
}
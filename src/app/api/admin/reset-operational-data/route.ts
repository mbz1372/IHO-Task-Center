import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {createHash,timingSafeEqual} from 'crypto';

function adminDb(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY در Vercel تنظیم نشده است');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function verifyPassword(db:any,password:string){
  const {data}=await db.from('ihos_settings').select('value').eq('key','super_admin_delete_password').maybeSingle();
  const value=data?.value;
  if(value?.salt&&value?.hash){
    const actual=createHash('sha256').update(`${value.salt}:${password}`).digest('hex');
    return timingSafeEqual(Buffer.from(actual),Buffer.from(value.hash));
  }
  return !!process.env.SUPER_ADMIN_DELETE_KEY&&password===process.env.SUPER_ADMIN_DELETE_KEY;
}
const TABLES=[
  'ihos_task_activities','ihos_reminders','ihos_notifications','ihos_calendar_events',
  'ihos_documents','ihos_goals','ihos_projects','ihos_activity_logs','ihos_tasks',
  'ihos_hotel_automation','ihos_provider_rules','ihos_hotels'
];
export async function DELETE(req:NextRequest){
  try{
    const {password,actor}=await req.json();
    if(!actor?.isSuperAdmin) return NextResponse.json({error:'فقط سوپر ادمین مجاز است'},{status:403});
    const db=adminDb();
    if(!(await verifyPassword(db,String(password||'')))) return NextResponse.json({error:'رمز حذف کامل نامعتبر است'},{status:403});
    let deleted=0; const details:any[]=[];
    for(const table of TABLES){
      const {count}=await db.from(table).select('*',{count:'exact',head:true});
      const {error}=await db.from(table).delete().neq('id','__never__');
      if(error && !String(error.message||'').includes('does not exist')) throw new Error(`${table}: ${error.message}`);
      deleted+=count||0; details.push({table,count:count||0});
    }
    await db.from('ihos_secure_delete_logs').insert({table_name:'ALL_OPERATIONAL_DATA',record_id:null,action:'reset-operational-data',deleted_count:deleted,actor_id:actor?.id||null,actor_username:actor?.username||null,actor_name:actor?.name||null,created_at:new Date().toISOString()});
    return NextResponse.json({ok:true,deleted,details});
  }catch(e:any){return NextResponse.json({error:e.message||'خطا در پاک‌سازی'},{status:500});}
}

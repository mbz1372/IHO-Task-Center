import { NextResponse } from 'next/server';
import { getAdminSupabase, hashPassword, publicUser } from '@/lib/server-supabase';
import { users } from '@/lib/types';

export async function POST(req: Request){
  try{
    const { userId, password } = await req.json();
    if(!userId || !password) return NextResponse.json({ ok:false, error:'کاربر و رمز عبور الزامی است' }, { status:400 });
    const adminSupabase = getAdminSupabase();
    if(!adminSupabase) return NextResponse.json({ ok:false, error:'اتصال امن Supabase روی سرور تنظیم نشده است' }, { status:500 });

    const { data: memberRow } = await adminSupabase.from('iho_team_members').select('id,payload').eq('id', userId).maybeSingle();
    const fallback = users.find(u => u.id === userId);
    const member = memberRow?.payload || (fallback ? { ...fallback, active:true, dailyTarget:8 } : null);
    if(!member || member.active === false) return NextResponse.json({ ok:false, error:'این کاربر فعال نیست' }, { status:403 });

    const { data: authRow } = await adminSupabase.from('iho_user_auth').select('user_id,password_hash,is_active').eq('user_id', userId).maybeSingle();
    const inputHash = hashPassword(userId, password);

    // First run bootstrap: all seeded users can enter with 123456 until admin changes their password.
    const firstRunOk = !authRow && password === '123456';
    const savedOk = !!authRow && authRow.is_active !== false && authRow.password_hash === inputHash;

    if(!firstRunOk && !savedOk) return NextResponse.json({ ok:false, error:'رمز عبور اشتباه است' }, { status:401 });
    if(firstRunOk){
      await adminSupabase.from('iho_user_auth').upsert({ user_id:userId, password_hash: inputHash, is_active: member.active !== false, role: member.role || 'expert' });
      await adminSupabase.from('iho_team_members').upsert({ id:userId, payload: publicUser(member) });
    }

    return NextResponse.json({ ok:true, user: publicUser(member) });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message || 'خطای ورود' }, { status:500 });
  }
}

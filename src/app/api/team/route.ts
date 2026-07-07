import { NextResponse } from 'next/server';
import { getAdminSupabase, hashPassword, publicUser } from '@/lib/server-supabase';

export async function POST(req: Request){
  try{
    const adminSupabase = getAdminSupabase();
    if(!adminSupabase) return NextResponse.json({ ok:false, error:'Supabase service role تنظیم نیست' }, { status:500 });
    const { members } = await req.json();
    if(!Array.isArray(members)) return NextResponse.json({ ok:false, error:'members باید آرایه باشد' }, { status:400 });

    const cleaned = members.map(publicUser).filter(Boolean);
    for(const m of cleaned){
      await adminSupabase.from('iho_team_members').upsert({ id:m.id, payload:m });
      await adminSupabase.from('iho_user_auth').upsert({ user_id:m.id, is_active:m.active !== false, role:m.role || 'expert' }, { onConflict:'user_id' });
    }
    for(const raw of members){
      if(raw?.newPassword && String(raw.newPassword).trim().length >= 4){
        await adminSupabase.from('iho_user_auth').upsert({ user_id:raw.id, password_hash:hashPassword(raw.id, String(raw.newPassword)), is_active:raw.active !== false, role:raw.role || 'expert' }, { onConflict:'user_id' });
      }
    }

    return NextResponse.json({ ok:true, members: cleaned });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message || 'خطای ذخیره تیم' }, { status:500 });
  }
}

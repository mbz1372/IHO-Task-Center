import { NextResponse } from 'next/server';
import { getAdminSupabase, hashPassword, publicUser } from '@/lib/server-supabase';

export async function POST(req: Request){
  try{
    const adminSupabase = getAdminSupabase();
    if(!adminSupabase) return NextResponse.json({ ok:false, error:'Supabase service role تنظیم نیست' }, { status:500 });
    const { members } = await req.json();
    if(!Array.isArray(members)) return NextResponse.json({ ok:false, error:'members باید آرایه باشد' }, { status:400 });

    const cleaned = members.map(publicUser).filter(Boolean);
    const incomingIds = new Set(cleaned.map((m:any) => m.id));

    // Important: this API receives the FULL team list from the admin screen.
    // So rows that are not present anymore must be deleted from Supabase too.
    // In earlier versions we only upserted rows; deleted experts stayed in DB
    // and came back after refresh/realtime load.
    const { data: existingRows, error: existingError } = await adminSupabase
      .from('iho_team_members')
      .select('id');
    if(existingError) throw existingError;

    const deletedIds = (existingRows || [])
      .map((r:any) => r.id)
      .filter((id:string) => !incomingIds.has(id));

    for(const id of deletedIds){
      await adminSupabase.from('iho_team_members').delete().eq('id', id);
      // Keep password history out of active use. We do not hard-delete auth by default;
      // disabling is safer and prevents deleted users from logging in.
      await adminSupabase.from('iho_user_auth').upsert({ user_id:id, is_active:false }, { onConflict:'user_id' });
    }

    for(const m of cleaned){
      await adminSupabase.from('iho_team_members').upsert({ id:m.id, payload:m });
      await adminSupabase.from('iho_user_auth').upsert({ user_id:m.id, is_active:m.active !== false, role:m.role || 'expert' }, { onConflict:'user_id' });
    }
    for(const raw of members){
      if(raw?.newPassword && String(raw.newPassword).trim().length >= 4){
        await adminSupabase.from('iho_user_auth').upsert({ user_id:raw.id, password_hash:hashPassword(raw.id, String(raw.newPassword)), is_active:raw.active !== false, role:raw.role || 'expert' }, { onConflict:'user_id' });
      }
    }

    return NextResponse.json({ ok:true, members: cleaned, deletedIds });
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message || 'خطای ذخیره تیم' }, { status:500 });
  }
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

let cached: SupabaseClient | null = null;
export function getAdminSupabase(){
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if(!url || !serviceKey) return null;
  if(!cached) cached = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

const PEPPER = process.env.IHO_AUTH_PEPPER || 'iho-task-center-enterprise-v4';
export function hashPassword(userId: string, password: string){
  return crypto.createHash('sha256').update(`${userId}:${password}:${PEPPER}`).digest('hex');
}
export function publicUser(payload: any){
  if(!payload) return null;
  const { newPassword, password, passwordHash, ...safe } = payload;
  return safe;
}

import { createClient } from '@supabase/supabase-js';
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const isSupabaseReady = Boolean(supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co'));
export const supabase = isSupabaseReady ? createClient(supabaseUrl, supabaseKey, { realtime: { params: { eventsPerSecond: 10 } } }) : null;

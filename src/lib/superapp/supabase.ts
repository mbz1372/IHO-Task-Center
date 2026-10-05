import {createClient, type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|null=null;
export function getSupabase(){
 if(client) return client;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) return null;
 client=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true},realtime:{params:{eventsPerSecond:5}}});
 return client;
}
export async function upsertChunks(table:string,rows:any[],chunkSize=500){
 const db=getSupabase(); if(!db) throw new Error('Supabase تنظیم نشده است');
 let done=0;
 for(let i=0;i<rows.length;i+=chunkSize){const chunk=rows.slice(i,i+chunkSize);const {error}=await db.from(table).upsert(chunk,{onConflict:'id'});if(error) throw error;done+=chunk.length;}
 return done;
}

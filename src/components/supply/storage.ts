'use client';

import {getSupabase} from '@/lib/superapp/supabase';

export const normalizeFa=(value:any)=>String(value??'')
  .replace(/\u200c/g,' ')
  .replace(/[يى]/g,'ی')
  .replace(/ك/g,'ک')
  .replace(/\s+/g,' ')
  .trim()
  .toLowerCase();

export const makeId=(prefix='row')=>globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const nowIso=()=>new Date().toISOString();

function isMissingSchema(error:any){
  const message=normalizeFa(error?.message||error?.details||error);
  return message.includes('schema cache')||message.includes('could not find the table')||message.includes('does not exist')||message.includes('could not find the')||error?.code==='42P01'||error?.code==='42703'||error?.code==='PGRST204'||error?.code==='PGRST205';
}

async function loadFallback(table:string){
  const db=getSupabase();
  if(!db) return [];
  const {data,error}=await db.from('ihos_settings').select('key,value').like('key',`v23:${table}:%`).limit(5000);
  if(error) return [];
  return (data||[]).map((row:any)=>row.value).filter(Boolean);
}

export async function loadRows(table:string,select='*',limit=12000){
  const db=getSupabase();
  if(!db) return [] as any[];
  const rows:any[]=[];
  try{
    for(let from=0;from<limit;from+=1000){
      const {data,error}=await db.from(table).select(select).range(from,Math.min(limit-1,from+999));
      if(error) throw error;
      rows.push(...(data||[]));
      if((data||[]).length<1000) break;
    }
    return rows;
  }catch(error){
    if(isMissingSchema(error)) return loadFallback(table);
    throw error;
  }
}

export async function saveRow(table:string,row:any){
  const db=getSupabase();
  if(!db) throw new Error('اتصال Supabase برقرار نیست');
  try{
    const {error}=await db.from(table).upsert(row,{onConflict:'id'});
    if(error) throw error;
    return {fallback:false};
  }catch(error){
    if(!isMissingSchema(error)) throw error;
    const {error:fallbackError}=await db.from('ihos_settings').upsert({key:`v23:${table}:${row.id}`,value:row,updated_at:nowIso()},{onConflict:'key'});
    if(fallbackError) throw fallbackError;
    return {fallback:true};
  }
}

export async function saveRows(table:string,rows:any[]){
  const db=getSupabase();
  if(!db) throw new Error('اتصال Supabase برقرار نیست');
  if(!rows.length) return {fallback:false,count:0};
  try{
    for(let index=0;index<rows.length;index+=400){
      const {error}=await db.from(table).upsert(rows.slice(index,index+400),{onConflict:'id'});
      if(error) throw error;
    }
    return {fallback:false,count:rows.length};
  }catch(error){
    if(!isMissingSchema(error)) throw error;
    for(let index=0;index<rows.length;index+=100){
      const fallbackRows=rows.slice(index,index+100).map(row=>({key:`v23:${table}:${row.id}`,value:row,updated_at:nowIso()}));
      const {error:fallbackError}=await db.from('ihos_settings').upsert(fallbackRows,{onConflict:'key'});
      if(fallbackError) throw fallbackError;
    }
    return {fallback:true,count:rows.length};
  }
}

export async function saveSetting(key:string,value:any){
  const db=getSupabase();
  if(!db) throw new Error('اتصال Supabase برقرار نیست');
  const {error}=await db.from('ihos_settings').upsert({key,value,updated_at:nowIso()},{onConflict:'key'});
  if(error) throw error;
}

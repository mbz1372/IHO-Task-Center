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

const SLOT_DETAIL_TABLES=new Set([
  'ihos_supply_reservation_list',
  'ihos_supply_uploaded_hotels',
  'ihos_supply_confirmed_sales',
  'ihos_supply_unconfirmed_sales',
  'ihos_supply_mehr_mo',
  'ihos_supply_hotel_assignments',
  'ihos_supply_analytics_traffic',
]);

function isMissingSchema(error:any){
  const message=normalizeFa(error?.message||error?.details||error);
  return message.includes('schema cache')||message.includes('could not find the table')||message.includes('does not exist')||message.includes('could not find the')||error?.code==='42P01'||error?.code==='42703'||error?.code==='PGRST204'||error?.code==='PGRST205';
}

function chunks<T>(rows:T[],size:number){
  const out:T[][]=[];
  for(let index=0;index<rows.length;index+=size) out.push(rows.slice(index,index+size));
  return out;
}

async function runPool<T>(items:T[],limit:number,worker:(item:T,index:number)=>Promise<void>){
  let cursor=0;
  const runners=Array.from({length:Math.min(limit,items.length)},async()=>{
    while(cursor<items.length){
      const index=cursor++;
      await worker(items[index],index);
    }
  });
  await Promise.all(runners);
}

function text(value:any){return String(value??'').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim()}
function keyText(value:any){return normalizeFa(value).replace(/[\s\-_/()（）.]/g,'')}
function pick(row:any,names:string[]){
  const keys=Object.keys(row||{});
  const wanted=names.map(keyText);
  const found=keys.find(key=>wanted.some(name=>keyText(key)===name||keyText(key).includes(name)||name.includes(keyText(key))));
  return found?row[found]:'';
}
function num(value:any){
  const raw=String(value??'')
    .replace(/[٬,\s]/g,'')
    .replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const n=Number(raw);
  return Number.isFinite(n)?n:0;
}
function rowCount(payload:any){return Math.max(1,num(pick(payload,['تعداد رزرو','رزرو','booking_count','count','confirmed','unconfirmed','تعداد']))||1)}
function hotelCode(payload:any,row:any){return text(row.hotel_code||pick(payload,['کد هتل','کد','hotel_code','hotel code','HotelId','HotelCode','id']))}
function hotelTitle(payload:any,row:any){return text(row.hotel_title||pick(payload,['نام هتل','هتل','hotel','hotel name','HotelName','نام اقامتگاه','نام مرکز']))||text(Object.values(payload||{})[0])}
function hotelCity(payload:any,row:any){return text(row.city||pick(payload,['شهر','city','CityName']))}
function add(target:any,field:string,value:number){target[field]=(num(target[field])+value)||0}

function compactSupplyImportRows(rows:any[]){
  if(rows.length<2500) return rows;
  const groups=new Map<string,any>();
  for(const row of rows){
    const payload=row.payload||{};
    const fileKey=String(row.file_key||'');
    const code=hotelCode(payload,row);
    const title=hotelTitle(payload,row);
    const city=hotelCity(payload,row);
    const baseKey=code?`code:${keyText(code)}`:`title:${keyText(title)}`;
    const task=text(pick(payload,['taskId','task id','نوع تسک','تسک','task']));
    const expert=text(pick(payload,['کارشناس','نام کارشناس','owner','assignee','مسئول','expert']));
    const groupKey=fileKey==='assignment'
      ? `${row.import_id}|${fileKey}|${baseKey}|${keyText(task)}|${keyText(expert)}`
      : `${row.import_id}|${fileKey}|${baseKey}`;
    const current=groups.get(groupKey)||{
      ...row,
      id:`${row.import_id}-${fileKey}-${groups.size+1}`,
      hotel_code:code,
      hotel_title:title,
      city,
      row_index:groups.size+1,
      payload:{...payload,hotel_code:code,hotel_title:title,city,__compact:true,__source_rows:0},
    };
    const p=current.payload;
    p.__source_rows=(p.__source_rows||0)+1;

    if(fileKey==='reserveList'){
      add(p,'تعداد رزرو',rowCount(payload));
      add(p,'booking_count',rowCount(payload));
    }else if(fileKey==='confirmed'){
      add(p,'تعداد رزرو',rowCount(payload));
      add(p,'booking_count',rowCount(payload));
      add(p,'شب اقامت',num(pick(payload,['شب اقامت','nights','room_nights'])));
      add(p,'فروش',num(pick(payload,['فروش','مبلغ','amount','gross_sales'])));
      add(p,'سود',num(pick(payload,['سود','مارجین','profit','margin'])));
    }else if(fileKey==='unconfirmed'){
      add(p,'تعداد رزرو',rowCount(payload));
      add(p,'booking_count',rowCount(payload));
      add(p,'فروش',num(pick(payload,['فروش','مبلغ','amount','gross_sales'])));
    }else if(fileKey==='traffic'){
      add(p,'بازدید',num(pick(payload,['بازدید','sessions','views','کاربر','users','pageviews','event count']))||1);
      p.conversion=Math.max(num(p.conversion),num(pick(payload,['conversion','نرخ تبدیل','purchase conversion'])));
    }else if(fileKey==='assignment'){
      p['نوع تسک']=task||p['نوع تسک'];
      p['کارشناس']=expert||p['کارشناس'];
    }
    p.hotel_code=code;
    p.hotel_title=title;
    p.city=city;
    current.payload=p;
    groups.set(groupKey,current);
  }
  return [...groups.values()].map((row,index)=>({...row,row_index:index+1,id:`${row.import_id}-${row.file_key}-compact-${index+1}`}));
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
  const orderedRows:any[]=[];
  try{
    for(let from=0;from<limit;from+=1000){
      const {data,error}=await db.from(table).select(select).order('created_at',{ascending:false}).range(from,Math.min(limit-1,from+999));
      if(error) throw error;
      orderedRows.push(...(data||[]));
      if((data||[]).length<1000) return orderedRows;
    }
    return orderedRows;
  }catch(error:any){
    if(!isMissingSchema(error)){
      const plainRows:any[]=[];
      for(let from=0;from<limit;from+=1000){
        const {data,error:plainError}=await db.from(table).select(select).range(from,Math.min(limit-1,from+999));
        if(plainError) throw plainError;
        plainRows.push(...(data||[]));
        if((data||[]).length<1000) break;
      }
      return plainRows;
    }
    return loadFallback(table);
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

  // The UI only reads ihos_supply_import_rows. Writing the same Excel rows into
  // seven duplicate detail tables made large uploads painfully slow, so detail-table
  // persistence is intentionally skipped here.
  if(SLOT_DETAIL_TABLES.has(table)) return {fallback:false,count:rows.length,skipped:true};

  const preparedRows=table==='ihos_supply_import_rows'?compactSupplyImportRows(rows):rows;
  const primaryChunkSize=table==='ihos_settings'?100:1000;
  const primaryConcurrency=table==='ihos_settings'?1:4;

  try{
    const parts=chunks(preparedRows,primaryChunkSize);
    await runPool(parts,primaryConcurrency,async part=>{
      const {error}=await db.from(table).upsert(part,{onConflict:'id'});
      if(error) throw error;
    });
    return {fallback:false,count:preparedRows.length,originalCount:rows.length};
  }catch(error){
    if(!isMissingSchema(error)) throw error;
    const parts=chunks(preparedRows,250);
    await runPool(parts,2,async part=>{
      const fallbackRows=part.map(row=>({key:`v23:${table}:${row.id}`,value:row,updated_at:nowIso()}));
      const {error:fallbackError}=await db.from('ihos_settings').upsert(fallbackRows,{onConflict:'key'});
      if(fallbackError) throw fallbackError;
    });
    return {fallback:true,count:preparedRows.length,originalCount:rows.length};
  }
}

export async function saveSetting(key:string,value:any){
  const db=getSupabase();
  if(!db) throw new Error('اتصال Supabase برقرار نیست');
  const {error}=await db.from('ihos_settings').upsert({key,value,updated_at:nowIso()},{onConflict:'key'});
  if(error) throw error;
}

import type {AutomationResult,HotelAutomation,ProviderRule} from './types';
const norm=(v?:string)=>String(v||'').trim().toLowerCase();
export function evaluateAutomation(row:HotelAutomation,rules:ProviderRule[]):AutomationResult{
 const rule=rules.find(r=>norm(r.name)===norm(row.provider));
 const effective=!rule?.effectiveFrom||new Date(rule.effectiveFrom)<=new Date();
 const rateApi=Boolean(rule?.active&&effective&&rule.rateApi);
 const capacityApi=Boolean(rule?.active&&effective&&rule.capacityApi);
 const rateOnline=rateApi||row.hotelRate;
 const capacityOnline=capacityApi||row.hotelCapacity;
 const rateSource=rateApi?'Provider API':row.hotelRate?'Hotel Panel':row.rateExpert?'Expert':'Offline';
 const capacitySource=capacityApi?'Provider API':row.hotelCapacity?'Hotel Panel':row.capacityExpert?'Expert':'Offline';
 const fullyOnline=rateOnline&&capacityOnline;
 let score=(rateOnline?50:row.rateExpert?25:0)+(capacityOnline?50:row.capacityExpert?35:0);
 const bad=['iho','asa','shab'].includes(norm(row.provider));
 const migrationNeeded=bad||(!fullyOnline&&Boolean(rule?.replacementProvider));
 let status=fullyOnline?'۱۰۰٪ آنلاین':capacityOnline?'ظرفیت آنلاین':rateOnline?'نرخ آنلاین':(row.rateExpert||row.capacityExpert)?'کارشناس‌محور':'آفلاین';
 if(migrationNeeded) status='نیازمند مهاجرت Provider';
 const suggestedProvider=rule?.replacementProvider||(!fullyOnline?'Lamasoo':undefined);
 const reason=fullyOnline?'نرخ و ظرفیت بدون دخالت کارشناس تأمین می‌شود':migrationNeeded?`Provider فعلی برای آنلاین‌سازی کامل مناسب نیست`:`${rateSource} / ${capacitySource}`;
 return {score,status,rateSource,capacitySource,fullyOnline,migrationNeeded,suggestedProvider,reason};
}
export const DEFAULT_PROVIDER_RULES:ProviderRule[]=[
{name:'Harris Netminder',rateApi:true,capacityApi:true,active:true,priority:1},
{name:'Lamasoo',rateApi:true,capacityApi:true,active:true,priority:2},
{name:'Adotel',rateApi:true,capacityApi:true,active:true,priority:3},
{name:'Sepehr',rateApi:true,capacityApi:true,active:true,priority:4},
{name:'Moghim',rateApi:false,capacityApi:true,active:true,replacementProvider:'Lamasoo',priority:5},
{name:'VHotel',rateApi:false,capacityApi:true,active:true,replacementProvider:'Lamasoo',priority:6},
{name:'IHO Provider',rateApi:false,capacityApi:false,active:true,replacementProvider:'Lamasoo',priority:7},
{name:'IHO',rateApi:false,capacityApi:false,active:false,replacementProvider:'IHO Provider',priority:8},
{name:'Asa',rateApi:false,capacityApi:false,active:false,replacementProvider:'IHO Provider',priority:9},
{name:'Shab',rateApi:false,capacityApi:false,active:false,replacementProvider:'IHO Provider',priority:10},
];

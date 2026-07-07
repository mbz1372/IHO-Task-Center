import { hotels } from './hotels';
import { checklistPresets, Task, Category } from './types';

const now = new Date();
const d = (n: number) => new Date(now.getTime() + n * 86400000).toISOString().slice(0, 10);
const id = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);
const makeChecklist = (category: Category) => checklistPresets[category].map(title => ({ id: id(), title, done: false }));
const h = (i: number) => hotels[i] || hotels[0];
const baseDate = new Date().toISOString();

export const seedTasks: Task[] = [
  {
    id:'T-1001', title:'دریافت ظرفیت پیک آخر هفته', hotelId:Number(h(1).id), hotelName:String(h(1).name), city:String(h(1).city),
    category:'ظرفیت', priority:'فوری', status:'جدید', assignee:'فاطمه رنجبر', manager:'نرگس قدرتی', dueDate:d(0),
    description:'ظرفیت پنجشنبه و جمعه دریافت و در پنل ثبت شود. در صورت ظرفیت محدود، اتاق‌های پرفروش اولویت دارند.', checklist:makeChecklist('ظرفیت'),
    comments:[], activities:[{id:id(), user:'محمدباقر ذوالفقاری', action:'تسک ایجاد شد', at:baseDate}], createdBy:'محمدباقر ذوالفقاری', createdAt:baseDate, updatedAt:baseDate, tags:['پیک','A/B']
  },
  {
    id:'T-1002', title:'پیگیری قرارداد جدید', hotelId:Number(h(2).id), hotelName:String(h(2).name), city:String(h(2).city),
    category:'قرارداد', priority:'بالا', status:'در حال پیگیری', assignee:'فائزه سالاری', manager:'محمد باقری', dueDate:d(2),
    description:'نسخه مهرشده قرارداد دریافت و در پرونده هتل ثبت شود.', checklist:makeChecklist('قرارداد'),
    comments:[{id:id(), user:'محمد باقری', text:'امروز با مدیر فروش هتل هماهنگ شود.', at:baseDate}], activities:[{id:id(), user:'محمد باقری', action:'وضعیت به در حال پیگیری تغییر کرد', at:baseDate}], createdBy:'محمد باقری', createdAt:baseDate, updatedAt:baseDate, tags:['قرارداد']
  },
  {
    id:'T-1003', title:'اصلاح عکس و امکانات اتاق', hotelId:Number(h(3).id), hotelName:String(h(3).name), city:String(h(3).city),
    category:'محتوا', priority:'متوسط', status:'منتظر پاسخ هتل', assignee:'مهسا ناصری', manager:'منصوره یکتایی', dueDate:d(4),
    description:'عکس‌های جدید و امکانات اتاق‌ها دریافت شود و متن صفحه هتل بروزرسانی شود.', checklist:makeChecklist('محتوا'),
    comments:[], activities:[{id:id(), user:'منصوره یکتایی', action:'تسک به محتوا ارجاع شد', at:baseDate}], createdBy:'منصوره یکتایی', createdAt:baseDate, updatedAt:baseDate, tags:['محتوا']
  },
  {
    id:'T-1004', title:'بررسی اختلاف قیمت رقبا', hotelId:Number(h(4).id), hotelName:String(h(4).name), city:String(h(4).city),
    category:'قیمت', priority:'بالا', status:'نیازمند اصلاح', assignee:'پگاه واعظین', manager:'سپیده دعوت‌طلب', dueDate:d(-1),
    description:'قیمت سایت‌های رقیب چک و اصلاحیه اعلام شود. اگر امکان اصلاح نبود دلیل ثبت شود.', checklist:makeChecklist('قیمت'),
    comments:[], activities:[{id:id(), user:'سپیده دعوت‌طلب', action:'نیازمند اصلاح شد', at:baseDate}], createdBy:'سپیده دعوت‌طلب', createdAt:baseDate, updatedAt:baseDate, tags:['رقبا','قیمت']
  }
];

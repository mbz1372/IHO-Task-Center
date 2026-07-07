export type Role = 'admin' | 'manager' | 'expert' | 'content' | 'capacity';
export type Status = 'جدید' | 'در حال پیگیری' | 'منتظر پاسخ هتل' | 'نیازمند اصلاح' | 'در انتظار تایید' | 'انجام‌شده' | 'لغوشده';
export type Priority = 'فوری' | 'بالا' | 'متوسط' | 'پایین';
export type Category = 'قرارداد' | 'ظرفیت' | 'قیمت' | 'پنل' | 'محتوا' | 'مالی' | 'همکاری مجدد' | 'سایر';

export type User = { id: string; name: string; role: Role; team: string; cityScope?: string[] };
export type Comment = { id: string; user: string; text: string; at: string };
export type ChecklistItem = { id: string; title: string; done: boolean; doneBy?: string; doneAt?: string };
export type Activity = { id: string; user: string; action: string; at: string };

export type Task = {
  id: string;
  title: string;
  hotelId: number;
  hotelName: string;
  city: string;
  category: Category;
  priority: Priority;
  status: Status;
  assignee: string;
  manager: string;
  dueDate: string;
  description: string;
  result?: string;
  checklist: ChecklistItem[];
  comments: Comment[];
  activities: Activity[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags: string[];
};

export const statuses: Status[] = ['جدید','در حال پیگیری','منتظر پاسخ هتل','نیازمند اصلاح','در انتظار تایید','انجام‌شده','لغوشده'];
export const activeStatuses: Status[] = ['جدید','در حال پیگیری','منتظر پاسخ هتل','نیازمند اصلاح','در انتظار تایید'];
export const priorities: Priority[] = ['فوری','بالا','متوسط','پایین'];
export const categories: Category[] = ['قرارداد','ظرفیت','قیمت','پنل','محتوا','مالی','همکاری مجدد','سایر'];

export const users: User[] = [
  { id:'u-admin', name:'محمدباقر ذوالفقاری', role:'admin', team:'مدیریت تامین' },
  { id:'u-bagheri', name:'محمد باقری', role:'manager', team:'مرکز', cityScope:['تهران','اصفهان','قم','کاشان'] },
  { id:'u-narges', name:'نرگس قدرتی', role:'manager', team:'شرق و جنوب', cityScope:['مشهد','کیش','شیراز','یزد','کرمان'] },
  { id:'u-sepideh', name:'سپیده دعوت‌طلب', role:'manager', team:'شمال و غرب', cityScope:['رشت','تبریز','اردبیل','همدان','ساری'] },
  { id:'u-mansoureh', name:'منصوره یکتایی', role:'manager', team:'پنل و محتوا' },
  { id:'u-salari', name:'فائزه سالاری', role:'expert', team:'مرکز' },
  { id:'u-ranjbar', name:'فاطمه رنجبر', role:'expert', team:'شرق و جنوب' },
  { id:'u-afsaneh', name:'افسانه مرادی', role:'expert', team:'شرق و جنوب' },
  { id:'u-pegah', name:'پگاه واعظین', role:'expert', team:'شمال و غرب' },
  { id:'u-rahimi', name:'فاطمه رحیمی', role:'expert', team:'شمال و غرب' },
  { id:'u-mahla', name:'مهلا بهرامی‌زاده', role:'capacity', team:'کنترل ظرفیت' },
  { id:'u-shoja', name:'محمد شجاع', role:'capacity', team:'هتل خارجی' },
  { id:'u-parya', name:'پاریا گلی', role:'content', team:'پنل و محتوا' },
  { id:'u-mahsa', name:'مهسا ناصری', role:'content', team:'پنل و محتوا' }
];

export const experts = users.filter(u => !['admin','manager'].includes(u.role)).map(u => u.name);
export const managers = users.filter(u => ['admin','manager'].includes(u.role)).map(u => u.name);

export const checklistPresets: Record<Category, string[]> = {
  'ظرفیت': ['تماس با هتل','دریافت تاریخ‌های باز','دریافت نوع اتاق و نرخ','ثبت در پنل','تست نمایش در سایت','تایید فروش'],
  'قیمت': ['بررسی نرخ ایران‌هتل','بررسی نرخ رقبا','ثبت اختلاف قیمت','هماهنگی با هتل','اصلاح نرخ','تایید نهایی'],
  'قرارداد': ['بررسی وضعیت فعلی','ارسال قرارداد','پیگیری امضا','دریافت نسخه مهرشده','ثبت در سیستم','اطلاع به مالی'],
  'پنل': ['تماس با هتل','معرفی پنل','دریافت یوزر/اطلاعات','ارسال دسترسی','آموزش اولیه','تست ورود'],
  'محتوا': ['دریافت عکس','بررسی کیفیت عکس','اصلاح توضیحات','اصلاح امکانات','اصلاح قوانین','تایید نهایی محتوا'],
  'مالی': ['بررسی مانده','هماهنگی با مالی','اطلاع به هتل','ثبت نتیجه','پیگیری مجدد'],
  'همکاری مجدد': ['بررسی مانع همکاری','تماس اولیه','مذاکره مجدد','ثبت پیشنهاد','ارسال برای تایید مدیر'],
  'سایر': ['بررسی اولیه','اقدام','ثبت نتیجه']
};

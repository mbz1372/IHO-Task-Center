export type Status='جدید'|'در حال پیگیری'|'منتظر پاسخ هتل'|'نیازمند اصلاح'|'انجام‌شده';
export type Priority='فوری'|'بالا'|'متوسط'|'پایین';
export type Task={id:string;title:string;hotelId:number;hotelName:string;city:string;category:string;priority:Priority;status:Status;assignee:string;manager:string;dueDate:string;description:string;comments:{user:string;text:string;at:string}[];createdAt:string;updatedAt:string;};
export const statuses:Status[]=['جدید','در حال پیگیری','منتظر پاسخ هتل','نیازمند اصلاح','انجام‌شده'];
export const priorities:Priority[]=['فوری','بالا','متوسط','پایین'];
export const experts=['فاطمه رنجبر','افسانه مرادی','پگاه واعظین','فاطمه رحیمی','فائزه سالاری','مهلا بهرامی‌زاده','محمد شجاع','پاریا گلی','مهسا ناصری'];
export const managers=['محمد باقری','نرگس قدرتی','سپیده دعوت‌طلب','منصوره یکتایی','محمدباقر ذوالفقاری'];

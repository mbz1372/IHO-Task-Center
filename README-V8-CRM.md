# IranHotel OS V8 — Hotel CRM UX Edition

## تغییرات اصلی
- بازطراحی کامل ماژول سوپر اپ هتل با Design System یکپارچه
- پرونده ۳۶۰ هتل در Drawer سریع
- تفکیک صریح «تعداد تخت» از «موجودی آنلاین»
- تعریف ۱۰۰٪ آنلاین: نرخ و موجودی از Provider API یا پنل هتل، بدون دخالت کارشناس
- جدول Server-side با ۴۰ ردیف در هر صفحه
- تب ۱۰۰٪ آنلاین و پیشنهاد مهاجرت Provider
- کارت‌های Provider و قابلیت‌های Rate/Inventory API
- Task Center با Drag & Drop بومی و ذخیره خودکار در Supabase
- حفظ Data Governance و حذف فقط برای Super Admin

## نصب
1. فایل‌های SQL نسخه‌های V6 و V7 را در Supabase اجرا کنید.
2. متغیرهای محیطی فعلی Supabase را در Vercel حفظ کنید.
3. برای حذف امن، `SUPABASE_SERVICE_ROLE_KEY` و `SUPER_ADMIN_DELETE_KEY` الزامی هستند.
4. پروژه را Push و Deploy کنید.

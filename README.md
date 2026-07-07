# IranHotel Operations System — Enterprise V5 Super App

نسخه V5 بر پایه نسخه موفق V4 ساخته شده و با تمرکز روی سوپر اپ عملیاتی ایران‌هتل توسعه یافته است.

## امکانات اصلی

- داشبورد مدیریتی و KPI عملیاتی
- CRM 360 هتل‌ها با دید سلامت، ظرفیت، قرارداد، اسناد و تسک‌های باز
- گزارش‌ساز مدیریتی با فیلتر کاربر و تاریخ شمسی
- Task Center با Kanban، تغییر مسئول، مشارکت‌کنندگان، برچسب‌ها، فعالیت‌ها و Progress Bar
- Hotel CRM و ورود گروهی هتل‌ها با Excel مطابق فایل ایران‌هتل
- تقویم ماهانه شمسی همراه با تسک، رویداد و یادآور
- آپلود قراردادها و اسناد روی Supabase Storage
- Roles & Permissions برای کنترل منوها و اکشن‌ها
- مدیریت کاربران، افزودن/ویرایش/حذف کاربر
- یادآور با تاریخ و ساعت و Chrome Notification در حالت باز بودن سیستم
- اتوماسیون عملیاتی
- هدف‌گذاری و لاگ اتفاق‌ها
- PWA / manifest / service worker پایه
- Responsive کامل برای دسکتاپ، تبلت و موبایل

## راه‌اندازی

1. پروژه را کامل در GitHub جایگزین کن.
2. در Supabase → SQL Editor فایل `src/app/schema.sql` را اجرا کن.
3. در Supabase مطمئن شو bucket با نام `ihos-documents` ساخته شده است. SQL تلاش می‌کند آن را بسازد.
4. در Vercel Environment Variables داشته باش:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. در Vercel گزینه Redeploy بدون Cache را بزن.

## ورود اولیه

- username: `admin`
- password: `123456`

## نکته مهم امنیتی

برای استفاده داخلی با سرعت عملیاتی، Policyها فعلاً باز هستند. برای Production رسمی، باید Supabase Auth، JWT-based RLS و Hash رمز در سمت سرور اضافه شود.

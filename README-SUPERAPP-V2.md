# IHO Task Manager + Hotel SuperApp V2

این نسخه روی هسته V7 پروژه IHO Task Manager ساخته شده و تنظیمات فعلی زیر را حفظ می‌کند:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- جداول قبلی `ihos_*`
- کاربران، نقش‌ها، تسک‌ها، هتل‌ها، اسناد، تقویم، اعلان‌ها و تنظیمات فعلی

## نصب
```bash
npm install
npm run build
npm run start
```

## Supabase
محتوای کامل `src/app/schema.sql` را در SQL Editor اجرا کنید. دو جدول جدید اضافه می‌شوند:
- `ihos_hotel_automation`
- `ihos_provider_rules`

## روش ورود داده
از منوی «سوپر اپ مدیریت هتل» و تب «تنظیمات و ورود داده»:
1. فایل BI هتل‌ها
2. فایل وضعیت نرخ و ظرفیت
3. فایل کارشناسان (`task id=1` ظرفیت، `task id=2` نرخ)

Import به‌صورت chunk انجام می‌شود، جدول فقط ۸۰ ردیف در هر صفحه رندر می‌کند و تنظیمات Provider مستقیماً در Supabase ذخیره می‌شود.

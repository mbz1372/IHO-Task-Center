# IranHotel Operations System Enterprise V3

نسخه سازمانی آنلاین با Supabase + Vercel.

## امکانات اضافه‌شده در V3
- نوتیفیکیشن داخلی و Chrome Notification برای کاربر مسئول تسک
- دیت‌پیکر شمسی اختصاصی برای ددلاین تسک و رویداد تقویم
- تقویم شمسی ماهانه با نمایش تسک‌های هر روز و رویدادها
- ورود گروهی هتل‌ها از فایل Excel مطابق فرمت فایل ایران‌هتل
- آپلود فایل قراردادها و اسناد در Supabase Storage
- مدیریت کامل تنظیمات شامل نام سیستم، زیرعنوان، رنگ برند، لوگو، favicon، تنظیمات اعلان و اسناد
- اتصال آنلاین با Supabase از طریق CDN Client برای Build پایدار روی Vercel

## نصب
1. محتوا را روی GitHub جایگزین کن.
2. در Supabase فایل `src/app/schema.sql` را اجرا کن.
3. در Vercel این Environment Variable ها را داشته باش:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. در Vercel Redeploy بدون Cache بزن.

## ورود اولیه
- username: `admin`
- password: `123456`

## نکته
برای Excel Import، مرورگر کتابخانه SheetJS را از CDN بارگذاری می‌کند. در محیط آنلاین Vercel این کار انجام می‌شود.

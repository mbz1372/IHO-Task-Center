# IHO Task Center Enterprise V4

نسخه سازمانی داخلی برای تیم تامین ایران‌هتل.

## امکانات V4

- ورود با رمز عبور برای همه کاربران
- رمز پیش‌فرض اولیه: `123456`
- مدیریت کارشناس‌ها و تیم فقط برای مدیر
- ذخیره آنلاین تغییرات تیم در Supabase
- جدول امن `iho_user_auth` برای رمزها؛ رمزها در جدول عمومی تیم ذخیره نمی‌شوند
- Realtime برای تسک‌ها و تیم
- داشبورد، Kanban، لیست، هتل‌ها، گزارش، قالب‌های تسک و CSV

## مراحل Deploy

1. فایل‌ها را در GitHub جایگزین کن.
2. در Supabase، فایل `src/app/schema.sql` را در SQL Editor اجرا کن.
3. در Vercel Environment Variables این‌ها باید وجود داشته باشند:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx یا service_role key
```

اگر Supabase/Vercel Integration را زده باشی، معمولاً `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` خودکار اضافه شده‌اند.

4. Redeploy بزن.

## ورود اولیه

برای همه کاربران seeded، رمز اولیه `123456` است. بعد از ورود مدیر، از بخش «مدیریت کارشناس‌ها» برای هر نفر رمز جدید بگذار.


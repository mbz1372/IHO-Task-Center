# IHO Task Center Enterprise V2.3

نسخه پایدار برای Vercel با Next.js پچ‌شده و بدون هشدار CVE-2025-66478.

## Deploy روی Vercel

1. فایل‌ها را داخل ریپوی `IHO-Task-Center` جایگزین کنید.
2. در Vercel روی Redeploy بزنید.
3. اگر می‌خواهید همه کارشناسان داده مشترک داشته باشند، Supabase را فعال کنید.

## Environment Variables اختیاری برای Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

بعد از ساخت پروژه Supabase، فایل زیر را در SQL Editor اجرا کنید:

```txt
src/app/schema.sql
```

اگر این دو متغیر تنظیم نشوند، اپلیکیشن با Local Storage اجرا می‌شود.

## نسخه‌ها

- Node.js: 24.x
- Next.js: 15.5.9
- React: 19.1.2
- TypeScript: 5.8.3

## Login آزمایشی

در صفحه ورود، یکی از کاربران را انتخاب کنید. برای نسخه MVP پسورد واقعی فعال نیست.

## امکانات

- RTL فارسی
- داشبورد KPI
- Kanban تسک‌ها
- List View
- پرونده هتل
- تیم و عملکرد کارشناسان
- ساخت/ویرایش/حذف تسک
- کامنت و Timeline
- چک‌لیست تسک
- خروجی CSV
- اتصال اختیاری Supabase Realtime

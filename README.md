# IHO Task Center Super V3

نسخه Super برای مدیریت تسک، هتل، تیم تامین، گزارش مدیریتی و کارتابل کارشناسان ایران‌هتل.

## Deploy روی Vercel
1. فایل‌ها را در GitHub قرار دهید.
2. روی Vercel ایمپورت کنید.
3. Node.js روی 24.x باشد.
4. Build Command: `npm run build`
5. Install Command: `npm install --no-audit --no-fund --legacy-peer-deps --no-package-lock`

## Supabase اختیاری
اگر Env های زیر را وارد نکنید، برنامه با LocalStorage کار می‌کند.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

برای Supabase فایل `src/app/schema.sql` را اجرا کنید.

## ورود
- محمدباقر ذوالفقاری = مدیر کل و دسترسی کامل
- سایر کاربران = دسترسی محدود بر اساس نقش

## امکانات V3
- داشبورد مدیریتی Super
- Kanban تسک‌ها با Drag & Drop
- لیست تسک‌ها و فیلتر پیشرفته
- پرونده هتل‌ها و ایجاد سریع تسک برای هتل
- مدیریت کامل کارشناس‌ها فقط برای مدیر
- قالب‌های آماده تسک و ایجاد گروهی تسک
- گزارش عملکرد کارشناس‌ها و زون‌ها
- خروجی CSV
- اعلان‌ها و هشدارهای مدیریتی
- Supabase Realtime اختیاری


## Vercel Settings Fix
اگر خطای `No Output Directory named public` دیدید، در Vercel مسیر زیر را چک کنید:
Project Settings → Build and Output Settings → Output Directory
این فیلد باید خالی باشد یا برای این نسخه توسط `vercel.json` روی `.next` Override می‌شود. Framework Preset هم باید Next.js باشد.

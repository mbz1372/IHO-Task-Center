# Deploy روی Vercel

1. محتوای این پوشه را در Repository متصل به پروژه `supply-dashbord` جایگزین کنید.
2. Environment Variableهای فایل `.env.example` را در Vercel تنظیم کنید.
3. برای ارتقا از نسخه ۱۷، فایل `database/SUPABASE-V18-EXECUTION-INTELLIGENCE.sql` را یک‌بار در Supabase SQL Editor اجرا کنید. در نصب تازه، ابتدا `src/app/schema.sql`، سپس Migration نسخه ۱۷ و در پایان Migration نسخه ۱۸ اجرا شود.
4. Push به شاخه اصلی انجام شود و پس از Deploy، یک بار `Redeploy without cache` اجرا شود.
5. بعد از ورود، از دکمه بروزرسانی داشبورد و سوپر اپ هتل استفاده کنید تا کش‌های قدیمی کنار گذاشته شوند.
6. در «نقش‌ها و دسترسی‌ها»، دسترسی مرکز فرمان، مالکیت هتل و KPI را برای نقش‌های سفارشی فعال کنید.

## کنترل قبل از انتشار

```bash
npm ci
npx tsc --noEmit
npm run build
```

# Deploy روی Vercel

1. محتوای این پوشه را در Repository متصل به پروژه `supply-dashbord` جایگزین کنید.
2. Environment Variableهای فایل `.env.example` را در Vercel تنظیم کنید.
3. برای دیتابیس موجود، Migration جدیدی مخصوص V16 لازم نیست. در نصب تازه، ابتدا `src/app/schema.sql` و سپس فایل‌های موردنیاز پوشه `database` اجرا شوند.
4. Push به شاخه اصلی انجام شود و پس از Deploy، یک بار `Redeploy without cache` اجرا شود.
5. بعد از ورود، از دکمه بروزرسانی داشبورد و سوپر اپ هتل استفاده کنید تا کش‌های قدیمی کنار گذاشته شوند.

## کنترل قبل از انتشار

```bash
npm ci
npx tsc --noEmit
npm run build
```

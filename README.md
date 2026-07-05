# IHO Task Center

نسخه MVP کارتابل آنلاین تیم تامین ایران‌هتل.

## اجرا روی سیستم
```bash
npm install
npm run dev
```

## Deploy روی Vercel
1. پروژه را در GitHub آپلود کنید.
2. در Vercel گزینه Import Project را بزنید.
3. Framework: Next.js
4. Deploy.

## آنلاین واقعی بین کارشناسان
نسخه فعلی با localStorage کار می‌کند تا سریع تست شود. برای آنلاین واقعی:
1. یک پروژه Supabase بسازید.
2. فایل `src/app/schema.sql` را در SQL Editor اجرا کنید.
3. مقدارهای `.env.example` را در Vercel Environment Variables وارد کنید.
4. در فاز بعدی اتصال Supabase Realtime را فعال می‌کنیم.

## امکانات MVP
- ورود ساده مدیر/کارشناس
- داشبورد KPI
- Kanban Drag & Drop
- ایجاد تسک
- تغییر وضعیت
- کامنت و Timeline
- پرونده سریع هتل‌ها
- دیتای اولیه از فایل هتل‌های ایران‌هتل

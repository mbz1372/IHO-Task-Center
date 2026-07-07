# IHO Task Center Enterprise V2

کارتابل آنلاین تیم تأمین ایران‌هتل، آماده Deploy روی Vercel.

## امکانات
- لاگین نمونه با نقش‌های مدیر، سیتی‌منیجر، کارشناس، محتوا و کنترل ظرفیت
- داشبورد KPI
- Kanban Drag & Drop
- لیست تسک‌ها با فیلتر و تغییر وضعیت سریع
- پرونده هتل‌ها
- ثبت/ویرایش/حذف تسک
- کامنت، Timeline، نتیجه نهایی
- چک‌لیست آماده بر اساس دسته‌بندی تسک
- خروجی CSV
- Scope دسترسی بر اساس نقش
- اتصال اختیاری به Supabase برای آنلاین واقعی بین همه کارشناسان

## اجرای لوکال
```bash
npm install
npm run dev
```

## Deploy روی Vercel
1. پروژه را در GitHub آپلود کنید.
2. در Vercel پروژه را Import کنید.
3. بدون Supabase هم بالا می‌آید، ولی داده‌ها فقط در مرورگر ذخیره می‌شود.

## آنلاین واقعی با Supabase
1. یک Project در Supabase بسازید.
2. محتوای فایل `src/app/schema.sql` را در SQL Editor اجرا کنید.
3. در Vercel این Environment Variable ها را اضافه کنید:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Redeploy بزنید.

بعد از اتصال Supabase، همه کارشناسان داده مشترک و لحظه‌ای می‌بینند.

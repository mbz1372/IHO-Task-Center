# IranHotel OS Enterprise V7 — Full Operations OS

نسخه V7 با تمرکز روی تبدیل سیستم به ERP عملیاتی داخلی ایران‌هتل ساخته شده است.

## اجرای Deploy
1. فایل‌ها را کامل جایگزین GitHub کن.
2. `src/app/schema.sql` را در Supabase SQL Editor اجرا کن.
3. در Vercel گزینه `Redeploy without cache` را بزن.
4. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ورود اولیه
- username: `admin`
- password: `123456`

## امکانات جدید V7
- میزکار عملیاتی هر کاربر
- داشبورد مدیرعامل
- Hotel Risk Radar
- Review / Approval Center
- SLA و زمان استاندارد
- Playbookهای عملیاتی
- پیام داخلی و Mention
- مدیریت قرارداد
- ارتباطات هتل
- Saved Views
- Bulk Actions
- AI Assistant داخلی rule-based
- گزارش روزانه خودکار
- حفظ امکانات نسخه‌های قبل: CRM 360، پروفایل هتل، پروفایل کارشناس، KPI، Realtime، تقویم شمسی، اسناد، اعلان‌ها، هدف‌گذاری، پروژه‌ها، اتوماسیون، نقش‌ها و دسترسی‌ها

## Build Status
Build با Next.js 15.5.9 موفق تست شد.

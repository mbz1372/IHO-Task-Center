# IHO Task Center V8.1 — Pro Merge + Reservation Intelligence

این نسخه، اشتباه V8 Basic را اصلاح می‌کند: پایه محصول دوباره همان نسخه Pro / V23 عملیاتی است و تحلیل داده رزرو به‌عنوان یک ماژول جدید به آن اضافه شده، نه جایگزین داشبورد اصلی.

## پایه حفظ‌شده از نسخه Pro

- داشبورد اصلی عملیات زنجیره تأمین
- Hotel CRM و پرونده عملیاتی هتل
- KPI کارشناسان و گزارش کار ساخت‌یافته
- Provider / Rate / Capacity / Contract / Cash-flow
- گزارش‌های عملیاتی، مانع‌ها، گردش‌کارها و Realtime fallback
- ساختار Supabase و Migrationهای قبلی نسخه Pro

## ماژول جدید

مسیر جدید:

```text
/reservation-intelligence
```

امکانات ماژول تحلیل رزرو:

- Import اکسل رزروهای قطعی و غیرقطعی
- Import اکسل ترافیک سایت Analytics
- قیف تبدیل ترافیک تا رزرو
- تشخیص هتل‌های پرترافیک ولی کم‌تبدیل
- محاسبه ریسک رزروی هر هتل
- ساخت تسک پیگیری از روی تحلیل
- خروجی CSV مدیریتی
- Aval AI Assistant برای تحلیل و پیشنهاد اقدام

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
AVALAI_API_KEY=...
AVALAI_MODEL=gpt-4o-mini
AVALAI_BASE_URL=https://api.avalai.ir/v1
```

## راه‌اندازی

1. فایل‌های Migration قبلی نسخه Pro را حفظ کنید.
2. برای جداول رزرو، فایل زیر را در Supabase اجرا کنید:

```text
database/SUPABASE-V8-RESERVATION-INTELLIGENCE.sql
```

3. در Vercel گزینه `Redeploy without cache` را اجرا کنید.

ورود اولیه طبق نسخه قبلی باقی می‌ماند.

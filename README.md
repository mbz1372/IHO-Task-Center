# IranHotel OS — Reservation Intelligence V8

این نسخه برای پروژه «تحلیل داده رزرو» ساخته شده و روی Vercel + Supabase اجرا می‌شود.

## امکانات اصلی
- تحلیل رزرو تایید شده و تایید نشده
- قیف تبدیل از ترافیک سایت تا رزرو
- Hotel Risk Radar
- Hotel CRM و پروفایل هتل
- Task Center عملیاتی با Assign کارشناس
- Import اکسل برای Hotels / Reservations / Traffic
- Aval AI Assistant با API Route امن
- Realtime با Supabase و Chrome Notification

## Environment Variables در Vercel
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
AVALAI_API_KEY=...
AVALAI_MODEL=gpt-4o-mini
# optional
AVALAI_BASE_URL=https://api.avalai.ir/v1/chat/completions
```

## Supabase
ابتدا `src/app/schema.sql` را در SQL Editor اجرا کنید.

برای Realtime در Supabase:
Database > Replication > جدول‌های ihos_* را فعال کنید.

## ورود اولیه
username: `admin`
password: `123456`

## Deploy
- GitHub را به Vercel وصل کنید.
- Node.js 24.x
- Redeploy without cache بعد از تغییرات بزرگ.

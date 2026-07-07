# IranHotel Operations System V1.2

نسخه V1.2 با تمرکز روی زیرساخت واقعی:

- اتصال واقعی به Supabase با fallback لوکال
- حذف واقعی کاربران از Supabase
- مدیریت فعال/غیرفعال‌سازی کاربران
- تنظیمات ذخیره‌شونده در جدول `iho_os_settings`
- تم تیره/روشن سراسری
- نوتیفیکیشن Chrome با Notification API و Service Worker
- پاپ‌آپ سراسری ایجاد تسک از همه صفحات
- Realtime ساده برای تسک‌های جدید و آپدیت تسک‌ها
- CRM هتل، Task Center، مدیریت تیم، گزارش و تنظیمات

## راه‌اندازی

1. پروژه را روی GitHub جایگزین کن.
2. در Vercel این Environment Variableها را داشته باش:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ylerrzqerjhabcjghdta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

3. در Supabase > SQL Editor فایل `src/app/schema.sql` را اجرا کن.
4. Redeploy بزن.

رمز اولیه همه کاربران: `123456`

## نکته مهم نوتیفیکیشن Chrome

این نسخه نوتیفیکیشن مرورگر را برای مرورگری که سایت باز است فعال می‌کند. Push Notification واقعی حتی وقتی سایت بسته است، نیاز به VAPID key و ذخیره Subscription دارد و در فاز بعد قابل اضافه شدن است.

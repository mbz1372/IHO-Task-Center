# ورود با Google در ایران‌هتل

## تنظیمات یک‌باره
1. در [Google Cloud Console](https://console.cloud.google.com/apis/credentials) یک OAuth Client ID از نوع Web application بساز. صفحه Consent Screen و کاربران مجاز را طبق سیاست سازمان تنظیم کن.
2. Authorized redirect URI:
   `https://ylerrzqerjhabcjghdta.supabase.co/auth/v1/callback`
3. در Supabase → Authentication → Providers → Google، گزینه Enable را فعال و Client ID و Client Secret دریافتی را **فقط در داشبورد Supabase** ثبت کن. کلید محرمانه را در GitHub، چت یا NEXT_PUBLIC قرار نده.
4. در Supabase → Authentication → URL Configuration، Site URL را روی `https://iho-task.vercel.app` قرار بده و Redirect URLs را شامل این دو مقدار تنظیم کن:
   - `https://iho-task.vercel.app/`
   - `https://iho-task.vercel.app/account-access`
5. در صفحات ورود ایران‌هتل روی «ورود با حساب Google» بزن.

## حفظ حساب مدیر فعلی
- سامانه برای ورود به Supply OS، شناسه کاربر تأییدشده را با `sco_members.user_id` مطابقت می‌دهد. ساخت حساب جدید Google **به‌خودی‌خود مجوز نمی‌دهد**.
- برای اتصال خودکار به حساب قدیمی، ورود با Google باید با **همان ایمیل تأییدشده حساب موجود** صورت گیرد؛ رفتار اتصال خودکار هویت‌ها را پس از راه‌اندازی Google Provider تأیید کن. اگر Google با ایمیل متفاوت است، مسیر امن اتصال هویت (`linkIdentity`) از نشست احراز هویت‌شده موجود یا تغییر نقش توسط مدیر مجاز لازم است. هرگز نقش مدیر را صرفاً با ادعای ایمیل یا ثبت‌نام جدید اعطا نکن.
- تا فعال‌شدن OAuth در داشبورد Supabase، دکمه می‌تواند خطای «provider not enabled» برگرداند.
- Google OAuth مستقل از سهمیه ایمیل بازیابی Supabase است.
- برای امنیت سازمانی بهتر است Google Workspace و محدودیت کاربران مجاز در Google OAuth Consent Screen استفاده شود؛ کنترل اصلی دسترسی داده همچنان با RLS/عضویت سمت سرور باشد.

## تأیید
- تست نهایی: ورود Google، حفظ user id، کنترل دسترسی مدیر، عدم دسترسی کاربر غیرعضو، خروج و ورود مجدد، و مسیردهی صحیح روی دامنه اصلی.
- بدون Client ID/Secret و فعال‌سازی Google Provider در Supabase، نمی‌توان ورود انتهابه‌انتها را تأیید کرد.

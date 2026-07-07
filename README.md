# IHO Task Center Enterprise V2.1

نسخه پایدارتر برای Vercel با pnpm.

## Deploy روی Vercel

1. فایل‌ها را داخل GitHub push کنید.
2. در Vercel پروژه را Import کنید.
3. Node.js را روی 20.x بگذارید.
4. اگر Supabase دارید، این ENVها را اضافه کنید:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

5. فایل `src/app/schema.sql` را در SQL Editor سوپابیس اجرا کنید.
6. Redeploy بزنید.

## نکته مهم

خطای `npm error Exit handler never called` مربوط به npm در مرحله نصب است. این نسخه با `pnpm` نصب می‌شود تا این خطا دور زده شود.

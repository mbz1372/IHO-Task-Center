-- IranHotel OS V14 - پاک‌سازی داده‌های عملیاتی فعلی
-- کاربران، نقش‌ها و تنظیمات سیستم حفظ می‌شوند.
begin;
truncate table if exists public.ihos_task_activities restart identity cascade;
truncate table if exists public.ihos_reminders restart identity cascade;
truncate table if exists public.ihos_notifications restart identity cascade;
truncate table if exists public.ihos_calendar_events restart identity cascade;
truncate table if exists public.ihos_documents restart identity cascade;
truncate table if exists public.ihos_goals restart identity cascade;
truncate table if exists public.ihos_projects restart identity cascade;
truncate table if exists public.ihos_activity_logs restart identity cascade;
truncate table if exists public.ihos_tasks restart identity cascade;
truncate table if exists public.ihos_hotel_automation restart identity cascade;
truncate table if exists public.ihos_provider_rules restart identity cascade;
truncate table if exists public.ihos_hotels restart identity cascade;
commit;

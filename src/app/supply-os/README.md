# IranHotel Supply OS (Reboot)
Production path: /supply-os. Standalone app code and schema; legacy IranHotel tables are untouched.

## Operating workflow
1. Manager starts with one hotel master export (name/code and preferably city).
2. The dashboard ranks hotels by explainable supply risks and opportunities.
3. Manager creates one actionable task, assigns a responsible staff member, and sets a deadline.
4. Assigned expert updates the task with mandatory real outcome and note. SQL records task + history atomically.
5. Manager reviews overdue tasks, status updates and measured hotel sales trends.
6. Export prioritized hotel list, follow-ups, team KPIs and CEO brief.

## Upload requirements
Only mandatory: one hotel master sheet, e.g. All Hotel Data(1).xlsx. Choose file type Hotel Master and map columns to hotel code, name and city.
Optional afterward: Hotel Assignment; online availability/rates; recent dated confirmed/unconfirmed/lost reservation exports; hotel traffic.
For multi-day or yearly sales exports, map the actual booking/report date. Persian/Jalali and Gregorian YYYY/MM/DD dates are supported.
The app aggregates by hotel/day, validates missing matches, retries idempotently, and uploads in bounded parallel batches. Original raw booking records are not stored.

## Setup
Auth: Supabase email magic link. If required, allow https://iho-task-center.vercel.app/supply-os as a redirect in Supabase Auth URL configuration.
New tables are sco_members, sco_hotels, sco_metrics, sco_tasks, sco_events, sco_imports, and read-only view sco_hotel_rollup.
An authenticated user must be manually enrolled as the FIRST manager using their verified Supabase Auth UUID. No anonymous public access or table TRUNCATE permissions exist.
Managers may add other signed-in members in Team UI.
Database schema files are in /database/SUPPLY-OS-REBOOT-V1*.sql; all migrations have been applied in the connected Supabase project.

## Scope & verification
The dashboard does not fabricate missing online or sales facts. Scoring is transparent, based on available data; changes after interventions are correlation, not proof of causality.
Deployment build and unauthenticated page loading can be checked remotely. Email login, authorized data import and complete task lifecycle require the user's first authenticated manager session for end-to-end QA.

# IranHotel Operations System Enterprise v2

A production-oriented internal operations app for IranHotel supply team.

## Deploy
1. Upload to GitHub.
2. Connect to Vercel.
3. Add Vercel env vars:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Run `src/app/schema.sql` in Supabase SQL Editor.
5. Redeploy without cache.

Default login: `admin` / `123456`

## Modules
- Dashboard
- Task Center with global modal
- Hotel CRM
- Team/User management with edit/delete
- Persian calendar display
- Document center
- Chrome notifications
- Settings persisted to Supabase
- Dark/Light mode
- CSV export
- Realtime sync for task/user/settings changes

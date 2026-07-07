## V4.1 Team Delete Fix
- Fixed team deletion persistence on Supabase.
- Deleted members are removed from iho_team_members and disabled in iho_user_auth.

# V4 Enterprise

- Password login for every team member.
- Default initial password: 123456.
- Admin-only team management with password reset field.
- Team edits are saved through server API to Supabase.
- Added secure `iho_user_auth` table for password hashes.
- Realtime refresh for tasks and team changes.
- Compatible with Vercel + Supabase Integration.

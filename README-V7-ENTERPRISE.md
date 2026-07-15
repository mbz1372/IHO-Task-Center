# IHO Operations OS V7 Enterprise

## Required Vercel Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only, never NEXT_PUBLIC)
- SUPER_ADMIN_DELETE_KEY (strong private deletion PIN/password)

## Required SQL
Run in order:
1. SUPABASE-MIGRATION-V2.sql
2. SUPABASE-MIGRATION-V3.sql
3. SUPABASE-PERFORMANCE-V6.sql
4. DATA-GOVERNANCE-V7.sql

## Deletion policy
- Only username `admin`, role id `role-super-admin`, or explicit Super Admin role sees deletion controls.
- Every destructive operation requires the exact confirmation phrase and SUPER_ADMIN_DELETE_KEY.
- Records are archived to `ihos_recycle_bin` before deletion.
- Security events are written to `ihos_secure_delete_logs`.
- Bulk deletion of users and roles is blocked.

# Performance V6

1. Run `SUPABASE-PERFORMANCE-V6.sql` once in Supabase SQL Editor.
2. Deploy the project.

Changes:
- No initial download of 9,154 hotels.
- Server-side pagination (50 rows).
- Search/filter runs in PostgreSQL.
- Dashboard KPIs are a single RPC query.
- Main Task Manager loads only 300 lightweight hotel rows; full data is in the SuperApp.
- Excel imports are chunked and do not render all records.

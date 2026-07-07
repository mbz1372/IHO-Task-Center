# Changelog

## V2.3.0

- Upgrade Next.js from vulnerable 15.1.6 to patched 15.5.9.
- Upgrade React / React DOM to 19.1.2.
- Keep Node.js 24.x for Vercel current runtime.
- Keep stable npm install command; no pnpm/corepack.
- No package-lock forced to avoid Vercel install conflicts.


## V2.4 Client Runtime Fix
- Fixed React runtime crash caused by string style props after login.
- Added task normalization for localStorage/Supabase payloads.
- Fixed loading state after successful Supabase fetch.

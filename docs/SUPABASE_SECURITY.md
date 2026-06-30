# Supabase Security

## Required Policy Model

The browser publishable key is public. Security must not depend on hiding it.

- Catalog tables: public `SELECT`; no anonymous `INSERT`, `UPDATE`, or `DELETE`
- `submissions`, `reports`, and `waitlist`: narrowly validated anonymous `INSERT`; no public reads
- `workflows`: decide explicitly whether generated workflows are public-by-ID or owner-only
- `users`: no anonymous access
- Admin writes: server proxy or server route only
- Storage buckets: public image reads; writes and deletes through `/api/admin/storage` only

## Verification Checklist

- RLS is enabled on every exposed table.
- No policy grants `anon` unrestricted mutation on catalog or identity tables.
- Public insert policies constrain allowed columns and row status.
- The service-role key exists only in server environment variables.
- Storage upload policies do not permit anonymous writes.
- Database backups and point-in-time recovery match the production recovery objective.

## Migration Discipline

Create a `supabase/migrations` directory before the next schema or policy change. Check in every schema, policy, index, and function change. Apply migrations to Preview before Production and include a data verification query.

## Admin Flow

Admin pages import `lib/admin-supabase.js`. Database requests go through `/api/admin/supabase`, which verifies a NextAuth `admin` or `agent` role against the current database record, checks same-origin requests, limits tables and methods, and adds the service role only on the server.

Do not import `lib/supabase.js` into an admin page for database writes.

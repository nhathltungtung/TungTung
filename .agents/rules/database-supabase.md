# Supabase & Database Architecture Rules

## 1. SSR Client vs Server Client

Always select the correct Supabase client based on execution context:

| Context | Import Path | Method | Notes |
|---|---|---|---|
| **Client Component** (`'use client'`) | `@/lib/supabase/client` | `createClient()` | Uses browser cookie storage. |
| **Server Component** | `@/lib/supabase/server` | `createClient()` | Async factory reading cookies via `next/headers`. |
| **Server Action** (`'use server'`) | `@/lib/supabase/server` | `createClient()` | Async factory reading & writing cookies. |
| **Route Handler** (`app/api/*`) | `@/lib/supabase/server` | `createClient()` | Async factory reading & writing cookies. |

> **IMPORTANT**: Never instantiate `@supabase/supabase-js` directly in components without the `@supabase/ssr` cookie adapters found in `@/lib/supabase/`.

## 2. Row Level Security (RLS) Policy Standards

Every table created in PostgreSQL **MUST** enable RLS:

```sql
-- Always enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Read policy (e.g. public or authenticated read)
CREATE POLICY "Allow authenticated read"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Insert policy with user association
CREATE POLICY "Allow authenticated insert"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 3. Update policy with ownership or admin role
CREATE POLICY "Allow owner or admin update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- 4. Delete policy restricted to ADMIN
CREATE POLICY "Allow admin delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );
```

## 3. Database Migrations & Seeding

- Migrations are stored in `supabase/migrations/`.
- Naming format: `<YYYYMMDD_HHMMSS>_<feature_name>.sql`.
- When updating schema locally:
  - Add tables, foreign keys, triggers, and RLS policies into a new migration file.
  - Update `supabase/seed.sql` with mock data for testing.
  - Test locally with `npm run db:reset` or execute directly in **Supabase Studio** at `http://127.0.0.1:54323`.

## 4. Supabase Docker Local Stack

- **Supabase Studio**: `http://127.0.0.1:54323` (User: `supabase`, Pass: `supabaseadmin123`)
- **API Gateway**: `http://127.0.0.1:54321`
- **Postgres Database**: `localhost:54322` (User: `postgres`, Pass: `postgres`)
- **Mailcatcher (Inbucket)**: `http://127.0.0.1:54324`
- Default Test Admin Account: `admin@tailadmin.dev` / `admin123456`

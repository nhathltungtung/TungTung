---
name: supabase-workflow
description: >-
  Operational runbook for managing local Supabase Docker stack, database migrations,
  seed data, Row Level Security (RLS) policies, and environment configuration.
---

# Supabase Docker & Database Workflow

Use this skill when you need to manage the PostgreSQL database, execute migrations, reset test data, inspect Supabase Studio, or configure Supabase credentials.

---

## 🐳 1. Docker Management Commands

The project bundles a complete self-hosted Supabase stack inside `supabase-docker/`:

```bash
# Start local Supabase containers in background
npm run db:start

# Inspect status of all containers
npm run db:status

# Tail logs of all services
npm run db:logs

# Stop all containers
npm run db:stop

# WIPE database volume and recreate with initial schema & seed
npm run db:reset
```

---

## 🌐 2. Local Service Endpoints & Credentials

| Service | Local URL / Host | Default Credentials |
|---|---|---|
| **Supabase Studio** (Web UI) | `http://127.0.0.1:54323` | User: `supabase` / Pass: `supabaseadmin123` |
| **API Gateway / Kong** | `http://127.0.0.1:54321` | Anon & Service keys in `.env.local` |
| **PostgreSQL Database** | `localhost:54322` | User: `postgres` / Pass: `postgres` / DB: `postgres` |
| **Mailcatcher (Inbucket)** | `http://127.0.0.1:54324` | Webmail to view sign-up & OTP emails |
| **Storage / MinIO** | `http://127.0.0.1:54321/storage/v1` | Buckets: `avatars`, `attachments` |

---

## 📜 3. Creating & Applying Migrations

### Creating a Migration File
Create a new file in `supabase/migrations/`:
```text
supabase/migrations/20260912_170000_create_customers.sql
```

Ensure it includes:
1. Table creation with primary key (`UUID DEFAULT gen_random_uuid()`).
2. Foreign key relationships and cascade rules.
3. Indexes on frequently queried columns (`user_id`, `created_at`, `status`).
4. Enabling RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
5. Granular policies for SELECT, INSERT, UPDATE, DELETE.

### Applying Migrations Locally
- **Method A (Studio UI)**: Open `http://127.0.0.1:54323`, navigate to **SQL Editor**, paste the migration script, and click **RUN**.
- **Method B (Automated Reset)**: Add the script into `supabase/seed.sql` or `supabase/migrations/` and run:
  ```bash
  npm run db:reset
  ```

---

## 🔒 4. RLS & Security Checklist

Before finalizing any database change, verify:
- [ ] RLS is enabled (`ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`).
- [ ] Authenticated users cannot modify rows belonging to other tenants/users without permission.
- [ ] The `service_role` key is **never** committed to version control or included in `NEXT_PUBLIC_*` variables.
- [ ] Storage buckets have appropriate policies (`SELECT` for public, `INSERT` restricted to authenticated owners).

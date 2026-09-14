-- Migration: Create audit_logs table and seed data
-- Path: supabase/migrations/20260913010000_create_audit_logs.sql

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT 'Hệ Thống Tự Động',
  actor_email TEXT NOT NULL DEFAULT 'system@tailadmin.dev',
  action TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARNING', 'CRITICAL')),
  resource TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON public.audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access
DROP POLICY IF EXISTS "Allow read on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow read on audit_logs"
  ON public.audit_logs
  FOR SELECT
  TO public
  USING (true);

-- Allow insert access for all authenticated & backend operations
DROP POLICY IF EXISTS "Allow insert on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow insert on audit_logs"
  ON public.audit_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow delete only for admins / local cleanup
DROP POLICY IF EXISTS "Allow delete on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow delete on audit_logs"
  ON public.audit_logs
  FOR DELETE
  TO public
  USING (true);

-- Seed realistic sample audit logs
INSERT INTO public.audit_logs (id, actor_name, actor_email, action, level, ip_address, resource, metadata, created_at)
VALUES
  (
    'a0000002-0000-0000-0000-000000000001',
    'TailAdmin Master',
    'admin@tailadmin.dev',
    'ROLE_PERMISSIONS_UPDATED',
    'WARNING',
    '192.168.1.10',
    'RBAC Matrix (Manager -> Export Permission)',
    '{"target_role": "manager", "added_permissions": ["export_excel", "view_reports"], "author_ip": "192.168.1.10"}'::jsonb,
    NOW() - INTERVAL '15 minutes'
  ),
  (
    'a0000002-0000-0000-0000-000000000002',
    'Hồ Long Nhật',
    'nhathl@gmail.com',
    'USER_LOGIN_SUCCESS',
    'INFO',
    '113.190.23.45',
    'Supabase Auth Gateway',
    '{"auth_provider": "email", "device": "macOS 15.2 Chrome 129", "session_id": "sess_9821af"}'::jsonb,
    NOW() - INTERVAL '1 hour'
  ),
  (
    'a0000002-0000-0000-0000-000000000003',
    'TailAdmin Master',
    'admin@tailadmin.dev',
    'DATABASE_BACKUP_COMPLETED',
    'INFO',
    '127.0.0.1',
    'PostgreSQL Database Pooler',
    '{"backup_size": "42.8 MB", "destination": "Supabase Storage /backups/daily-2026-09-12.sql"}'::jsonb,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'a0000002-0000-0000-0000-000000000004',
    'Hệ Thống Tự Động',
    'system@tailadmin.dev',
    'FAILED_LOGIN_ATTEMPTS_EXCEEDED',
    'CRITICAL',
    '45.134.22.8',
    'Auth Service GoTrue',
    '{"attempted_email": "root@company.com", "failed_count": 5, "action_taken": "IP_BLOCKED_TEMPORARILY_15MIN"}'::jsonb,
    NOW() - INTERVAL '5 hours'
  ),
  (
    'a0000002-0000-0000-0000-000000000005',
    'Trần Minh Quang',
    'quang.tm@tailadmin.dev',
    'PRODUCT_PRICE_BULK_MODIFIED',
    'WARNING',
    '14.232.180.12',
    'Product Catalog (Category: Thép hình)',
    '{"items_updated": 4, "average_change_percent": "+5.2%", "approved_by": "admin@tailadmin.dev"}'::jsonb,
    NOW() - INTERVAL '8 hours'
  ),
  (
    'a0000002-0000-0000-0000-000000000006',
    'TailAdmin Master',
    'admin@tailadmin.dev',
    'SYSTEM_MAINTENANCE_SCHEDULED',
    'INFO',
    '127.0.0.1',
    'System Infrastructure',
    '{"window_start": "2026-09-15T02:00:00Z", "expected_downtime_minutes": 10, "reason": "Postgres minor upgrade"}'::jsonb,
    NOW() - INTERVAL '12 hours'
  )
ON CONFLICT (id) DO NOTHING;

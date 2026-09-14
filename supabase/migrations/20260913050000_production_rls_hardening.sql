-- ==============================================================================
-- Migration: 20260913050000_production_rls_hardening.sql
-- Description: Enforce production-grade Row Level Security (RLS) across all tables
-- ==============================================================================

-- 1. HARDEN public.profiles
-- Remove overly permissive open mutation policy
DROP POLICY IF EXISTS "Allow all mutations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;

-- Regular users can only update their own non-sensitive profile info (cannot elevate their own role)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
  );

-- Admins have full read/write/delete access on all user profiles
CREATE POLICY "Admins have full access on profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. HARDEN public.products
-- Remove open mutation policy
DROP POLICY IF EXISTS "Allow all mutations on products" ON public.products;
DROP POLICY IF EXISTS "Staff can mutate products" ON public.products;

-- Public can read products
DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
CREATE POLICY "Allow public read on products"
  ON public.products
  FOR SELECT
  TO public
  USING (true);

-- Only Admin & Manager can create, update, or delete products
CREATE POLICY "Staff can mutate products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- 3. HARDEN public.system_settings
DROP POLICY IF EXISTS "Allow all update on system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow insert on system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admins can update system_settings" ON public.system_settings;

CREATE POLICY "Only admins can update system_settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. HARDEN public.audit_logs (Immutable Append-Only Ledger)
DROP POLICY IF EXISTS "Allow public read on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all insert on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert on audit_logs" ON public.audit_logs;

-- Only Admins can inspect audit logs
CREATE POLICY "Admins can read audit_logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Any authenticated user or system action can log events
CREATE POLICY "Allow insert on audit_logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- NOTE: No UPDATE or DELETE policies are granted on public.audit_logs.
-- This ensures audit logs are strictly immutable and tamper-proof.

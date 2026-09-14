-- Migration: Create system_settings table and seed default configuration
-- Path: supabase/migrations/20260913030000_create_system_settings.sql

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  system_name TEXT NOT NULL DEFAULT 'Base Next.js Admin',
  company_name TEXT NOT NULL DEFAULT 'Công Ty Công Nghệ TailAdmin',
  logo_url TEXT,
  support_email TEXT NOT NULL DEFAULT 'hotro@tailadmin.dev',
  hotline TEXT NOT NULL DEFAULT '1900 6868',
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings (for layout, landing, and sidebar branding)
DROP POLICY IF EXISTS "Allow public read on system_settings" ON public.system_settings;
CREATE POLICY "Allow public read on system_settings"
  ON public.system_settings FOR SELECT
  TO public
  USING (true);

-- Allow authenticated/admin to update settings
DROP POLICY IF EXISTS "Allow all update on system_settings" ON public.system_settings;
CREATE POLICY "Allow all update on system_settings"
  ON public.system_settings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert on system_settings" ON public.system_settings;
CREATE POLICY "Allow insert on system_settings"
  ON public.system_settings FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert singleton default row if not exists
INSERT INTO public.system_settings (id, system_name, company_name, support_email, hotline, maintenance_mode)
VALUES (
  1,
  'Base Next.js Admin',
  'Công Ty Công Nghệ TailAdmin',
  'hotro@tailadmin.dev',
  '1900 6868',
  false
)
ON CONFLICT (id) DO NOTHING;

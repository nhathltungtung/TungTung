-- ==============================================================================
-- Migration: Update profiles schema with department, status, phone & seed users
-- Path: supabase/migrations/20260913000000_update_profiles_and_seed_users.sql
-- ==============================================================================

-- 1. Add new columns to public.profiles if they don't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Phòng Kỹ Thuật (Engineering)',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update role and status check constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'manager', 'user'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('Active', 'Suspended'));

-- 3. Update automatic trigger to capture new fields from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, department, status, phone)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        COALESCE(new.raw_user_meta_data->>'department', 'Phòng Kỹ Thuật (Engineering)'),
        COALESCE(new.raw_user_meta_data->>'status', 'Active'),
        COALESCE(new.raw_user_meta_data->>'phone', NULL)
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        department = COALESCE(EXCLUDED.department, public.profiles.department),
        status = COALESCE(EXCLUDED.status, public.profiles.status),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$;

-- 4. Ensure RLS policies allow SELECT and Admin mutations
DROP POLICY IF EXISTS "Allow public read on profiles" ON public.profiles;
CREATE POLICY "Allow public read on profiles"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow all mutations on profiles" ON public.profiles;
CREATE POLICY "Allow all mutations on profiles"
  ON public.profiles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- 5. Indexes for fast filtering and sorting
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 6. Update existing profiles for Admin Master & Hồ Long Nhật
UPDATE public.profiles
SET 
  role = 'admin',
  department = 'Ban Điều Hành (Executive)',
  status = 'Active'
WHERE email = 'admin@tailadmin.dev';

UPDATE public.profiles
SET 
  role = 'admin',
  department = 'Phòng Kỹ Thuật (Engineering)',
  status = 'Active'
WHERE email = 'nhathl@gmail.com';

-- 7. Seed sample team members into auth.users and public.profiles
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token, email_change
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'quang.tm@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Trần Minh Quang","role":"manager","department":"Phòng Kỹ Thuật (Engineering)","status":"Active"}', now() - interval '60 days', now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'yen.lh@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lê Hoàng Yến","role":"manager","department":"Phòng Sản Phẩm (Product)","status":"Active"}', now() - interval '45 days', now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'dang.ph@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Phạm Hải Đăng","role":"user","department":"Phòng Thiết Kế (UI/UX)","status":"Active"}', now() - interval '30 days', now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'hanh.vb@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vũ Bích Hạnh","role":"user","department":"Phòng Hỗ Trợ (Customer Success)","status":"Suspended"}', now() - interval '20 days', now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'cuong.dq@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Đỗ Quốc Cường","role":"user","department":"Phòng Kinh Doanh (Sales)","status":"Active"}', now() - interval '15 days', now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'linh.nm@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ngô Mỹ Linh","role":"user","department":"Phòng Marketing","status":"Active"}', now() - interval '10 days', now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000001-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'khiem.bg@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bùi Gia Khiêm","role":"manager","department":"Phòng Tài Chính & Kế Toán","status":"Active"}', now() - interval '5 days', now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'ha.nt@tailadmin.dev', extensions.crypt('admin123456', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nguyễn Thu Hà","role":"user","department":"Phòng Nhân Sự (HR)","status":"Active"}', now() - interval '2 days', now(), '', '', '', '')
ON CONFLICT (id) DO UPDATE
SET 
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Ensure public.profiles has correct department and status for all seeded users
INSERT INTO public.profiles (id, email, full_name, role, department, status, created_at)
VALUES
  ('a0000001-0000-0000-0000-000000000003', 'quang.tm@tailadmin.dev', 'Trần Minh Quang', 'manager', 'Phòng Kỹ Thuật (Engineering)', 'Active', now() - interval '60 days'),
  ('a0000001-0000-0000-0000-000000000004', 'yen.lh@tailadmin.dev', 'Lê Hoàng Yến', 'manager', 'Phòng Sản Phẩm (Product)', 'Active', now() - interval '45 days'),
  ('a0000001-0000-0000-0000-000000000005', 'dang.ph@tailadmin.dev', 'Phạm Hải Đăng', 'user', 'Phòng Thiết Kế (UI/UX)', 'Active', now() - interval '30 days'),
  ('a0000001-0000-0000-0000-000000000006', 'hanh.vb@tailadmin.dev', 'Vũ Bích Hạnh', 'user', 'Phòng Hỗ Trợ (Customer Success)', 'Suspended', now() - interval '20 days'),
  ('a0000001-0000-0000-0000-000000000007', 'cuong.dq@tailadmin.dev', 'Đỗ Quốc Cường', 'user', 'Phòng Kinh Doanh (Sales)', 'Active', now() - interval '15 days'),
  ('a0000001-0000-0000-0000-000000000008', 'linh.nm@tailadmin.dev', 'Ngô Mỹ Linh', 'user', 'Phòng Marketing', 'Active', now() - interval '10 days'),
  ('a0000001-0000-0000-0000-000000000009', 'khiem.bg@tailadmin.dev', 'Bùi Gia Khiêm', 'manager', 'Phòng Tài Chính & Kế Toán', 'Active', now() - interval '5 days'),
  ('a0000001-0000-0000-0000-000000000010', 'ha.nt@tailadmin.dev', 'Nguyễn Thu Hà', 'user', 'Phòng Nhân Sự (HR)', 'Active', now() - interval '2 days')
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  status = EXCLUDED.status;

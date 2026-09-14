-- ==============================================================================
-- TungTung Cloud Database - All Consolidated Migrations
-- Run this in Supabase Cloud Dashboard -> SQL Editor
-- ==============================================================================

-- >>>>> START: 20260909000000_init_auth_and_profiles.sql <<<<<
-- ==============================================================================
-- 0. Ensure Required Schemas & Roles for PostgREST and Realtime
-- ==============================================================================
CREATE SCHEMA IF NOT EXISTS graphql_public;
GRANT USAGE ON SCHEMA graphql_public TO anon, authenticated, service_role, postgres;

CREATE SCHEMA IF NOT EXISTS _realtime;
GRANT ALL ON SCHEMA _realtime TO supabase_admin, postgres;

-- ==============================================================================
-- 1. Create Public Profiles Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users with role management.';

-- ==============================================================================
-- 2. Enable Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- ==============================================================================
-- 3. Automatic Trigger for New User Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profiles_updated_at ON public.profiles;
CREATE TRIGGER on_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. Grant Permissions
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;


-- >>>>> START: 20260912000000_create_roofing_management_schema.sql <<<<<
-- ==============================================================================
-- SCHEMA QUẢN LÝ BÁN HÀNG & KHO TÔN THÉP (ĐẠI LÝ TUẤN HƯƠNG)
-- Phục vụ số hoá theo quy cách cắt tôn, phụ kiện và theo dõi đơn hàng
-- ==============================================================================

-- 1. Bảng Khách Hàng (Customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    note TEXT,
    total_debt NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Danh Mục Sản Phẩm & Phụ Kiện (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ton_lop' CHECK (category IN ('ton_lop', 'phu_kien', 'thep_hop', 'xa_go', 'khac')),
    unit TEXT NOT NULL DEFAULT 'm2',
    default_width NUMERIC(6, 2) DEFAULT 1.08,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stock_quantity NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Đơn Hàng Cắt Tôn (Roofing Orders)
CREATE TABLE IF NOT EXISTS public.roofing_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deposit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cutting', 'completed', 'cancelled')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Nhóm Tôn Trong Đơn Hàng (Roofing Order Groups)
CREATE TABLE IF NOT EXISTS public.roofing_order_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.roofing_orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    width NUMERIC(6, 2) NOT NULL DEFAULT 1.08,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_pieces INT NOT NULL DEFAULT 0,
    total_meters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_square_meters NUMERIC(12, 4) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

-- 5. Bảng Chi Tiết Tấm Cắt Tôn Lẻ (Roofing Order Cut Items)
CREATE TABLE IF NOT EXISTS public.roofing_order_cut_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.roofing_order_groups(id) ON DELETE CASCADE,
    length NUMERIC(8, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_meters NUMERIC(10, 2) NOT NULL,
    sort_order INT DEFAULT 0
);

-- 6. Bảng Phụ Kiện Kèm Theo Đơn Hàng (Roofing Order Accessories)
CREATE TABLE IF NOT EXISTS public.roofing_order_accessories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.roofing_orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    length NUMERIC(8, 2),
    pieces INT,
    unit TEXT NOT NULL DEFAULT 'Cái',
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

-- ==============================================================================
-- INDEXES & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_roofing_orders_customer_id ON public.roofing_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_roofing_orders_order_date ON public.roofing_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_roofing_orders_status ON public.roofing_orders(status);
CREATE INDEX IF NOT EXISTS idx_roofing_order_groups_order_id ON public.roofing_order_groups(order_id);
CREATE INDEX IF NOT EXISTS idx_roofing_order_cut_items_group_id ON public.roofing_order_cut_items(group_id);
CREATE INDEX IF NOT EXISTS idx_roofing_order_accessories_order_id ON public.roofing_order_accessories(order_id);

-- Kích hoạt RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_order_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_order_cut_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_order_accessories ENABLE ROW LEVEL SECURITY;

-- Cho phép người dùng đã xác thực (hoặc anon trong chế độ dev local) thao tác
CREATE POLICY "Allow public read access for customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow public read access for products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_orders" ON public.roofing_orders FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_order_groups" ON public.roofing_order_groups FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_order_cut_items" ON public.roofing_order_cut_items FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_order_accessories" ON public.roofing_order_accessories FOR ALL USING (true);


-- >>>>> START: 20260913000000_update_profiles_and_seed_users.sql <<<<<
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


-- >>>>> START: 20260913010000_create_audit_logs.sql <<<<<
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


-- >>>>> START: 20260913020000_storage_buckets.sql <<<<<
-- Migration: Create Storage Buckets and Policies for Avatars and Products
-- Path: supabase/migrations/20260913020000_storage_buckets.sql

-- 1. Create Public Buckets if they don't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies
-- Allow public to read/view images
DROP POLICY IF EXISTS "Public can view avatar images" ON storage.objects;
CREATE POLICY "Public can view avatar images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow all uploads & mutations (local demo / authenticated)
DROP POLICY IF EXISTS "Allow upload avatar images" ON storage.objects;
CREATE POLICY "Allow upload avatar images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow update avatar images" ON storage.objects;
CREATE POLICY "Allow update avatar images"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow delete avatar images" ON storage.objects;
CREATE POLICY "Allow delete avatar images"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow upload product images" ON storage.objects;
CREATE POLICY "Allow upload product images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow update product images" ON storage.objects;
CREATE POLICY "Allow update product images"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow delete product images" ON storage.objects;
CREATE POLICY "Allow delete product images"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'product-images');

-- 3. Ensure image_url exists on public.products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;


-- >>>>> START: 20260913030000_create_system_settings.sql <<<<<
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


-- >>>>> START: 20260913050000_production_rls_hardening.sql <<<<<
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


-- >>>>> START: 20260914000000_create_inventory_and_accounting_schema.sql <<<<<
-- ==============================================================================
-- SCHEMA QUẢN LÝ KHO TT88 & KẾ TOÁN HỘ KINH DOANH (ĐẠI LÝ TUẤN HƯƠNG)
-- Phục vụ số hoá thay thế file 54qr.xlsx (60 mã hàng, Sổ Quỹ S1-HKD, Mẫu 03-VT, 04-VT)
-- ==============================================================================

-- 1. Bảng Danh Mục Hàng Hoá & Tồn Kho (Inventory Items)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'CÂY',
    category TEXT NOT NULL CHECK (category IN ('thep_hop', 'ong_tron', 'nhom', 'ton_lop', 'phu_kien', 'vat_tu_khac')),
    stock_qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stock_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Đơn giá vốn bình quân gia quyền TT88
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Giá bán niêm yết
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Lịch Sử Nhập / Xuất Kho (Stock Transactions - Mẫu 03-VT & 04-VT)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code TEXT UNIQUE NOT NULL, -- PNK001 (Nhập 03-VT), PXK001 (Xuất 04-VT)
    type TEXT NOT NULL CHECK (type IN ('import', 'export', 'adjustment')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    product_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    partner_name TEXT, -- Nhà cung cấp (Olympic, Hòa Phát...) hoặc Khách thầu
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Sổ Quỹ Tiền Mặt (Cash Transactions - Mẫu S1-HKD, 01-TT, 02-TT)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code TEXT UNIQUE NOT NULL, -- PT001 (Phiếu thu 01-TT), PC001 (Phiếu chi 02-TT)
    type TEXT NOT NULL CHECK (type IN ('receipt', 'payment')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL, -- Lý do thu / chi
    counterpart TEXT NOT NULL, -- Người nộp hoặc người nhận tiền
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer')),
    reference_id TEXT, -- Mã đơn hàng cắt tôn hoặc mã chứng từ liên quan
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Sổ Công Nợ Thợ Thầu & Khách Hàng (Customer Debts)
CREATE TABLE IF NOT EXISTS public.customer_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    total_purchased NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remaining_debt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    last_payment_date DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes tối ưu hiệu năng truy vấn
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON public.inventory_items(code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON public.stock_transactions(date);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product_code ON public.stock_transactions(product_code);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_customer_debts_customer_id ON public.customer_debts(customer_id);

-- RLS Policies
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on inventory_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on stock_transactions" ON public.stock_transactions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on stock_transactions" ON public.stock_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on cash_transactions" ON public.cash_transactions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on cash_transactions" ON public.cash_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on customer_debts" ON public.customer_debts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on customer_debts" ON public.customer_debts FOR ALL USING (true) WITH CHECK (true);

-- NẠP 60 MÃ HÀNG GỐC TỪ SHEET 2 '54qr.xlsx'
INSERT INTO public.inventory_items (code, name, unit, category, stock_qty, stock_value, unit_cost, selling_price)
VALUES
  ('H141411', '14x14x1,1', 'CÂY', 'thep_hop', 52, 3413800, 65650, 75000),
  ('H141414', '14x14x1,4', 'CÂY', 'thep_hop', 40, 2678000, 66950, 78000),
  ('H161612', '16x16x1,2', 'CÂY', 'thep_hop', 15, 1016550, 67770, 79000),
  ('H161614', '16x16x1,4', 'CÂY', 'thep_hop', 21, 1635270, 77870, 89000),
  ('H202010', '20x20x1,0', 'CÂY', 'thep_hop', 72, 4129200, 57350, 68000),
  ('H202014', '20x20x1,4', 'CÂY', 'thep_hop', 6, 594120, 99020, 112000),
  ('H252511', '25x25x1,1', 'CÂY', 'thep_hop', 45, 3579300, 79540, 92000),
  ('H252514', '25x25x1,4', 'CÂY', 'thep_hop', 32, 3975360, 124230, 140000),
  ('H303014', '30x30x1,4', 'CÂY', 'thep_hop', 37, 5666180, 153140, 172000),
  ('H404014', '40x40x1,4', 'CÂY', 'thep_hop', 19, 3880218, 204222, 230000),
  ('H404018', '40X40x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 290000),
  ('H505014', '50X50x1,4', 'CÂY', 'thep_hop', 20, 5223400, 261170, 295000),
  ('H505018', '50X50x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 360000),
  ('H132614', '13X26x1,4', 'CÂY', 'thep_hop', 34, 3227960, 94940, 108000),
  ('H204012', '20X40x1,2', 'CÂY', 'thep_hop', 30, 3974700, 132490, 150000),
  ('H204014', '20X40x1,4', 'CÂY', 'thep_hop', 32, 4828608, 150894, 170000),
  ('H255012', '25X50x1,2', 'CÂY', 'thep_hop', 32, 5268160, 164630, 185000),
  ('H255014', '25X50x1,4', 'CÂY', 'thep_hop', 30, 5810190, 193673, 218000),
  ('H255018', '20X50x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 275000),
  ('H306014', '30X60x1,4', 'CÂY', 'thep_hop', 30, 6926700, 230890, 260000),
  ('H306018', '30X60x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 325000),
  ('H408014', '40X80x1,4', 'CÂY', 'thep_hop', 25, 7767000, 310680, 350000),
  ('H408018', '40X80x1,8', 'CÂY', 'thep_hop', 8, 3168960, 396120, 445000),
  ('H5010014', '50X100x1,4', 'CÂY', 'thep_hop', 9, 3516030, 390670, 440000),
  ('H5010018', '50X100x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 560000),
  ('O2114', 'O 21x1,4', 'CÂY', 'ong_tron', 17, 1449760, 85280, 98000),
  ('O2116', 'O 21X1,6', 'CÂY', 'ong_tron', 20, 5439000, 271950, 305000),
  ('O2119', 'O 21X1,9', 'CÂY', 'ong_tron', 0, 0, 0, 350000),
  ('O2714', 'O 27X1,4', 'CÂY', 'ong_tron', 14, 1522920, 108780, 125000),
  ('O2716', 'O 27X1,6', 'CÂY', 'ong_tron', 21, 4549500, 216643, 245000),
  ('O2719', 'O 27X1,9', 'CÂY', 'ong_tron', 0, 0, 0, 290000),
  ('O3314', 'O 33X1,4', 'CÂY', 'ong_tron', 12, 1659840, 138320, 158000),
  ('O3316', 'O 33X1,6', 'CÂY', 'ong_tron', 0, 0, 0, 185000),
  ('O3319', 'O 33X1,9', 'CÂY', 'ong_tron', 3, 720000, 240000, 275000),
  ('O4214', 'O 42X1,4', 'CÂY', 'ong_tron', 0, 0, 0, 210000),
  ('O4216', 'O 42X1,6', 'CÂY', 'ong_tron', 18, 4851000, 269500, 305000),
  ('O4219', 'O 42X1,9', 'CÂY', 'ong_tron', 0, 0, 0, 360000),
  ('O4814', 'O 48X1,4', 'CÂY', 'ong_tron', 6, 1864056, 310676, 355000),
  ('O4816', 'O 48X1,6', 'CÂY', 'ong_tron', 15, 4620000, 308000, 350000),
  ('O4819', 'O 48X1,9', 'CÂY', 'ong_tron', 7, 2481500, 354500, 400000),
  ('O6019', 'O 60X1,9', 'CÂY', 'ong_tron', 11, 4889500, 444500, 500000),
  ('O6014', 'O 60X1,4', 'CÂY', 'ong_tron', 8, 1648320, 206040, 235000),
  ('O7621', 'O 76X2,1', 'CÂY', 'ong_tron', 7, 4256000, 608000, 690000),
  ('O7614', 'O 76X1,4', 'CÂY', 'ong_tron', 0, 0, 0, 450000),
  ('O9021', 'O 90X21', 'CÂY', 'ong_tron', 4, 2820000, 705000, 800000),
  ('SUCO', 'NHÔM TRẮNG SỨ CỎ', 'KG', 'nhom', 200, 21000000, 105000, 120000),
  ('VGNTCO', 'NHÔM VÂN GỖ NỘI THẤT CỎ', 'KG', 'nhom', 108, 12528000, 116000, 132000),
  ('CAFEYL', 'NHÔM YANGLI MÀU CAFÉ', 'KG', 'nhom', 421, 46310000, 110000, 125000),
  ('CAFEYLBH', 'NHÔM YANGLI MÀU CAFÉ BẢO HÀNH', 'KG', 'nhom', 9.56, 1108960, 116000, 132000),
  ('VGNTYL', 'NHÔM YANGLI MÀU VÂN GỖ NỘI THẤT', 'KG', 'nhom', 221, 26962000, 122000, 138000),
  ('VGTYL', 'NHÔM YANGLI MÀU VÂN GỖ TRẮC', 'KG', 'nhom', 52.78, 6439160, 122000, 138000),
  ('TON1LOP', 'TÔN 1 LỚP OLYMPIC', 'M2', 'ton_lop', 243, 15066000, 62000, 111000),
  ('TONXOP', 'TÔN XỐP CÁCH NHIỆT', 'M2', 'ton_lop', 68, 8840000, 130000, 165000),
  ('MANG300', 'MÁNG 300 INOX', 'MD', 'phu_kien', 62, 1674000, 27000, 45000),
  ('XOI300', 'XỐI 300', 'MD', 'phu_kien', 59, 1593000, 27000, 45000),
  ('NOC300', 'NÓC 300', 'MD', 'phu_kien', 46, 1242000, 27000, 45000),
  ('SUON300', 'SƯỜN 300', 'MD', 'phu_kien', 49, 1323000, 27000, 45000),
  ('INOX304', 'INOX 304 CUỘN', 'KG', 'vat_tu_khac', 597.92, 35695824, 59700, 72000),
  ('LUOI', 'LƯỚI B40', 'KG', 'vat_tu_khac', 270, 5886000, 21800, 28000),
  ('SATCAN', 'SẮT BÁN THEO CÂN', 'KG', 'vat_tu_khac', 721.65, 10319595, 14300, 18000)
ON CONFLICT (code) DO NOTHING;

-- Nạp giao dịch Sổ Quỹ Tiền Mặt mẫu
INSERT INTO public.cash_transactions (voucher_code, type, date, category, counterpart, amount, payment_method, note)
VALUES
  ('PT001', 'receipt', CURRENT_DATE, 'Thu tiền bán tôn lợp & phụ kiện mái', 'Anh Việt (Khách thầu)', 6680844, 'cash', 'Thanh toán hoá đơn cắt tôn 11 tấm'),
  ('PT002', 'receipt', CURRENT_DATE - 1, 'Thu tiền công nợ khách thầu', 'Xưởng Mái Tôn Hải Yến', 15000000, 'bank_transfer', 'Thanh toán đợt 1 công trình Nghĩa Dân'),
  ('PC001', 'payment', CURRENT_DATE - 2, 'Chi tiền nhập cuộn tôn mạ kẽm', 'Nhà máy Tôn Olympic', 25000000, 'bank_transfer', 'Nhập cuộn tôn 0.4 xanh rêu')
ON CONFLICT (voucher_code) DO NOTHING;


-- >>>>> START: 20260914010000_create_units_of_measure_catalog.sql <<<<<
-- ==============================================================================
-- SCHEMA BẢNG DANH MỤC ĐƠN VỊ TÍNH DÙNG CHUNG (UNITS OF MEASURE CATALOG)
-- Dùng chung cho Quản lý Kho Hàng TT88 và Đơn Hàng Cắt Tôn (Đại Lý Tuấn Hương)
-- ==============================================================================

-- 1. Tạo bảng danh mục đơn vị tính (units_of_measure)
CREATE TABLE IF NOT EXISTS public.units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,            -- Mã code chuẩn: CAY, MET, M2, KG, CAI, TAM, CUON, HOP, BAO, BINH, BO, LO, TUI, MD
    name VARCHAR(50) NOT NULL,                   -- Tên hiển thị chuẩn: Cây, Mét, m², Kg, Cái, Tấm, Cuộn, Hộp, Bao, Bình, Bộ, Lọ, Túi, Mét dài
    symbol VARCHAR(20),                          -- Ký hiệu viết tắt: cây, m, m², kg, cái, tấm...
    category VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (category IN ('all', 'thep_hop', 'ton_lop', 'phu_kien', 'vat_tu_khac')),
    description TEXT,                            -- Mô tả áp dụng
    sort_order INT NOT NULL DEFAULT 0,           -- Thứ tự hiển thị ưu tiên
    is_active BOOLEAN NOT NULL DEFAULT true,     -- Trạng thái kích hoạt
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Đánh chỉ mục (Indexes) để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_uom_code ON public.units_of_measure(code);
CREATE INDEX IF NOT EXISTS idx_uom_category ON public.units_of_measure(category);
CREATE INDEX IF NOT EXISTS idx_uom_sort_order ON public.units_of_measure(sort_order);
CREATE INDEX IF NOT EXISTS idx_uom_is_active ON public.units_of_measure(is_active);

-- 3. Kích hoạt Row Level Security (RLS)
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;

-- 4. Chính sách bảo mật RLS:
-- Mọi người dùng (kể cả khách / anon và authenticated) đều được phép đọc danh mục ĐVT
DROP POLICY IF EXISTS "Allow read access to all users for units_of_measure" ON public.units_of_measure;
CREATE POLICY "Allow read access to all users for units_of_measure"
ON public.units_of_measure FOR SELECT
USING (true);

-- Chỉ admin / service role được phép chỉnh sửa danh mục ĐVT
DROP POLICY IF EXISTS "Allow admin write access for units_of_measure" ON public.units_of_measure;
CREATE POLICY "Allow admin write access for units_of_measure"
ON public.units_of_measure FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 5. Nạp dữ liệu khởi tạo 14 đơn vị tính chuẩn ngành tôn thép (Seed Data)
INSERT INTO public.units_of_measure (code, name, symbol, category, description, sort_order, is_active)
VALUES
    ('CAY', 'Cây', 'cây', 'thep_hop', 'Thép hộp mạ kẽm, ống tròn Hòa Phát, nhôm cây định hình 6m', 1, true),
    ('MET', 'Mét', 'm', 'all', 'Mét dài tôn cắt theo quy cách, phụ kiện xối máng cắt lẻ', 2, true),
    ('M2', 'm²', 'm²', 'ton_lop', 'Diện tích m² tôn lợp 1 lớp, tôn xốp PU, tôn ngói Ruby', 3, true),
    ('KG', 'Kg', 'kg', 'vat_tu_khac', 'Nhôm định hình, Inox 304, lưới B40, sắt phôi cân ký', 4, true),
    ('CAI', 'Cái', 'cái', 'phu_kien', 'Đầu bịt máng xối, nẹp chỉ tôn, phụ kiện gia công nhỏ', 5, true),
    ('TAM', 'Tấm', 'tấm', 'ton_lop', 'Tấm tôn thành phẩm đã dập cắt theo kích thước', 6, true),
    ('CUON', 'Cuộn', 'cuộn', 'ton_lop', 'Cuộn tôn nguyên khổ nhà máy (Olympic, Hoa Sen, Đông Á)', 7, true),
    ('HOP', 'Hộp', 'hộp', 'vat_tu_khac', 'Vít bắn tôn đóng hộp, que hàn, linh kiện', 8, true),
    ('BAO', 'Bao', 'bao', 'vat_tu_khac', 'Đinh dù, vật tư đóng bao lớn', 9, true),
    ('BINH', 'Bình', 'bình', 'vat_tu_khac', 'Keo bọt chống cháy, bình xịt mỡ bảo dưỡng', 10, true),
    ('BO', 'Bộ', 'bộ', 'phu_kien', 'Bộ phụ kiện nóc máng trọn gói công trình', 11, true),
    ('LO', 'Lọ', 'lọ', 'phu_kien', 'Keo Silicone Apollo A500, A300 chống dột mái', 12, true),
    ('TUI', 'Túi', 'túi', 'phu_kien', 'Vít mạ kẽm đóng túi nhỏ 100 - 200 con', 13, true),
    ('MD', 'Mét dài', 'md', 'phu_kien', 'Đơn vị kế toán mét dài dập xưởng Thông tư 88', 14, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());


-- >>>>> START: seed.sql <<<<<
-- ==============================================================================
-- Supabase Local Seed Data
-- ==============================================================================

-- Create pgcrypto extension if not already present
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create a demo user in auth.users if not exists
-- Password will be 'admin123456' using standard Supabase bcrypt hash
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a1111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@tailadmin.dev',
    extensions.crypt('admin123456', extensions.gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"TailAdmin Master","role":"admin"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Seed Danh mục Khách hàng mẫu
INSERT INTO public.customers (id, name, phone, address, note)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'Anh Việt (Khách thầu)', '0988 123 456', 'Trương Xá, Nghĩa Dân, Hưng Yên', 'Thợ thầu công trình quen'),
    ('c2222222-2222-2222-2222-222222222222', 'Bác Hùng (Xây nhà)', '0912 345 678', 'Nghĩa Dân, Kim Động, Hưng Yên', 'Khách làm mái nhà 2 tầng')
ON CONFLICT (id) DO NOTHING;

-- Seed Danh mục Sản phẩm & Phụ kiện mẫu từ file hoá đơn
INSERT INTO public.products (code, name, category, unit, default_width, unit_price, stock_quantity)
VALUES
    ('TON-OLYMPIC-04', 'Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 111000, 2500),
    ('TON-DONGA-045', 'Tôn 0,45 Xanh Dương Đông Á 11 sóng', 'ton_lop', 'm2', 1.08, 115000, 1800),
    ('TON-HOASEN-04', 'Tôn 0,4 Đỏ Đậm Hoa Sen 11 sóng', 'ton_lop', 'm2', 1.08, 112000, 1200),
    ('SUON-300', 'Sườn 300', 'phu_kien', 'md', 0, 38000, 450),
    ('MANG-400-INOX', 'Máng 400 Inox 304', 'phu_kien', 'kg', 0, 82000, 300),
    ('KEO-A500', 'Keo A500', 'phu_kien', 'lo', 0, 48000, 150),
    ('VIT-4', 'Vít 4', 'phu_kien', 'tui', 0, 75000, 200)
ON CONFLICT (code) DO UPDATE 
SET unit_price = EXCLUDED.unit_price,
    stock_quantity = EXCLUDED.stock_quantity;


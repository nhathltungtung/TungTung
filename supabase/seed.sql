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
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone_change,
    phone_change_token,
    reauthentication_token
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
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE
SET 
  confirmation_token = COALESCE(auth.users.confirmation_token, ''),
  recovery_token = COALESCE(auth.users.recovery_token, ''),
  email_change_token_new = COALESCE(auth.users.email_change_token_new, ''),
  email_change = COALESCE(auth.users.email_change, ''),
  phone_change = COALESCE(auth.users.phone_change, ''),
  phone_change_token = COALESCE(auth.users.phone_change_token, ''),
  reauthentication_token = COALESCE(auth.users.reauthentication_token, '');

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

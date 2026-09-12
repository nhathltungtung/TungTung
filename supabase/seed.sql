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

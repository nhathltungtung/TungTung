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

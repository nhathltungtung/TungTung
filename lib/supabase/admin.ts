import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client using Service Role Key.
 * DÙNG ĐỘC QUYỀN TRÊN SERVER (Server Actions, API routes, Cron jobs).
 * TUYỆT ĐỐI KHÔNG import vào Client Components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Supabase Admin client."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

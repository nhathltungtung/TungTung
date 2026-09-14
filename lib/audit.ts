import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { LogLevel } from "@/types";

export interface LogActivityParams {
  action: string;
  level: LogLevel;
  resource: string;
  metadata?: Record<string, unknown>;
  actor?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

/**
 * Ghi nhận nhật ký hoạt động hệ thống vào bảng public.audit_logs
 * Tự động trích xuất IP từ headers và thông tin user từ session nếu không truyền actor.
 */
export async function logActivity({
  action,
  level,
  resource,
  metadata = {},
  actor,
}: LogActivityParams): Promise<void> {
  try {
    let clientIp = "127.0.0.1";
    try {
      const headerList = await headers();
      const forwarded = headerList.get("x-forwarded-for");
      const realIp = headerList.get("x-real-ip");
      if (forwarded) {
        clientIp = forwarded.split(",")[0].trim();
      } else if (realIp) {
        clientIp = realIp;
      }
    } catch {
      // Bên ngoài request context (vd: script/cron)
    }

    let actorName = actor?.name || "Hệ Thống Tự Động";
    let actorEmail = actor?.email || "system@tailadmin.dev";
    let userId = actor?.id || null;

    if (!actor) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          userId = user.id;
          actorEmail = user.email || actorEmail;
          actorName =
            (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            "Thành viên";
        }
      } catch {
        // Fallback actor mặc định
      }
    }

    let db: SupabaseClient | null = null;
    try {
      db = createAdminClient();
    } catch {
      // Fallback
    }

    if (!db || typeof db.from !== "function") {
      try {
        db = await createClient();
      } catch {
        // Mock / test environment fallback
      }
    }

    if (db && typeof db.from === "function") {
      const query = db.from("audit_logs");
      if (query && typeof query.insert === "function") {
        await query.insert({
          user_id: userId,
          actor_name: actorName,
          actor_email: actorEmail,
          action,
          level,
          resource,
          ip_address: clientIp,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    // Không làm gián đoạn luồng nghiệp vụ chính nếu ghi log lỗi
    console.error("Lỗi khi ghi audit log:", err);
  }
}

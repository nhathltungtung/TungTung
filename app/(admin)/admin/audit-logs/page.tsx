import React from "react";
import { createClient } from "@/lib/supabase/server";
import { AuditLogsClient } from "@/components/admin/audit-logs/AuditLogsClient";
import { AuditLogItem, LogLevel } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nhật Ký Hoạt Động | Base Next.js",
  description: "Ghi nhận toàn bộ thao tác bảo mật, thay đổi dữ liệu, truy cập API và sao lưu hệ thống.",
};

export default async function AuditLogsPage() {
  const supabase = await createClient();

  // Truy vấn trực tiếp từ bảng public.audit_logs trong Supabase PostgreSQL
  const { data: logsData, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    console.error("Lỗi khi tải audit_logs từ Supabase:", error.message);
  }

  const logs: AuditLogItem[] = (logsData || []).map((item) => ({
    id: item.id,
    timestamp: item.created_at,
    actor: item.actor_name || "Hệ Thống Tự Động",
    actorEmail: item.actor_email || "system@tailadmin.dev",
    action: item.action,
    level: (item.level as LogLevel) || "INFO",
    ipAddress: item.ip_address || "127.0.0.1",
    resource: item.resource,
    metadata: (item.metadata as Record<string, unknown>) || {},
    userId: item.user_id,
  }));

  return <AuditLogsClient initialLogs={logs} />;
}

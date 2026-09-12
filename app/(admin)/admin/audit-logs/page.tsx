"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { Drawer } from "@/components/ui/Drawer";
import {
  ShieldAlert,
  Info,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Clock,
} from "lucide-react";

export type LogLevel = "INFO" | "WARNING" | "CRITICAL";

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  actorEmail: string;
  action: string;
  level: LogLevel;
  ipAddress: string;
  resource: string;
  metadata: Record<string, unknown>;
}

const initialAuditLogs: AuditLogItem[] = [
  {
    id: "LOG-1049",
    timestamp: "2026-09-10 11:42:05",
    actor: "Admin Master",
    actorEmail: "admin@tailadmin.dev",
    action: "ROLE_PERMISSIONS_UPDATED",
    level: "WARNING",
    ipAddress: "192.168.1.10",
    resource: "RBAC Matrix (Manager -> Export Permission)",
    metadata: {
      target_role: "manager",
      added_permissions: ["export_excel", "view_reports"],
      author_ip: "192.168.1.10",
    },
  },
  {
    id: "LOG-1048",
    timestamp: "2026-09-10 11:20:18",
    actor: "Trần Minh Quang",
    actorEmail: "quang.tm@tailadmin.dev",
    action: "USER_LOGIN_SUCCESS",
    level: "INFO",
    ipAddress: "113.190.23.45",
    resource: "Supabase Auth Gateway",
    metadata: {
      auth_provider: "email",
      device: "macOS 15.2 Chrome 129",
    },
  },
  {
    id: "LOG-1047",
    timestamp: "2026-09-10 10:55:40",
    actor: "Nguyễn Văn Admin",
    actorEmail: "admin@tailadmin.dev",
    action: "DATABASE_BACKUP_COMPLETED",
    level: "INFO",
    ipAddress: "127.0.0.1",
    resource: "PostgreSQL Database Pooler",
    metadata: {
      backup_size: "42.8 MB",
      destination: "Supabase Storage /backups/daily-2026-09-10.sql",
    },
  },
  {
    id: "LOG-1046",
    timestamp: "2026-09-10 09:30:12",
    actor: "Hệ Thống Tự Động",
    actorEmail: "system@tailadmin.dev",
    action: "FAILED_LOGIN_ATTEMPTS_EXCEEDED",
    level: "CRITICAL",
    ipAddress: "45.134.22.8",
    resource: "Auth Service GoTrue",
    metadata: {
      attempted_email: "root@company.com",
      failed_count: 5,
      action_taken: "IP_BLOCKED_TEMPORARILY_15MIN",
    },
  },
  {
    id: "LOG-1045",
    timestamp: "2026-09-10 08:15:33",
    actor: "Admin Master",
    actorEmail: "admin@tailadmin.dev",
    action: "ORDER_DELETED_MANUALLY",
    level: "WARNING",
    ipAddress: "192.168.1.10",
    resource: "Orders Table (#ORD-9701)",
    metadata: {
      deleted_order_id: "ORD-9701",
      reason: "Đơn hàng thử nghiệm của tester",
    },
  },
  {
    id: "LOG-1044",
    timestamp: "2026-09-09 17:50:20",
    actor: "Lê Hoàng Yến",
    actorEmail: "yen.lh@tailadmin.dev",
    action: "DATA_EXPORT_EXCEL",
    level: "INFO",
    ipAddress: "14.232.18.90",
    resource: "Transactions Table",
    metadata: {
      total_rows_exported: 120,
      export_type: "xlsx",
    },
  },
];

export default function AuditLogsPage() {
  const [logs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case "INFO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> WARN
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse">
            <AlertOctagon className="w-3 h-3" /> CRITICAL
          </span>
        );
    }
  };

  const columns: ColumnDef<AuditLogItem>[] = [
    {
      accessorKey: "timestamp",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thời Gian" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {row.getValue("timestamp")}
        </span>
      ),
    },
    {
      accessorKey: "level",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mức Độ" />,
      cell: ({ row }) => getLevelBadge(row.getValue("level")),
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "action",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hành Động" />,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
          {row.getValue("action")}
        </span>
      ),
    },
    {
      accessorKey: "actor",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Người Thực Hiện" />,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <div className="font-semibold text-slate-900 dark:text-white leading-snug">
              {item.actor}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.actorEmail}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "resource",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tài Nguyên Tác Động" />,
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.getValue("resource")}
        </span>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Địa Chỉ IP" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.getValue("ipAddress")}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chi Tiết</span>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <button
            type="button"
            onClick={() => setSelectedLog(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#24303f] transition-colors cursor-pointer"
            title="Xem chi tiết sự kiện"
          >
            <Eye className="w-4 h-4" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          <span>Hệ thống</span>
          <span>/</span>
          <span className="text-blue-600 dark:text-blue-400">Nhật ký hoạt động</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          Nhật Ký Hoạt Động & Bảo Mật (Audit Logs)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ghi nhận toàn bộ thao tác nhạy cảm, lịch sử đăng nhập, cấp quyền và sự kiện bảo mật trong hệ thống.
        </p>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        searchKey="action"
        searchPlaceholder="Tìm theo hành động hoặc người thao tác..."
        filterColumn="level"
        filterTitle="Mức độ"
        filterOptions={[
          { label: "INFO (Thông tin)", value: "INFO" },
          { label: "WARNING (Cảnh báo)", value: "WARNING" },
          { label: "CRITICAL (Nghiêm trọng)", value: "CRITICAL" },
        ]}
        exportFileName="Nhat_ky_hoat_dong_TailAdmin"
        onRowClick={(item) => setSelectedLog(item)}
      />

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Chi Tiết Sự Kiện: ${selectedLog.id}` : ""}
        description={selectedLog ? `Ghi nhận lúc ${selectedLog.timestamp}` : ""}
        width="md"
        footer={
          <button
            type="button"
            onClick={() => setSelectedLog(null)}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-xs font-semibold text-slate-800 dark:text-white transition-colors"
          >
            Đóng Bảng Trượt
          </button>
        }
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-[#2e3a47] space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mức Độ Cảnh Báo:</span>
                {getLevelBadge(selectedLog.level)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Người Thực Hiện:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedLog.actor} ({selectedLog.actorEmail})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Địa Chỉ IP:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedLog.ipAddress}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tài Nguyên:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedLog.resource}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Dữ Liệu Payload (JSON Meta):
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

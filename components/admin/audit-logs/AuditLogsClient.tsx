"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/ui/table";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { formatDateTimeVN } from "@/lib/utils";
import { AuditLogItem, LogLevel } from "@/types";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Info,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Terminal,
  Server,
  User,
} from "lucide-react";

interface AuditLogsClientProps {
  initialLogs: AuditLogItem[];
}

export function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
  const router = useRouter();
  const logs = initialLogs;
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days">("all");

  const filteredLogs = React.useMemo(() => {
    if (dateFilter === "all") return logs;
    const now = new Date();
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      if (dateFilter === "today") {
        return logDate.toDateString() === now.toDateString();
      }
      if (dateFilter === "7days") {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (dateFilter === "30days") {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [logs, dateFilter]);

  // KPI Metrics Calculations
  const totalLogs = logs.length;
  const infoCount = logs.filter((l) => l.level === "INFO").length;
  const warningCount = logs.filter((l) => l.level === "WARNING").length;
  const criticalCount = logs.filter((l) => l.level === "CRITICAL").length;

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case "INFO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
            <AlertTriangle className="w-3.5 h-3.5" /> WARN
          </span>
        );
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Đã đồng bộ nhật ký mới nhất từ PostgreSQL!");
    }, 400);
  };

  const handleCopyText = (text: string, label = "thông tin") => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata, null, 2));
    setIsCopied(true);
    toast.success("Đã sao chép JSON Payload vào Clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // TanStack Columns
  const columns: ColumnDef<AuditLogItem>[] = [
    // 1. Selection Checkbox Column (Pinned Left)
    {
      id: "select",
      size: 48,
      minSize: 48,
      maxSize: 48,
      enableResizing: false,
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            aria-label="Chọn tất cả"
            className="rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            aria-label="Chọn sự kiện"
            className="rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "center",
        filterVariant: "none",
      },
    },

    // 2. Index / STT Column (Pinned Left)
    {
      id: "stt",
      size: 56,
      minSize: 56,
      maxSize: 56,
      enableResizing: false,
      header: () => <div className="text-center font-bold text-slate-700 dark:text-slate-200">STT</div>,
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        const pageRowIndex = table.getRowModel().rows.findIndex((r) => r.id === row.id);
        const indexNumber = pageIndex * pageSize + (pageRowIndex >= 0 ? pageRowIndex : 0) + 1;
        return (
          <div className="text-center font-mono text-slate-500 dark:text-slate-400 font-medium">
            {indexNumber}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "center",
        filterVariant: "none",
      },
    },

    // 3. Event ID Column
    {
      accessorKey: "id",
      size: 130,
      minSize: 100,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Mã Sự Kiện" />
      ),
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        const shortId = id.length > 8 ? id.substring(0, 8) + "..." : id;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyText(id, "mã sự kiện");
            }}
            className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            title={`Nhấp để sao chép (${id})`}
          >
            <span>{shortId}</span>
          </button>
        );
      },
      meta: {
        filterVariant: "multi-select",
      },
    },

    // 4. Timestamp Column
    {
      accessorKey: "timestamp",
      size: 170,
      minSize: 150,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Thời Gian" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {formatDateTimeVN(row.getValue("timestamp"))}
        </span>
      ),
      meta: {
        filterVariant: "multi-select",
      },
    },

    // 5. Level Column
    {
      accessorKey: "level",
      size: 130,
      minSize: 110,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Mức Độ" />
      ),
      cell: ({ row }) => getLevelBadge(row.getValue("level")),
      filterFn: (row, id, value) => {
        if (!value || !Array.isArray(value) || value.length === 0) return true;
        return value.includes(row.getValue(id));
      },
      meta: {
        filterVariant: "multi-select",
      },
    },

    // 6. Action Column
    {
      accessorKey: "action",
      size: 240,
      minSize: 180,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Hành Động" />
      ),
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
          {row.getValue("action")}
        </span>
      ),
      meta: {
        filterVariant: "multi-select",
      },
    },

    // 7. Actor Column
    {
      accessorKey: "actor",
      size: 210,
      minSize: 160,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Người Thực Hiện" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="py-0.5">
            <div className="font-semibold text-slate-900 dark:text-white leading-snug truncate">
              {item.actor}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {item.actorEmail}
            </div>
          </div>
        );
      },
      meta: {
        filterVariant: "multi-select",
      },
    },

    // 8. Resource Column
    {
      accessorKey: "resource",
      size: 230,
      minSize: 180,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Tài Nguyên Tác Động" />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 truncate block">
          {row.getValue("resource")}
        </span>
      ),
      meta: {
        filterVariant: "multi-select",
      },
    },

    // 9. IP Address Column
    {
      accessorKey: "ipAddress",
      size: 140,
      minSize: 120,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Địa Chỉ IP" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-slate-400" />
          {row.getValue("ipAddress")}
        </span>
      ),
      meta: {
        filterVariant: "multi-select",
      },
    },

    // 10. Actions Column (Pinned Right)
    {
      id: "actions",
      size: 80,
      minSize: 80,
      maxSize: 80,
      enableResizing: false,
      header: () => (
        <div className="text-center font-bold text-slate-700 dark:text-slate-200">Chi Tiết</div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSelectedLog(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#24303f] transition-colors cursor-pointer"
              title="Xem chi tiết sự kiện"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "center",
        filterVariant: "none",
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Nhật Ký Hoạt Động Hệ Thống
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ShieldAlert className="w-3.5 h-3.5" /> Audit Trail Live
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ghi nhận toàn bộ thao tác bảo mật, thay đổi dữ liệu, truy cập API và sao lưu hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#24303f] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            {isRefreshing ? "Đang đồng bộ..." : "Đồng bộ mới nhất"}
          </button>
        </div>
      </div>

      {/* 2. 4 Stat Cards KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng sự kiện */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng sự kiện ghi nhận
            </span>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalLogs.toLocaleString("vi-VN")}
            </h3>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 inline-block">
              Đồng bộ PostgreSQL
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Server className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Thông thường (INFO) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Thông thường (INFO)
            </span>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {infoCount.toLocaleString("vi-VN")}
            </h3>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 inline-block">
              Vận hành chuẩn
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Info className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Cảnh báo (WARNING) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Cảnh báo (WARNING)
            </span>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {warningCount.toLocaleString("vi-VN")}
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 inline-block">
              Cần chú ý theo dõi
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Nghiêm trọng (CRITICAL) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Nghiêm trọng (CRITICAL)
            </span>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {criticalCount.toLocaleString("vi-VN")}
            </h3>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 inline-block">
              Yêu cầu xử lý ngay
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Date Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#24303f] rounded-xl border border-slate-200 dark:border-[#2e3a47] text-xs">
          {(
            [
              { id: "all", label: "Tất cả thời gian" },
              { id: "today", label: "Hôm nay" },
              { id: "7days", label: "7 ngày qua" },
              { id: "30days", label: "30 ngày qua" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDateFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                dateFilter === tab.id
                  ? "bg-white dark:bg-[#1c2434] text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Hiển thị <strong>{filteredLogs.length}</strong> / {totalLogs} sự kiện
        </span>
      </div>

      {/* 3. DataTable System */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        searchKey="action"
        searchPlaceholder="Tìm kiếm hành động, người thực hiện, tài nguyên..."
        filterColumn="level"
        filterTitle="Mức Độ"
        filterOptions={[
          { label: "INFO (Thông thường)", value: "INFO" },
          { label: "WARNING (Cảnh báo)", value: "WARNING" },
          { label: "CRITICAL (Nghiêm trọng)", value: "CRITICAL" },
        ]}
        initialPinning={{
          left: ["select", "stt", "id"],
          right: ["actions"],
        }}
        exportFileName="Nhat_Ky_Hoat_Dong_Audit_Logs"
      />

      {/* 4. Modal Chi Tiết Payload JSON */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Chi Tiết Sự Kiện Nhật Ký"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            {/* Header info bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47]">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Mã sự kiện:</span>
                <span className="ml-1.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {selectedLog.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getLevelBadge(selectedLog.level)}
              </div>
            </div>

            {/* Grid thông tin chi tiết */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434]">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Hành động thực hiện
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {selectedLog.action}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434]">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Thời gian ghi nhận
                </span>
                <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateTimeVN(selectedLog.timestamp)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434]">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Người thực hiện
                </span>
                <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {selectedLog.actor}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedLog.actorEmail}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434]">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Địa chỉ IP & Cổng
                </span>
                <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {selectedLog.ipAddress}
                </span>
              </div>
            </div>

            {/* Tài nguyên tác động */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434]">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                Tài nguyên bị tác động
              </span>
              <span className="text-xs font-medium text-slate-900 dark:text-white">
                {selectedLog.resource}
              </span>
            </div>

            {/* JSON Metadata Payload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dữ liệu ngữ cảnh bổ sung (Metadata Payload)
                </span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Sao chép JSON
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-56">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#24303f] dark:hover:bg-[#2e3a47] dark:text-slate-300 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

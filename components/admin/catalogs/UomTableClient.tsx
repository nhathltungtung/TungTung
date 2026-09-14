"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/form/Button";
import { UomFormModal } from "./UomFormModal";
import { deleteUomAction, toggleUomActiveAction } from "@/app/(admin)/admin/catalogs/actions";
import { UnitOfMeasure } from "@/types/uom";
import { Plus, Edit2, Trash2, Eye, Tags, CheckCircle2, XCircle, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

interface UomTableClientProps {
  initialUoms: UnitOfMeasure[];
}

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
  all: {
    label: "Toàn Xưởng",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
  },
  thep_hop: {
    label: "Thép Hộp",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  ton_lop: {
    label: "Tôn Lợp",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  phu_kien: {
    label: "Phụ Kiện",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  vat_tu_khac: {
    label: "Vật Tư Khác",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
};

export function UomTableClient({ initialUoms }: UomTableClientProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "view";
    uom: UnitOfMeasure | null;
  }>({
    isOpen: false,
    mode: "create",
    uom: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    uom: UnitOfMeasure | null;
  }>({
    isOpen: false,
    uom: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteDialog.uom) return;
    setIsDeleting(true);
    try {
      const res = await deleteUomAction(deleteDialog.uom.id);
      if (!res.success) {
        toast.error(res.error || "Lỗi khi xoá đơn vị tính.");
        return;
      }
      toast.success(`Đã xoá đơn vị tính "${deleteDialog.uom.name}" thành công!`);
      setDeleteDialog({ isOpen: false, uom: null });
    } catch {
      toast.error("Có lỗi xảy ra khi xoá đơn vị tính.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (uom: UnitOfMeasure) => {
    try {
      const newStatus = !uom.isActive;
      const res = await toggleUomActiveAction(uom.id, newStatus);
      if (!res.success) {
        toast.error(res.error || "Lỗi khi đổi trạng thái.");
        return;
      }
      toast.success(
        `Đã ${newStatus ? "kích hoạt" : "tạm ngưng"} đơn vị '${uom.name}'!`
      );
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái.");
    }
  };

  const columns = useMemo<ColumnDef<UnitOfMeasure>[]>(
    () => [
      {
        accessorKey: "sortOrder",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="STT" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-400 font-bold">
            #{row.original.sortOrder || row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mã ĐVT (Code)" />
        ),
        cell: ({ row }) => (
          <span className="px-2.5 py-1 text-xs font-mono font-black rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tên Đơn Vị Tính" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {row.original.name}
            </span>
            {row.original.symbol && (
              <span className="text-xs text-slate-400 font-mono">
                ({row.original.symbol})
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ngành Hàng Áp Dụng" />
        ),
        cell: ({ row }) => {
          const badge = CATEGORY_BADGES[row.original.category] || CATEGORY_BADGES.all;
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.className}`}
            >
              {badge.label}
            </span>
          );
        },
        meta: {
          filterOptions: [
            { value: "all", label: "Toàn Xưởng" },
            { value: "thep_hop", label: "Thép Hộp" },
            { value: "ton_lop", label: "Tôn Lợp" },
            { value: "phu_kien", label: "Phụ Kiện" },
            { value: "vat_tu_khac", label: "Vật Tư Khác" },
          ],
        },
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mô Tả Ứng Dụng" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 max-w-sm">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Trạng Thái" />
        ),
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return (
            <button
              type="button"
              onClick={() => handleToggleActive(row.original)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105"
              title="Nhấp để chuyển đổi trạng thái sử dụng"
            >
              {isActive ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> Tạm dừng
                </span>
              )}
            </button>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Thao Tác</div>,
        cell: ({ row }) => {
          const uom = row.original;
          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalState({ isOpen: true, mode: "view", uom })}
                title="Xem chi tiết"
                className="w-8 h-8 p-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalState({ isOpen: true, mode: "edit", uom })}
                title="Chỉnh sửa"
                className="w-8 h-8 p-0 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialog({ isOpen: true, uom })}
                title="Xóa đơn vị tính"
                className="w-8 h-8 p-0 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header trang với nút Thêm Mới bên phải theo chuẩn */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2.5">
            <Tags className="w-6 h-6 text-primary" />
            Danh Mục Đơn Vị Tính (UOM Catalog)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý danh mục đơn vị tính chuẩn hoá dùng chung cho Kho Hàng TT88 và Bàn Tính Cắt Tôn
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            setModalState({
              isOpen: true,
              mode: "create",
              uom: null,
            })
          }
          className="flex items-center gap-1.5 bg-[#3c50e0] hover:bg-[#3344bd] text-white font-bold cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Thêm Đơn Vị Tính
        </Button>
      </div>

      {/* Main DataTable Container */}
      <div className="bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={initialUoms}
          searchKey="name"
          searchPlaceholder="Tìm kiếm theo tên ĐVT, mã code hoặc mô tả..."
        />
      </div>

      {/* Unified Form Modal (Rule 6: create | edit | view dùng chung 1 popup) */}
      <UomFormModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        uom={modalState.uom}
        onClose={() => setModalState({ isOpen: false, mode: "create", uom: null })}
        onModeChange={(newMode) => setModalState((prev) => ({ ...prev, mode: newMode }))}
      />

      {/* Dialog xác nhận xóa an toàn */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, uom: null })}
        onConfirm={handleDelete}
        title="Xác nhận xóa đơn vị tính"
        description={`Bạn có chắc chắn muốn xóa đơn vị tính "${deleteDialog.uom?.name}" (${deleteDialog.uom?.code}) khỏi hệ thống? Thao tác này sẽ không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

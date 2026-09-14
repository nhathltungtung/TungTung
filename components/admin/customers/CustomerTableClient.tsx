"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/form/Button";
import {
  CustomerData,
  CustomerFormModal,
} from "./CustomerFormModal";
import { deleteCustomerAction } from "@/app/(admin)/admin/customers/actions";
import { formatCurrency } from "@/lib/roofing-calc";
import { Plus, Edit2, Trash2, Eye, Phone, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

interface CustomerTableClientProps {
  initialCustomers: CustomerData[];
}

export function CustomerTableClient({
  initialCustomers,
}: CustomerTableClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerData[]>(initialCustomers);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "view";
    customer: CustomerData | null;
  }>({
    isOpen: false,
    mode: "create",
    customer: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    customer: CustomerData | null;
  }>({
    isOpen: false,
    customer: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteDialog.customer) return;
    setIsDeleting(true);
    const target = deleteDialog.customer;
    try {
      const res = await deleteCustomerAction(
        target.id,
        target.name
      );
      if (!res.success) {
        toast.error(res.error || "Lỗi khi xoá khách thầu.");
        return;
      }
      setCustomers((prev) => prev.filter((c) => c.id !== target.id));
      router.refresh();
      toast.success(`Đã xoá khách thầu "${target.name}" thành công!`);
      setDeleteDialog({ isOpen: false, customer: null });
    } catch {
      toast.error("Có lỗi xảy ra khi xoá.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<CustomerData>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Khách Thầu / Thợ Cơ Khí" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {row.original.name}
            </div>
            {row.original.note && (
              <div className="text-[11px] text-slate-400 truncate max-w-xs">
                {row.original.note}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Số Điện Thoại" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {row.original.phone || "—"}
          </span>
        ),
      },
      {
        accessorKey: "address",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Địa Chỉ / Công Trình" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {row.original.address || "—"}
          </span>
        ),
      },
      {
        accessorKey: "total_debt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Công Nợ Hiện Còn (đ)" />
        ),
        cell: ({ row }) => {
          const debt = Number(row.original.total_debt) || 0;
          return debt > 0 ? (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              {formatCurrency(debt)}
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-600">
              0 đ
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Thao Tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              title="Xem Chi Tiết (Rule 6 Unified Modal)"
              onClick={() =>
                setModalState({
                  isOpen: true,
                  mode: "view",
                  customer: row.original,
                })
              }
              className="p-1.5 text-slate-500 hover:text-primary"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Chỉnh Sửa"
              onClick={() =>
                setModalState({
                  isOpen: true,
                  mode: "edit",
                  customer: row.original,
                })
              }
              className="p-1.5 text-slate-500 hover:text-amber-600"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Xoá Khách Thầu"
              onClick={() =>
                setDeleteDialog({
                  isOpen: true,
                  customer: row.original,
                })
              }
              className="p-1.5 text-slate-500 hover:text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header Banner & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#24303f] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Khách Hàng & Thợ Thầu Cơ Khí
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Danh bạ thợ cơ khí, xưởng mái tôn, quản lý địa chỉ công trình và lịch sử mua bán
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            setModalState({
              isOpen: true,
              mode: "create",
              customer: null,
            })
          }
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Thêm Khách Thầu
        </Button>
      </div>

      {/* Main DataTable */}
      <div className="bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={customers}
          searchKey="name"
          searchPlaceholder="Tìm kiếm theo tên khách thầu hoặc số điện thoại..."
        />
      </div>

      {/* Unified Form Modal */}
      <CustomerFormModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        customer={modalState.customer}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onModeChange={(newMode) =>
          setModalState((prev) => ({ ...prev, mode: newMode }))
        }
        onSuccess={(saved) => {
          setCustomers((prev) => {
            const index = prev.findIndex((c) => c.id === saved.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = saved;
              return updated;
            }
            return [saved, ...prev];
          });
          router.refresh();
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={`Xác Nhận Xoá: ${deleteDialog.customer?.name || ""}`}
        description="Bạn có chắc chắn muốn xoá khách thầu này khỏi hệ thống? Dữ liệu lịch sử đơn hàng liên quan có thể bị ảnh hưởng."
        confirmText="Xoá Khách Thầu"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialog({ isOpen: false, customer: null })}
      />
    </div>
  );
}

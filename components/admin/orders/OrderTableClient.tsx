"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/form/Button";
import { RoofingOrder } from "@/types/roofing";
import { formatCurrency } from "@/lib/roofing-calc";
import {
  exportRoofingOrderToExcel,
  exportRoofingOrdersListToExcel,
} from "@/lib/roofing-excel";
import { RoofingInvoicePrint } from "@/components/roofing/RoofingInvoicePrint";
import { OrderListPrint } from "./OrderListPrint";
import {
  updateRoofingOrderStatusAction,
  deleteRoofingOrderAction,
} from "@/app/(admin)/admin/orders/actions";
import {
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Layers,
  Clock,
  CheckCircle,
  XCircle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import {
  getFromLocalStorage,
  deleteFromLocalStorage,
} from "@/lib/supabase/roofing-service";
import { saveRoofingOrderAction } from "@/app/(admin)/admin/orders/actions";
import { RotateCw } from "lucide-react";

interface OrderTableClientProps {
  initialOrders: RoofingOrder[];
}

export function OrderTableClient({ initialOrders }: OrderTableClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<RoofingOrder[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<RoofingOrder | null>(null);
  const [isPrintingList, setIsPrintingList] = useState(false);
  const [isExportingList, setIsExportingList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    order: RoofingOrder | null;
  }>({
    isOpen: false,
    order: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Cập nhật khi dữ liệu Server Components thay đổi qua revalidatePath
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Quét bộ nhớ máy (localStorage) khi vào trang: Đảm bảo KHÔNG BAO GIỜ MẤT ĐƠN kể cả khi mạng chậm/offline
  useEffect(() => {
    try {
      const localOrders = getFromLocalStorage();
      if (localOrders && localOrders.length > 0) {
        setOrders((prev) => {
          const existingCodes = new Set(prev.map((o) => o.orderCode));
          const toAdd = localOrders.filter(
            (o) => !existingCodes.has(o.orderCode)
          );
          if (toAdd.length > 0) {
            // Tự động đồng bộ ngầm đơn offline lên CSDL Supabase
            toAdd.forEach((offOrder) => {
              saveRoofingOrderAction(offOrder)
                .then((res) => {
                  if (res.success) {
                    // Dọn dẹp khỏi LocalStorage sau khi đã đồng bộ an toàn lên Cloud
                    deleteFromLocalStorage(offOrder.orderCode, offOrder.id);
                    toast.success(`Đã tự động đồng bộ đơn ${offOrder.orderCode} từ thiết bị lên CSDL!`);
                  }
                })
                .catch(() => {});
            });
            return [...toAdd, ...prev];
          }
          return prev;
        });
      }
    } catch (e) {
      console.error("Lỗi quét offline orders:", e);
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Đã làm mới danh sách đơn hàng!");
    }, 600);
  };

  // Xuất file Excel danh sách toàn bộ hoặc các đơn được lọc/chọn
  const handleExportListExcel = async (ordersToExport?: RoofingOrder[]) => {
    const targetOrders =
      ordersToExport && ordersToExport.length > 0 ? ordersToExport : orders;

    if (!targetOrders || targetOrders.length === 0) {
      toast.warning("Không có đơn hàng nào để xuất Excel.");
      return;
    }

    setIsExportingList(true);
    try {
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      await exportRoofingOrdersListToExcel(
        targetOrders,
        `Danh_Sach_Don_Hang_Cat_Ton_${datePart}.xlsx`
      );
      toast.success(
        `Đã xuất thành công ${targetOrders.length} đơn hàng ra file Excel!`
      );
    } catch (err) {
      console.error("Lỗi xuất danh sách Excel:", err);
      toast.error("Có lỗi xảy ra khi xuất file Excel danh sách.");
    } finally {
      setIsExportingList(false);
    }
  };

  const handleExportExcel = async (order: RoofingOrder) => {
    try {
      await exportRoofingOrderToExcel(
        order,
        `Phieu_Thanh_Toan_${order.orderCode}.xlsx`
      );
      toast.success(`Đã xuất phiếu thanh toán Excel đơn ${order.orderCode}!`);
    } catch {
      toast.error("Lỗi khi xuất file Excel.");
    }
  };

  const handleUpdateStatus = async (
    order: RoofingOrder,
    newStatus: "pending" | "cutting" | "completed" | "cancelled"
  ) => {
    // Cập nhật ngay trên giao diện để người dùng thấy tức thì
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id || o.orderCode === order.orderCode ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await updateRoofingOrderStatusAction(
        order.id,
        newStatus,
        order.orderCode
      );
      if (!res.success) {
        toast.error(res.error || "Lỗi khi cập nhật trạng thái.");
        return;
      }
      toast.success(`Đã cập nhật đơn ${order.orderCode} sang "${newStatus}"!`);
    } catch {
      toast.error("Có lỗi xảy ra.");
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteDialog.order) return;
    const targetOrder = deleteDialog.order;
    setIsDeleting(true);

    // 1. Cập nhật ngay trên giao diện để tránh kẹt và phản hồi tức thì
    setOrders((prev) =>
      prev.filter(
        (o) =>
          o.id !== targetOrder.id && o.orderCode !== targetOrder.orderCode
      )
    );

    // 2. Xóa triệt để khỏi LocalStorage và ghi vào danh sách Tombstone đã xoá
    deleteFromLocalStorage(targetOrder.orderCode, targetOrder.id);

    try {
      const res = await deleteRoofingOrderAction(
        targetOrder.id,
        targetOrder.orderCode
      );
      if (!res.success) {
        toast.error(res.error || "Lỗi khi xoá đơn hàng.");
        return;
      }
      toast.success(`Đã xoá đơn ${targetOrder.orderCode} thành công!`);
      setDeleteDialog({ isOpen: false, order: null });
      router.refresh();
    } catch {
      toast.error("Có lỗi xảy ra khi xoá đơn.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: RoofingOrder["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="w-3 h-3" /> Chờ Cắt
          </span>
        );
      case "cutting":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            <Layers className="w-3 h-3" /> Đang Cán Tôn
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3" /> Hoàn Tất
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            <XCircle className="w-3 h-3" /> Đã Huỷ
          </span>
        );
    }
  };

  const columns = useMemo<ColumnDef<RoofingOrder>[]>(
    () => [
      {
        accessorKey: "orderCode",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mã Đơn Hàng" />
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {row.original.orderCode}
            </span>
            <div className="text-[11px] text-slate-400">
              {row.original.createdAt}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Khách Hàng / Công Trình" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {row.original.customer.name || "Khách lẻ"}
            </div>
            <div className="text-[11px] text-slate-400">
              {row.original.customer.phone || "—"} • {row.original.customer.address || "Hưng Yên"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tổng Tiền (đ)" />
        ),
        cell: ({ row }) => (
          <span className="font-bold text-slate-800 dark:text-white">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "deposit",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Đã Cọc / Trả" />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(row.original.deposit)}
          </span>
        ),
      },
      {
        accessorKey: "remainingAmount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Còn Phải Thu" />
        ),
        cell: ({ row }) => {
          const rem = row.original.remainingAmount;
          return rem > 0 ? (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              {formatCurrency(rem)}
            </span>
          ) : (
            <span className="text-xs font-semibold text-emerald-600">
              Đã xong
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Trạng Thái" />
        ),
        cell: ({ row }) => getStatusBadge(row.original.status),
        meta: {
          filterOptions: [
            { value: "completed", label: "Đã hoàn thành" },
            { value: "processing", label: "Đang cắt tôn" },
            { value: "pending", label: "Chờ xử lý" },
            { value: "cancelled", label: "Đã hủy" },
          ],
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Thao Tác</div>,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {/* Nút Sửa đơn (ẩn với đơn đã huỷ) */}
              {order.status !== "cancelled" && (
                <Link
                  href={`/admin/orders/${order.id}/edit`}
                  title="Sửa Đơn Hàng"
                  className="inline-flex p-1.5 text-slate-500 hover:text-primary rounded-md transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              )}

              {/* Nút Xem & In Hoá Đơn */}
              <Button
                variant="ghost"
                size="sm"
                title="In Hoá Đơn A4/A5"
                onClick={() => setSelectedOrder(order)}
                className="p-1.5 text-slate-500 hover:text-primary"
              >
                <Printer className="w-4 h-4" />
              </Button>

              {/* Nút Xuất Excel Form Bản Chính */}
              <Button
                variant="ghost"
                size="sm"
                title="Xuất File Excel Gửi Zalo"
                onClick={() => handleExportExcel(order)}
                className="p-1.5 text-slate-500 hover:text-emerald-600"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </Button>

              {/* Đổi trạng thái sang Hoàn tất */}
              {order.status !== "completed" && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Đánh Dấu Hoàn Tất"
                  onClick={() => handleUpdateStatus(order, "completed")}
                  className="p-1.5 text-slate-500 hover:text-emerald-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              )}

              {/* Xoá đơn */}
              <Button
                variant="ghost"
                size="sm"
                title="Xoá Đơn"
                onClick={() =>
                  setDeleteDialog({
                    isOpen: true,
                    order,
                  })
                }
                className="p-1.5 text-slate-500 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      {/* Interactive Page View - Hidden During Print */}
      <div className="space-y-6 print:hidden">
        {/* Header Banner with Create Order Button & Print List Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#24303f] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                Danh Sách Đơn Hàng Cắt Tôn
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quản lý lịch sử cắt tôn, thông tin khách thầu, trạng thái cán tôn và in phiếu xuất bán hàng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Nút Xuất Excel Danh Sách Đơn Hàng */}
            <button
              type="button"
              onClick={() => handleExportListExcel()}
              disabled={isExportingList || orders.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Xuất file Excel danh sách đơn hàng định dạng chuẩn A4 ngang"
            >
              <FileSpreadsheet
                className={`w-3.5 h-3.5 text-emerald-600 ${
                  isExportingList ? "animate-pulse" : ""
                }`}
              />
              {isExportingList ? "Đang xuất..." : "Xuất Excel Danh Sách"}
            </button>

            {/* Nút In Danh Sách Đơn Hàng */}
            <button
              type="button"
              onClick={() => setIsPrintingList(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="In Báo Cáo Tổng Hợp Danh Sách Đơn Hàng Khổ A4"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              In Danh Sách Đơn
            </button>

            {/* Nút Làm Mới */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Tải lại danh sách đơn hàng mới nhất"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              Làm Mới
            </button>

            {/* Nút Tạo Đơn Cắt Tôn Mới */}
            <Link
              href="/admin/orders/create"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#3c50e0] hover:bg-[#3344bd] active:bg-[#2a3bb8] rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Tạo Đơn Cắt Tôn Mới
            </Link>
          </div>
        </div>

        {/* Main DataTable */}
        <div className="bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
          <DataTable
            columns={columns}
            data={orders}
            searchKey="orderCode"
            searchPlaceholder="Tìm kiếm theo mã đơn (HĐ-...) hoặc tên khách..."
            exportFileName="Danh_Sach_Don_Hang_Cat_Ton"
            onExportExcel={handleExportListExcel}
          />
        </div>
      </div>

      {/* Modal Xem & In Hoá Đơn A4/A5 */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Phiếu Bán Hàng: ${selectedOrder.orderCode}`}
          maxWidth="2xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.dismiss();
                  window.print();
                }}
                className="flex items-center gap-1.5 bg-[#3c50e0] hover:bg-[#3344bd]"
              >
                <Printer className="w-4 h-4" /> In Phiếu (A4/A5)
              </Button>
            </div>
          }
        >
          <RoofingInvoicePrint order={selectedOrder} />
        </Modal>
      )}

      {/* Modal Xem & In Báo Cáo Danh Sách Đơn Hàng A4 */}
      {isPrintingList && (
        <Modal
          isOpen={isPrintingList}
          onClose={() => setIsPrintingList(false)}
          title="Báo Cáo Tổng Hợp Danh Sách Đơn Hàng"
          maxWidth="2xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPrintingList(false)}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.dismiss();
                  window.print();
                }}
                className="flex items-center gap-1.5 bg-[#3c50e0] hover:bg-[#3344bd]"
              >
                <Printer className="w-4 h-4" /> In Danh Sách (A4)
              </Button>
            </div>
          }
        >
          <OrderListPrint orders={orders} />
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={`Xác Nhận Xoá Đơn: ${deleteDialog.order?.orderCode || ""}`}
        description="Bạn có chắc chắn muốn xoá đơn cắt tôn này? Dữ liệu các tấm tôn cắt và phụ kiện kèm theo sẽ bị xoá vĩnh viễn."
        confirmText="Xoá Đơn Hàng"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteOrder}
        onClose={() => setDeleteDialog({ isOpen: false, order: null })}
      />
    </>
  );
}

"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Checkbox } from "@/components/ui/form/Checkbox";
import {
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Eye,
  CreditCard,
  Calendar,
  User,
  ShoppingBag,
} from "lucide-react";

export type OrderStatus = "Completed" | "Processing" | "Pending" | "Cancelled";

export interface TransactionOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  amount: number;
  date: string;
  status: OrderStatus;
  paymentMethod: "Credit Card" | "PayPal" | "Bank Transfer" | "Crypto";
}

// 20 Mock Orders for realistic testing
const initialOrders: TransactionOrder[] = [
  {
    id: "ORD-9821",
    customerName: "Nguyễn Văn An",
    customerEmail: "an.nguyen@techcorp.vn",
    productName: "Gói TailAdmin UI Doanh Nghiệp (Enterprise)",
    amount: 1250.0,
    date: "2026-09-08",
    status: "Completed",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "ORD-9820",
    customerName: "Trần Thị Mai",
    customerEmail: "mai.tran@cloudmedia.io",
    productName: "Cụm Cơ Sở Dữ Liệu Supabase Cluster",
    amount: 850.0,
    date: "2026-09-08",
    status: "Processing",
    paymentMethod: "Credit Card",
  },
  {
    id: "ORD-9819",
    customerName: "Lê Hoàng Nam",
    customerEmail: "nam.le@vnsolutions.com",
    productName: "Bản Quyền Đội Ngũ Phát Triển (Team License)",
    amount: 420.0,
    date: "2026-09-07",
    status: "Pending",
    paymentMethod: "PayPal",
  },
  {
    id: "ORD-9818",
    customerName: "Phạm Minh Đức",
    customerEmail: "duc.pm@fintechhub.vn",
    productName: "Dịch Vụ Hỗ Trợ Kỹ Thuật VIP 24/7",
    amount: 290.0,
    date: "2026-09-06",
    status: "Cancelled",
    paymentMethod: "Credit Card",
  },
  {
    id: "ORD-9817",
    customerName: "Vũ Hải Đăng",
    customerEmail: "dang.vu@alphacorp.com",
    productName: "Tích Hợp Cổng Thanh Toán VNPay/Momo",
    amount: 1500.0,
    date: "2026-09-06",
    status: "Completed",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "ORD-9816",
    customerName: "Đỗ Bích Ngọc",
    customerEmail: "ngoc.do@designlab.co",
    productName: "Bộ Giao Diện Quản Trị Mobile Tailwind v4",
    amount: 320.0,
    date: "2026-09-05",
    status: "Completed",
    paymentMethod: "Credit Card",
  },
  {
    id: "ORD-9815",
    customerName: "Hoàng Gia Bảo",
    customerEmail: "bao.hg@megalabs.vn",
    productName: "Hệ Thống Phân Quyền RBAC Nâng Cao",
    amount: 680.0,
    date: "2026-09-05",
    status: "Processing",
    paymentMethod: "Crypto",
  },
  {
    id: "ORD-9814",
    customerName: "Bùi Phương Thảo",
    customerEmail: "thao.bp@ecovietnam.org",
    productName: "Bản Quyền Mã Nguồn Mở Start-up",
    amount: 199.0,
    date: "2026-09-04",
    status: "Completed",
    paymentMethod: "PayPal",
  },
  {
    id: "ORD-9813",
    customerName: "Dương Tuấn Kiệt",
    customerEmail: "kiet.duong@novasoft.io",
    productName: "Module Quản Lý Đa Chi Nhánh ERP",
    amount: 2400.0,
    date: "2026-09-04",
    status: "Completed",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "ORD-9812",
    customerName: "Lý Khánh Linh",
    customerEmail: "linh.lk@retailchain.com",
    productName: "Phần Mềm Quản Lý Kho & Đơn Hàng",
    amount: 1100.0,
    date: "2026-09-03",
    status: "Pending",
    paymentMethod: "Credit Card",
  },
  {
    id: "ORD-9811",
    customerName: "Ngô Quang Vinh",
    customerEmail: "vinh.nq@cybersec.vn",
    productName: "Kiểm Thử Bảo Mật & Audit Log Module",
    amount: 950.0,
    date: "2026-09-02",
    status: "Cancelled",
    paymentMethod: "Credit Card",
  },
  {
    id: "ORD-9810",
    customerName: "Đinh Thu Trang",
    customerEmail: "trang.dt@smartlogistics.vn",
    productName: "Tích Hợp API Vận Chuyển ViettelPost",
    amount: 540.0,
    date: "2026-09-01",
    status: "Completed",
    paymentMethod: "Bank Transfer",
  },
];

export default function TablesPage() {
  const [data, setData] = useState<TransactionOrder[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<TransactionOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionOrder | null>(null);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [selectedBatchRows, setSelectedBatchRows] = useState<TransactionOrder[]>([]);
  const [resetSelectionCallback, setResetSelectionCallback] = useState<(() => void) | null>(null);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hoàn tất
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Đang xử lý
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Đang chờ
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Đã hủy
          </span>
        );
    }
  };

  // Define Columns
  const columns: ColumnDef<TransactionOrder>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate" === "indeterminate")
          }
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Chọn tất cả các dòng trên trang này"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          aria-label="Chọn dòng này"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã Đơn" />,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
          {row.getValue("id")}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Khách Hàng" />,
      cell: ({ row }) => {
        const name = row.getValue("customerName") as string;
        const email = row.original.customerEmail;
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .slice(-2)
          .join("");

        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#24303f] flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                {name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "productName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sản Phẩm & Gói Dịch Vụ" />,
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
          {row.getValue("productName")}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Số Tiền" />,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày Đặt" />,
      cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">
          {row.getValue("date")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng Thái" />,
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hành Động</span>,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedOrder(order)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#24303f] transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(order)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              title="Xóa đơn hàng"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Batch action handlers
  const handleBatchMarkCompleted = (selected: TransactionOrder[], reset: () => void) => {
    const selectedIds = new Set(selected.map((o) => o.id));
    setData((prev) =>
      prev.map((order) =>
        selectedIds.has(order.id) ? { ...order, status: "Completed" } : order
      )
    );
    toast.success(`Đã cập nhật ${selected.length} đơn hàng sang trạng thái Hoàn tất!`);
    reset();
  };

  const handleSingleDelete = () => {
    if (!deleteTarget) return;
    setData((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    toast.success(`Đã xóa đơn hàng ${deleteTarget.id} thành công!`);
    setDeleteTarget(null);
  };

  const handleBatchDeleteConfirm = () => {
    const selectedIds = new Set(selectedBatchRows.map((o) => o.id));
    setData((prev) => prev.filter((o) => !selectedIds.has(o.id)));
    toast.success(`Đã xóa thành công ${selectedBatchRows.length} đơn hàng đã chọn!`);
    if (resetSelectionCallback) resetSelectionCallback();
    setIsBatchDeleteOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          <span>Quản trị</span>
          <span>/</span>
          <span className="text-blue-600 dark:text-blue-400">Bảng dữ liệu</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Quản Lý Bảng Đơn Hàng & Giao Dịch
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bảng dữ liệu thông minh với tìm kiếm Debounce, lọc trạng thái, sắp xếp đa cột, chọn hàng loạt và xuất Excel.
            </p>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={data}
        searchKey="customerName"
        searchPlaceholder="Tìm theo tên khách hàng hoặc mã đơn..."
        filterColumn="status"
        filterTitle="Trạng thái"
        filterOptions={[
          { label: "Hoàn tất (Completed)", value: "Completed" },
          { label: "Đang xử lý (Processing)", value: "Processing" },
          { label: "Đang chờ (Pending)", value: "Pending" },
          { label: "Đã hủy (Cancelled)", value: "Cancelled" },
        ]}
        exportFileName="Danh_sach_don_hang_TailAdmin"
        batchActions={(selected, reset) => (
          <>
            <button
              type="button"
              onClick={() => handleBatchMarkCompleted(selected, reset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đánh dấu Hoàn tất</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedBatchRows(selected);
                setResetSelectionCallback(() => reset);
                setIsBatchDeleteOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đã chọn ({selected.length})</span>
            </button>
          </>
        )}
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Chi Tiết Đơn Hàng: ${selectedOrder.id}` : "Chi Tiết Đơn Hàng"}
        description={selectedOrder ? `Đặt ngày ${selectedOrder.date}` : ""}
        width="md"
        footer={
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-xs font-semibold text-slate-800 dark:text-white transition-colors"
          >
            Đóng Bảng Trượt
          </button>
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Top Status & Price */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-[#2e3a47] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Trạng Thái Hiện Tại
                </span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Tổng Giá Trị
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(selectedOrder.amount)}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Thông Tin Khách Hàng
              </h4>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedOrder.customerName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4" />
                  <span className="text-slate-500">{selectedOrder.customerEmail}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sản Phẩm & Dịch Vụ
              </h4>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] space-y-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedOrder.productName}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white shrink-0">
                    {formatCurrency(selectedOrder.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Date */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Phương Thức & Thời Gian
              </h4>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Phương Thức:
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Ngày Đặt:
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedOrder.date}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleSingleDelete}
        title="Xóa Đơn Hàng Này?"
        description={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa đơn hàng "${deleteTarget.id}" của khách hàng "${deleteTarget.customerName}"? Hành động này không thể hoàn tác.`
            : ""
        }
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy Bỏ"
        variant="danger"
      />

      {/* Batch Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isBatchDeleteOpen}
        onClose={() => setIsBatchDeleteOpen(false)}
        onConfirm={handleBatchDeleteConfirm}
        title="Xóa Hàng Loạt Đơn Hàng Đã Chọn?"
        description={`Bạn đang chuẩn bị xóa vĩnh viễn ${selectedBatchRows.length} đơn hàng khỏi cơ sở dữ liệu. Bạn có chắc chắn muốn tiếp tục?`}
        confirmText={`Xóa ${selectedBatchRows.length} Đơn Hàng`}
        cancelText="Hủy Bỏ"
        variant="danger"
      />
    </div>
  );
}

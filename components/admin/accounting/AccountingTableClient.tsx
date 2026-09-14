"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/form/Button";
import {
  CashTransactionData,
  CashTransactionModal,
} from "./CashTransactionModal";
import {
  CustomerDebtData,
  DebtCollectionModal,
} from "./DebtCollectionModal";
import { deleteCashTransactionAction } from "@/app/(admin)/admin/accounting/actions";
import {
  formatCurrency,
  formatNumber,
} from "@/lib/roofing-calc";
import {
  exportMauS1HKDExcel,
  exportMau01TTExcel,
  exportMau02TTExcel,
  CashTransaction,
  CustomerDebt,
} from "@/lib/accounting-data";
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Trash2,
  Eye,
  CheckCircle2,
  DollarSign,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

interface AccountingTableClientProps {
  transactions: CashTransactionData[];
  debts: CustomerDebtData[];
  kpiOverview?: React.ReactNode;
}

export function AccountingTableClient({
  transactions,
  debts,
  kpiOverview,
}: AccountingTableClientProps) {
  const [activeTab, setActiveTab] = useState<"fund" | "debts" | "profit">("fund");

  // Transaction Modal State
  const [txModal, setTxModal] = useState<{
    isOpen: boolean;
    type: "receipt" | "payment";
    initialData: CashTransactionData | null;
    isViewOnly: boolean;
  }>({
    isOpen: false,
    type: "receipt",
    initialData: null,
    isViewOnly: false,
  });

  // Debt Collection Modal State
  const [debtModal, setDebtModal] = useState<{
    isOpen: boolean;
    debt: CustomerDebtData | null;
  }>({
    isOpen: false,
    debt: null,
  });

  // Delete Transaction Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    item: CashTransactionData | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTx = async () => {
    if (!deleteDialog.item) return;
    setIsDeleting(true);
    try {
      const res = await deleteCashTransactionAction(
        deleteDialog.item.id,
        deleteDialog.item.voucher_code
      );
      if (!res.success) {
        toast.error(res.error || "Lỗi khi xoá phiếu.");
        return;
      }
      toast.success(`Đã xoá phiếu ${deleteDialog.item.voucher_code} thành công!`);
      setDeleteDialog({ isOpen: false, item: null });
    } catch {
      toast.error("Có lỗi xảy ra khi xoá.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Convert for legacy Excel exports
  const getLegacyTxList = (): CashTransaction[] => {
    return transactions.map((t) => ({
      id: t.id,
      voucherCode: t.voucher_code,
      type: t.type,
      date: t.date,
      category: t.category,
      counterpart: t.counterpart,
      amount: Number(t.amount) || 0,
      paymentMethod: t.payment_method,
      note: t.note || "",
    }));
  };

  // Table Columns for Sổ Quỹ Tiền Mặt (S1-HKD)
  const txColumns = useMemo<ColumnDef<CashTransactionData>[]>(
    () => [
      {
        accessorKey: "voucher_code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mã Chứng Từ" />
        ),
        cell: ({ row }) => (
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {row.original.voucher_code}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Loại Phiếu" />
        ),
        cell: ({ row }) => {
          const isReceipt = row.original.type === "receipt";
          return isReceipt ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              <ArrowDownLeft className="w-3 h-3" /> Thu Tiền (01-TT)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3" /> Chi Tiền (02-TT)
            </span>
          );
        },
        meta: {
          filterOptions: [
            { value: "receipt", label: "Thu Tiền (01-TT)" },
            { value: "payment", label: "Chi Tiền (02-TT)" },
          ],
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ngày Lập" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">{row.original.date}</span>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lý Do Thu / Chi" />
        ),
        cell: ({ row }) => (
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {row.original.category}
          </div>
        ),
      },
      {
        accessorKey: "counterpart",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Đối Tác" />
        ),
        cell: ({ row }) => (
          <div className="text-xs text-slate-800 dark:text-slate-200">
            {row.original.counterpart}
          </div>
        ),
      },
      {
        accessorKey: "payment_method",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hình Thức" />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] text-slate-500 font-medium">
            {row.original.payment_method === "cash" ? "Tiền mặt" : "Chuyển khoản"}
          </span>
        ),
        meta: {
          filterOptions: [
            { value: "cash", label: "Tiền mặt" },
            { value: "bank_transfer", label: "Chuyển khoản" },
          ],
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Số Tiền (đ)" />
        ),
        cell: ({ row }) => {
          const isReceipt = row.original.type === "receipt";
          const amount = Number(row.original.amount) || 0;
          return (
            <span
              className={`text-xs font-bold ${
                isReceipt
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isReceipt ? "+" : "-"}
              {formatCurrency(amount)}
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
              title="Xem Chi Tiết"
              onClick={() =>
                setTxModal({
                  isOpen: true,
                  type: row.original.type,
                  initialData: row.original,
                  isViewOnly: true,
                })
              }
              className="p-1.5 text-slate-500 hover:text-primary"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Xoá Phiếu"
              onClick={() =>
                setDeleteDialog({
                  isOpen: true,
                  item: row.original,
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

  // Table Columns for Sổ Công Nợ Thợ Thầu
  const debtColumns = useMemo<ColumnDef<CustomerDebtData>[]>(
    () => [
      {
        accessorKey: "customer_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Khách Thầu / Thợ Cán" />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {row.original.customer_name}
            </div>
            <div className="text-[11px] text-slate-400">
              {row.original.phone || "Chưa có SĐT"} • {row.original.address || "Nghĩa Dân"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "total_purchased",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tổng Mua (đ)" />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {formatCurrency(Number(row.original.total_purchased) || 0)}
          </span>
        ),
      },
      {
        accessorKey: "total_paid",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Đã Trả (đ)" />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(Number(row.original.total_paid) || 0)}
          </span>
        ),
      },
      {
        accessorKey: "remaining_debt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nợ Còn Lại (đ)" />
        ),
        cell: ({ row }) => {
          const debt = Number(row.original.remaining_debt) || 0;
          return debt > 0 ? (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
              {formatCurrency(debt)}
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              Đã thanh toán hết
            </span>
          );
        },
      },
      {
        accessorKey: "last_payment_date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lần Trả Gần Nhất" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">
            {row.original.last_payment_date || "Chưa có"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Thao Tác</div>,
        cell: ({ row }) => {
          const debt = Number(row.original.remaining_debt) || 0;
          return (
            <div className="flex items-center justify-end gap-2">
              {debt > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setDebtModal({
                      isOpen: true,
                      debt: row.original,
                    })
                  }
                  className="flex items-center gap-1 py-1 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Thu Nợ 1-Click
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#24303f] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Sổ Quỹ Tiền Mặt (S1-HKD) & Công Nợ
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/40">
              Biểu Mẫu BTC Thông Tư 88
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ghi nhận thu - chi tiền mặt, xuất Phiếu Thu (01-TT), Phiếu Chi (02-TT) và quản lý sổ nợ thợ thầu
          </p>
        </div>

        {/* Primary Action Buttons on the Top Right */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lập Phiếu Thu 01-TT */}
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setTxModal({
                isOpen: true,
                type: "receipt",
                initialData: null,
                isViewOnly: false,
              })
            }
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" /> Lập Phiếu Thu (01-TT)
          </Button>

          {/* Lập Phiếu Chi 02-TT */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setTxModal({
                isOpen: true,
                type: "payment",
                initialData: null,
                isViewOnly: false,
              })
            }
            className="flex items-center gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" /> Lập Phiếu Chi (02-TT)
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {kpiOverview}

      {/* Secondary Bar: Tabs Navigation & Excel Exports */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("fund")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "fund"
                ? "bg-[#3c50e0] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Wallet className="w-4 h-4" /> Sổ Quỹ Tiền Mặt (S1-HKD) ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("debts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "debts"
                ? "bg-[#3c50e0] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" /> Sổ Nợ Thợ Thầu ({debts.length})
          </button>
        </div>

        {/* Xuất Excel BTC */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            title="Xuất Sổ Quỹ Tiền Mặt Mẫu S1-HKD"
            onClick={() => {
              exportMauS1HKDExcel(getLegacyTxList());
              toast.success("Đã xuất Sổ Quỹ Tiền Mặt (Mẫu S1-HKD) thành công!");
            }}
            className="flex items-center gap-1 text-slate-700 dark:text-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Sổ S1-HKD
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Xuất Phiếu Thu Mẫu 01-TT"
            onClick={() => {
              const tx = getLegacyTxList().find((t) => t.type === "receipt");
              if (tx) {
                exportMau01TTExcel(tx);
                toast.success("Đã xuất Phiếu Thu (Mẫu 01-TT) thành công!");
              } else {
                toast.info("Chưa có phiếu thu nào để xuất.");
              }
            }}
            className="flex items-center gap-1 text-slate-700 dark:text-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> Mẫu 01-TT
          </Button>
        </div>
      </div>

      {/* Tab 1: Sổ Quỹ Tiền Mặt */}
      {activeTab === "fund" && (
        <div className="bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
          <DataTable
            columns={txColumns}
            data={transactions}
            searchKey="counterpart"
            searchPlaceholder="Tìm kiếm theo tên đối tác hoặc lý do thu/chi..."
          />
        </div>
      )}

      {/* Tab 2: Sổ Công Nợ Thợ Thầu */}
      {activeTab === "debts" && (
        <div className="bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
          <DataTable
            columns={debtColumns}
            data={debts}
            searchKey="customer_name"
            searchPlaceholder="Tìm kiếm theo tên khách thầu..."
          />
        </div>
      )}

      {/* Modal Lập Phiếu Thu / Chi */}
      <CashTransactionModal
        isOpen={txModal.isOpen}
        type={txModal.type}
        initialData={txModal.initialData}
        isViewOnly={txModal.isViewOnly}
        onClose={() =>
          setTxModal((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Modal Thu Nợ 1-Click */}
      <DebtCollectionModal
        isOpen={debtModal.isOpen}
        debt={debtModal.debt}
        onClose={() => setDebtModal({ isOpen: false, debt: null })}
      />

      {/* Modal Xác Nhận Xoá */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={`Xác Nhận Xoá Phiếu: ${deleteDialog.item?.voucher_code || ""}`}
        description="Bạn có chắc chắn muốn xoá chứng từ này khỏi Sổ Quỹ? Hành động này không thể hoàn tác."
        confirmText="Xoá Phiếu"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteTx}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
      />
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/form/Button";
import {
  InventoryItemData,
  InventoryFormModal,
} from "./InventoryFormModal";
import { StockInModal } from "./StockInModal";
import { deleteInventoryItemAction } from "@/app/(admin)/admin/inventory/actions";
import {
  formatCurrency,
  formatNumber,
} from "@/lib/roofing-calc";
import {
  exportMau04VTExcel,
  exportMauS2HKDExcel,
  exportMau03VTExcel,
  exportBcNxtThueExcel,
  InventoryItem,
} from "@/lib/inventory-data";
import {
  Plus,
  ArrowDownToLine,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  Layers,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES_CATALOG, UNITS_CATALOG } from "@/lib/catalogs";

interface InventoryTableClientProps {
  initialItems: InventoryItemData[];
  kpiOverview?: React.ReactNode;
}

export function InventoryTableClient({ initialItems, kpiOverview }: InventoryTableClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "view";
    item: InventoryItemData | null;
  }>({
    isOpen: false,
    mode: "create",
    item: null,
  });

  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    item: InventoryItemData | null;
  }>({
    isOpen: false,
    item: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter items by category tab
  const filteredData = useMemo(() => {
    if (selectedCategory === "all") return initialItems;
    return initialItems.filter((i) => i.category === selectedCategory);
  }, [initialItems, selectedCategory]);

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    setIsDeleting(true);
    try {
      const res = await deleteInventoryItemAction(
        deleteDialog.item.id,
        deleteDialog.item.code
      );
      if (!res.success) {
        toast.error(res.error || "Lỗi khi xoá mặt hàng.");
        return;
      }
      toast.success(`Đã xoá mặt hàng "${deleteDialog.item.code}" thành công!`);
      setDeleteDialog({ isOpen: false, item: null });
    } catch {
      toast.error("Có lỗi xảy ra khi xoá.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    const found = CATEGORIES_CATALOG.find((c) => c.id === cat);
    const name = found?.name || cat;
    switch (cat) {
      case "thep_hop":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {name}
          </span>
        );
      case "ong_tron":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
            {name}
          </span>
        );
      case "nhom":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {name}
          </span>
        );
      case "ton_lop":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {name}
          </span>
        );
      case "phu_kien":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            {name}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {name}
          </span>
        );
    }
  };

  // Convert to legacy interface for Excel export functions
  const getLegacyItems = (): InventoryItem[] => {
    return initialItems.map((i) => ({
      code: i.code,
      name: i.name,
      unit: i.unit,
      category: i.category,
      stockQty: Number(i.stock_qty) || 0,
      stockValue: Number(i.stock_value) || 0,
      unitCost: Number(i.unit_cost) || 0,
    }));
  };

  const columns = useMemo<ColumnDef<InventoryItemData>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mã Hàng" />
        ),
        cell: ({ row }) => (
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tên Hàng / Quy Cách" />
        ),
        cell: ({ row }) => (
          <div className="font-medium text-slate-900 dark:text-white">
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Phân Loại" />
        ),
        cell: ({ row }) => getCategoryBadge(row.original.category),
        meta: {
          filterOptions: CATEGORIES_CATALOG.map((c) => ({ value: c.id, label: c.name })),
        },
      },
      {
        accessorKey: "unit",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ĐVT" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-slate-500 font-semibold uppercase">
            {row.original.unit}
          </span>
        ),
        meta: {
          filterOptions: UNITS_CATALOG.map((u) => ({ value: u.value, label: u.label })),
        },
      },
      {
        accessorKey: "stock_qty",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tồn Kho" />
        ),
        cell: ({ row }) => {
          const qty = Number(row.original.stock_qty) || 0;
          return qty > 0 ? (
            <span className="font-bold text-slate-800 dark:text-white">
              {formatNumber(qty)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" /> Hết hàng
            </span>
          );
        },
      },
      {
        accessorKey: "unit_cost",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Giá Vốn (TT88)" />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {formatCurrency(Number(row.original.unit_cost) || 0)}
          </span>
        ),
      },
      {
        accessorKey: "stock_value",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Giá Trị Tồn (đ)" />
        ),
        cell: ({ row }) => (
          <span className="text-xs font-bold text-primary dark:text-primary-light">
            {formatCurrency(Number(row.original.stock_value) || 0)}
          </span>
        ),
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
                  item: row.original,
                })
              }
              className="p-1.5 text-slate-500 hover:text-primary"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Sửa Hàng Hoá"
              onClick={() =>
                setModalState({
                  isOpen: true,
                  mode: "edit",
                  item: row.original,
                })
              }
              className="p-1.5 text-slate-500 hover:text-blue-600"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Xoá Hàng Hoá"
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

  return (
    <div className="space-y-6">
      {/* Header Banner with Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#24303f] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Kho Vật Tư & Nghiệp Vụ TT88
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
              Thay Thế File 54qr.xlsx
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý thép hộp, ống tròn, tôn lợp, tính đơn giá vốn bình quân gia quyền và xuất biểu mẫu chuẩn BTC
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nhập kho 03-VT */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStockInOpen(true)}
            className="flex items-center gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" /> Nhập Kho (03-VT)
          </Button>

          {/* Thêm mới (Rule 6 Unified Modal) */}
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setModalState({
                isOpen: true,
                mode: "create",
                item: null,
              })
            }
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Mặt Hàng
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {kpiOverview}

      {/* Category Tabs & Toolbar Action */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
          {/* Category filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#3c50e0] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Tất Cả ({initialItems.length})
            </button>
            {CATEGORIES_CATALOG.map((cat) => {
              const count = initialItems.filter((i) => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#3c50e0] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Xuất báo cáo TT88 */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              title="Xuất Phiếu Xuất Kho (Mẫu 04-VT)"
              onClick={() => {
                const sampleExportItems = initialItems.slice(0, 5).map((i) => ({
                  name: i.name,
                  code: i.code,
                  unit: i.unit,
                  qty: Math.max(1, Math.min(5, Number(i.stock_qty) || 1)),
                  price: Number(i.unit_cost) || 100000,
                  subtotal: Math.max(1, Math.min(5, Number(i.stock_qty) || 1)) * (Number(i.unit_cost) || 100000),
                }));
                exportMau04VTExcel(sampleExportItems);
                toast.success("Đã xuất Phiếu Xuất Kho (Mẫu 04-VT) thành công!");
              }}
              className="flex items-center gap-1 text-slate-700 dark:text-slate-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Mẫu 04-VT
            </Button>
            <Button
              variant="outline"
              size="sm"
              title="Xuất Sổ Chi Tiết Vật Liệu (Mẫu S2-HKD)"
              onClick={() => {
                const first = initialItems[0];
                if (first) {
                  exportMauS2HKDExcel(
                    first.code,
                    first.name,
                    first.unit,
                    Number(first.stock_qty) || 21,
                    Number(first.stock_value) || 1635270
                  );
                } else {
                  exportMauS2HKDExcel();
                }
                toast.success("Đã xuất Sổ S2-HKD thành công!");
              }}
              className="flex items-center gap-1 text-slate-700 dark:text-slate-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> Sổ S2-HKD
            </Button>
            <Button
              variant="outline"
              size="sm"
              title="Xuất Báo Cáo NXT Thuế"
              onClick={() => {
                exportBcNxtThueExcel(getLegacyItems());
                toast.success("Đã xuất Báo Cáo NXT Thuế thành công!");
              }}
              className="flex items-center gap-1 text-slate-700 dark:text-slate-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" /> BC NXT
            </Button>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <div className="bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={filteredData}
          searchKey="name"
          searchPlaceholder="Tìm kiếm theo mã hàng hoặc tên quy cách..."
        />
      </div>

      {/* Unified Form Modal (Create / Edit / View - Rule 6) */}
      <InventoryFormModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        item={modalState.item}
        onClose={() =>
          setModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onModeChange={(newMode) =>
          setModalState((prev) => ({ ...prev, mode: newMode }))
        }
      />

      {/* Stock In Modal (Mẫu 03-VT) */}
      <StockInModal
        isOpen={isStockInOpen}
        items={initialItems}
        onClose={() => setIsStockInOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={`Xác Nhận Xoá Mặt Hàng: ${deleteDialog.item?.code || ""}`}
        description={`Bạn có chắc chắn muốn xoá mặt hàng "${deleteDialog.item?.name || ""}" khỏi kho? Hành động này không thể hoàn tác.`}
        confirmText="Xoá Mặt Hàng"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
      />
    </div>
  );
}

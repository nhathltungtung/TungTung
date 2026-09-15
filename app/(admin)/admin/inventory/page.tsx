import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InventoryTableClient } from "@/components/admin/inventory/InventoryTableClient";
import { InventoryItemData } from "@/components/admin/inventory/InventoryFormModal";
import { formatCurrency, formatNumber } from "@/lib/roofing-calc";
import {
  Package,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Quản Lý Kho Hàng TT88 | Đại Lý Tôn Thép Tuấn Hương",
  description: "Quản lý mã hàng kim khí, tính giá vốn bình quân gia quyền và xuất báo cáo Thông tư 88/2021/TT-BTC",
};

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  let items: InventoryItemData[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("code", { ascending: true });

    if (!error && data) {
      items = data;
    }
  } catch (err) {
    console.error("Lỗi khi tải danh mục kho:", err);
  }

  const totalItems = items.length;
  const totalStockValue = items.reduce(
    (sum, i) => sum + (Number(i.stock_value) || 0),
    0
  );
  const totalStockQty = items.reduce(
    (sum, i) => sum + (Number(i.stock_qty) || 0),
    0
  );
  const outOfStockCount = items.filter(
    (i) => (Number(i.stock_qty) || 0) <= 0
  ).length;

  const kpiOverview = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng Mặt Hàng
          </span>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-primary">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          {formatNumber(totalItems)}
        </p>
        <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
          <Layers className="w-3 h-3" /> Mã trong CSDL
        </p>
      </div>

      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Giá Trị Tồn Kho
          </span>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          {formatCurrency(totalStockValue)}
        </p>
        <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Theo giá vốn BQGQ
        </p>
      </div>

      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng SL Tồn
          </span>
          <div className="p-2 bg-violet-50 dark:bg-violet-950/50 rounded-lg text-violet-600">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          {formatNumber(totalStockQty)}
        </p>
      </div>

      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Hết Hàng
          </span>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          {formatNumber(outOfStockCount)}
        </p>
      </div>
    </div>
  );

  return <InventoryTableClient initialItems={items} kpiOverview={kpiOverview} />;
}

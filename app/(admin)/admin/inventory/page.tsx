import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InventoryTableClient } from "@/components/admin/inventory/InventoryTableClient";
import { InventoryItemData } from "@/components/admin/inventory/InventoryFormModal";
import { RAW_60_PRODUCTS, categorizeProduct } from "@/lib/inventory-data";
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
  description: "Quản lý 60 mã hàng kim khí, tính giá vốn bình quân gia quyền và xuất báo cáo Thông tư 88/2021/TT-BTC",
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

    if (!error && data && data.length > 0) {
      items = data;
    } else {
      // Fallback nạp 60 mã hàng gốc nếu database chưa chạy migration
      items = RAW_60_PRODUCTS.map((p, idx) => ({
        id: `mock-${idx}`,
        code: p.code,
        name: p.name,
        unit: p.unit,
        category: categorizeProduct(p.code, p.unit),
        stock_qty: p.stockQty,
        stock_value: p.stockValue,
        unit_cost: p.stockQty > 0 ? Math.round(p.stockValue / p.stockQty) : 0,
        selling_price: Math.round(
          (p.stockQty > 0 ? p.stockValue / p.stockQty : 100000) * 1.15
        ),
        note: "Mã hàng nguyên bản sheet 2 54qr.xlsx",
      }));
    }
  } catch (err) {
    console.error("Lỗi khi tải danh mục kho:", err);
  }

  // Tính toán KPI thực tế
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
        <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">
          {totalItems} <span className="text-xs font-normal text-slate-400">mã</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Thép hộp, ống tròn, nhôm, tôn lợp
        </p>
      </div>

      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng Giá Trị Tồn Kho
          </span>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
          {formatCurrency(totalStockValue)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Theo giá vốn bình quân TT88
        </p>
      </div>

      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng Số Lượng Tồn
          </span>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">
          {formatNumber(totalStockQty)} <span className="text-xs font-normal text-slate-400">cây/m²/kg</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Đang lưu bãi sắt & xưởng cán
        </p>
      </div>

      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cảnh Báo Hết Hàng
          </span>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
          {outOfStockCount} <span className="text-xs font-normal text-slate-400">mã cần nhập</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Tồn kho chạm mốc 0
        </p>
      </div>
    </div>
  );

  return <InventoryTableClient initialItems={items} kpiOverview={kpiOverview} />;
}

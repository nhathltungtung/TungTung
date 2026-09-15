import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRoofingOrdersServer } from "@/lib/supabase/roofing-service.server";
import { formatCurrency, formatNumber } from "@/lib/roofing-calc";
import {
  Calculator,
  Boxes,
  Package,
  TrendingUp,
  Plus,
  Printer,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Layers,
  MapPin,
  Phone,
  Wallet,
  ArrowDownLeft,
  ArrowDownToLine,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";

export const metadata = {
  title: "Bảng Điều Khiển Tổng Quan | Đại Lý Tôn Thép Tuấn Hương",
  description: "Hệ thống quản trị bán hàng, tính toán cắt tôn theo quy cách và kế toán kho TT88",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let orders: Awaited<ReturnType<typeof getRoofingOrdersServer>> = [];
  let totalStockValue = 0;
  let totalStockItems = 0;
  let outOfStockCount = 0;
  let cashBalance = 0;
  let totalCustomers = 0;

  try {
    const supabase = await createClient();

    // 1. Đơn hàng
    orders = await getRoofingOrdersServer();

    // 2. Thống kê kho hàng
    const { data: invData } = await supabase.from("inventory_items").select("*");
    if (invData && invData.length > 0) {
      totalStockItems = invData.length;
      totalStockValue = invData.reduce(
        (sum: number, i: { stock_value?: number | null }) =>
          sum + (Number(i.stock_value) || 0),
        0
      );
      outOfStockCount = invData.filter(
        (i: { stock_qty?: number | null }) => (Number(i.stock_qty) || 0) <= 0
      ).length;
    }

    // 3. Sổ quỹ tiền mặt
    const { data: txData } = await supabase.from("cash_transactions").select("*");
    if (txData && txData.length > 0) {
      const receipts = txData
        .filter((t: { type?: string }) => t.type === "receipt")
        .reduce(
          (sum: number, t: { amount?: number | null }) =>
            sum + (Number(t.amount) || 0),
          0
        );
      const payments = txData
        .filter((t: { type?: string }) => t.type === "payment")
        .reduce(
          (sum: number, t: { amount?: number | null }) =>
            sum + (Number(t.amount) || 0),
          0
        );
      cashBalance = receipts - payments;
    }

    // 4. Khách hàng
    const { count } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });
    if (count !== null && count > 0) {
      totalCustomers = count;
    }
  } catch (err) {
    console.error("Lỗi tải dashboard:", err);
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const cuttingOrders = orders.filter((o) => o.status === "cutting" || o.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Banner Đại Lý Tuấn Hương */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-blue-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Hệ Thống Quản Trị ERP Đại Lý Số Hoá 100%
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG
            </h1>
            <p className="text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Trương Xá, Nghĩa Dân, Hưng Yên
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-400" /> Hotline: 0988.123.456
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/orders/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95"
            >
              <Calculator className="w-4 h-4" /> Tạo Đơn Cắt Tôn
            </Link>
            <Link
              href="/admin/inventory"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all"
            >
              <Boxes className="w-4 h-4" /> Kho TT88
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Thẻ KPI Thời Gian Thực */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu bán tôn */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng Doanh Thu Cắt Tôn
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-primary">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Từ {orders.length} đơn hàng đã tiếp nhận
          </p>
        </div>

        {/* Giá trị tồn kho 60 mã */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng Giá Trị Tồn Kho
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalStockValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalStockItems} mã hàng trong kho
          </p>
        </div>

        {/* Tồn Quỹ Tiền Mặt */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tồn Quỹ Tiền Mặt (S1-HKD)
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {formatCurrency(cashBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Khả dụng tại két tiền xưởng
          </p>
        </div>

        {/* Đơn Đang Cán Tôn / Chờ Cắt */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đơn Đang Chờ Cán
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {cuttingOrders} <span className="text-xs font-normal text-slate-400">đơn</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Đang đứng máy hoặc chờ thợ xẻ
          </p>
        </div>
      </div>

      {/* Bảng Đơn Hàng Gần Đây & Thao Tác Nhanh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách đơn mới nhất (2 cột) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Đơn Cắt Tôn Gần Đây
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {order.orderCode}
                  </span>
                  <div className="text-slate-400 text-[11px]">
                    {order.customer.name || "Khách lẻ"} • {order.createdAt}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800 dark:text-white">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                    {order.status === "completed" ? "Đã hoàn tất" : "Đang xử lý"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thao Tác Tác Nghiệp Nhanh (1 cột) */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            Tác Nghiệp Nhanh
          </h2>

          <div className="space-y-2">
            <Link
              href="/admin/orders/create"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900 text-xs font-semibold text-blue-900 dark:text-blue-200 hover:bg-blue-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" /> Bàn Tính Cắt Tôn Siêu Tốc
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/admin/inventory"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900 text-xs font-semibold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-600" /> Nhập Kho Mẫu 03-VT
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/admin/accounting"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900 text-xs font-semibold text-purple-900 dark:text-purple-200 hover:bg-purple-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-purple-600" /> Lập Phiếu Thu 01-TT
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/admin/customers"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> Danh Bạ Thợ Thầu ({totalCustomers})
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

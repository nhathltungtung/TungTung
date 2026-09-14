import React from "react";
import { createClient } from "@/lib/supabase/server";
import { AccountingTableClient } from "@/components/admin/accounting/AccountingTableClient";
import { CashTransactionData } from "@/components/admin/accounting/CashTransactionModal";
import { CustomerDebtData } from "@/components/admin/accounting/DebtCollectionModal";
import { DEFAULT_TRANSACTIONS, DEFAULT_DEBTS } from "@/lib/accounting-data";
import { formatCurrency } from "@/lib/roofing-calc";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Kế Toán Sổ Quỹ S1-HKD & Công Nợ | Đại Lý Tôn Thép Tuấn Hương",
  description: "Theo dõi Thu - Chi - Tồn quỹ tiền mặt và quản lý sổ công nợ thợ thầu theo Thông tư 88/2021/TT-BTC",
};

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  let transactions: CashTransactionData[] = [];
  let debts: CustomerDebtData[] = [];

  try {
    const supabase = await createClient();

    // 1. Tải danh sách giao dịch Sổ Quỹ
    const { data: txData, error: txErr } = await supabase
      .from("cash_transactions")
      .select("*")
      .order("date", { ascending: false });

    if (!txErr && txData && txData.length > 0) {
      transactions = txData;
    } else {
      // Fallback
      transactions = DEFAULT_TRANSACTIONS.map((t) => ({
        id: t.id,
        voucher_code: t.voucherCode,
        type: t.type,
        date: t.date,
        category: t.category,
        counterpart: t.counterpart,
        amount: t.amount,
        payment_method: t.paymentMethod,
        reference_id: null,
        note: t.note,
      }));
    }

    // 2. Tải danh sách công nợ thợ thầu
    const { data: debtData, error: debtErr } = await supabase
      .from("customer_debts")
      .select("*")
      .order("remaining_debt", { ascending: false });

    if (!debtErr && debtData && debtData.length > 0) {
      debts = debtData;
    } else {
      // Fallback
      debts = DEFAULT_DEBTS.map((d) => ({
        id: d.id,
        customer_name: d.customerName,
        phone: d.phone,
        address: d.address,
        total_purchased: d.totalPurchased,
        total_paid: d.totalPaid,
        remaining_debt: d.remainingDebt,
        last_payment_date: d.lastPaymentDate,
      }));
    }
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu kế toán:", err);
  }

  // Tính toán số liệu thống kê
  const totalReceipts = transactions
    .filter((t) => t.type === "receipt")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalPayments = transactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const cashBalance = totalReceipts - totalPayments;

  const totalOutstandingDebt = debts.reduce(
    (sum, d) => sum + (Number(d.remaining_debt) || 0),
    0
  );

  const kpiOverview = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tồn Quỹ Hiện Tại */}
      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tồn Quỹ Tiền Mặt
          </span>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
          {formatCurrency(cashBalance)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Số dư tiền mặt khả dụng tại quỹ
        </p>
      </div>

      {/* Tổng Thu Trong Kỳ */}
      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng Thu (Phiếu Thu 01-TT)
          </span>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-primary">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-primary dark:text-primary-light mt-2">
          {formatCurrency(totalReceipts)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Tiền bán tôn + thu nợ thợ thầu
        </p>
      </div>

      {/* Tổng Chi Trong Kỳ */}
      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng Chi (Phiếu Chi 02-TT)
          </span>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
          {formatCurrency(totalPayments)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Nhập tôn, điện xưởng, vận chuyển
        </p>
      </div>

      {/* Công Nợ Phải Thu */}
      <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Nợ Thợ Thầu Còn Phải Thu
          </span>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
          {formatCurrency(totalOutstandingDebt)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {debts.filter((d) => (Number(d.remaining_debt) || 0) > 0).length} thợ thầu chưa thanh toán hết
        </p>
      </div>
    </div>
  );

  return (
    <AccountingTableClient
      transactions={transactions}
      debts={debts}
      kpiOverview={kpiOverview}
    />
  );
}

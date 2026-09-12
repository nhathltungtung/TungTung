"use client";

import React from "react";
import { RecentOrder, OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { MoreVertical, ExternalLink } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

interface RecentOrdersTableProps {
  orders: readonly RecentOrder[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const { t } = useTranslation();

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t.dashboard.statusCompleted}
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {t.dashboard.statusProcessing}
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {t.dashboard.statusPending}
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t.dashboard.statusCancelled}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] shadow-xs">
      {/* Table Header Section */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#2e3a47]">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.dashboard.recentTransactions}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.dashboard.recentTransactionsDesc}
          </p>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          {t.common.viewAll} <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-[#2e3a47] bg-slate-50/75 dark:bg-[#24303f]/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8a99ad]">
              <th className="py-4 px-6">{t.dashboard.thCustomer}</th>
              <th className="py-4 px-6">{t.dashboard.thProduct}</th>
              <th className="py-4 px-6">{t.dashboard.thDate}</th>
              <th className="py-4 px-6">{t.dashboard.thAmount}</th>
              <th className="py-4 px-6">{t.dashboard.thStatus}</th>
              <th className="py-4 px-6 text-right">{t.dashboard.thAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#2e3a47] text-sm">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-slate-50/80 dark:hover:bg-[#24303f]/60 transition-colors"
              >
                {/* Customer Column */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-semibold text-xs shrink-0">
                      {order.customerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white leading-tight">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {order.customerEmail}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Product Column */}
                <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                  {order.productName}
                </td>

                {/* Date Column */}
                <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {order.date}
                </td>

                {/* Amount Column */}
                <td className="py-4 px-6 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                  {formatCurrency(order.amount)}
                </td>

                {/* Status Column */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>

                {/* Action Column */}
                <td className="py-4 px-6 text-right">
                  <button
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-[#2e3a47] transition-colors"
                    aria-label="Order actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

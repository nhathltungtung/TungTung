"use client";

import React from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function AnalyticsOverviewCard() {
  const { t, language } = useTranslation();
  const isVi = language === "vi";

  const weeklyData = [
    { day: isVi ? "T2" : "Mon", revenue: 65, orders: 40 },
    { day: isVi ? "T3" : "Tue", revenue: 80, orders: 55 },
    { day: isVi ? "T4" : "Wed", revenue: 45, orders: 30 },
    { day: isVi ? "T5" : "Thu", revenue: 95, orders: 70 },
    { day: isVi ? "T6" : "Fri", revenue: 75, orders: 50 },
    { day: isVi ? "T7" : "Sat", revenue: 110, orders: 85 },
    { day: isVi ? "CN" : "Sun", revenue: 90, orders: 60 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Performance Chart Card */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#2e3a47]">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {t.dashboard.revenueGrowthTitle} <TrendingUp className="w-5 h-5 text-blue-500" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.dashboard.revenueGrowthSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> {t.dashboard.revenueLegend}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-500 inline-block" /> {t.dashboard.ordersLegend}
            </span>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="mt-6 flex items-end justify-between gap-3 h-48 pt-6 px-2">
          {weeklyData.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                <div
                  style={{ height: `${(item.revenue / 120) * 100}%` }}
                  className="w-3.5 bg-blue-600 dark:bg-blue-500 rounded-t-md hover:brightness-110 transition-all cursor-pointer"
                  title={`Revenue: $${item.revenue * 100}`}
                />
                <div
                  style={{ height: `${(item.orders / 120) * 100}%` }}
                  className="w-3.5 bg-indigo-300 dark:bg-indigo-600/70 rounded-t-md hover:brightness-110 transition-all cursor-pointer"
                  title={`Orders: ${item.orders}`}
                />
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{item.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target & Conversion Ratio Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {isVi ? "Mục Tiêu Tháng" : "Monthly Target"}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              +18.4%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isVi ? "Kế hoạch: $150,000.00 / tháng" : "Goal: $150,000.00 / month"}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {isVi ? "Tiến độ thực hiện" : "Target Progress"}
                </span>
                <span className="text-blue-600 dark:text-blue-400">82.5%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#24303f] h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full" style={{ width: "82.5%" }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-[#2e3a47]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isVi ? "Thu nhập tháng này" : "Earned this month"}
                  </p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">$123,750</p>
                </div>
                <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" /> 12%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-[#2e3a47] text-xs text-slate-500 dark:text-slate-400">
          {isVi ? "Cập nhật tự động qua webhook Supabase" : "Updated automatically via Supabase webhook"}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { BarChart3, TrendingUp, Users, ArrowUpRight, Activity, Calendar } from "lucide-react";

export const metadata = {
  title: "Analytics Dashboard | TailAdmin Hub",
  description: "Detailed system analytics and user acquisition metrics",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Phân Tích & Thống Kê
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Báo cáo chi tiết về lượng truy cập và tỷ lệ chuyển đổi của toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5" /> 30 Ngày Qua
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Real-time Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pageviews</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">128,940</p>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% so với tuần trước
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">3.85%</p>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> +0.6% so với tuần trước
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">New Subscribers</span>
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">1,482</p>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> +9.1% so với tuần trước
          </p>
        </div>
      </div>
    </div>
  );
}

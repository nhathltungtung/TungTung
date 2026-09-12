"use client";

import React from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { AnalyticsOverviewCard } from "@/components/dashboard/AnalyticsOverviewCard";
import { sampleMetrics, sampleRecentOrders } from "@/lib/sample-data";
import { Download, RefreshCw, Sparkles, ExternalLink } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.dashboard.title}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3 h-3" /> {t.dashboard.liveBadge}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#24303f] transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.dashboard.viewLandingPage}
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#24303f] transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t.dashboard.syncData}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            {t.dashboard.downloadReport}
          </button>
        </div>
      </div>

      {/* 4 Stat Cards KPI Grid */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {sampleMetrics.map((metric) => (
            <StatCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      {/* Analytics & Performance Overview */}
      <section aria-label="Analytics Chart">
        <AnalyticsOverviewCard />
      </section>

      {/* Recent Orders / Transactions Table */}
      <section aria-label="Recent Transactions">
        <RecentOrdersTable orders={sampleRecentOrders} />
      </section>
    </div>
  );
}

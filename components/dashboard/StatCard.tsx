"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Eye, ShoppingCart, Users, DollarSign } from "lucide-react";
import { StatMetric } from "@/types";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface StatCardProps {
  metric: StatMetric;
}

export function StatCard({ metric }: StatCardProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (metric.iconType) {
      case "revenue":
        return <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case "sales":
        return <ShoppingCart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case "users":
        return <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
      case "growth":
      default:
        return <Eye className="w-6 h-6 text-violet-600 dark:text-violet-400" />;
    }
  };

  const getIconBg = () => {
    switch (metric.iconType) {
      case "revenue":
        return "bg-blue-500/10 dark:bg-blue-500/20";
      case "sales":
        return "bg-emerald-500/10 dark:bg-emerald-500/20";
      case "users":
        return "bg-indigo-500/10 dark:bg-indigo-500/20";
      case "growth":
      default:
        return "bg-violet-500/10 dark:bg-violet-500/20";
    }
  };

  const getTranslatedTitle = () => {
    switch (metric.iconType) {
      case "revenue":
        return t.dashboard.kpiRevenue;
      case "sales":
        return t.dashboard.kpiSales;
      case "users":
        return t.dashboard.kpiUsers;
      case "growth":
        return t.dashboard.kpiGrowth;
      default:
        return metric.title;
    }
  };

  const getTranslatedPeriod = () => {
    switch (metric.iconType) {
      case "revenue":
        return t.dashboard.monthPeriod;
      case "sales":
        return t.dashboard.weekPeriod;
      case "users":
        return t.dashboard.newPeriod;
      case "growth":
        return t.dashboard.stablePeriod;
      default:
        return metric.periodDescription;
    }
  };

  const isUp = metric.trend === "up";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] p-6 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl", getIconBg())}>
          {getIcon()}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
            isUp
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          )}
        >
          {isUp ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          <span>{metric.change}</span>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          {metric.value}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {getTranslatedTitle()}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {getTranslatedPeriod()}
          </span>
        </div>
      </div>
    </div>
  );
}

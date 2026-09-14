import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-[#24303f] p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#24303f] p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="bg-white dark:bg-[#24303f] p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

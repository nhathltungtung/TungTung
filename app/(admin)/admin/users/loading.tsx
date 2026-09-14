import React from "react";

// Skeleton card component
function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg mt-2" />
        <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50" />
    </div>
  );
}

// Skeleton table row
function SkeletonRow({ cols = 9 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-[#2e3a47]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-3.5">
          <div
            className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"
            style={{ width: `${50 + ((i * 13) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      {/* Top Header Actions Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-slate-200 dark:bg-slate-700/60 rounded-xl animate-pulse" />
          <div className="h-3.5 w-96 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-44 bg-slate-200 dark:bg-slate-700/60 rounded-xl animate-pulse" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] shadow-xs overflow-hidden">
        {/* Toolbar skeleton */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#2e3a47] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-72 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700/50 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            <div className="h-9 w-20 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
            <div className="h-9 w-16 bg-slate-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Table header skeleton */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/75 dark:bg-[#1c2434] border-b border-slate-200/80 dark:border-[#2e3a47]">
              <tr>
                {[48, 56, 250, 150, 220, 140, 150, 130, 130].map((w, i) => (
                  <th key={i} className="py-3 px-3.5" style={{ width: w }}>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2e3a47]">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} cols={9} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination skeleton */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#2e3a47] flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-100 dark:bg-slate-700/50 rounded-full animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-700/50 rounded-full animate-pulse" />
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-8 bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  totalRows?: number;
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [5, 10, 20, 50],
  totalRows,
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = totalRows !== undefined ? totalRows : table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 dark:border-[#2e3a47] text-xs text-slate-500 dark:text-slate-400">
      {/* Selection Summary */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 ? (
          <span className="font-medium text-slate-700 dark:text-slate-200 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg">
            Đã chọn {selectedCount.toLocaleString("vi-VN")} / {totalCount.toLocaleString("vi-VN")} bản ghi
          </span>
        ) : (
          <span className="tabular-nums">
            Hiển thị{" "}
            <strong className="text-slate-800 dark:text-white">
              {totalCount === 0
                ? 0
                : (pageIndex * table.getState().pagination.pageSize + 1).toLocaleString("vi-VN")}
            </strong>
            {" "}–{" "}
            <strong className="text-slate-800 dark:text-white">
              {Math.min((pageIndex + 1) * table.getState().pagination.pageSize, totalCount).toLocaleString("vi-VN")}
            </strong>
            {" "}trong{" "}
            <strong className="text-slate-800 dark:text-white">{totalCount.toLocaleString("vi-VN")}</strong>
            {" "}kết quả
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span>Dòng mỗi trang:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#24303f] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page Indicator */}
        <div className="flex items-center justify-center font-medium text-slate-700 dark:text-slate-300 min-w-20">
          Trang {pageCount > 0 ? pageIndex + 1 : 0} / {pageCount}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#24303f] hover:bg-slate-100 dark:hover:bg-[#2c3a4d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-200"
            title="Trang đầu tiên"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#24303f] hover:bg-slate-100 dark:hover:bg-[#2c3a4d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-200"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#24303f] hover:bg-slate-100 dark:hover:bg-[#2c3a4d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-200"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#24303f] hover:bg-slate-100 dark:hover:bg-[#2c3a4d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-200"
            title="Trang cuối"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

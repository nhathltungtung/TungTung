"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { DataTablePagination } from "./DataTablePagination";
import { Search, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";
import { exportToExcel, exportToCsv } from "@/lib/export";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterColumn?: string;
  filterTitle?: string;
  filterOptions?: FilterOption[];
  batchActions?: (selectedRows: TData[], resetSelection: () => void) => React.ReactNode;
  exportFileName?: string;
  enableExport?: boolean;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Tìm kiếm trong bảng...",
  filterColumn,
  filterTitle = "Trạng thái",
  filterOptions = [],
  batchActions,
  exportFileName = "du_lieu_bang",
  enableExport = true,
  onRowClick,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
  const isBatchActive = selectedRows.length > 0 && !!batchActions;

  // Handle Export
  const handleExportExcel = () => {
    const exportData = selectedRows.length > 0 ? selectedRows : data;
    exportToExcel(exportData as Record<string, unknown>[], exportFileName);
  };

  const handleExportCsv = () => {
    const exportData = selectedRows.length > 0 ? selectedRows : data;
    exportToCsv(exportData as Record<string, unknown>[], exportFileName);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] shadow-xs overflow-hidden transition-colors">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#2e3a47]">
        {isBatchActive ? (
          /* Batch Actions Bar */
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Đã chọn {selectedRows.length} bản ghi</span>
            </div>

            <div className="flex items-center gap-2">
              {batchActions(selectedRows, () => table.resetRowSelection())}
              <button
                type="button"
                onClick={() => table.resetRowSelection()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        ) : (
          /* Standard Search & Filter Toolbar */
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={
                    searchKey
                      ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
                      : globalFilter
                  }
                  onChange={(e) => {
                    if (searchKey) {
                      table.getColumn(searchKey)?.setFilterValue(e.target.value);
                    } else {
                      setGlobalFilter(e.target.value);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Status/Category Filter dropdown */}
              {filterColumn && filterOptions.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
                    onChange={(e) => {
                      table.getColumn(filterColumn)?.setFilterValue(e.target.value || undefined);
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">{filterTitle}: Tất cả</option>
                    {filterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Export Actions */}
            {enableExport && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2e3a47] transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Xuất file Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2e3a47] transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Xuất file CSV (.csv)"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-50/75 dark:bg-[#1c2434] border-b border-slate-100 dark:border-[#2e3a47]"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3.5 px-5 font-semibold text-xs select-none">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-[#2e3a47] text-xs">
            {isLoading ? (
              <>
                <SkeletonTableRow columns={columns.length} />
                <SkeletonTableRow columns={columns.length} />
                <SkeletonTableRow columns={columns.length} />
                <SkeletonTableRow columns={columns.length} />
                <SkeletonTableRow columns={columns.length} />
              </>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={cn(
                    "transition-colors hover:bg-slate-50/80 dark:hover:bg-[#24303f]/50",
                    row.getIsSelected() && "bg-blue-50/60 dark:bg-blue-950/20",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3.5 px-5 text-slate-700 dark:text-slate-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState
                    title="Không tìm thấy kết quả phù hợp"
                    description="Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc trạng thái."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <DataTablePagination table={table} />
    </div>
  );
}

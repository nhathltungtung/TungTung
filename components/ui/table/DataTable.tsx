"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnSizingInfoState,
} from "@tanstack/react-table";
import { DataTablePagination } from "./DataTablePagination";
import {
  Search,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  X,
  Columns3,
  Pin,
  PinOff,
  GripVertical,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Check,
  Rows3,
} from "lucide-react";
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
  enableColumnFilters?: boolean;
  initialPinning?: { left?: string[]; right?: string[] };
  batchActions?: (selectedRows: TData[], resetSelection: () => void) => React.ReactNode;
  exportFileName?: string;
  enableExport?: boolean;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  stickyHeader?: boolean;
  defaultDensity?: "standard" | "compact";
  // Server-side & Manual Pagination options
  manualPagination?: boolean;
  pageCount?: number;
  totalRows?: number;
  paginationState?: { pageIndex: number; pageSize: number };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
}

// Module-level column label map — created once, not on every call
const COL_LABEL_MAP: Record<string, string> = {
  select: "Chọn bản ghi",
  stt: "Số thứ tự (STT)",
  sku: "Mã SKU",
  name: "Tên sản phẩm",
  category: "Danh mục",
  price: "Đơn giá",
  stock: "Tồn kho",
  unit: "Đơn vị tính",
  status: "Trạng thái",
  created_at: "Ngày tạo",
  actions: "Thao tác",
};

// Helper to extract readable column label for settings modal
function getColLabel<TData>(col: Column<TData, unknown>) {
  const header = col.columnDef.header;
  if (typeof header === "string") return header;
  const meta = col.columnDef.meta as { filterPlaceholder?: string } | undefined;
  if (meta?.filterPlaceholder) {
    return meta.filterPlaceholder.replace("...", "").trim();
  }
  return COL_LABEL_MAP[col.id] || col.id;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Tìm kiếm trong bảng...",
  filterColumn,
  filterTitle = "Lọc",
  filterOptions = [],
  initialPinning = { left: ["select", "stt", "sku"], right: ["actions"] },
  batchActions,
  exportFileName = "export_data",
  enableExport = true,
  onRowClick,
  isLoading = false,
  stickyHeader = true,
  defaultDensity = "standard",
  manualPagination = false,
  pageCount,
  totalRows,
  paginationState,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  // Table States
  const [density, setDensity] = useState<"standard" | "compact">(defaultDensity);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const activePagination = paginationState ?? internalPagination;

  // Sync search input if globalFilter is cleared/reset externally
  useEffect(() => {
    setSearchInput(globalFilter);
  }, [globalFilter]);

  // Only trigger table filtering on Enter or clicking the Search button
  const handleApplySearch = () => {
    setGlobalFilter(searchInput.trim());
  };
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: initialPinning.left || [],
    right: initialPinning.right || [],
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnSizingInfo, setColumnSizingInfo] = useState<ColumnSizingInfoState>({
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: [],
  });

  // Column Settings Popover State (Drag & drop, Freeze/Pin, Visibility)
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // Toolbar Quick Filter Dropdown State (with search)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [toolbarFilterSearch, setToolbarFilterSearch] = useState("");
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
        setShowColumnPicker(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
        setToolbarFilterSearch("");
      }
    }
    if (showColumnPicker || showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnPicker, showFilterDropdown]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    manualPagination,
    pageCount: pageCount ?? -1,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      columnOrder,
      columnPinning,
      columnSizing,
      columnSizingInfo,
      pagination: activePagination,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const nextPagination =
        typeof updater === "function" ? updater(activePagination) : updater;
      if (!paginationState) {
        setInternalPagination(nextPagination);
      }
      onPaginationChange?.(nextPagination);
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const searchStr = String(filterValue).toLowerCase().trim();
      if (!searchStr) return true;

      if (searchKey) {
        const val = row.getValue(searchKey);
        if (val !== undefined && val !== null) {
          return String(val).toLowerCase().includes(searchStr);
        }
      }

      return row.getAllCells().some((cell) => {
        const val = cell.getValue();
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(searchStr);
      });
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    defaultColumn: {
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === undefined || filterValue === null || filterValue === "") return true;

        const rowValue = row.getValue(columnId);
        if (rowValue === undefined || rowValue === null) return false;

        // 1. Number Range filter [min, max] (Price, Stock)
        if (
          Array.isArray(filterValue) &&
          filterValue.length === 2 &&
          (typeof filterValue[0] === "number" || typeof filterValue[1] === "number")
        ) {
          const [min, max] = filterValue as [number | undefined, number | undefined];
          const num = Number(rowValue);
          if (isNaN(num)) return false;
          if (min !== undefined && min !== null && !isNaN(min) && num < min) return false;
          if (max !== undefined && max !== null && !isNaN(max) && num > max) return false;
          return true;
        }

        // 2. Multi-select Array Filter (checked items from funnel popover)
        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) return true;
          return filterValue.some((val) => {
            if (val === undefined || val === null) return false;
            const strRow = String(rowValue).toLowerCase().trim();
            const strVal = String(val).toLowerCase().trim();
            if (strRow === strVal) return true;

            // Date format comparison (e.g. 10/01/2026 vs ISO date)
            const d = new Date(strRow);
            if (!isNaN(d.getTime())) {
              const day = String(d.getDate()).padStart(2, "0");
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const year = d.getFullYear();
              const dateVN = `${day}/${month}/${year}`;
              if (dateVN.toLowerCase() === strVal) return true;
            }
            return false;
          });
        }

        // 3. String substring search (Text filter)
        return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase().trim());
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
  const isBatchActive = selectedRows.length > 0 && !!batchActions;

  // Handle Export
  const handleExportExcel = async () => {
    const exportData = selectedRows.length > 0 ? selectedRows : data;
    await exportToExcel(exportData as Record<string, unknown>[], exportFileName);
  };

  const handleExportCsv = async () => {
    const exportData = selectedRows.length > 0 ? selectedRows : data;
    await exportToCsv(exportData as Record<string, unknown>[], exportFileName);
  };

  const hasPinnedColumns =
    (columnPinning.left && columnPinning.left.length > 0) ||
    (columnPinning.right && columnPinning.right.length > 0);

  // Reorder and Drag-and-Drop Columns Handling
  const leafColumns = table.getAllLeafColumns();
  const activeOrder = table.getState().columnOrder;

  const orderedColumns = useMemo(() => {
    if (!activeOrder || activeOrder.length === 0) return leafColumns;
    return [...leafColumns].sort((a, b) => {
      const idxA = activeOrder.indexOf(a.id);
      const idxB = activeOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [leafColumns, activeOrder]);

  const filteredDisplayColumns = useMemo(() => {
    if (!columnSearch.trim()) return orderedColumns;
    const q = columnSearch.toLowerCase().trim();
    return orderedColumns.filter((col) => getColLabel(col).toLowerCase().includes(q));
  }, [orderedColumns, columnSearch]);

  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.setData("text/plain", colId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetColId) {
      setDraggedColId(null);
      return;
    }

    const currentOrder =
      activeOrder.length > 0 ? [...activeOrder] : leafColumns.map((c) => c.id);
    const fromIdx = currentOrder.indexOf(draggedColId);
    const toIdx = currentOrder.indexOf(targetColId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const nextOrder = [...currentOrder];
      const [moved] = nextOrder.splice(fromIdx, 1);
      nextOrder.splice(toIdx, 0, moved);
      setColumnOrder(nextOrder);
    }
    setDraggedColId(null);
  };

  const handleMoveColumn = (colId: string, direction: "up" | "down") => {
    const currentOrder =
      activeOrder.length > 0 ? [...activeOrder] : leafColumns.map((c) => c.id);
    const fromIdx = currentOrder.indexOf(colId);
    if (fromIdx === -1) return;

    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(fromIdx, 1);
    nextOrder.splice(toIdx, 0, moved);
    setColumnOrder(nextOrder);
  };

  // Reset columns: visibility, order and pinning
  const handleResetColumnSettings = () => {
    setColumnOrder([]);
    table.resetColumnPinning();
    table.toggleAllColumnsVisible(true);
    setColumnPinning({
      left: initialPinning.left || [],
      right: initialPinning.right || [],
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] shadow-xs transition-colors">
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
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        ) : (
          /* Standard Search & Controls Toolbar */
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left side: Search and quick filters */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Global search input with submit button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplySearch();
                      }
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setGlobalFilter("");
                      }}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Submit button: Click to apply search */}
                <button
                  type="button"
                  onClick={handleApplySearch}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer active:scale-95 flex-shrink-0"
                  title="Tìm kiếm (Enter)"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm kiếm</span>
                </button>
              </div>

              {/* Status/Category Filter Searchable Dropdown */}
              {filterColumn && filterOptions.length > 0 && (
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={cn(
                      "inline-flex items-center justify-between gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-2xs",
                      table.getColumn(filterColumn)?.getFilterValue()
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 font-semibold"
                        : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-[#24303f] dark:text-slate-200 dark:border-[#2e3a47]"
                    )}
                  >
                    <span className="truncate">
                      {table.getColumn(filterColumn)?.getFilterValue()
                        ? `${filterTitle}: ${filterOptions.find((o) => o.value === table.getColumn(filterColumn)?.getFilterValue())?.label || table.getColumn(filterColumn)?.getFilterValue()}`
                        : `${filterTitle}: Tất cả`}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", showFilterDropdown && "rotate-180 text-blue-600")} />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute left-0 mt-1.5 w-56 p-2 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                      {/* Search box inside dropdown */}
                      <div className="relative mb-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                        <input
                          type="text"
                          value={toolbarFilterSearch}
                          onChange={(e) => setToolbarFilterSearch(e.target.value)}
                          placeholder="Tìm kiếm..."
                          className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>

                      {/* Filter options list */}
                      <div className="max-h-48 overflow-y-auto space-y-0.5 divide-y divide-slate-100/50 dark:divide-[#2e3a47]/30">
                        <div
                          onClick={() => {
                            table.getColumn(filterColumn)?.setFilterValue(undefined);
                            setShowFilterDropdown(false);
                            setToolbarFilterSearch("");
                          }}
                          className={cn(
                            "flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-xs",
                            !table.getColumn(filterColumn)?.getFilterValue()
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                              : "hover:bg-slate-100 dark:hover:bg-[#24303f] text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <span>{filterTitle}: Tất cả</span>
                          {!table.getColumn(filterColumn)?.getFilterValue() && (
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>

                        {filterOptions
                          .filter((opt) =>
                            opt.label
                              .toLowerCase()
                              .includes(toolbarFilterSearch.toLowerCase().trim())
                          )
                          .map((opt) => {
                            const isSelected =
                              table.getColumn(filterColumn)?.getFilterValue() === opt.value;
                            return (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  table.getColumn(filterColumn)?.setFilterValue(opt.value);
                                  setShowFilterDropdown(false);
                                  setToolbarFilterSearch("");
                                }}
                                className={cn(
                                  "flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-xs",
                                  isSelected
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                                    : "hover:bg-slate-100 dark:hover:bg-[#24303f] text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <span className="truncate">{opt.label}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reset All Column Filters Button */}
              {(columnFilters.length > 0 || globalFilter || searchInput) && (
                <button
                  type="button"
                  onClick={() => {
                    table.resetColumnFilters();
                    setGlobalFilter("");
                    setSearchInput("");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors shadow-2xs cursor-pointer"
                  title="Xóa toàn bộ các bộ lọc đang áp dụng"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc ({columnFilters.length + (globalFilter ? 1 : 0)})</span>
                </button>
              )}
            </div>

            {/* Right side: Column Visibility / Pinning / Reorder Picker & Export Actions */}
            <div className="flex items-center gap-2">
              {/* Column Settings Dropdown (Ẩn/Hiện, Kéo thả vị trí, Đóng băng/Ghim cột) */}
              <div className="relative" ref={columnPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs",
                    showColumnPicker
                      ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60"
                      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#24303f] dark:text-slate-300 dark:border-[#2e3a47]"
                  )}
                  title="Cài đặt cột: Đổi vị trí kéo thả, đóng băng và ẩn/hiện cột"
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cột hiển thị</span>
                </button>

                {showColumnPicker && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 p-3.5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                    {/* Header with Title & Reset Button */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#2e3a47]">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <Columns3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Cột hiển thị & Đóng băng</span>
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                          Kéo thả ⠿ để đổi vị trí • Bấm 📌 để ghim
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetColumnSettings}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        title="Đặt lại vị trí, ghim và hiển thị cột về ban đầu"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Đặt lại</span>
                      </button>
                    </div>

                    {/* Search column name */}
                    <div className="relative mb-2.5">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                      <input
                        type="text"
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                        placeholder="Tìm cột..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Column List with Drag-and-Drop + Pinning + Visibility */}
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100/60 dark:divide-[#2e3a47]/50">
                      {filteredDisplayColumns.map((col, idx) => {
                        const isPinned = col.getIsPinned();
                        const isVisible = col.getIsVisible();
                        const canHide = col.getCanHide();
                        const label = getColLabel(col);
                        const isBeingDragged = draggedColId === col.id;

                        return (
                          <div
                            key={col.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, col.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className={cn(
                              "group flex items-center justify-between py-1.5 px-2 rounded-xl transition-all select-none pt-1.5",
                              isBeingDragged
                                ? "opacity-40 border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                                : "hover:bg-slate-50 dark:hover:bg-[#24303f]/60"
                            )}
                          >
                            {/* Left: Drag handle, Up/Down, Checkbox, Name */}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {/* Drag handle */}
                              <div
                                className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                title="Kéo thả để thay đổi vị trí cột"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>

                              {/* Up / Down quick buttons */}
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveColumn(col.id, "up")}
                                  className="text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                                  title="Dịch lên"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === filteredDisplayColumns.length - 1}
                                  onClick={() => handleMoveColumn(col.id, "down")}
                                  className="text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                                  title="Dịch xuống"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Visibility Checkbox */}
                              <label className="flex items-center gap-2 cursor-pointer truncate flex-1 ml-1">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  disabled={!canHide}
                                  onChange={col.getToggleVisibilityHandler()}
                                  className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer disabled:opacity-50"
                                />
                                <span
                                  className={cn(
                                    "truncate font-medium",
                                    isVisible
                                      ? "text-slate-800 dark:text-slate-200"
                                      : "text-slate-400 line-through"
                                  )}
                                  title={label}
                                >
                                  {label}
                                </span>
                              </label>
                            </div>

                            {/* Right: Pinning (Freeze) Controls */}
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              {/* Pin Left Button */}
                              <button
                                type="button"
                                onClick={() => col.pin(isPinned === "left" ? false : "left")}
                                className={cn(
                                  "px-1.5 py-0.5 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition-all cursor-pointer",
                                  isPinned === "left"
                                    ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/60 dark:border-blue-700 dark:text-blue-200 shadow-2xs font-semibold"
                                    : "border-slate-200 dark:border-[#2e3a47] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                                title={isPinned === "left" ? "Bỏ ghim trái" : "Ghim cố định bên trái"}
                              >
                                <Pin className="w-3 h-3" />
                                <span>Trái</span>
                              </button>

                              {/* Pin Right Button */}
                              <button
                                type="button"
                                onClick={() => col.pin(isPinned === "right" ? false : "right")}
                                className={cn(
                                  "px-1.5 py-0.5 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition-all cursor-pointer",
                                  isPinned === "right"
                                    ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/60 dark:border-blue-700 dark:text-blue-200 shadow-2xs font-semibold"
                                    : "border-slate-200 dark:border-[#2e3a47] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                                title={isPinned === "right" ? "Bỏ ghim phải" : "Ghim cố định bên phải"}
                              >
                                <Pin className="w-3 h-3 rotate-90" />
                                <span>Phải</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Density Toggle (Chuẩn / Cô đọng) */}
              <button
                type="button"
                onClick={() => setDensity((d) => (d === "standard" ? "compact" : "standard"))}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs",
                  density === "compact"
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60"
                    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#24303f] dark:text-slate-300 dark:border-[#2e3a47]"
                )}
                title={density === "standard" ? "Đổi sang chế độ cô đọng (Compact)" : "Đổi sang chế độ tiêu chuẩn (Standard)"}
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{density === "standard" ? "Tiêu chuẩn" : "Cô đọng"}</span>
              </button>

              {/* Reset Pinning if active */}
              {hasPinnedColumns && (
                <button
                  type="button"
                  onClick={() => table.resetColumnPinning()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2e3a47] transition-all cursor-pointer"
                  title="Bỏ ghim toàn bộ cột"
                >
                  <PinOff className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Bỏ ghim</span>
                </button>
              )}

              {/* Export Actions */}
              {enableExport && (
                <>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2e3a47] transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title="Xuất file Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2e3a47] transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title="Xuất file CSV (.csv)"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table Viewport with Horizontal and Vertical Scroll */}
      <div className={cn("overflow-x-auto relative", stickyHeader && "max-h-[72vh] overflow-y-auto")}>
        <table
          className="w-full border-collapse table-fixed"
          style={{ width: `${table.getTotalSize()}px`, minWidth: "100%" }}
        >
          <thead className={cn(stickyHeader && "sticky top-0 z-20")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-50/95 dark:bg-[#1c2434]/95 border-b border-slate-200/80 dark:border-[#2e3a47]"
              >
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned();
                  const isLastPinnedLeft = isPinned === "left" && header.column.getIsLastColumn("left");
                  const isFirstPinnedRight = isPinned === "right" && header.column.getIsFirstColumn("right");
                  const leftOffset = isPinned === "left" ? header.column.getStart("left") : undefined;
                  const rightOffset = isPinned === "right" ? header.column.getAfter("right") : undefined;
                  const align = (header.column.columnDef.meta as { align?: "left" | "center" | "right" })?.align || "left";

                  return (
                    <th
                      key={header.id}
                      style={{
                        width: `${header.getSize()}px`,
                        minWidth: `${header.column.columnDef.minSize ?? header.getSize()}px`,
                        left: leftOffset !== undefined ? `${leftOffset}px` : undefined,
                        right: rightOffset !== undefined ? `${rightOffset}px` : undefined,
                        position: isPinned ? "sticky" : undefined,
                        zIndex: isPinned ? 30 : undefined,
                      }}
                      className={cn(
                        "font-semibold text-xs whitespace-nowrap select-none relative group transition-colors overflow-visible bg-slate-50/98 dark:bg-[#1c2434]/98 backdrop-blur-xs",
                        density === "compact" ? "py-2 px-2.5" : "py-3 px-3.5",
                        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
                        isPinned && "z-30 bg-slate-100/98 dark:bg-[#1f2937]/98 backdrop-blur-xs",
                        isLastPinnedLeft && "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] border-r border-slate-200 dark:border-[#2e3a47]",
                        isFirstPinnedRight && "shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.12)] border-l border-slate-200 dark:border-[#2e3a47]"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, {
                            ...header.getContext(),
                            table,
                          })}

                      {/* Column Resizer Handle — wider hit area, high z-index */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            header.getResizeHandler()(e);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            header.getResizeHandler()(e);
                          }}
                          className={cn(
                            "absolute right-0 top-0 h-full w-4 -mr-2 cursor-col-resize select-none touch-none z-30 flex items-center justify-center group/resizer",
                          )}
                          title="Kéo chuột để co giãn độ rộng cột"
                        >
                          <div
                            className={cn(
                              "w-0.5 h-full transition-colors duration-100",
                              header.column.getIsResizing()
                                ? "bg-blue-500"
                                : "bg-slate-300/0 dark:bg-slate-600/0 group-hover/resizer:bg-slate-300/80 dark:group-hover/resizer:bg-slate-600/80"
                            )}
                          />
                        </div>
                      )}
                    </th>
                  );
                })}
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
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = cell.column.getIsPinned();
                    const isLastPinnedLeft = isPinned === "left" && cell.column.getIsLastColumn("left");
                    const isFirstPinnedRight = isPinned === "right" && cell.column.getIsFirstColumn("right");
                    const leftOffset = isPinned === "left" ? cell.column.getStart("left") : undefined;
                    const rightOffset = isPinned === "right" ? cell.column.getAfter("right") : undefined;
                    const align = (cell.column.columnDef.meta as { align?: "left" | "center" | "right" })?.align || "left";

                    return (
                      <td
                        key={cell.id}
                        style={{
                          width: `${cell.column.getSize()}px`,
                          minWidth: `${cell.column.columnDef.minSize ?? cell.column.getSize()}px`,
                          left: leftOffset !== undefined ? `${leftOffset}px` : undefined,
                          right: rightOffset !== undefined ? `${rightOffset}px` : undefined,
                          position: isPinned ? "sticky" : undefined,
                        }}
                        className={cn(
                          "text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-hidden transition-all",
                          density === "compact" ? "py-1.5 px-2.5" : "py-3 px-3.5",
                          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
                          isPinned && "z-10 bg-white/98 dark:bg-[#1c2434]/98 backdrop-blur-xs",
                          isLastPinnedLeft && "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200/80 dark:border-[#2e3a47]",
                          isFirstPinnedRight && "shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.08)] border-l border-slate-200/80 dark:border-[#2e3a47]"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  {columnFilters.length > 0 || globalFilter ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#24303f] flex items-center justify-center">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">Không tìm thấy kết quả</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Không có bản ghi nào khớp với {columnFilters.length > 0 ? `${columnFilters.length} bộ lọc` : "từ khóa"} đang áp dụng.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          table.resetColumnFilters();
                          setGlobalFilter("");
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  ) : (
                    <EmptyState
                      title="Chưa có dữ liệu"
                      description="Hiện chưa có bản ghi nào trong bảng này."
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      <DataTablePagination table={table} totalRows={totalRows} />
    </div>
  );
}

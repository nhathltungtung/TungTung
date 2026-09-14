"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Column, Table } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  Pin,
  X,
  Search,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnFilterMeta, FormattedNumberInput } from "./DataTableColumnFilter";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  table?: Table<TData>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  table,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSorted = column.getIsSorted();
  const isPinned = column.getIsPinned();
  const canSort = column.getCanSort();
  const canFilter = column.getCanFilter();
  const isFiltered = column.getIsFiltered();

  const meta = column.columnDef.meta as ColumnFilterMeta | undefined;
  const filterVariant = meta?.filterVariant ?? "text";
  const align = meta?.align ?? "left";

  // Open & synchronously calculate rock-solid screen coordinates
  const handleOpenFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const popupWidth = 288; // 18rem = 288px
    let left = rect.left;
    if (left + popupWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popupWidth - 16);
    }
    if (left < 16) left = 16;

    // Stable vertical positioning right below the funnel button
    let top = rect.bottom + 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    // Only flip upwards if screen bottom is cramped and space above is plenty
    if (spaceBelow < 240 && rect.top > 260) {
      top = Math.max(16, rect.top - 320);
    }

    setSearchValue("");
    setCoords({ top, left });
    setIsOpen(true);
  };

  // Focus search input smoothly on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle outside click, Escape key and window resize to close popover
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleResize() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Current active filter value(s)
  const currentFilter = column.getFilterValue();

  // Selected values set for multi-value checkbox filtering
  const selectedValues = useMemo<string[]>(() => {
    if (Array.isArray(currentFilter)) {
      return currentFilter.map(String);
    }
    if (typeof currentFilter === "string" && currentFilter) {
      return [currentFilter];
    }
    return [];
  }, [currentFilter]);

  // Extract all unique values with Cascading / Faceted Filtering (Self-Exclusion)
  // Only values present in rows satisfying all OTHER active column filters and globalFilter are shown.
  const columnFiltersState = table?.getState().columnFilters;
  const globalFilterState = table?.getState().globalFilter;

  const uniqueValues = useMemo(() => {
    if (!table || !isOpen) return [];
    const countMap = new Map<string, number>();

    const activeFilters = columnFiltersState || [];
    // Active filters of OTHER columns (self-exclusion so user can select multiple values in this column)
    const otherColumnFilters = activeFilters.filter(
      (f) => f.id !== column.id && f.value !== undefined && f.value !== ""
    );
    const globalFilter = globalFilterState;
    const globalFilterFn = table.options.globalFilterFn;

    const coreRows = table.getPreFilteredRowModel().flatRows;

    for (const row of coreRows) {
      // 1. Check if row passes all other column filters
      let passesOtherFilters = true;
      for (const f of otherColumnFilters) {
        // Fast path: use row.columnFilters cache if available from TanStack Table
        const rowFilters = (row as unknown as { columnFilters?: Record<string, boolean> }).columnFilters;
        if (rowFilters && rowFilters[f.id] === false) {
          passesOtherFilters = false;
          break;
        }
        // Verification via column.getFilterFn()
        const col = table.getColumn(f.id);
        if (col) {
          const filterFn = col.getFilterFn() as unknown;
          if (typeof filterFn === "function") {
            const isMatch = (filterFn as (r: unknown, id: string, val: unknown, meta?: unknown) => boolean)(
              row,
              f.id,
              f.value,
              () => {}
            );
            if (!isMatch) {
              passesOtherFilters = false;
              break;
            }
          }
        }
      }
      if (!passesOtherFilters) continue;

      // 2. Check if row passes globalFilter (if active)
      if (globalFilter) {
        const rowFilters = (row as unknown as { columnFilters?: Record<string, boolean> }).columnFilters;
        if (rowFilters && rowFilters.__global__ === false) {
          continue;
        }
        let passesGlobal = true;
        const gf = globalFilterFn as unknown;
        if (typeof gf === "function") {
          passesGlobal = Boolean(
            (gf as (r: unknown, id: string, val: unknown, meta?: unknown) => boolean)(
              row,
              "__global__",
              globalFilter,
              () => {}
            )
          );
        } else {
          const searchStr = String(globalFilter).toLowerCase().trim();
          passesGlobal = row.getAllCells().some((cell) => {
            const val = cell.getValue();
            return val !== undefined && val !== null && String(val).toLowerCase().includes(searchStr);
          });
        }
        if (!passesGlobal) continue;
      }

      // 3. Row passes all other filters -> register its value for this column
      const val = row.getValue(column.id);
      if (val !== undefined && val !== null && val !== "") {
        let strVal = String(val);
        if (filterVariant === "date") {
          const d = new Date(strVal);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            strVal = `${day}/${month}/${year}`;
          }
        }
        countMap.set(strVal, (countMap.get(strVal) || 0) + 1);
      }
    }

    // Ensure any currently selected values in this column are retained (even if count is 0)
    // so the user can easily see and uncheck them.
    for (const sel of selectedValues) {
      if (!countMap.has(sel)) {
        countMap.set(sel, 0);
      }
    }

    return Array.from(countMap.entries())
      .map(([value, count]) => {
        const matchedOption = meta?.filterOptions?.find((opt) => String(opt.value) === value);
        return {
          value,
          label: matchedOption ? matchedOption.label : value,
          count,
        };
      })
      .sort((a, b) => {
        if (filterVariant === "date") {
          const partsA = a.value.split("/").map(Number);
          const partsB = b.value.split("/").map(Number);
          if (partsA.length === 3 && partsB.length === 3) {
            const timeA = new Date(partsA[2], partsA[1] - 1, partsA[0]).getTime();
            const timeB = new Date(partsB[2], partsB[1] - 1, partsB[0]).getTime();
            return timeB - timeA;
          }
        }
        return a.label.localeCompare(b.label, "vi", { numeric: true });
      });
  }, [
    table,
    column.id,
    meta,
    filterVariant,
    isOpen,
    selectedValues,
    columnFiltersState,
    globalFilterState,
  ]);

  // Filtered list of values by the local search box inside the popover
  const filteredUniqueValues = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return uniqueValues;
    return uniqueValues.filter((item) => {
      const l = item.label.toLowerCase();
      const v = item.value.toLowerCase();
      return l.includes(query) || v.includes(query);
    });
  }, [uniqueValues, searchValue]);

  // Cap rendered DOM elements to 100 to maintain 60fps even with 50k+ records
  const MAX_DISPLAY_ITEMS = 100;
  const displayedUniqueValues = useMemo(() => {
    return filteredUniqueValues.slice(0, MAX_DISPLAY_ITEMS);
  }, [filteredUniqueValues]);

  // Toggle selection of a specific value without modifying the search query
  const handleToggleValue = (val: string) => {
    let newSelected: string[];
    if (selectedValues.includes(val)) {
      newSelected = selectedValues.filter((v) => v !== val);
    } else {
      newSelected = [...selectedValues, val];
    }

    if (newSelected.length === 0) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(newSelected);
    }
  };

  // Select all visible values
  const handleSelectAll = () => {
    const allVals = filteredUniqueValues.map((v) => v.value);
    column.setFilterValue(allVals);
  };

  // Clear/deselect all
  const handleClearAll = () => {
    column.setFilterValue(undefined);
  };

  // Select only this single value
  const handleSelectOnly = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    column.setFilterValue([val]);
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-1.5 min-w-0 select-none",
        align === "right"
          ? "justify-end"
          : align === "center"
          ? "justify-center"
          : "justify-between",
        className
      )}
    >
      {/* Title & Sorting Trigger */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        {canSort ? (
          <button
            type="button"
            onClick={() => column.toggleSorting(isSorted === "asc")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors whitespace-nowrap truncate"
            title={`Sắp xếp theo ${title}`}
            aria-label={`Sắp xếp theo ${title}`}
          >
            <span className="truncate" title={title}>{title}</span>
            {isSorted === "desc" ? (
              <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            ) : isSorted === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400/70 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 transition-opacity" />
            )}
          </button>
        ) : (
          <span 
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap truncate"
            title={title}
            aria-label={title}
          >
            {title}
          </span>
        )}

        {/* Pinned Indicator badge */}
        {isPinned && (
          <span
            className="p-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex-shrink-0"
            title={`Đã ghim sang ${isPinned === "left" ? "trái" : "phải"}`}
          >
            <Pin className={cn("w-2.5 h-2.5", isPinned === "right" && "rotate-90")} />
          </span>
        )}
      </div>

      {/* Funnel Filter Trigger Button */}
      {filterVariant !== "none" && canFilter && (
        <div className="relative flex-shrink-0 flex items-center">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleOpenFilter}
            className={cn(
              "p-1 rounded-md transition-all cursor-pointer",
              isFiltered
                ? "bg-blue-600 text-white shadow-2xs"
                : isOpen
                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
            )}
            title={
              isFiltered
                ? `Đang lọc cột ${title} (${selectedValues.length || 1} giá trị)`
                : `Lọc dữ liệu cột ${title}`
            }
            aria-label={`Lọc dữ liệu cột ${title}`}
          >
            <Filter className={cn("w-3.5 h-3.5", isFiltered && "fill-white")} />
          </button>

          {/* Funnel Dropdown via Portal into document.body: Fixed position, rock solid, no jitter */}
          {isOpen && coords && typeof document !== "undefined" && createPortal(
            <div
              ref={popoverRef}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 99999,
              }}
              className="w-72 p-3 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#2e3a47]">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-white truncate">
                  <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="truncate">Lọc: {title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Number Range inputs (for price/stock) */}
              {filterVariant === "range" && (
                <div className="mb-2.5 pb-2.5 border-b border-slate-100 dark:border-[#2e3a47] space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Khoảng giá / số:
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FormattedNumberInput
                      value={(currentFilter as [number, number])?.[0]}
                      onChange={(val) =>
                        column.setFilterValue((old: [number, number]) => [val, old?.[1]])
                      }
                      placeholder="Từ số"
                      className="w-full py-1.5 px-2 text-xs rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 tabular-nums"
                    />
                    <span className="text-slate-400 flex-shrink-0">–</span>
                    <FormattedNumberInput
                      value={(currentFilter as [number, number])?.[1]}
                      onChange={(val) =>
                        column.setFilterValue((old: [number, number]) => [old?.[0], val])
                      }
                      placeholder="Đến số"
                      className="w-full py-1.5 px-2 text-xs rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 tabular-nums"
                    />
                  </div>
                </div>
              )}

              {/* Search Inside Dropdown Values */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredUniqueValues.length > 0) {
                        const vals = filteredUniqueValues.map((v) => v.value);
                        column.setFilterValue(vals);
                      } else if (searchValue.trim()) {
                        column.setFilterValue([searchValue.trim()]);
                      }
                    }
                  }}
                  placeholder={filterVariant === "date" ? "Tìm ngày dd/mm/yyyy..." : (meta?.filterPlaceholder ?? "Lọc / Tìm giá trị...")}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchValue("");
                    }}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Select Actions */}
              <div className="flex items-center justify-between px-1 py-1 mb-1 text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#2e3a47]/60">
                <span className="font-medium">
                  {uniqueValues.length} giá trị có trong bảng
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Dropdown List of Values Present in Table */}
              <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 divide-y divide-slate-100/50 dark:divide-[#2e3a47]/40">
                {filteredUniqueValues.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 dark:text-slate-400 text-[11px]">
                    Không tìm thấy giá trị
                  </div>
                ) : (
                  displayedUniqueValues.map((item) => {
                    const isChecked = selectedValues.includes(item.value);
                    return (
                      <div
                        key={item.value}
                        onClick={() => handleToggleValue(item.value)}
                        className={cn(
                          "group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-xs",
                          isChecked
                            ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium"
                            : "hover:bg-slate-100 dark:hover:bg-[#24303f] text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                              isChecked
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1c2434]"
                            )}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate" title={item.label}>
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                          {/* Count of records with this value */}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#2e3a47] text-slate-500 dark:text-slate-400 font-mono">
                            {item.count}
                          </span>

                          {/* Quick 'Only' Button on Hover */}
                          <button
                            type="button"
                            onClick={(e) => handleSelectOnly(item.value, e)}
                            className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 dark:text-blue-400 hover:underline px-1 py-0.5 cursor-pointer"
                            title="Chỉ chọn giá trị này"
                          >
                            Chỉ
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Notice when values exceed 100 */}
                {filteredUniqueValues.length > MAX_DISPLAY_ITEMS && (
                  <div className="py-1.5 px-2 text-center text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#24303f] rounded-lg mt-1 font-medium">
                    Hiển thị {MAX_DISPLAY_ITEMS} / {filteredUniqueValues.length.toLocaleString()} giá trị (nhập từ khóa tìm kiếm để lọc thêm)
                  </div>
                )}
              </div>

              {/* Bottom Reset & Status Bar */}
              {isFiltered && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#2e3a47] flex items-center justify-between">
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    Đã chọn {selectedValues.length} giá trị
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Xóa bộ lọc cột này
                  </button>
                </div>
              )}
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}

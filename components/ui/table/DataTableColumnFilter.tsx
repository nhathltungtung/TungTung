"use client";

import React, { useState, useCallback } from "react";
import { Column } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { formatWithDots } from "@/components/ui/form/NumberInput";

export interface ColumnFilterMeta {
  filterVariant?: "text" | "select" | "range" | "date" | "none";
  filterOptions?: { label: string; value: string }[];
  filterPlaceholder?: string;
  align?: "left" | "center" | "right";
}

interface ColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

// ── FormattedNumberInput (shared, also used in DataTableColumnHeader popup) ─

interface FormattedNumberInputProps {
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function FormattedNumberInput({
  value,
  onChange,
  placeholder,
  className,
}: FormattedNumberInputProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [display, setDisplay] = useState<string>(
    value !== undefined ? formatWithDots(String(value)) : ""
  );

  if (prevValue !== value) {
    setPrevValue(value);
    setDisplay(value !== undefined ? formatWithDots(String(value)) : "");
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      setDisplay(formatWithDots(digits));
      onChange(digits ? Number(digits) : undefined);
    },
    [onChange]
  );

  const handleClear = () => {
    setDisplay("");
    onChange(undefined);
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={
          className ??
          "w-full py-1 px-1.5 text-[11px] font-normal rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1a2231] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 tabular-nums"
        }
      />
      {display && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="Xóa"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}


// ── Main Filter Component ──────────────────────────────────────────────────

export function DataTableColumnFilter<TData, TValue>({
  column,
}: ColumnFilterProps<TData, TValue>) {
  const columnFilterValue = column.getFilterValue();
  const meta = column.columnDef.meta as ColumnFilterMeta | undefined;
  const variant = meta?.filterVariant ?? "text";

  const textValue = typeof columnFilterValue === "string" ? columnFilterValue : "";

  if (variant === "none" || !column.getCanFilter()) {
    return null;
  }

  // 1. Select Dropdown Filter (Status, Category, Role)
  if (variant === "select") {
    return (
      <div className="relative min-w-[110px]">
        <select
          value={(columnFilterValue as string) ?? ""}
          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
          className="w-full py-1 px-2 text-[11px] font-normal rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1a2231] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
        >
          <option value="">{meta?.filterPlaceholder ?? "Tất cả"}</option>
          {meta?.filterOptions?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 2. Number Range Filter with dot-formatted inputs (Price, Stock)
  if (variant === "range") {
    const rangeValue = (columnFilterValue as [number | undefined, number | undefined]) ?? [
      undefined,
      undefined,
    ];

    return (
      <div className="flex items-center gap-1 min-w-[160px]">
        <FormattedNumberInput
          value={rangeValue[0]}
          placeholder="Min"
          onChange={(val) =>
            column.setFilterValue(
              (old: [number | undefined, number | undefined]) => [val, old?.[1]]
            )
          }
        />
        <span className="text-slate-400 text-xs flex-shrink-0">–</span>
        <FormattedNumberInput
          value={rangeValue[1]}
          placeholder="Max"
          onChange={(val) =>
            column.setFilterValue(
              (old: [number | undefined, number | undefined]) => [old?.[0], val]
            )
          }
        />
      </div>
    );
  }

  // 3. Default Text Search Filter (Name, SKU, Code)
  return (
    <div className="relative min-w-[120px] flex items-center">
      <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
      <input
        type="text"
        value={textValue}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        placeholder={meta?.filterPlaceholder ?? "Lọc..."}
        className="w-full pl-6 pr-6 py-1 text-[11px] font-normal rounded-lg border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1a2231] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all"
      />
      {textValue && (
        <button
          type="button"
          onClick={() => {
            column.setFilterValue(undefined);
          }}
          className="absolute right-1.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="Xóa bộ lọc"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

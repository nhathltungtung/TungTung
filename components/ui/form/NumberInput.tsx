"use client";

import React, { useState, useEffect, useCallback, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

// ── Format helpers ─────────────────────────────────────────────────────────

/** "1000000" → "1.000.000" */
export function formatWithDots(raw: string | number): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "1.000.000" → 1000000  (returns undefined when empty) */
export function parseDots(formatted: string): number | undefined {
  const digits = formatted.replace(/\./g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return isNaN(n) ? undefined : n;
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange" | "defaultValue"
  > {
  /** Current numeric value (controlled) */
  value?: number | string | null;
  /** Called with the raw number (or undefined when empty) */
  onChange?: (value: number | undefined) => void;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ElementType;
  /** Suffix shown inside the input on the right, e.g. "₫" */
  suffix?: string;
  /** Minimum allowed value (default 0) */
  min?: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      suffix,
      min,
      id,
      className,
      disabled,
      placeholder,
      required,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    // Controlled display string (formatted with dots)
    const [display, setDisplay] = useState<string>(() =>
      value !== undefined && value !== null && value !== "" && value !== 0
        ? formatWithDots(String(value))
        : ""
    );

    // Sync when external value changes (reset, edit mode, etc.)
    useEffect(() => {
      const ext =
        value !== undefined && value !== null && value !== ""
          ? formatWithDots(String(value))
          : "";
      setDisplay((prev) => {
        // Avoid clobbering while user is actively typing (numeric equality check)
        const prevNum = parseDots(prev);
        const extNum = parseDots(ext);
        if (prevNum === extNum) return prev;
        return ext;
      });
    }, [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const digits = raw.replace(/\D/g, "");
        const formatted = formatWithDots(digits);
        setDisplay(formatted);
        const numeric = parseDots(formatted);
        // Enforce min if provided
        const clamped =
          numeric !== undefined && min !== undefined && numeric < min ? min : numeric;
        onChange?.(clamped);
      },
      [onChange, min]
    );

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            disabled={disabled}
            placeholder={
              placeholder ??
              (suffix ? `0 ${suffix}` : "0")
            }
            className={cn(
              "w-full py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-hidden tabular-nums",
              LeftIcon ? "pl-10" : "pl-3.5",
              suffix ? "pr-12" : error ? "pr-10" : "pr-3.5",
              error
                ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-rose-500"
                : "border-slate-200 dark:border-[#2e3a47] focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#24303f]",
              disabled && "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800",
              className
            )}
            {...rest}
          />

          {/* Right: error icon OR suffix label */}
          {error ? (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : suffix ? (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {suffix}
              </span>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs font-medium text-rose-500 flex items-center gap-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

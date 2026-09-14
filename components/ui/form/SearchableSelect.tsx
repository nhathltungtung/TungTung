"use client";

import React, { useState, useRef, useEffect, useMemo, forwardRef } from "react";
import { ChevronDown, Search, X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SearchableOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  clearable?: boolean;
}

export const SearchableSelect = forwardRef<HTMLDivElement, SearchableSelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      value: controlledValue,
      defaultValue = "",
      onChange,
      onBlur,
      placeholder = "Chọn một mục...",
      searchPlaceholder = "Tìm kiếm...",
      disabled = false,
      required = false,
      className,
      id,
      name,
      clearable = false,
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const currentValue = isControlled ? controlledValue : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option object
    const selectedOption = useMemo(
      () => options.find((opt) => opt.value === currentValue),
      [options, currentValue]
    );

    // Filter options by search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase().trim();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q)
      );
    }, [options, searchQuery]);

    // Close on click outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery("");
          if (onBlur) onBlur();
        }
      }
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, onBlur]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus({ preventScroll: true });
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    const handleSelect = (val: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      if (onChange) {
        onChange(val);
      }
      setIsOpen(false);
      setSearchQuery("");
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) {
        setInternalValue("");
      }
      if (onChange) {
        onChange("");
      }
      setSearchQuery("");
    };

    return (
      <div className={cn("w-full space-y-1.5", className)} ref={ref}>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative" ref={containerRef}>
          {/* Hidden input for HTML form submission */}
          {name && <input type="hidden" name={name} value={currentValue} />}

          {/* Trigger Button */}
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center justify-between py-2.5 px-3.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border transition-all text-left cursor-pointer select-none",
              error
                ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30"
                : isOpen
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-[#24303f]"
                : "border-slate-200 dark:border-[#2e3a47] hover:border-slate-300 dark:hover:border-slate-600",
              disabled && "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
            )}
            aria-expanded={isOpen}
          >
            <span
              className={cn(
                "truncate",
                selectedOption
                  ? "text-slate-900 dark:text-white font-medium"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {clearable && currentValue && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                  title="Xóa lựa chọn"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-400 transition-transform duration-150",
                  isOpen && "transform rotate-180 text-blue-600 dark:text-blue-400"
                )}
              />
            </div>
          </button>

          {/* Searchable Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[200px] p-2 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              {/* Search Input Box */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1 divide-y divide-slate-100/50 dark:divide-[#2e3a47]/30">
                {filteredOptions.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Không tìm thấy kết quả phù hợp
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === currentValue;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => !opt.disabled && handleSelect(opt.value)}
                        className={cn(
                          "flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer transition-colors text-xs select-none",
                          isSelected
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold"
                            : "hover:bg-slate-100 dark:hover:bg-[#24303f] text-slate-700 dark:text-slate-300",
                          opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5] flex-shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {helperText && !error && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

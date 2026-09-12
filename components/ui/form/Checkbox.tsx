"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            className={cn(
              "w-4 h-4 mt-0.5 rounded-md border border-slate-300 dark:border-[#2e3a47] text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#1c2434] bg-slate-50 dark:bg-[#24303f] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-rose-500",
              className
            )}
            {...props}
          />
          {(label || description) && (
            <label
              htmlFor={checkboxId}
              className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none leading-relaxed"
            >
              {label && <span className="block">{label}</span>}
              {description && (
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  {description}
                </span>
              )}
            </label>
          )}
        </div>
        {error && <p className="text-xs font-medium text-rose-500 pl-7">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

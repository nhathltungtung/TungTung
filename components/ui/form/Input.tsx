"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-hidden",
              LeftIcon ? "pl-10" : "pl-3.5",
              RightIcon || error ? "pr-10" : "pr-3.5",
              error
                ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 dark:border-rose-500"
                : "border-slate-200 dark:border-[#2e3a47] focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#24303f]",
              props.disabled && "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800",
              className
            )}
            {...props}
          />

          {error ? (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : RightIcon ? (
            <button
              type="button"
              onClick={onRightIconClick}
              disabled={props.disabled}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <RightIcon className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs font-medium text-rose-500 flex items-center gap-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  // Kept for backward compatibility if passed
  showMenu?: boolean;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#24303f] active:scale-90 transition-all duration-150 flex items-center justify-center cursor-pointer",
        className
      )}
      aria-label="Chuyển đổi giao diện Sáng / Tối"
      title={isDark ? "Đang bật chế độ Tối - Bấm để chuyển sang Sáng" : "Đang bật chế độ Sáng - Bấm để chuyển sang Tối"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-200 rotate-0 scale-100 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 dark:text-slate-200 transition-transform duration-200 -rotate-12 scale-100 hover:rotate-0" />
      )}
    </button>
  );
}

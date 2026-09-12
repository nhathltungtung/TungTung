"use client";

import React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";
import { useTheme } from "@/components/theme/ThemeProvider";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme === "dark" ? "dark" : "light"}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-[#1c2434] group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-white group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-[#2e3a47] group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:text-sm group-[.toaster]:font-medium",
          description:
            "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400 group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:rounded-xl",
          cancelButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-[#24303f] group-[.toast]:text-slate-700 dark:group-[.toast]:text-slate-300 group-[.toast]:rounded-xl",
          closeButton:
            "group-[.toast]:bg-white dark:group-[.toast]:bg-[#1c2434] group-[.toast]:border-slate-200 dark:group-[.toast]:border-[#2e3a47] group-[.toast]:text-slate-400 hover:group-[.toast]:text-slate-700 dark:hover:group-[.toast]:text-slate-200",
        },
      }}
    />
  );
}

export { toast };

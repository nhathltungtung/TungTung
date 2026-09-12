"use client";

import React from "react";
import { useTranslation } from "./LanguageProvider";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, toggleLanguage } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2e3a47] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2e3a47] active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs",
        className
      )}
      aria-label="Chuyển đổi ngôn ngữ / Switch language"
      title={`Ngôn ngữ hiện tại: ${language === "vi" ? "Tiếng Việt 🇻🇳" : "English 🇬🇧"} - Bấm để chuyển đổi`}
    >
      <span className="text-sm select-none">
        {language === "vi" ? "🇻🇳" : "🇬🇧"}
      </span>
      <span className="tracking-wide uppercase font-bold text-[11px]">
        {language === "vi" ? "VI" : "EN"}
      </span>
    </button>
  );
}

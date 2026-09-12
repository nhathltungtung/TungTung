"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Sparkles } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-indigo-500/10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-2xl shadow-blue-500/25 relative overflow-hidden">
          {/* Decorative geometric blur circles */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold mb-6 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.landing.ctaSub}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {t.landing.ctaTitle}
            </h2>

            <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed">
              {t.landing.ctaDesc}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/admin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm shadow-xl transition-all hover:scale-105"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t.landing.ctaButton}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/auth/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-700/60 hover:bg-blue-700 border border-white/25 text-white font-semibold text-sm backdrop-blur-xs transition-colors"
              >
                <span>{t.landing.ctaRegister}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

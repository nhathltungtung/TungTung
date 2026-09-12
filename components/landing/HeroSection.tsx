"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/10 blur-[90px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs mb-6 hover:scale-105 transition-transform cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span>{t.landing.heroBadgeRelease}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{t.landing.heroBadgeReady}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            {t.landing.heroTitlePrefix}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              {t.landing.heroTitleHighlight}
            </span>{" "}
            {t.landing.heroTitleSuffix}
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {t.landing.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-xl shadow-blue-600/25 transition-all hover:shadow-2xl hover:shadow-blue-600/35 hover:-translate-y-0.5"
            >
              <span>{t.landing.heroCtaAdmin}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/auth/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#1c2434]/80 backdrop-blur-xs hover:bg-slate-50 dark:hover:bg-[#24303f] text-slate-800 dark:text-slate-100 font-semibold text-base transition-colors shadow-xs"
            >
              <Lock className="w-4 h-4 text-blue-500" />
              <span>{t.landing.heroCtaSignIn}</span>
            </Link>
          </div>

          {/* Trust points */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Next.js 16 App Router
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tailwind CSS v4
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Supabase SSR Cookie Auth
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Strict TypeScript
            </span>
          </div>
        </div>

        {/* Interactive Dashboard Mockup Preview */}
        <div className="mt-14 relative mx-auto max-w-5xl">
          <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-blue-500/20 via-slate-300/30 to-slate-200/20 dark:from-blue-500/30 dark:via-slate-800/40 dark:to-slate-900/20 shadow-2xl border border-white/40 dark:border-slate-700/50">
            <div className="rounded-2xl bg-white dark:bg-[#1c2434] overflow-hidden border border-slate-200/80 dark:border-slate-800">
              {/* Fake Window Header */}
              <div className="px-4 py-3 bg-slate-100/90 dark:bg-[#141b29] border-b border-slate-200 dark:border-[#2e3a47] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                    https://admin.yourdomain.com/admin
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-500 border border-blue-500/30">
                    Live Demo
                  </span>
                </div>
              </div>

              {/* Mockup Dashboard Content */}
              <div className="p-4 sm:p-6 space-y-5 bg-slate-50 dark:bg-[#10172a]">
                {/* 4 Mini Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.dashboard.kpiRevenue}</span>
                      <DollarSign className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">$124,500</p>
                    <span className="text-[10px] font-medium text-emerald-600">+12.5% {t.dashboard.monthPeriod}</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.dashboard.kpiSales}</span>
                      <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">1,480</p>
                    <span className="text-[10px] font-medium text-emerald-600">+8.2% {t.dashboard.weekPeriod}</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.dashboard.kpiUsers}</span>
                      <Users className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">2,450</p>
                    <span className="text-[10px] font-medium text-emerald-600">+18.3% {t.dashboard.newPeriod}</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.dashboard.kpiGrowth}</span>
                      <TrendingUp className="w-4 h-4 text-violet-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">3.45%</p>
                    <span className="text-[10px] font-medium text-emerald-600">{t.dashboard.stablePeriod}</span>
                  </div>
                </div>

                {/* Banner Callout inside mockup */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-600 text-white">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t.landing.ctaTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.landing.ctaDesc}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin"
                    className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {t.landing.ctaButton}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

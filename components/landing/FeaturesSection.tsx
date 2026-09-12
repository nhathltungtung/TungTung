"use client";

import React from "react";
import {
  Server,
  Layout,
  Shield,
  Code2,
  Gauge,
  Rocket,
  Check,
} from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function FeaturesSection() {
  const { t, language } = useTranslation();

  const isVi = language === "vi";

  const features = [
    {
      icon: Server,
      title: isVi ? "Next.js 16 App Router & SSR" : "Next.js 16 App Router & SSR",
      description: isVi
        ? "Tận dụng sức mạnh tối đa của Server Components, async cookies(), streaming HTML và giảm thiểu dung lượng JavaScript gửi về client."
        : "Leverage the full power of Server Components, async cookies(), streaming HTML, and minimal client-side JavaScript bundle sizes.",
      color: "from-blue-500 to-indigo-600",
      badge: "Core",
    },
    {
      icon: Layout,
      title: isVi ? "Hệ Thống Giao Diện TailAdmin" : "TailAdmin UI Design System",
      description: isVi
        ? "Chuẩn hóa phong cách TailAdmin UI: Sidebar đa cấp mở rộng, Dark/Light mode tức thì, Notification center và KPI cards sắc nét."
        : "Standardized TailAdmin UI: Multi-level expandable sidebar, instant dark/light mode toggle, notifications center, and crisp KPI metric cards.",
      color: "from-indigo-500 to-violet-600",
      badge: "UI/UX",
    },
    {
      icon: Shield,
      title: isVi ? "Supabase SSR Quản Lý Cookie" : "Supabase SSR Cookie Auth",
      description: isVi
        ? "Tích hợp chuẩn `@supabase/ssr` chia tách rõ ràng 3 phân hệ: Browser Client, Server Component Client và Edge Middleware session refresher."
        : "Standard `@supabase/ssr` integration cleanly partitioned into Browser Client, Server Component Client, and Edge Middleware session refresher.",
      color: "from-emerald-500 to-teal-600",
      badge: "Security",
    },
    {
      icon: Code2,
      title: isVi ? "Strict TypeScript 100%" : "Strict TypeScript 100%",
      description: isVi
        ? "Kiểm soát dữ liệu nghiêm ngặt, loại bỏ hoàn toàn kiểu dữ liệu 'any', áp dụng thuộc tính bất biến `readonly` cho toàn bộ interfaces."
        : "Strict static type validation with zero 'any' types, immutable `readonly` interface attributes across the whole codebase.",
      color: "from-amber-500 to-orange-600",
      badge: "Type-Safe",
    },
    {
      icon: Gauge,
      title: isVi ? "Turbopack Siêu Tốc" : "Lightning Turbopack",
      description: isVi
        ? "Biên dịch và tối ưu hóa thời gian khởi chạy máy chủ phát triển cũng như Production Build chỉ trong vài giây với Turbopack."
        : "Ultra-fast dev server boot times and optimized production compilation in under 2 seconds powered by Turbopack.",
      color: "from-rose-500 to-pink-600",
      badge: "Performance",
    },
    {
      icon: Rocket,
      title: isVi ? "Sẵn Sàng Triển Khai Vercel" : "Production Vercel Ready",
      description: isVi
        ? "Cấu hình tối ưu cho nền tảng Vercel, đi kèm tài liệu checklist triển khai chi tiết và hướng dẫn cấu hình redirect auth URL."
        : "Production optimized preset for Vercel, featuring a step-by-step pre-flight checklist and Supabase redirect URL guide.",
      color: "from-sky-500 to-cyan-600",
      badge: "DevOps",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0c1220]/50 border-y border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            {t.landing.featuresSub}
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.landing.featuresTitle}
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {t.landing.featuresDesc}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group relative p-8 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#24303f] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2e3a47]">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feat.title}
                </h3>

                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#2e3a47]/60 flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{isVi ? "Đã được kiểm nghiệm & tích hợp" : "Production tested & integrated"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

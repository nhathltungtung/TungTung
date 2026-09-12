"use client";

import React from "react";
import { Database, Cpu, Paintbrush, ShieldCheck, Terminal, Layers } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function TechStackSection() {
  const { t, language } = useTranslation();
  const isVi = language === "vi";

  const stackItems = [
    {
      name: "Next.js 16+",
      category: isVi ? "Khung Nền Tảng Core" : "Framework Core",
      desc: isVi ? "App Router, Server Components & Turbopack" : "App Router, Server Components & Turbopack",
      icon: Cpu,
      color: "text-slate-900 dark:text-white",
    },
    {
      name: "Tailwind CSS v4",
      category: isVi ? "Hệ Thống Giao Diện" : "Styling System",
      desc: isVi ? "PostCSS, Modern Design Tokens & Dark Mode" : "PostCSS, Modern Design Tokens & Dark Mode",
      icon: Paintbrush,
      color: "text-cyan-500",
    },
    {
      name: "Supabase SSR",
      category: isVi ? "Backend & Xác Thực" : "Backend & Auth",
      desc: isVi ? "@supabase/ssr, Safe Cookies & Postgres RLS" : "@supabase/ssr, Safe Cookies & Postgres RLS",
      icon: Database,
      color: "text-emerald-500",
    },
    {
      name: "TypeScript 5",
      category: isVi ? "An Toàn Kiểu Dữ Liệu" : "Type Safety",
      desc: isVi ? "Strict type checking, Zero 'any', Readonly types" : "Strict type checking, Zero 'any', Readonly types",
      icon: Terminal,
      color: "text-blue-500",
    },
    {
      name: "TailAdmin UI",
      category: isVi ? "Bộ Giao Diện Quản Trị" : "Component Kit",
      desc: isVi ? "Sidebar đa tầng, Header search & Dashboard cards" : "Multi-level sidebar, header search & KPI cards",
      icon: Layers,
      color: "text-indigo-500",
    },
    {
      name: "Edge Middleware",
      category: isVi ? "Tầng Bảo Mật Phiên" : "Security Layer",
      desc: isVi ? "Auto JWT Refresh, Protected Admin Routing" : "Auto JWT Refresh, Protected Admin Routing",
      icon: ShieldCheck,
      color: "text-violet-500",
    },
  ];

  return (
    <section id="architecture" className="py-20 md:py-28 bg-white dark:bg-[#10172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {t.landing.techStackSub}
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.landing.techStackTitle}
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {t.landing.techStackDesc}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stackItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-[#1c2434] border border-slate-200/80 dark:border-[#2e3a47] flex items-start gap-4 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-colors"
              >
                <div className="p-3 rounded-xl bg-white dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] shadow-xs shrink-0">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture Comparison Card */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-blue-900/10 via-indigo-900/10 to-violet-900/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-slate-900/40 border border-blue-500/20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {isVi ? "Phân Hệ Hai Tầng (Dual Architecture)" : "Dual Architecture System"}
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {isVi ? "Tách Biệt Hoàn Toàn Giữa Landing Page & Admin Portal" : "Complete Decoupling of Landing Page & Admin Portal"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                {isVi
                  ? "Nhờ tính năng Route Groups (marketing) và (admin) của Next.js App Router, người dùng truy cập trang giới thiệu nhanh gọn với layout public, trong khi đội ngũ quản trị làm việc trong không gian Admin độc lập với Sidebar và Header tối ưu."
                  : "Leveraging Next.js App Router Route Groups (marketing) and (admin), visitors enjoy a lightweight public landing experience while administrators work inside a dedicated, high-productivity TailAdmin layout."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="p-4 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs text-center min-w-[160px]">
                <p className="text-xs text-slate-400 font-semibold">{isVi ? "Tuyến đường Public" : "Public Route"}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">/ (Landing Page)</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">SEO & Marketing</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs text-center min-w-[160px]">
                <p className="text-xs text-slate-400 font-semibold">{isVi ? "Tuyến đường Admin" : "Admin Route"}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">/admin (Dashboard)</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">Full TailAdmin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

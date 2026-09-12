"use client";

import React from "react";
import { Zap, ShieldCheck, Clock, CheckCircle } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function MetricsSection() {
  const { t, language } = useTranslation();
  const isVi = language === "vi";

  const metrics = [
    {
      value: "100%",
      label: "Strict TypeScript",
      desc: isVi ? "Zero 'any', interfaces bất biến cho toàn hệ thống" : "Zero 'any', immutable interfaces across codebase",
      icon: ShieldCheck,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      value: "<1.5s",
      label: isVi ? "Turbopack Build" : "Turbopack Build",
      desc: isVi ? "Thời gian biên dịch toàn bộ các route tĩnh cực nhanh" : "Near-instant static pre-rendering build speed",
      icon: Zap,
      color: "text-amber-500",
    },
    {
      value: "0 " + (isVi ? "Lỗ Hổng" : "Vulnerabilities"),
      label: isVi ? "Bảo Mật An Toàn" : "Clean Audit",
      desc: isVi ? "Kiểm định an toàn bảo mật dependencies tuyệt đối" : "100% verified security audit on npm packages",
      icon: CheckCircle,
      color: "text-emerald-500",
    },
    {
      value: "10x",
      label: isVi ? "Tốc Độ Khởi Tạo" : "Development Velocity",
      desc: isVi ? "Tiết kiệm 2-3 tuần cấu hình auth và layout phức tạp" : "Save weeks of boilerplate setup and configuration",
      icon: Clock,
      color: "text-indigo-500",
    },
  ];

  return (
    <section id="metrics" className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0c1220]/50 border-y border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {t.landing.metricsSub}
          </h2>
          <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.landing.metricsTitle}
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {t.landing.metricsDesc}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="p-6 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs text-center"
              >
                <div className="inline-flex p-3 rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-[#2e3a47] mb-4">
                  <Icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {m.value}
                </h3>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {m.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

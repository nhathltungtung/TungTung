"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer id="docs" className="bg-white dark:bg-[#0c1220] border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/25">
                T
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                TailAdmin <span className="text-blue-500">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              {t.landing.footerDesc}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Bảo mật Cookie SSR & TypeScript 100%</span>
            </div>
          </div>

          {/* Col 2: Phân Hệ Quản Trị */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              {t.landing.footerAdminPortal}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.nav.ecommerce} Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.nav.analytics}
                </Link>
              </li>
              <li>
                <Link href="/admin/tables" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.nav.tables}
                </Link>
              </li>
              <li>
                <Link href="/admin/settings" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.nav.settings}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Xác Thực & Tài Liệu */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              {t.landing.footerSystemAuth}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/auth/signin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.nav.signIn}
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.nav.signUp}
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.landing.navFeatures}
                </a>
              </li>
              <li>
                <a href="#metrics" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {t.landing.navMetrics}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} {t.landing.footerRights}</p>
          <p className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> {t.landing.footerMadeWith}
          </p>
        </div>
      </div>
    </footer>
  );
}

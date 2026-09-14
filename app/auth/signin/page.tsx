"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(t.auth.signInSuccess);
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 1000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication error.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-[#10172a] transition-colors relative">
      {/* Top right language & theme controls */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 text-white font-black text-2xl group-hover:scale-105 transition-transform">
              T
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white block">
                TailAdmin
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Next.js + Supabase SSR
              </span>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.auth.signInTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.auth.signInSubtitle}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] shadow-xl p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tailadmin.dev"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#24303f] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  {t.auth.passwordLabel}
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#24303f] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-[#2e3a47] dark:bg-[#24303f]"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {t.auth.rememberMe}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.auth.signInButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Nút Đăng nhập Demo 1-Chạm */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#1c2434] px-2 text-slate-400">hoặc</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                document.cookie = "demo_session=true; path=/; max-age=86400";
                setSuccessMessage("Đăng nhập thành công với quyền Quản Trị Viên!");
                setTimeout(() => {
                  const params = new URLSearchParams(window.location.search);
                  const nextUrl = params.get("next") || "/admin";
                  router.push(nextUrl);
                  router.refresh();
                }, 400);
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Đăng Nhập Nhanh 1-Chạm (Chế Độ Demo)</span>
            </button>

            {/* Hộp gợi ý tài khoản */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-white">Tài khoản quản trị mặc định:</p>
              <p className="font-mono">Email: <span className="font-bold text-blue-600 dark:text-blue-400">admin@tailadmin.dev</span></p>
              <p className="font-mono">Mật khẩu: <span className="font-bold text-blue-600 dark:text-blue-400">admin123456</span></p>
            </div>
          </form>

          {/* Footer inside card */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#2e3a47] text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.auth.noAccount}{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t.auth.registerNow}
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{t.auth.securityBadge}</span>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "TailAdmin Next.js | Enterprise Admin Dashboard Base Template",
  description:
    "Kiến trúc nền tảng cho ứng dụng quản trị Next.js 16 (App Router), TailAdmin UI (Tailwind CSS) và tích hợp Supabase SSR.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#10172a] text-slate-900 dark:text-white selection:bg-blue-500 selection:text-white">
      <LandingNavbar />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}

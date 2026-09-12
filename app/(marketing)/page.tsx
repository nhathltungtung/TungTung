import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TechStackSection } from "@/components/landing/TechStackSection";
import { MetricsSection } from "@/components/landing/MetricsSection";
import { CtaSection } from "@/components/landing/CtaSection";

export const metadata = {
  title: "TailAdmin Hub - Enterprise Next.js 16 & Supabase SSR Dashboard Base",
  description:
    "Khám phá nền tảng quản trị mẫu hoàn chỉnh: Next.js 16 App Router, TailAdmin UI, Supabase SSR Auth, Type-Safe 100% và Vercel Ready.",
};

export default function LandingPage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturesSection />
      <TechStackSection />
      <MetricsSection />
      <CtaSection />
    </div>
  );
}

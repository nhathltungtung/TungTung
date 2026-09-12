import React from "react";
import { DefaultLayout } from "@/components/layout/DefaultLayout";

export const metadata = {
  title: "Admin Dashboard | TailAdmin Hub",
  description: "Next.js 16 + TailAdmin + Supabase SSR Admin Management Portal",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}

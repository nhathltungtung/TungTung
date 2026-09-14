"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

// Label mapping for common route segments
const routeLabels: Record<string, { vi: string; en: string }> = {
  admin: { vi: "Bảng điều khiển", en: "Dashboard" },
  analytics: { vi: "Phân tích", en: "Analytics" },
  users: { vi: "Người dùng", en: "Users" },
  tables: { vi: "Bảng dữ liệu", en: "Tables" },
  "audit-logs": { vi: "Nhật ký hệ thống", en: "Audit Logs" },
  settings: { vi: "Cài đặt", en: "Settings" },
  "ui-components": { vi: "UI Components", en: "UI Components" },
  ecommerce: { vi: "Thương mại điện tử", en: "E-Commerce" },
  calendar: { vi: "Lịch", en: "Calendar" },
  orders: { vi: "Đơn hàng", en: "Orders" },
  inventory: { vi: "Kho hàng", en: "Inventory" },
  products: { vi: "Sản phẩm", en: "Products" },
  create: { vi: "Tạo mới", en: "Create" },
  edit: { vi: "Chỉnh sửa", en: "Edit" },
  detail: { vi: "Chi tiết", en: "Detail" },
};

function formatSegment(segment: string, lang: "vi" | "en"): string {
  const normalized = segment.toLowerCase();
  if (routeLabels[normalized]) {
    return routeLabels[normalized][lang] || routeLabels[normalized].en;
  }
  // Auto-format kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumb({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const { language } = useTranslation();
  const lang = (language === "vi" ? "vi" : "en") as "vi" | "en";

  // Split path into segments ignoring empty strings
  const segments = (pathname || "")
    .split("/")
    .filter((segment) => segment.length > 0);

  // If on marketing root or empty, render single Home
  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
        <span className="flex items-center font-medium text-slate-700 dark:text-slate-200">
          <Home className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
          Home
        </span>
      </nav>
    );
  }

  // Build cumulative breadcrumb items
  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const label = formatSegment(segment, lang);

    return {
      label,
      href,
      isLast,
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm overflow-x-auto no-scrollbar py-1 ${className}`}
    >
      <ol className="flex items-center space-x-1.5 sm:space-x-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {/* Root Dashboard item */}
        <li className="flex items-center">
          <Link
            href="/admin"
            className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title={lang === "vi" ? "Bảng điều khiển" : "Dashboard"}
          >
            <Home className="w-4 h-4 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors" />
          </Link>
        </li>

        {items.map((item) => {
          // If the first segment is "admin", we can skip duplicate if root is /admin,
          // but if it's the only segment (/admin), show Dashboard as current page
          if (item.href === "/admin" && items.length > 1) {
            return null;
          }

          return (
            <li key={item.href} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-1 flex-shrink-0" />
              {item.isLast ? (
                <span
                  aria-current="page"
                  className="font-semibold text-slate-800 dark:text-white px-1.5 py-0.5 rounded-md bg-slate-100/70 dark:bg-slate-800/60"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

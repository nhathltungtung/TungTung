import {
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Users,
  Calendar,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  Globe,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { MenuGroup } from "@/types";

export const navigationConfig: readonly MenuGroup[] = [
  {
    name: "MENU",
    menuItems: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        children: [
          { title: "eCommerce", href: "/admin" },
          { title: "Analytics", href: "/admin/analytics" },
        ],
      },
      {
        title: "E-commerce",
        href: "/admin/ecommerce",
        icon: ShoppingCart,
        badge: "Pro",
        badgeColor: "primary",
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
      {
        title: "Users Management",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Calendar",
        href: "/admin/calendar",
        icon: Calendar,
      },
    ],
  },
  {
    name: "SYSTEM & UTILITIES",
    menuItems: [
      {
        title: "Landing Page",
        href: "/",
        icon: Globe,
      },
      {
        title: "Tables",
        href: "/admin/tables",
        icon: FileSpreadsheet,
      },
      {
        title: "Authentication",
        href: "/auth",
        icon: ShieldCheck,
        children: [
          { title: "Sign In", href: "/auth/signin" },
          { title: "Sign Up", href: "/auth/signup" },
        ],
      },
      {
        title: "UI Components",
        href: "/admin/ui-components",
        icon: Sparkles,
        badge: "New",
        badgeColor: "primary",
      },
      {
        title: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ShieldAlert,
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

import {
  LayoutDashboard,
  Calculator,
  Boxes,
  Receipt,
  Users,
  UserCheck,
  Settings,
  ShieldAlert,
  Tags,
} from "lucide-react";
import { MenuGroup } from "@/types";

export const navigationConfig: readonly MenuGroup[] = [
  {
    name: "QUẢN TRỊ ĐẠI LÝ",
    menuItems: [
      {
        title: "Tổng Quan",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Đơn Cắt Tôn",
        href: "/admin/orders/create",
        icon: Calculator,
        badge: "Hot",
        badgeColor: "success",
        children: [
          { title: "Tạo Đơn Cắt Tôn", href: "/admin/orders/create" },
          { title: "Danh Sách Đơn Hàng", href: "/admin/orders" },
        ],
      },
      {
        title: "Kho Hàng TT88",
        href: "/admin/inventory",
        icon: Boxes,
      },
      {
        title: "Kế Toán & Sổ Quỹ",
        href: "/admin/accounting",
        icon: Receipt,
        badge: "TT88",
        badgeColor: "primary",
      },
      {
        title: "Khách Hàng & Thợ Thầu",
        href: "/admin/customers",
        icon: Users,
      },
      {
        title: "Danh Mục ĐVT",
        href: "/admin/catalogs",
        icon: Tags,
        badge: "Catalog",
        badgeColor: "primary",
      },
    ],
  },
  {
    name: "HỆ THỐNG & NHÂN SỰ",
    menuItems: [
      {
        title: "Tài Khoản & Phân Quyền",
        href: "/admin/users",
        icon: UserCheck,
      },
      {
        title: "Cài Đặt Đại Lý",
        href: "/admin/settings",
        icon: Settings,
      },
      {
        title: "Nhật Ký Thao Tác",
        href: "/admin/audit-logs",
        icon: ShieldAlert,
      },
    ],
  },
];

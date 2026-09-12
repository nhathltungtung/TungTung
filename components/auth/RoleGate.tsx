"use client";

import React from "react";
import { useUser } from "@/hooks/useUser";

interface RoleGateProps {
  allowedRoles: ("admin" | "manager" | "user")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component kiểm soát hiển thị nội dung theo vai trò người dùng (Role-Based Access Control)
 *
 * @example
 * <RoleGate allowedRoles={["admin"]}>
 *   <button className="bg-rose-600 text-white">Xóa Dữ Liệu</button>
 * </RoleGate>
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  const userRole = user?.role || "user";

  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

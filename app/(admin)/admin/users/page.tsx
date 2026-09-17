import React from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagedUser, UserRole, AccountStatus } from "@/types";
import { UserTableClient } from "@/components/admin/users/UserTableClient";
import { Users, Shield, ShieldCheck, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quản Lý Người Dùng | Base Next.js",
  description: "Quản trị danh sách người dùng, vai trò phân quyền RBAC và trạng thái hoạt động",
};

export default async function UsersPage() {
  const supabase = await createClient();

  // Truy vấn trực tiếp từ bảng public.profiles trong Supabase PostgreSQL
  const { data: initialProfiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  let profiles = initialProfiles;

  // Nếu client SSR thông thường gặp lỗi hoặc không lấy được dữ liệu, tự động fallback sang Admin Service Role
  if (error || !profiles || profiles.length === 0) {
    try {
      const adminClient = createAdminClient();
      const adminRes = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!adminRes.error && adminRes.data) {
        profiles = adminRes.data;
      }
    } catch (adminErr) {
      console.error("Lỗi khi fallback Admin Client trong UsersPage:", adminErr);
    }
  }

  if (error && (!profiles || profiles.length === 0)) {
    console.error("Lỗi khi tải danh sách người dùng từ profiles:", error.message);
  }

  // Chuyển đổi dữ liệu database sang định dạng ManagedUser
  const users: ManagedUser[] = (profiles || []).map((p) => ({
    id: p.id,
    fullName: p.full_name || "Chưa đặt tên",
    email: p.email || "",
    role: (p.role as UserRole) || "user",
    status: (p.status as AccountStatus) || "Active",
    department: p.department || "Phòng Kỹ Thuật (Engineering)",
    phone: p.phone || undefined,
    avatarUrl: p.avatar_url || undefined,
    createdAt: p.created_at || new Date().toISOString(),
  }));

  // Tính toán số liệu thống kê KPI từ dữ liệu thật
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const managerCount = users.filter((u) => u.role === "manager").length;
  const activeCount = users.filter((u) => u.status === "Active").length;

  const kpiOverview = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tổng thành viên */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng thành viên
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalUsers.toLocaleString("vi-VN")}
          </h3>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 inline-block">
            Đã đồng bộ CSDL
          </span>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Card 2: Quản trị viên (Admin) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Quản trị viên
          </span>
          <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {adminCount.toLocaleString("vi-VN")}
          </h3>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1 inline-block">
            Toàn quyền hệ thống
          </span>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
          <Shield className="w-6 h-6" />
        </div>
      </div>

      {/* Card 3: Cấp Quản lý (Manager) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cấp Quản lý
          </span>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {managerCount.toLocaleString("vi-VN")}
          </h3>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 inline-block">
            Vận hành & giám sát
          </span>
        </div>
        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Card 4: Đang hoạt động */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Đang hoạt động
          </span>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount.toLocaleString("vi-VN")}
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
            Sẵn sàng làm việc
          </span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return <UserTableClient initialUsers={users} kpiOverview={kpiOverview} />;
}

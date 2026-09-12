"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Key,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { RoleGate } from "@/components/auth/RoleGate";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user, refreshUser, role } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "rbac">("profile");

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || "Admin Master");
  const [phone, setPhone] = useState("+84 987 654 321");
  const [jobTitle, setJobTitle] = useState("Lead Systems Architect");
  const [bio, setBio] = useState("Quản trị viên trưởng hệ thống Base Next.js & Supabase SSR.");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // Cập nhật bảng profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (profileError) throw profileError;

        // Cập nhật auth metadata
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        await refreshUser();
      }

      setProfileMessage({
        type: "success",
        text: "Hồ sơ cá nhân đã được cập nhật thành công!",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu hồ sơ.";
      setProfileMessage({ type: "error", text: message });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Mật khẩu xác nhận không trùng khớp.",
      });
      setPasswordSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: "Mật khẩu đã được thay đổi thành công!",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể đổi mật khẩu.";
      setPasswordMessage({ type: "error", text: message });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          <span>Quản trị</span>
          <span>/</span>
          <span className="text-blue-600 dark:text-blue-400">Cài đặt tài khoản</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Cài Đặt & Hồ Sơ Người Dùng
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý thông tin tài khoản cá nhân, mật khẩu bảo mật và quyền hạn truy cập (RBAC).
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2e3a47] pb-px">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className="w-4 h-4" />
          Hồ Sơ Cá Nhân
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "security"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Key className="w-4 h-4" />
          Bảo Mật & Mật Khẩu
        </button>

        <button
          onClick={() => setActiveTab("rbac")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "rbac"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
          Phân Quyền (RBAC)
        </button>
      </div>

      {/* TAB 1: Profile Form */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar & Role Summary Card */}
          <div className="lg:col-span-1 bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-[#1c2434]">
                {user?.fullName?.slice(0, 2).toUpperCase() || "AD"}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-transform group-hover:scale-110"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {fullName || user?.fullName || "Admin Master"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.email || "admin@tailadmin.dev"}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Shield className="w-3.5 h-3.5" />
                Vai trò: {role.toUpperCase()}
              </span>
            </div>

            <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-[#2e3a47] text-left text-xs space-y-2.5 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Mã định danh (UID):</span>
                <span className="font-mono text-slate-800 dark:text-slate-300">
                  {user?.id ? `${user.id.slice(0, 8)}...` : "demo-uid"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Đang hoạt động
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tham gia:</span>
                <span className="text-slate-800 dark:text-slate-300">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "01/01/2026"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Detailed Edit Form */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
              Thông Tin Chi Tiết
            </h3>

            {profileMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-sm flex items-center gap-2.5 ${
                  profileMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {profileMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Họ và Tên
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={user?.email || "admin@tailadmin.dev"}
                      disabled
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl bg-slate-100 dark:bg-[#1b2230] border border-slate-200 dark:border-[#2e3a47] text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Số Điện Thoại
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chức Danh / Vị Trí
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Giới Thiệu Ngắn (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {profileSaving ? "Đang lưu thay đổi..." : "Lưu Thông Tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === "security" && (
        <div className="max-w-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
            Thay Đổi Mật Khẩu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Đảm bảo sử dụng mật khẩu mạnh kết hợp chữ cái, chữ số và ký tự đặc biệt để bảo vệ tài khoản quản trị.
          </p>

          {passwordMessage && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-sm flex items-center gap-2.5 ${
                passwordMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              }`}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập tối thiểu 6 ký tự"
                  required
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Xác Nhận Mật Khẩu Mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all"
              >
                <Key className="w-4 h-4" />
                {passwordSaving ? "Đang cập nhật..." : "Đổi Mật Khẩu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: RBAC Demo & Permission Gates */}
      {activeTab === "rbac" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Hệ Thống Phân Quyền Vai Trò (Role-Based Access Control)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Hệ thống được thiết kế với 3 cấp bậc quyền hạn chuẩn: <strong className="text-blue-600">ADMIN</strong>,{" "}
              <strong className="text-indigo-600">MANAGER</strong> và <strong className="text-slate-600 dark:text-slate-300">USER</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  ADMIN (Toàn quyền)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Có quyền truy cập toàn bộ menu, xóa dữ liệu, thay đổi cấu hình hệ thống và quản lý tài khoản người dùng khác.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  MANAGER (Quản lý)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Xem báo cáo, xuất file Excel, duyệt đơn hàng và chỉnh sửa dữ liệu nghiệp vụ, không được xóa cấu hình cốt lõi.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f]">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  USER (Nhân viên / Khách)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Chỉ được xem thông tin cá nhân và dữ liệu được phân quyền riêng biệt theo chính sách Row Level Security (RLS).
                </p>
              </div>
            </div>

            {/* RoleGate Demo Section */}
            <div className="pt-5 border-t border-slate-100 dark:border-[#2e3a47]">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Khu Vực Thao Tác Nguy Hiểm (Bảo vệ bởi RoleGate)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Các nút bên dưới được bọc bởi component <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-500">{"<RoleGate allowedRoles={['admin']} />"}</code>. Chỉ người có vai trò Admin mới thấy các nút hành động này.
              </p>

              <RoleGate
                allowedRoles={["admin"]}
                fallback={
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Bạn đang đăng nhập với vai trò thường. Chỉ Quản trị viên (Admin) mới có thể thực hiện thao tác tại đây.</span>
                  </div>
                }
              >
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => alert("Đã kích hoạt xóa cache hệ thống.")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-xs font-semibold text-slate-800 dark:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Làm Mới Bộ Nhớ Cache
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Bạn có chắc chắn muốn xuất toàn bộ dữ liệu cấu hình hệ thống?")) {
                        alert("Đang chuẩn bị file backup...");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa Dữ Liệu Tạm (Admin Only)
                  </button>
                </div>
              </RoleGate>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Sliders,
  Building,
  Headphones,
  Loader2,
  Power,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { RoleGate } from "@/components/auth/RoleGate";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/form/ImageUploader";
import { updateSystemSettingsAction } from "./actions";

export default function SettingsPage() {
  const { user, refreshUser, role } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "rbac" | "system">("profile");

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || "Admin Master");
  const [phone, setPhone] = useState("+84 987 654 321");
  const [jobTitle, setJobTitle] = useState("Lead Systems Architect");
  const [bio, setBio] = useState("Quản trị viên trưởng hệ thống Base Next.js & Supabase SSR.");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Security Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // System Settings State
  const [systemName, setSystemName] = useState("Hệ Thống Quản Lý Bán Hàng & Kho Tôn Thép");
  const [companyName, setCompanyName] = useState("ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [supportEmail, setSupportEmail] = useState("tuanhuong.ton@gmail.com");
  const [hotline, setHotline] = useState("0988.123.456");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemSaving, setSystemSaving] = useState(false);
  const [systemLoading, setSystemLoading] = useState(true);

  // Load system settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("system_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

        if (data) {
          setSystemName(data.system_name || "Hệ Thống Quản Lý Bán Hàng & Kho Tôn Thép");
          setCompanyName(data.company_name || "ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG");
          setLogoUrl(data.logo_url || "");
          setSupportEmail(data.support_email || "tuanhuong.ton@gmail.com");
          setHotline(data.hotline || "0988.123.456");
          setMaintenanceMode(!!data.maintenance_mode);
        }
      } catch (err) {
        console.error("Lỗi khi tải cấu hình hệ thống:", err);
      } finally {
        setSystemLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Handle Avatar Direct Upload via Storage
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn định dạng file ảnh (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện không được vượt quá 5MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `avatars/${Date.now()}-${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      const publicUrl = publicData.publicUrl;

      // Update profile
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        await supabase
          .from("profiles")
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        await supabase.auth.updateUser({
          data: { avatar_url: publicUrl },
        });

        await refreshUser();
      }

      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải ảnh đại diện.";
      toast.error(message);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

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
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.id);

        if (profileError) throw profileError;

        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        await refreshUser();
      }

      toast.success("Hồ sơ cá nhân đã được cập nhật thành công!");
      setProfileMessage({
        type: "success",
        text: "Hồ sơ cá nhân đã được cập nhật thành công!",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu hồ sơ.";
      toast.error(message);
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

      toast.success("Mật khẩu đã được thay đổi thành công!");
      setPasswordMessage({
        type: "success",
        text: "Mật khẩu tài khoản đã được cập nhật thành công!",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật mật khẩu.";
      toast.error(message);
      setPasswordMessage({ type: "error", text: message });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Save System Settings
  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemSaving(true);

    try {
      const res = await updateSystemSettingsAction({
        systemName,
        companyName,
        logoUrl,
        supportEmail,
        hotline,
        maintenanceMode,
      });

      if (!res.success) {
        toast.error(res.error || "Không thể lưu cấu hình hệ thống");
        return;
      }

      toast.success("Cấu hình chung hệ thống đã được lưu thành công!");
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu cấu hình.");
    } finally {
      setSystemSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Cài Đặt & Cấu Hình Hệ Thống
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý tài khoản cá nhân, mật khẩu bảo mật, phân quyền RBAC và cấu hình toàn cục.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#2e3a47] pb-px">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "rbac"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" />
          Phân Quyền (RBAC)
        </button>

        <RoleGate allowedRoles={["admin"]}>
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "system"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Cấu Hình Chung
          </button>
        </RoleGate>
      </div>

      {/* TAB 1: Profile Form */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar & Role Summary Card */}
          <div className="lg:col-span-1 bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs flex flex-col items-center text-center">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <div className="relative group mb-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-[#1c2434] overflow-hidden">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.fullName?.slice(0, 2).toUpperCase() || "AD"
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-transform group-hover:scale-110 cursor-pointer disabled:opacity-50"
                title="Tải ảnh đại diện mới"
              >
                {avatarUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
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
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Địa Chỉ Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || "admin@tailadmin.dev"}
                      disabled
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Số Điện Thoại
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chức Danh / Vị Trí
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tiểu Sử (Bio)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {profileSaving ? "Đang lưu..." : "Lưu Thông Tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === "security" && (
        <div className="max-w-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Đổi Mật Khẩu
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Mật khẩu mới của bạn cần tối thiểu 6 ký tự. Hãy sử dụng mật khẩu mạnh để bảo vệ tài khoản.
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
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
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
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
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
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {passwordSaving ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: RBAC Overview */}
      {activeTab === "rbac" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Mô Hình Phân Quyền Vai Trò (Role-Based Access Control)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Hệ thống áp dụng phân quyền 3 cấp độ kết hợp bảo vệ cấp database qua Supabase Row Level Security (RLS).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  ADMIN
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Toàn quyền hệ thống: quản lý tài khoản, đổi quyền, cấu hình hệ thống, xóa dữ liệu và sao lưu.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  MANAGER
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Quyền quản lý vận hành: xem danh sách người dùng, cập nhật trạng thái, xuất báo cáo doanh thu.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  USER
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
                Các nút bên dưới được bọc bởi component <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-500">{"<RoleGate allowedRoles={['admin']} />"}</code>.
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
                    onClick={() => toast.success("Đã làm mới bộ nhớ cache hệ thống!")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2c3a4d] text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Làm Mới Bộ Nhớ Cache
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Bạn có chắc chắn muốn xuất toàn bộ dữ liệu cấu hình hệ thống?")) {
                        toast.info("Đang tạo tệp sao lưu dữ liệu...");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
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

      {/* TAB 4: System Settings */}
      {activeTab === "system" && (
        <RoleGate
          allowedRoles={["admin"]}
          fallback={
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">
              Chỉ Quản trị viên (Admin) mới có quyền truy cập tab Cấu hình chung hệ thống.
            </div>
          }
        >
          <div className="bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] rounded-2xl p-6 shadow-xs max-w-4xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Cấu Hình Chung Hệ Thống (Toàn Cục)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Các thiết lập dưới đây được lưu vào bảng <code className="text-blue-600 font-mono">system_settings</code> trong PostgreSQL và áp dụng trực tiếp cho toàn bộ người dùng và trang công khai.
            </p>

            {systemLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">Đang tải cấu hình hệ thống...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                {/* 50-50 Balanced Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tên Hệ Thống / Dự Án
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tên Công Ty / Doanh Nghiệp Sở Hữu
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Hỗ Trợ Kỹ Thuật
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Đường Dây Nóng (Hotline)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={hotline}
                        onChange={(e) => setHotline(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <Headphones className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  {/* Logo Upload & Maintenance Mode Pair */}
                  <div>
                    <ImageUploader
                      label="Logo Thương Hiệu Hệ Thống"
                      bucket="avatars"
                      folder="branding"
                      value={logoUrl}
                      onChange={(url) => setLogoUrl(url)}
                      aspectRatio="auto"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#1c2434] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Power className="w-3.5 h-3.5 text-amber-500" />
                          Chế Độ Bảo Trì Hệ Thống (Maintenance)
                        </span>
                        <input
                          type="checkbox"
                          id="maintenanceToggle"
                          checked={maintenanceMode}
                          onChange={(e) => setMaintenanceMode(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Khi bật chế độ bảo trì, người dùng thông thường truy cập cổng portal sẽ thấy thông báo tạm dừng vận hành. Quản trị viên vẫn có thể đăng nhập bình thường.
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2e3a47]">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          maintenanceMode
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        }`}
                      >
                        {maintenanceMode ? "Đang bật chế độ bảo trì" : "Hệ thống hoạt động bình thường"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={systemSaving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {systemSaving ? "Đang lưu cấu hình..." : "Lưu Cấu Hình Toàn Cục"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </RoleGate>
      )}
    </div>
  );
}

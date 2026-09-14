"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/form/Input";
import { PasswordInput } from "@/components/ui/form/PasswordInput";
import { Select } from "@/components/ui/form/Select";
import { toast } from "sonner";
import { ManagedUser, UserRole, AccountStatus } from "@/types";
import {
  createManagedUserAction,
  updateManagedUserAction,
} from "@/app/(admin)/admin/users/actions";
import { User, UserPlus, Edit2, Eye } from "lucide-react";
import { formatDateVN } from "@/lib/utils";

export type UserModalMode = "create" | "edit" | "view";

const userFormSchema = z.object({
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().optional(),
  role: z.enum(["admin", "manager", "user"] as const),
  department: z.string().min(1, "Vui lòng chọn phòng ban"),
  status: z.enum(["Active", "Suspended"] as const),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: ManagedUser | null;
  mode?: UserModalMode;
  onSuccess?: (user?: ManagedUser) => void;
}

export const departmentOptions = [
  { label: "Ban Điều Hành (Executive)", value: "Ban Điều Hành (Executive)" },
  { label: "Phòng Kỹ Thuật (Engineering)", value: "Phòng Kỹ Thuật (Engineering)" },
  { label: "Phòng Sản Phẩm (Product)", value: "Phòng Sản Phẩm (Product)" },
  { label: "Phòng Thiết Kế (UI/UX)", value: "Phòng Thiết Kế (UI/UX)" },
  { label: "Phòng Hỗ Trợ (Customer Success)", value: "Phòng Hỗ Trợ (Customer Success)" },
  { label: "Phòng Kinh Doanh (Sales)", value: "Phòng Kinh Doanh (Sales)" },
  { label: "Phòng Marketing", value: "Phòng Marketing" },
  { label: "Phòng Tài Chính & Kế Toán", value: "Phòng Tài Chính & Kế Toán" },
  { label: "Phòng Nhân Sự (HR)", value: "Phòng Nhân Sự (HR)" },
];

export const roleOptions = [
  { label: "Quản trị viên (Admin)", value: "admin" },
  { label: "Quản lý (Manager)", value: "manager" },
  { label: "Thành viên (User)", value: "user" },
];

export const statusOptions = [
  { label: "Đang hoạt động", value: "Active" },
  { label: "Đã tạm khóa", value: "Suspended" },
];

interface ProfileResponseData {
  id?: string;
  full_name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  status?: AccountStatus;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export function UserFormModal({
  isOpen,
  onClose,
  user,
  mode = "create",
  onSuccess,
}: UserFormModalProps) {
  const [currentMode, setCurrentMode] = useState<UserModalMode>(mode);
  const [prevMode, setPrevMode] = useState<UserModalMode>(mode);

  if (mode !== prevMode) {
    setPrevMode(mode);
    setCurrentMode(mode);
  }

  const isView = currentMode === "view";
  const isEditing = currentMode === "edit";
  const isCreating = currentMode === "create";

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "user",
      department: "Phòng Kỹ Thuật (Engineering)",
      status: "Active",
      phone: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          fullName: user.fullName,
          email: user.email,
          password: "",
          role: user.role,
          department: user.department,
          status: user.status,
          phone: user.phone || "",
        });
      } else {
        reset({
          fullName: "",
          email: "",
          password: "",
          role: "user",
          department: "Phòng Kỹ Thuật (Engineering)",
          status: "Active",
          phone: "",
        });
      }
    }
  }, [isOpen, user, reset]);

  const onInvalid = (fieldErrors: FieldErrors<UserFormValues>) => {
    const errorMessages = Object.values(fieldErrors)
      .map((e) => e?.message)
      .filter((msg): msg is string => typeof msg === "string" && msg.length > 0);
    if (errorMessages.length > 0) {
      toast.error(errorMessages[0]);
    }
  };

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (isCreating) {
        if (!values.password || values.password.length < 6) {
          setError("password", {
            message: "Mật khẩu ban đầu tối thiểu 6 ký tự",
          });
          toast.error("Mật khẩu ban đầu tối thiểu 6 ký tự");
          return;
        }

        const res = await createManagedUserAction(values);
        if (!res.success) {
          toast.error(res.error || "Không thể tạo tài khoản thành viên");
          return;
        }

        const profileData = res.data as ProfileResponseData | undefined;
        const createdUser: ManagedUser = {
          id: profileData?.id || crypto.randomUUID(),
          fullName: profileData?.full_name || values.fullName,
          email: profileData?.email || values.email,
          role: values.role,
          department: values.department,
          status: values.status,
          phone: values.phone || undefined,
          createdAt: profileData?.created_at || new Date().toISOString(),
        };

        toast.success("Thêm thành viên mới thành công!");
        onClose();
        if (onSuccess) onSuccess(createdUser);
      } else if (isEditing && user) {
        const res = await updateManagedUserAction(user.id, {
          ...values,
          email: values.email || user.email,
        });
        if (!res.success) {
          toast.error(res.error || "Không thể cập nhật thành viên");
          return;
        }

        const profileData = res.data as ProfileResponseData | undefined;
        const updatedUser: ManagedUser = {
          id: user.id,
          fullName: profileData?.full_name || values.fullName,
          email: profileData?.email || values.email || user.email,
          role: values.role,
          department: values.department,
          status: values.status,
          phone: values.phone || undefined,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        };

        toast.success("Cập nhật thông tin thành viên thành công!");
        onClose();
        if (onSuccess) onSuccess(updatedUser);
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi lưu dữ liệu thành viên.");
    }
  };

  const getModalTitle = () => {
    switch (currentMode) {
      case "view":
        return "Chi Tiết Thành Viên";
      case "edit":
        return "Chỉnh Sửa Thành Viên";
      case "create":
        return "Thêm Thành Viên Mới";
    }
  };

  const getModalDescription = () => {
    switch (currentMode) {
      case "view":
        return `Xem hồ sơ tài khoản: ${user?.email || ""}`;
      case "edit":
        return `Cập nhật thông tin tài khoản: ${user?.email || ""}`;
      case "create":
        return "Khởi tạo tài khoản và phân quyền vai trò cho thành viên mới";
    }
  };

  const getHeaderIcon = () => {
    switch (currentMode) {
      case "view":
        return <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case "edit":
        return <Edit2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "create":
        return <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          {getHeaderIcon()}
          <span>{getModalTitle()}</span>
        </span>
      }
      description={getModalDescription()}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {isView ? (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Chế độ xem hồ sơ
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMode("edit")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={user && isEditing ? () => setCurrentMode("view") : onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {user && isEditing ? "Quay lại xem" : "Hủy bỏ"}
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit, onInvalid)}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? "Đang lưu..."
                  : isEditing
                    ? "Lưu thay đổi"
                    : "Lưu thành viên"}
              </button>
            </>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4 py-1">
        {/* Hệ thống lưới 2 cột cân đối hoàn hảo (grid-cols-1 sm:grid-cols-2 gap-4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hàng 1: Họ tên & Email */}
          <Input
            label="Họ và Tên"
            placeholder="VD: Nguyễn Văn Hoàng"
            disabled={isView}
            required={!isView}
            {...register("fullName")}
            error={errors.fullName?.message}
          />

          <Input
            label="Email Đăng Nhập"
            type="email"
            placeholder="hoang.nv@company.com"
            disabled={isView}
            readOnly={isEditing}
            required={!isView}
            {...register("email")}
            error={errors.email?.message}
            className={isEditing ? "opacity-80 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50" : ""}
          />

          {/* Hàng 2: Vai trò & Trạng thái */}
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Vai Trò (Role)"
                options={roleOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value as UserRole)}
                disabled={isView}
                required={!isView}
                error={errors.role?.message}
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Trạng Thái Hoạt Động"
                options={statusOptions}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value as AccountStatus)}
                disabled={isView}
                required={!isView}
                error={errors.status?.message}
              />
            )}
          />

          {/* Hàng 3: Phòng ban & Số điện thoại */}
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Select
                label="Phòng Ban / Đơn Vị"
                options={departmentOptions}
                value={field.value}
                onChange={field.onChange}
                disabled={isView}
                required={!isView}
                error={errors.department?.message}
              />
            )}
          />

          <Input
            label="Số Điện Thoại"
            placeholder="VD: 0912 345 678"
            disabled={isView}
            {...register("phone")}
            error={errors.phone?.message}
          />

          {/* Hàng 4: Mật khẩu (nếu Create) hoặc Ngày tạo & ID (nếu View/Edit) */}
          {isCreating ? (
            <>
              <PasswordInput
                label="Mật Khẩu Ban Đầu"
                placeholder="Tối thiểu 6 ký tự..."
                required={true}
                {...register("password")}
                error={errors.password?.message}
              />
              <div className="flex flex-col justify-end">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 pb-2">
                  * Mật khẩu sẽ được mã hóa an toàn qua Supabase Auth
                </span>
              </div>
            </>
          ) : user ? (
            <>
              <Input
                label="Ngày Tham Gia"
                value={formatDateVN(user.createdAt)}
                disabled
              />
              <Input
                label="Mã Định Danh (UID)"
                value={user.id}
                disabled
              />
            </>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

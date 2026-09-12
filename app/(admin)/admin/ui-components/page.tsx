"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Sliders,
  PanelRight,
  Send,
  Loader2,
  Mail,
  User,
  Layers,
  Sparkles,
  Inbox,
  FileCheck,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import {
  Input,
  PasswordInput,
  Select,
  Switch,
  Checkbox,
  Textarea,
} from "@/components/ui/form";
import {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonTableRow,
} from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

// Zod Validation Schema for Test Form
const demoFormSchema = z.object({
  fullName: z.string().min(3, "Họ và tên phải có tối thiểu 3 ký tự"),
  email: z.string().email("Địa chỉ email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có tối thiểu 6 ký tự"),
  role: z.string().min(1, "Vui lòng chọn một vai trò"),
  bio: z.string().min(10, "Tiểu sử giới thiệu phải từ 10 ký tự trở lên"),
  terms: z.boolean().refine((val) => val === true, {
    message: "Bạn cần đồng ý với điều khoản sử dụng",
  }),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

export default function UIComponentsPage() {
  // Modal & Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Switch demo state
  const [pushNotifications, setPushNotifications] = useState(true);

  // React Hook Form with Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "",
      bio: "",
      terms: false,
    },
  });

  const onFormSubmit = async (data: DemoFormData) => {
    // Simulate async API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success("Dữ liệu form hợp lệ!", {
      description: `Đã xác thực thành công cho: ${data.fullName} (${data.role})`,
    });
    reset();
  };

  // Toast Demos
  const handlePromiseToast = () => {
    const promise = () =>
      new Promise<{ name: string }>((resolve, reject) =>
        setTimeout(() => {
          if (Math.random() > 0.2) {
            resolve({ name: "Bản báo cáo doanh thu Q3.pdf" });
          } else {
            reject(new Error("Lỗi kết nối máy chủ"));
          }
        }, 1500)
      );

    toast.promise(promise, {
      loading: "Đang xuất dữ liệu và đóng gói file...",
      success: (data) => `Tải xuống thành công: ${data.name}`,
      error: "Không thể xuất báo cáo. Vui lòng thử lại sau.",
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsDeleting(false);
    setIsConfirmOpen(false);
    toast.success("Đã xóa bản ghi thành công!", {
      description: "Dữ liệu đã được gỡ bỏ khỏi hệ thống hoàn toàn.",
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          <span>Hệ thống</span>
          <span>/</span>
          <span className="text-blue-600 dark:text-blue-400">UI Components</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Bộ UI Primitives & Design System
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thư viện các component giao diện cơ sở, hệ thống Toast, Modal, Drawer, Skeleton và Form Controls kết hợp Zod.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Toast Notifications */}
      <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Hệ Thống Toast Notifications (Sonner)
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hỗ trợ thông báo nổi bật, tự động đổi màu theo chủ đề Sáng/Tối và hỗ trợ Promise async loading.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() =>
              toast.success("Thao tác thành công!", {
                description: "Hồ sơ của bạn đã được lưu vào hệ thống.",
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Success Toast
          </button>

          <button
            type="button"
            onClick={() =>
              toast.error("Đã xảy ra lỗi!", {
                description: "Không thể kết nối tới cơ sở dữ liệu Supabase.",
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            Error Toast
          </button>

          <button
            type="button"
            onClick={() =>
              toast.warning("Cảnh báo dung lượng!", {
                description: "Bạn đã sử dụng 85% hạn mức lưu trữ tệp tin.",
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            Warning Toast
          </button>

          <button
            type="button"
            onClick={() =>
              toast.info("Cập nhật phiên bản mới", {
                description: "Phiên bản Base Next.js v2.0 đã sẵn sàng sử dụng.",
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Info className="w-4 h-4" />
            Info Toast
          </button>

          <button
            type="button"
            onClick={handlePromiseToast}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Async Promise Toast
          </button>
        </div>
      </div>

      {/* SECTION 2: Modal, Confirm Dialog & Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              2. Modal Hộp Thoại
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Popup linh hoạt có backdrop làm mờ, phím Escape đóng và animation phóng to mượt mà.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Mở Modal Mẫu
          </button>
        </div>

        <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              3. Confirm Dialog
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hộp thoại xác nhận trước các hành động nguy hiểm với trạng thái loading spinner.
          </p>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 active:scale-95 transition-all"
          >
            Mở Confirm Dialog (Xóa)
          </button>
        </div>

        <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
            <PanelRight className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              4. Drawer (Bảng Trượt)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Khay trượt từ cạnh phải màn hình để xem nhanh chi tiết hoặc nhập liệu form phụ.
          </p>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            Mở Drawer Chi Tiết
          </button>
        </div>
      </div>

      {/* SECTION 3: Form Controls with Zod Validation */}
      <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
          <Sliders className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              5. Bộ Form Controls & Kiểm Tra Dữ Liệu Tự Động (React Hook Form + Zod)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thử bấm &quot;Kiểm Tra &amp; Gửi Dữ Liệu&quot; khi chưa điền để quan sát phản hồi lỗi validation tự động.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Họ và Tên"
              placeholder="VD: Trần Hoàng Nam"
              leftIcon={User}
              required
              {...register("fullName")}
              error={errors.fullName?.message}
            />

            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="name@company.com"
              leftIcon={Mail}
              required
              {...register("email")}
              error={errors.email?.message}
            />

            <PasswordInput
              label="Mật Khẩu"
              placeholder="Nhập ít nhất 6 ký tự"
              required
              {...register("password")}
              error={errors.password?.message}
            />

            <Select
              label="Vai Trò / Cấp Bậc"
              required
              placeholder="-- Chọn vai trò --"
              options={[
                { value: "admin", label: "Admin (Quản trị viên)" },
                { value: "manager", label: "Manager (Quản lý dự án)" },
                { value: "user", label: "User (Nhân viên)" },
              ]}
              {...register("role")}
              error={errors.role?.message}
            />
          </div>

          <Textarea
            label="Tiểu Sử Giới Thiệu (Bio)"
            placeholder="Viết tóm tắt kinh nghiệm làm việc hoặc mục tiêu..."
            rows={3}
            required
            {...register("bio")}
            error={errors.bio?.message}
          />

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-[#2e3a47] space-y-4">
            <Switch
              label="Bật thông báo qua Email"
              description="Nhận các bản tin cập nhật hệ thống và cảnh báo đăng nhập bất thường"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />

            <div className="pt-3 border-t border-slate-200 dark:border-[#2e3a47]">
              <Checkbox
                label="Tôi đồng ý với các điều khoản dịch vụ và chính sách bảo mật hệ thống"
                description="Bằng việc tích chọn, bạn xác nhận đã đọc và hiểu rõ quy chế quản trị dữ liệu"
                {...register("terms")}
                error={errors.terms?.message}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2e3a47] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Đặt Lại Form
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSubmitting ? "Đang xác thực..." : "Kiểm Tra & Gửi Dữ Liệu"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: Skeleton Loaders & Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skeleton Preview */}
        <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
            <Loader2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              6. Skeleton Shimmer Loaders
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hiệu ứng khung xương tải nội dung giúp cải thiện trải nghiệm người dùng (UX) khi nạp dữ liệu async.
          </p>

          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3">
              <SkeletonAvatar size="md" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>

            <SkeletonCard />

            <div className="border border-slate-100 dark:border-[#2e3a47] rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <SkeletonTableRow columns={3} />
                  <SkeletonTableRow columns={3} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Empty State Preview */}
        <div className="bg-white dark:bg-[#1c2434] rounded-2xl border border-slate-200 dark:border-[#2e3a47] p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
            <Inbox className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              7. Trạng Thái Dữ Liệu Rỗng (Empty State)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị trang nhã khi người dùng chưa có đơn hàng, sản phẩm hoặc danh sách rỗng.
          </p>

          <EmptyState
            title="Chưa có dữ liệu nào được tạo"
            description="Bạn có thể bắt đầu tạo đơn hàng hoặc thêm mới thành viên vào hệ thống để bắt đầu theo dõi số liệu."
            actionText="Tạo Bản Ghi Mới"
            onAction={() =>
              toast.info("Đã mở trình tạo bản ghi mới!", {
                description: "Hành động được gọi từ Empty State button.",
              })
            }
          />
        </div>
      </div>

      {/* SAMPLE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm Mới Dự Án Mẫu"
        description="Điền thông tin cơ bản của dự án để khởi tạo không gian làm việc mới."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2e3a47] text-slate-700 dark:text-slate-200 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                toast.success("Dự án đã được tạo thành công!");
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all"
            >
              Tạo Dự Án
            </button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Input label="Tên Dự Án" placeholder="VD: Nền Tảng E-Commerce V2" required />
          <Select
            label="Phòng Ban Phụ Trách"
            placeholder="Chọn phòng ban"
            options={[
              { value: "tech", label: "Phòng Kỹ Thuật (Tech)" },
              { value: "product", label: "Phòng Sản Phẩm (Product)" },
              { value: "sales", label: "Phòng Kinh Doanh (Sales)" },
            ]}
          />
          <Textarea label="Mô Tả Dự Án" placeholder="Mục tiêu chính và phạm vi của dự án..." rows={2} />
        </div>
      </Modal>

      {/* SAMPLE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Xác Nhận Xóa Bản Ghi Này?"
        description="Hành động này sẽ xóa vĩnh viễn bản ghi khỏi cơ sở dữ liệu và không thể hoàn tác lại."
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy Bỏ"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* SAMPLE DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Chi Tiết Bản Ghi Hệ Thống"
        description="Mã định danh: #LOG-88392-VN"
        width="md"
        footer={
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2e3a47] text-xs font-semibold text-slate-800 dark:text-white transition-colors"
          >
            Đóng Bảng Trượt
          </button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-[#2e3a47] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng Thái:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Hoàn Tất
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Người Thực Hiện:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Admin Master</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thời Gian:</span>
              <span className="text-slate-800 dark:text-slate-200">10:45:12, 10/09/2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Địa chỉ IP:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">192.168.1.1</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Dữ Liệu Payload:</span>
            <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] overflow-x-auto font-mono">
              {JSON.stringify(
                {
                  event: "USER_ROLE_UPDATED",
                  target_user: "dev@tailadmin.dev",
                  new_role: "manager",
                  approved_by: "superadmin",
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { uomSchema, UomFormValues } from "@/app/(admin)/admin/catalogs/schemas";
import { createUomAction, updateUomAction } from "@/app/(admin)/admin/catalogs/actions";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/form/Button";
import { Edit2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { UnitOfMeasure } from "@/types/uom";

interface UomFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "view";
  uom: UnitOfMeasure | null;
  onClose: () => void;
  onModeChange?: (newMode: "create" | "edit" | "view") => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "Tất Cả (Dùng chung cho toàn xưởng)" },
  { value: "thep_hop", label: "Thép Hộp & Ống Tròn (Hòa Phát, mạ kẽm)" },
  { value: "ton_lop", label: "Tôn Lợp & Tôn Cuộn (Olympic, Hoa Sen, Đông Á)" },
  { value: "phu_kien", label: "Phụ Kiện Dập Xưởng (Máng, xối, nóc, sườn)" },
  { value: "vat_tu_khac", label: "Vật Tư & Kim Khí Khác (Keo, vít, que hàn, đinh)" },
];

const STATUS_OPTIONS = [
  { value: "true", label: "Đang Sử Dụng (Kích hoạt)" },
  { value: "false", label: "Tạm Ngưng (Ẩn khỏi dropdown)" },
];

export function UomFormModal({
  isOpen,
  mode,
  uom,
  onClose,
  onModeChange,
  onSuccess,
}: UomFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UomFormValues>({
    resolver: zodResolver(uomSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      category: "all",
      description: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (uom && (isEdit || isView)) {
        reset({
          code: uom.code,
          name: uom.name,
          symbol: uom.symbol || "",
          category: uom.category,
          description: uom.description || "",
          sortOrder: uom.sortOrder || 0,
          isActive: uom.isActive,
        });
      } else {
        reset({
          code: "",
          name: "",
          symbol: "",
          category: "all",
          description: "",
          sortOrder: 0,
          isActive: true,
        });
      }
    }
  }, [isOpen, uom, isEdit, isView, reset]);

  const onSubmit = (values: UomFormValues) => {
    startTransition(async () => {
      try {
        if (isEdit && uom) {
          const res = await updateUomAction(uom.id, values);
          if (!res.success) {
            toast.error(res.error || "Lỗi khi cập nhật đơn vị tính.");
            return;
          }
          toast.success(`Cập nhật đơn vị tính '${values.name}' thành công!`);
        } else {
          const res = await createUomAction(values);
          if (!res.success) {
            toast.error(res.error || "Lỗi khi tạo mới đơn vị tính.");
            return;
          }
          toast.success(`Tạo mới đơn vị tính '${values.name}' thành công!`);
        }
        onClose();
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
      }
    });
  };

  const getTitle = () => {
    if (isView) return `Chi Tiết Đơn Vị Tính: ${uom?.name || ""}`;
    if (isEdit) return `Chỉnh Sửa Đơn Vị Tính: ${uom?.name || ""}`;
    return "Thêm Mới Đơn Vị Tính Vào Catalog";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      description="Quản lý danh mục ĐVT chuẩn dùng chung cho Kho hàng TT88 và Bàn tính đơn cắt tôn"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {isView && onModeChange && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onModeChange("edit")}
                className="flex items-center gap-1.5 cursor-pointer text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="w-3.5 h-3.5" /> Chuyển sang chỉnh sửa
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
              {isView ? "Đóng" : "Hủy bỏ"}
            </Button>
            {!isView && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isPending}
                onClick={handleSubmit(onSubmit)}
                className="flex items-center gap-1.5 bg-[#3c50e0] hover:bg-[#3344bd] text-white font-bold cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEdit ? "Cập Nhật" : "Lưu Thông Tin"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Hệ lưới cân xứng 50% - 50% bắt buộc theo Rule 6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hàng 1: Mã ĐVT (50%) & Tên ĐVT (50%) */}
          <div>
            <Input
              label="Mã Đơn Vị Tính (Code)"
              placeholder="VD: CAY, MET, M2, KG"
              disabled={isView || isEdit} // Không sửa mã code khi edit để đảm bảo toàn vẹn
              error={errors.code?.message}
              required={!isView}
              className="font-mono font-bold uppercase"
              {...register("code")}
            />
            {isEdit && (
              <p className="text-[11px] text-slate-400 mt-1 italic">
                * Mã code cố định để bảo toàn liên kết với dữ liệu kế toán và đơn hàng cũ.
              </p>
            )}
          </div>

          <div>
            <Input
              label="Tên Đơn Vị Tính Hiển Thị"
              placeholder="VD: Cây, Mét, m², Kg, Cái..."
              disabled={isView}
              error={errors.name?.message}
              required={!isView}
              className="font-semibold"
              {...register("name")}
            />
          </div>

          {/* Hàng 2: Ký hiệu ngắn (50%) & Nhóm ngành hàng (50%) */}
          <div>
            <Input
              label="Ký Hiệu Viết Tắt (Symbol)"
              placeholder="VD: cây, m, m², kg, cái..."
              disabled={isView}
              error={errors.symbol?.message}
              {...register("symbol")}
            />
          </div>

          <div>
            <Select
              label="Nhóm Ngành Hàng Áp Dụng"
              disabled={isView}
              error={errors.category?.message}
              required={!isView}
              options={CATEGORY_OPTIONS}
              {...register("category")}
            />
          </div>

          {/* Hàng 3: Thứ tự hiển thị (50%) & Trạng thái hoạt động (50%) */}
          <div>
            <Input
              type="number"
              min="0"
              label="Thứ Tự Ưu Tiên (Sort Order)"
              placeholder="0, 1, 2, 3..."
              disabled={isView}
              error={errors.sortOrder?.message}
              {...register("sortOrder")}
            />
          </div>

          <div>
            <Select
              label="Trạng Thái Sử Dụng"
              disabled={isView}
              options={STATUS_OPTIONS}
              value={String(uom ? uom.isActive : true)}
              onChange={(e) => {
                reset((prev) => ({ ...prev, isActive: e.target.value === "true" }));
              }}
            />
          </div>

          {/* Hàng 4: Mô tả ứng dụng thực tế (Trải rộng 2 cột cân xứng) */}
          <div className="sm:col-span-2">
            <Input
              label="Mô Tả Ứng Dụng Thực Tế Tại Xưởng"
              placeholder="VD: Áp dụng cho thép hộp mạ kẽm, ống tròn Hòa Phát, nhôm cây định hình 6m..."
              disabled={isView}
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

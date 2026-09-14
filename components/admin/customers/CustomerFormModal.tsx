"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerSchema,
  CustomerFormValues,
} from "@/app/(admin)/admin/customers/schemas";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/app/(admin)/admin/customers/actions";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/form/Button";
import { Edit2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export interface CustomerData {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  total_debt?: number | null;
  created_at?: string;
}

interface CustomerFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "view";
  customer: CustomerData | null;
  onClose: () => void;
  onModeChange?: (newMode: "create" | "edit" | "view") => void;
  onSuccess?: (savedCustomer: CustomerData) => void;
}

export function CustomerFormModal({
  isOpen,
  mode,
  customer,
  onClose,
  onModeChange,
  onSuccess,
}: CustomerFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      note: "",
      totalDebt: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (customer && (isEdit || isView)) {
        reset({
          name: customer.name,
          phone: customer.phone || "",
          address: customer.address || "",
          note: customer.note || "",
          totalDebt: Number(customer.total_debt) || 0,
        });
      } else {
        reset({
          name: "",
          phone: "",
          address: "Nghĩa Dân, Kim Động, Hưng Yên",
          note: "Thợ cơ khí / chủ công trình",
          totalDebt: 0,
        });
      }
    }
  }, [isOpen, customer, isEdit, isView, reset]);

  const onSubmit = (values: CustomerFormValues) => {
    startTransition(async () => {
      try {
        if (isEdit && customer) {
          const res = await updateCustomerAction(customer.id, values);
          if (!res.success) {
            toast.error(res.error || "Lỗi cập nhật khách thầu.");
            return;
          }
          toast.success("Cập nhật thông tin khách thầu thành công!");
          if (res.data) {
            onSuccess?.(res.data as CustomerData);
          }
        } else {
          const res = await createCustomerAction(values);
          if (!res.success) {
            toast.error(res.error || "Lỗi tạo mới khách thầu.");
            return;
          }
          toast.success(`Đã thêm khách thầu "${values.name}" thành công!`);
          if (res.data) {
            onSuccess?.(res.data as CustomerData);
          }
        }
        onClose();
      } catch {
        toast.error("Có lỗi xảy ra khi lưu dữ liệu.");
      }
    });
  };

  const getTitle = () => {
    if (isView) return `Hồ Sơ Khách Thầu: ${customer?.name || ""}`;
    if (isEdit) return `Chỉnh Sửa Khách Thầu: ${customer?.name || ""}`;
    return "Thêm Mới Khách Thầu / Thợ Cơ Khí";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      description="Quản lý thông tin thợ cơ khí, địa chỉ công trình và theo dõi hạn mức công nợ"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {isView && onModeChange && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onModeChange("edit")}
                className="flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Chuyển sang chỉnh sửa
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {isView ? "Đóng" : "Hủy bỏ"}
            </Button>
            {!isView && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isPending}
                onClick={handleSubmit(onSubmit)}
                className="flex items-center gap-1.5"
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
        {/* Hệ lưới cân xứng 50% - 50% Rule 6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Họ Và Tên Khách Thầu"
              placeholder="VD: Anh Việt (Thợ mái)"
              disabled={isView}
              error={errors.name?.message}
              required={!isView}
              {...register("name")}
            />
          </div>
          <div>
            <Input
              label="Số Điện Thoại"
              placeholder="0988.xxx.xxx"
              disabled={isView}
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <div>
            <Input
              label="Địa Chỉ Công Trình / Xưởng"
              placeholder="VD: Xã Nghĩa Dân, Hưng Yên"
              disabled={isView}
              error={errors.address?.message}
              {...register("address")}
            />
          </div>
          <div>
            <Input
              type="number"
              step="1000"
              label="Công Nợ Hiện Tại (đ)"
              placeholder="0"
              disabled={isView}
              error={errors.totalDebt?.message}
              {...register("totalDebt")}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Ghi Chú Thêm"
              placeholder="Thường lấy tôn 1 lớp Olympic, vít 4..."
              disabled={isView}
              error={errors.note?.message}
              {...register("note")}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

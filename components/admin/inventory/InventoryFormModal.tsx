"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inventoryItemSchema,
  InventoryItemFormValues,
} from "@/app/(admin)/admin/inventory/schemas";
import {
  createInventoryItemAction,
  updateInventoryItemAction,
} from "@/app/(admin)/admin/inventory/actions";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/form/Button";
import { Edit2, Loader2, Save, Package } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES_CATALOG, UNITS_CATALOG } from "@/lib/catalogs";

export interface InventoryItemData {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: "thep_hop" | "ong_tron" | "nhom" | "ton_lop" | "phu_kien" | "vat_tu_khac";
  stock_qty: number;
  stock_value: number;
  unit_cost: number;
  selling_price: number;
  note?: string | null;
}

interface InventoryFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit" | "view";
  item: InventoryItemData | null;
  onClose: () => void;
  onModeChange?: (newMode: "create" | "edit" | "view") => void;
}

export function InventoryFormModal({
  isOpen,
  mode,
  item,
  onClose,
  onModeChange,
}: InventoryFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      unit: "CÂY",
      category: "thep_hop",
      stockQty: 0,
      unitCost: 0,
      sellingPrice: 0,
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (item && (isEdit || isView)) {
        reset({
          code: item.code,
          name: item.name,
          unit: item.unit,
          category: item.category,
          stockQty: Number(item.stock_qty) || 0,
          unitCost: Number(item.unit_cost) || 0,
          sellingPrice: Number(item.selling_price) || 0,
          note: item.note || "",
        });
      } else {
        reset({
          code: "",
          name: "",
          unit: "CÂY",
          category: "thep_hop",
          stockQty: 10,
          unitCost: 100000,
          sellingPrice: 120000,
          note: "",
        });
      }
    }
  }, [isOpen, item, isEdit, isView, reset]);

  const onSubmit = (values: InventoryItemFormValues) => {
    startTransition(async () => {
      try {
        if (isEdit && item) {
          const res = await updateInventoryItemAction(item.id, values);
          if (!res.success) {
            toast.error(res.error || "Lỗi cập nhật hàng hoá");
            return;
          }
          toast.success("Cập nhật thông tin hàng hoá thành công!");
        } else {
          const res = await createInventoryItemAction(values);
          if (!res.success) {
            toast.error(res.error || "Lỗi tạo mới hàng hoá");
            return;
          }
          toast.success(`Đã thêm mã hàng "${values.code}" thành công!`);
        }
        onClose();
      } catch {
        toast.error("Có lỗi xảy ra khi lưu dữ liệu.");
      }
    });
  };

  const getTitle = () => {
    if (isView) return `Chi Tiết Mặt Hàng: ${item?.code || ""}`;
    if (isEdit) return `Chỉnh Sửa Mặt Hàng: ${item?.code || ""}`;
    return "Thêm Mới Mặt Hàng Vào Kho";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      description="Quản lý thông tin quy cách, phân loại và đơn giá vốn bình quân theo TT88"
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
                {isEdit ? "Cập Nhật" : "Lưu Mặt Hàng"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Hệ lưới cân xứng 50% - 50% bắt buộc theo Rule 6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hàng 1 */}
          <div>
            <Input
              label="Mã Hàng Hoá"
              placeholder="VD: H204014, TON1LOP..."
              disabled={isView || isEdit}
              error={errors.code?.message}
              required={!isView}
              {...register("code")}
            />
          </div>
          <div>
            <Input
              label="Tên Quy Cách / Chủng Loại"
              placeholder="VD: 20X40x1,4, Tôn 1 Lớp..."
              disabled={isView}
              error={errors.name?.message}
              required={!isView}
              {...register("name")}
            />
          </div>

          {/* Hàng 2 */}
          <div>
            <Select
              label="Phân Loại Nhóm Hàng"
              disabled={isView}
              error={errors.category?.message}
              required={!isView}
              options={CATEGORIES_CATALOG.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              {...register("category")}
            />
          </div>
          <div>
            <Select
              label="Đơn Vị Tính (ĐVT)"
              disabled={isView}
              error={errors.unit?.message}
              required={!isView}
              options={UNITS_CATALOG}
              {...register("unit")}
            />
          </div>

          {/* Hàng 3 */}
          <div>
            <Input
              type="number"
              step="any"
              label="Số Lượng Tồn Kho"
              placeholder="0"
              disabled={isView}
              error={errors.stockQty?.message}
              required={!isView}
              {...register("stockQty")}
            />
          </div>
          <div>
            <Input
              type="number"
              step="100"
              label="Đơn Giá Vốn Bình Quân (đ)"
              placeholder="0"
              disabled={isView}
              error={errors.unitCost?.message}
              required={!isView}
              {...register("unitCost")}
            />
          </div>

          {/* Hàng 4 */}
          <div>
            <Input
              type="number"
              step="100"
              label="Đơn Giá Bán Dự Kiến (đ)"
              placeholder="0"
              disabled={isView}
              error={errors.sellingPrice?.message}
              required={!isView}
              {...register("sellingPrice")}
            />
          </div>
          <div>
            <Input
              label="Ghi Chú Vị Trí / Bãi Sắt"
              placeholder="Kệ số 3, dãy tôn Olympic..."
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

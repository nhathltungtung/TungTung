"use client";

import React, { useState, useTransition } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  stockInSchema,
  StockInFormValues,
} from "@/app/(admin)/admin/inventory/schemas";
import { createStockInAction } from "@/app/(admin)/admin/inventory/actions";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/form/Button";
import { Loader2, ArrowDownToLine, Calculator, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SUPPLIERS_CATALOG } from "@/lib/catalogs";
import { formatCurrency, formatNumber } from "@/lib/roofing-calc";
import { InventoryItemData } from "./InventoryFormModal";

interface StockInModalProps {
  isOpen: boolean;
  items: InventoryItemData[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function StockInModal({
  isOpen,
  items,
  onClose,
  onSuccess,
}: StockInModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<StockInFormValues>({
    resolver: zodResolver(stockInSchema) as unknown as Resolver<StockInFormValues>,
    defaultValues: {
      supplier: SUPPLIERS_CATALOG[0].name,
      productCode: items[0]?.code || "H204014",
      quantity: 10,
      unitPrice: 100000,
      note: "Nhập cuộn tôn / vật tư kim khí xưởng cán",
    },
  });

  const selectedCode = watch("productCode");
  const quantity = watch("quantity") || 0;
  const unitPrice = watch("unitPrice") || 0;

  const currentItem = items.find((i) => i.code === selectedCode);
  const currentQty = Number(currentItem?.stock_qty) || 0;
  const currentStockValue = Number(currentItem?.stock_value) || 0;

  const importTotal = Number(quantity) * Number(unitPrice);
  const newQty = currentQty + Number(quantity);
  const newStockValue = currentStockValue + importTotal;
  const newUnitCost = newQty > 0 ? Math.round(newStockValue / newQty) : unitPrice;

  const onSubmit = (values: StockInFormValues) => {
    startTransition(async () => {
      try {
        const res = await createStockInAction(values);
        if (!res.success) {
          toast.error(res.error || "Lỗi tạo phiếu nhập kho.");
          return;
        }
        toast.success(`Tạo Phiếu nhập kho (${res.voucherCode}) thành công!`);
        reset();
        onClose();
        onSuccess?.();
      } catch {
        toast.error("Có lỗi xảy ra khi nhập kho.");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lập Phiếu Nhập Kho (Mẫu Số 03-VT Chuẩn BTC)"
      description="Tự động cộng dồn tồn kho và tính lại đơn giá vốn bình quân gia quyền theo Thông tư 88"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy Bỏ
          </Button>
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
              <ArrowDownToLine className="w-4 h-4" />
            )}
            Xác Nhận Nhập Kho
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Nhà Cung Cấp / Nhà Máy"
              error={errors.supplier?.message}
              required
              options={SUPPLIERS_CATALOG.map((s) => ({
                value: s.name,
                label: s.name,
              }))}
              {...register("supplier")}
            />
          </div>
          <div>
            <Select
              label="Chọn Mặt Hàng Nhập Kho"
              error={errors.productCode?.message}
              required
              options={items.map((i) => ({
                value: i.code,
                label: `${i.code} - ${i.name} (Tồn: ${i.stock_qty} ${i.unit})`,
              }))}
              {...register("productCode")}
            />
          </div>

          <div>
            <Input
              type="number"
              step="any"
              label="Số Lượng Nhập"
              placeholder="10"
              error={errors.quantity?.message}
              required
              {...register("quantity")}
            />
          </div>
          <div>
            <Input
              type="number"
              step="100"
              label="Đơn Giá Nhập (đ)"
              placeholder="100000"
              error={errors.unitPrice?.message}
              required
              {...register("unitPrice")}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Diễn Giải / Ghi Chú Chứng Từ"
              placeholder="VD: Nhập cuộn tôn theo hoá đơn số 00218..."
              error={errors.note?.message}
              {...register("note")}
            />
          </div>
        </div>

        {/* Khối xem trước tính toán giá vốn TT88 */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 text-xs space-y-2">
          <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
            <Calculator className="w-4 h-4" /> Tự Động Tính Giá Vốn Bình Quân Gia Quyền (TT 88):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-slate-400 block">Thành tiền nhập:</span>
              <strong className="text-blue-600 dark:text-blue-400 text-sm">
                {formatCurrency(importTotal)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Tồn hiện tại:</span>
              <span>{formatNumber(currentQty)} {currentItem?.unit || "CÂY"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Tồn sau nhập:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatNumber(newQty)} {currentItem?.unit || "CÂY"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Giá vốn mới (TT88):</span>
              <strong className="text-amber-600 dark:text-amber-400 text-sm">
                {formatCurrency(newUnitCost)}
              </strong>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

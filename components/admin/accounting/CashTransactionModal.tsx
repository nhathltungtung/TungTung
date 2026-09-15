"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  cashTransactionSchema,
  CashTransactionFormValues,
} from "@/app/(admin)/admin/accounting/schemas";
import { createCashTransactionAction } from "@/app/(admin)/admin/accounting/actions";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/form/Button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  RECEIPT_REASONS_CATALOG,
  PAYMENT_REASONS_CATALOG,
} from "@/lib/catalogs";

export interface CashTransactionData {
  id: string;
  voucher_code: string;
  type: "receipt" | "payment";
  date: string;
  category: string;
  counterpart: string;
  amount: number;
  payment_method: "cash" | "bank_transfer";
  reference_id?: string | null;
  note?: string | null;
}

interface CashTransactionModalProps {
  isOpen: boolean;
  type: "receipt" | "payment";
  initialData?: CashTransactionData | null;
  isViewOnly?: boolean;
  onClose: () => void;
}

export function CashTransactionModal({
  isOpen,
  type,
  initialData,
  isViewOnly = false,
  onClose,
}: CashTransactionModalProps) {
  const [isPending, startTransition] = useTransition();
  const isReceipt = type === "receipt";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CashTransactionFormValues>({
    resolver: zodResolver(cashTransactionSchema) as any,
    defaultValues: {
      type,
      date: new Date().toISOString().split("T")[0],
      category: isReceipt
        ? RECEIPT_REASONS_CATALOG[0].label
        : PAYMENT_REASONS_CATALOG[0].label,
      counterpart: "",
      amount: 0,
      paymentMethod: "cash",
      referenceId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          type: initialData.type,
          date: initialData.date,
          category: initialData.category,
          counterpart: initialData.counterpart,
          amount: Number(initialData.amount) || 0,
          paymentMethod: initialData.payment_method,
          referenceId: initialData.reference_id || "",
          note: initialData.note || "",
        });
      } else {
        reset({
          type,
          date: new Date().toISOString().split("T")[0],
          category: isReceipt
            ? RECEIPT_REASONS_CATALOG[0].label
            : PAYMENT_REASONS_CATALOG[0].label,
          counterpart: "",
          amount: 0,
          paymentMethod: isReceipt ? "cash" : "bank_transfer",
          referenceId: "",
          note: "",
        });
      }
    }
  }, [isOpen, type, initialData, isReceipt, reset]);

  const onSubmit = (values: CashTransactionFormValues) => {
    startTransition(async () => {
      try {
        const res = await createCashTransactionAction(values);
        if (!res.success) {
          toast.error(res.error || "Lỗi khi lập phiếu giao dịch.");
          return;
        }
        toast.success(
          `Lập ${isReceipt ? "Phiếu Thu (01-TT)" : "Phiếu Chi (02-TT)"} thành công!`
        );
        onClose();
      } catch {
        toast.error("Có lỗi xảy ra khi lưu chứng từ.");
      }
    });
  };

  const title = isViewOnly
    ? `Chi Tiết Phiếu: ${initialData?.voucher_code || ""}`
    : isReceipt
    ? "Lập Phiếu Thu Tiền Mặt (Mẫu 01-TT Chuẩn BTC)"
    : "Lập Phiếu Chi Tiền Mặt (Mẫu 02-TT Chuẩn BTC)";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Chứng từ kế toán hộ kinh doanh Thông tư 88/2021/TT-BTC"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {isViewOnly ? "Đóng" : "Hủy Bỏ"}
          </Button>
          {!isViewOnly && (
            <Button
              type="button"
              variant={isReceipt ? "primary" : "outline"}
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
              {isReceipt ? "Lưu Phiếu Thu" : "Lưu Phiếu Chi"}
            </Button>
          )}
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Hệ lưới cân xứng 50% - 50% Rule 6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              type="date"
              label="Ngày Lập Chứng Từ"
              disabled={isViewOnly}
              error={errors.date?.message}
              required={!isViewOnly}
              {...register("date")}
            />
          </div>
          <div>
            <Select
              label="Hình Thức Thanh Toán"
              disabled={isViewOnly}
              error={errors.paymentMethod?.message}
              required={!isViewOnly}
              options={[
                { value: "cash", label: "Tiền mặt (Sổ quỹ tiền mặt)" },
                { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
              ]}
              {...register("paymentMethod")}
            />
          </div>

          <div>
            <Input
              label="Lý Do Thu / Chi"
              placeholder="VD: Thu tiền bán tôn, chi tiền điện xưởng..."
              disabled={isViewOnly}
              error={errors.category?.message}
              required={!isViewOnly}
              {...register("category")}
            />
          </div>
          <div>
            <Input
              label={isReceipt ? "Họ Tên Người Nộp Tiền" : "Họ Tên Người Nhận Tiền"}
              placeholder="VD: Anh Việt, Nhà máy Tôn Olympic..."
              disabled={isViewOnly}
              error={errors.counterpart?.message}
              required={!isViewOnly}
              {...register("counterpart")}
            />
          </div>

          <div>
            <Input
              type="number"
              step="1000"
              label="Số Tiền (đ)"
              placeholder="0"
              disabled={isViewOnly}
              error={errors.amount?.message}
              required={!isViewOnly}
              {...register("amount")}
            />
          </div>
          <div>
            <Input
              label="Số Chứng Từ Gốc / Mã Đơn Kèm Theo"
              placeholder="VD: HĐ-2026-001, PNK-002..."
              disabled={isViewOnly}
              error={errors.referenceId?.message}
              {...register("referenceId")}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Diễn Giải Chi Tiết / Địa Chỉ"
              placeholder="Nội dung giao dịch thực tế..."
              disabled={isViewOnly}
              error={errors.note?.message}
              {...register("note")}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

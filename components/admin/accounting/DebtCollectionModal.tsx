"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  debtCollectionSchema,
  DebtCollectionFormValues,
} from "@/app/(admin)/admin/accounting/schemas";
import { collectCustomerDebtAction } from "@/app/(admin)/admin/accounting/actions";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/form/Button";
import { Loader2, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/roofing-calc";

export interface CustomerDebtData {
  id: string;
  customer_name: string;
  phone?: string | null;
  address?: string | null;
  total_purchased: number;
  total_paid: number;
  remaining_debt: number;
  last_payment_date?: string | null;
}

interface DebtCollectionModalProps {
  isOpen: boolean;
  debt: CustomerDebtData | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DebtCollectionModal({
  isOpen,
  debt,
  onClose,
  onSuccess,
}: DebtCollectionModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DebtCollectionFormValues>({
    resolver: zodResolver(debtCollectionSchema) as any,
    values: {
      customerId: debt?.id || "",
      customerName: debt?.customer_name || "",
      amount: Number(debt?.remaining_debt) || 5000000,
      paymentMethod: "cash",
      note: `Thu tiền công nợ thợ thầu ${debt?.customer_name || ""}`,
    },
  });

  const onSubmit = (values: DebtCollectionFormValues) => {
    startTransition(async () => {
      try {
        const res = await collectCustomerDebtAction(values);
        if (!res.success) {
          toast.error(res.error || "Lỗi khi thu nợ.");
          return;
        }
        toast.success(
          `Đã thu nợ ${formatCurrency(values.amount)} và tự động tạo Phiếu Thu (${res.voucherCode}) vào Sổ Quỹ!`
        );
        reset();
        onClose();
        onSuccess?.();
      } catch {
        toast.error("Có lỗi xảy ra khi xử lý thu nợ.");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thu Nợ Khách Thầu: ${debt?.customer_name || ""}`}
      description="Tự động trừ công nợ thợ thầu và ghi nhận Phiếu Thu vào Sổ Quỹ Tiền Mặt"
      size="md"
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
              <CheckCircle2 className="w-4 h-4" />
            )}
            Xác Nhận Thu Nợ & Tạo Phiếu Thu
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Banner hiển thị số nợ hiện tại */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Số nợ hiện còn:</span>
            <strong className="text-base text-amber-600 dark:text-amber-400 font-bold">
              {formatCurrency(Number(debt?.remaining_debt) || 0)}
            </strong>
          </div>
          <div className="text-right text-slate-500">
            <span>SĐT: {debt?.phone || "Chưa có"}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Input
              type="number"
              step="1000"
              label="Số Tiền Khách Trả Đợt Này (đ)"
              placeholder="0"
              error={errors.amount?.message}
              required
              {...register("amount")}
            />
          </div>

          <div>
            <Select
              label="Hình Thức Thu Tiền"
              error={errors.paymentMethod?.message}
              required
              options={[
                { value: "cash", label: "Tiền mặt (Nhập vào Sổ quỹ tiền mặt)" },
                { value: "bank_transfer", label: "Chuyển khoản tài khoản ngân hàng" },
              ]}
              {...register("paymentMethod")}
            />
          </div>

          <div>
            <Input
              label="Ghi Chú Thu Nợ"
              placeholder="Trả nợ công trình Nghĩa Dân, đợt 2..."
              error={errors.note?.message}
              {...register("note")}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

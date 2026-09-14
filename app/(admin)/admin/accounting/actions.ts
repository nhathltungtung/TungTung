"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { cashTransactionSchema, debtCollectionSchema } from "./schemas";

export async function createCashTransactionAction(payload: unknown) {
  const parsed = cashTransactionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { type, date, category, counterpart, amount, paymentMethod, referenceId, note } =
    parsed.data;

  try {
    const supabase = await createClient();
    const prefix = type === "receipt" ? "PT" : "PC";
    const voucherCode = `${prefix}-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from("cash_transactions")
      .insert({
        voucher_code: voucherCode,
        type,
        date,
        category,
        counterpart,
        amount,
        payment_method: paymentMethod,
        reference_id: referenceId || null,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: type === "receipt" ? "CASH_RECEIPT_CREATED" : "CASH_PAYMENT_CREATED",
      level: "INFO",
      resource: `Phiếu ${voucherCode}`,
      metadata: { voucherCode, type, amount, counterpart, category },
    });

    revalidatePath("/admin/accounting");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi lập phiếu thu/chi.";
    return { success: false, error: message };
  }
}

export async function deleteCashTransactionAction(id: string, voucherCode: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("cash_transactions").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "CASH_TRANSACTION_DELETED",
      level: "WARNING",
      resource: `Phiếu ${voucherCode}`,
      metadata: { id, voucherCode },
    });

    revalidatePath("/admin/accounting");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi xoá phiếu giao dịch.";
    return { success: false, error: message };
  }
}

export async function collectCustomerDebtAction(payload: unknown) {
  const parsed = debtCollectionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { customerId, customerName, amount, paymentMethod, note } = parsed.data;

  try {
    const supabase = await createClient();

    // 1. Tự động sinh Phiếu Thu vào Sổ Quỹ (Mẫu 01-TT)
    const voucherCode = `PT-NO-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split("T")[0];

    const { error: txErr } = await supabase.from("cash_transactions").insert({
      voucher_code: voucherCode,
      type: "receipt",
      date: today,
      category: "Thu tiền công nợ khách thầu / thợ công trình",
      counterpart: customerName,
      amount,
      payment_method: paymentMethod,
      reference_id: customerId || null,
      note: note || `Thu nợ khách thầu ${customerName}`,
    });

    if (txErr) {
      return { success: false, error: txErr.message };
    }

    // 2. Cập nhật bảng công nợ customer_debts nếu có record
    if (customerId) {
      const { data: debtRecord } = await supabase
        .from("customer_debts")
        .select("*")
        .eq("id", customerId)
        .single();

      if (debtRecord) {
        const curPaid = Number(debtRecord.total_paid) || 0;
        const curRemain = Number(debtRecord.remaining_debt) || 0;

        await supabase
          .from("customer_debts")
          .update({
            total_paid: curPaid + amount,
            remaining_debt: Math.max(0, curRemain - amount),
            last_payment_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("id", customerId);
      }
    }

    await logActivity({
      action: "DEBT_COLLECTION_RECORDED",
      level: "INFO",
      resource: `Thu nợ: ${customerName}`,
      metadata: { customerName, amount, voucherCode, paymentMethod },
    });

    revalidatePath("/admin/accounting");
    revalidatePath("/admin/customers");
    revalidatePath("/admin");
    return { success: true, voucherCode };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi thực hiện thu nợ.";
    return { success: false, error: message };
  }
}

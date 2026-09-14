"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { customerSchema } from "./schemas";

export async function createCustomerAction(payload: unknown) {
  const parsed = customerSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, phone, address, note, totalDebt } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name,
        phone: phone || null,
        address: address || null,
        note: note || null,
        total_debt: totalDebt || 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "CUSTOMER_CREATED",
      level: "INFO",
      resource: `Khách thầu: ${name}`,
      metadata: { name, phone, address, totalDebt },
    });

    revalidatePath("/admin/customers");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi tạo mới khách thầu.";
    return { success: false, error: message };
  }
}

export async function updateCustomerAction(id: string, payload: unknown) {
  const parsed = customerSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, phone, address, note, totalDebt } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .update({
        name,
        phone: phone || null,
        address: address || null,
        note: note || null,
        total_debt: totalDebt || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "CUSTOMER_UPDATED",
      level: "INFO",
      resource: `Khách thầu: ${name}`,
      metadata: { id, name, phone, totalDebt },
    });

    revalidatePath("/admin/customers");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi cập nhật khách thầu.";
    return { success: false, error: message };
  }
}

export async function deleteCustomerAction(id: string, name: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "CUSTOMER_DELETED",
      level: "WARNING",
      resource: `Khách thầu: ${name}`,
      metadata: { id, name },
    });

    revalidatePath("/admin/customers");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi xoá khách thầu.";
    return { success: false, error: message };
  }
}

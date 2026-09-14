"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";

export async function updateRoofingOrderStatusAction(
  id: string,
  status: "pending" | "cutting" | "completed" | "cancelled",
  orderCode: string
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("roofing_orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "ROOFING_ORDER_STATUS_UPDATED",
      level: "INFO",
      resource: `Đơn hàng ${orderCode}`,
      metadata: { id, orderCode, status },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái đơn.";
    return { success: false, error: message };
  }
}

export async function deleteRoofingOrderAction(id: string, orderCode: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("roofing_orders")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "ROOFING_ORDER_DELETED",
      level: "WARNING",
      resource: `Đơn hàng ${orderCode}`,
      metadata: { id, orderCode },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi xoá đơn hàng.";
    return { success: false, error: message };
  }
}

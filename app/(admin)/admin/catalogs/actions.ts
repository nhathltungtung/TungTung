"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { uomSchema } from "./schemas";

export async function createUomAction(payload: unknown) {
  const parsed = uomSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { code, name, symbol, category, description, sortOrder, isActive } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("units_of_measure")
      .insert({
        code,
        name,
        symbol: symbol || null,
        category,
        description: description || null,
        sort_order: sortOrder,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: `Mã đơn vị '${code}' đã tồn tại trên hệ thống.` };
      }
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "UOM_CREATED",
      level: "INFO",
      resource: `Đơn vị tính: ${name} (${code})`,
      metadata: { code, name, category, sortOrder, isActive },
    });

    revalidatePath("/admin/catalogs");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/orders/create");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi tạo mới đơn vị tính.";
    return { success: false, error: message };
  }
}

export async function updateUomAction(id: string, payload: unknown) {
  const parsed = uomSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { code, name, symbol, category, description, sortOrder, isActive } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("units_of_measure")
      .update({
        code,
        name,
        symbol: symbol || null,
        category,
        description: description || null,
        sort_order: sortOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: `Mã đơn vị '${code}' đã được sử dụng bởi bản ghi khác.` };
      }
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "UOM_UPDATED",
      level: "INFO",
      resource: `Đơn vị tính: ${name} (${code})`,
      metadata: { id, code, name, category, sortOrder, isActive },
    });

    revalidatePath("/admin/catalogs");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/orders/create");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi cập nhật đơn vị tính.";
    return { success: false, error: message };
  }
}

export async function deleteUomAction(id: string) {
  try {
    const supabase = await createClient();

    // 1. Kiểm tra xem ĐVT có đang được sử dụng trong bảng inventory_items không
    const { data: uomRecord } = await supabase
      .from("units_of_measure")
      .select("code, name")
      .eq("id", id)
      .single();

    if (uomRecord) {
      const { count } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .or(`unit.eq.${uomRecord.code},unit.eq.${uomRecord.name}`);

      if (count && count > 0) {
        return {
          success: false,
          error: `Không thể xoá! Đang có ${count} mặt hàng trong kho sử dụng đơn vị '${uomRecord.name}'. Hãy chuyển trạng thái sang Tạm Dừng thay vì xoá.`,
        };
      }
    }

    const { error } = await supabase.from("units_of_measure").delete().eq("id", id);
    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "UOM_DELETED",
      level: "WARNING",
      resource: `Đơn vị tính ID: ${id}`,
      metadata: { id, uomRecord },
    });

    revalidatePath("/admin/catalogs");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/orders/create");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi xoá đơn vị tính.";
    return { success: false, error: message };
  }
}

export async function toggleUomActiveAction(id: string, isActive: boolean) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("units_of_measure")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/catalogs");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/orders/create");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi đổi trạng thái.";
    return { success: false, error: message };
  }
}

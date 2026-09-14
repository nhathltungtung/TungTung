"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { inventoryItemSchema, stockInSchema } from "./schemas";

export async function createInventoryItemAction(payload: unknown) {
  const parsed = inventoryItemSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { code, name, unit, category, stockQty, unitCost, sellingPrice, note } =
    parsed.data;

  try {
    const supabase = await createClient();
    const stockValue = stockQty * unitCost;

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        code,
        name,
        unit,
        category,
        stock_qty: stockQty,
        stock_value: stockValue,
        unit_cost: unitCost,
        selling_price: sellingPrice,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: `Mã hàng "${code}" đã tồn tại trên hệ thống.` };
      }
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "INVENTORY_ITEM_CREATED",
      level: "INFO",
      resource: `Mã hàng: ${code}`,
      metadata: { code, name, stockQty, unitCost },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi thêm mới hàng hoá.";
    return { success: false, error: message };
  }
}

export async function updateInventoryItemAction(id: string, payload: unknown) {
  const parsed = inventoryItemSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { code, name, unit, category, stockQty, unitCost, sellingPrice, note } =
    parsed.data;

  try {
    const supabase = await createClient();
    const stockValue = stockQty * unitCost;

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        code,
        name,
        unit,
        category,
        stock_qty: stockQty,
        stock_value: stockValue,
        unit_cost: unitCost,
        selling_price: sellingPrice,
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "INVENTORY_ITEM_UPDATED",
      level: "INFO",
      resource: `Mã hàng: ${code}`,
      metadata: { id, code, name, stockQty, unitCost },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi cập nhật hàng hoá.";
    return { success: false, error: message };
  }
}

export async function deleteInventoryItemAction(id: string, code: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "INVENTORY_ITEM_DELETED",
      level: "WARNING",
      resource: `Mã hàng: ${code}`,
      metadata: { id, code },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi xoá hàng hoá.";
    return { success: false, error: message };
  }
}

export async function createStockInAction(payload: unknown) {
  const parsed = stockInSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { supplier, productCode, quantity, unitPrice, note } = parsed.data;

  try {
    const supabase = await createClient();

    // 1. Tìm thông tin mặt hàng hiện tại
    const { data: item, error: fetchErr } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("code", productCode)
      .single();

    if (fetchErr || !item) {
      return { success: false, error: `Không tìm thấy mã hàng "${productCode}" trong kho.` };
    }

    // 2. Tính lại đơn giá vốn bình quân gia quyền theo chuẩn TT88
    const currentQty = Number(item.stock_qty) || 0;
    const currentStockValue = Number(item.stock_value) || 0;
    const importTotal = quantity * unitPrice;

    const newQty = currentQty + quantity;
    const newStockValue = currentStockValue + importTotal;
    const newUnitCost = newQty > 0 ? Math.round(newStockValue / newQty) : unitPrice;

    // 3. Cập nhật tồn kho & giá vốn
    const { error: updateErr } = await supabase
      .from("inventory_items")
      .update({
        stock_qty: newQty,
        stock_value: newStockValue,
        unit_cost: newUnitCost,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 4. Sinh mã phiếu nhập và lưu vào stock_transactions (Mẫu 03-VT)
    const voucherCode = `PNK-${Date.now().toString().slice(-6)}`;
    const { error: txErr } = await supabase.from("stock_transactions").insert({
      voucher_code: voucherCode,
      type: "import",
      date: new Date().toISOString().split("T")[0],
      product_id: item.id,
      product_code: item.code,
      product_name: item.name,
      unit: item.unit,
      quantity,
      unit_price: unitPrice,
      total_amount: importTotal,
      partner_name: supplier,
      note,
    });

    if (txErr) {
      console.error("Lỗi khi lưu lịch sử nhập kho:", txErr);
    }

    await logActivity({
      action: "STOCK_IN_CREATED",
      level: "INFO",
      resource: `Phiếu nhập ${voucherCode}`,
      metadata: {
        voucherCode,
        supplier,
        productCode,
        quantity,
        unitPrice,
        importTotal,
        newUnitCost,
      },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin");
    return { success: true, voucherCode };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi khi tạo phiếu nhập kho.";
    return { success: false, error: message };
  }
}

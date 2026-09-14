"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { RoofingOrder } from "@/types/roofing";
import { mapDbOrderToRoofingOrder } from "@/lib/roofing-order-mapper";

const ROOFING_ORDER_SELECT = `
  id,
  order_code,
  order_date,
  customer_name,
  customer_phone,
  customer_address,
  total_amount,
  discount,
  deposit,
  remaining_amount,
  status,
  note,
  roofing_order_groups (
    id,
    product_name,
    width,
    unit_price,
    total_pieces,
    total_meters,
    total_square_meters,
    subtotal,
    sort_order,
    roofing_order_cut_items (
      id,
      length,
      quantity,
      total_meters,
      sort_order
    )
  ),
  roofing_order_accessories (
    id,
    name,
    length,
    pieces,
    unit,
    quantity,
    unit_price,
    subtotal,
    sort_order
  )
`;

/**
 * Server Action: Lấy 1 đơn cắt tôn theo id (dùng cho trang sửa)
 */
export async function getRoofingOrderByIdAction(
  id: string
): Promise<RoofingOrder | null> {
  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const { data, error } = await supabase
      .from("roofing_orders")
      .select(ROOFING_ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapDbOrderToRoofingOrder(data);
  } catch (err) {
    console.error("Lỗi getRoofingOrderByIdAction:", err);
    return null;
  }
}

/**
 * Server Action: Lưu / Cập nhật Đơn Hàng Cắt Tôn vào Supabase
 * Tự động đồng bộ các bảng liên kết (Nhóm tôn, Kích thước cắt lẻ, Phụ kiện bán kèm),
 * ghi log hoạt động hệ thống và revalidate toàn bộ trang danh sách đơn hàng.
 */
export async function saveRoofingOrderAction(order: RoofingOrder): Promise<{
  success: boolean;
  orderId?: string;
  orderCode?: string;
  message?: string;
  error?: string;
}> {
  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    // 1. Chuẩn hóa dữ liệu đơn hàng chính
    const orderPayload = {
      order_code: order.orderCode,
      customer_name: order.customer.name?.trim() || "Khách lẻ",
      customer_phone: order.customer.phone?.trim() || null,
      customer_address: order.customer.address?.trim() || null,
      order_date: order.createdAt || new Date().toISOString().split("T")[0],
      total_amount: Number(order.totalAmount) || 0,
      discount: Number(order.discount) || 0,
      deposit: Number(order.deposit) || 0,
      remaining_amount: Number(order.remainingAmount) || 0,
      status: order.status || "pending",
      note: order.customer.note?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Kiểm tra xem đơn hàng đã tồn tại theo mã chưa
    const { data: existingOrder } = await supabase
      .from("roofing_orders")
      .select("id")
      .eq("order_code", order.orderCode)
      .maybeSingle();

    let orderId: string;
    if (existingOrder?.id) {
      orderId = existingOrder.id;
      const { error: updateErr } = await supabase
        .from("roofing_orders")
        .update(orderPayload)
        .eq("id", orderId);
      if (updateErr) throw updateErr;
    } else {
      const { data: newOrder, error: insertErr } = await supabase
        .from("roofing_orders")
        .insert(orderPayload)
        .select("id")
        .single();
      if (insertErr || !newOrder) throw insertErr || new Error("Không thể tạo đơn hàng mới");
      orderId = newOrder.id;
    }

    // 2. Xóa các nhóm tôn và phụ kiện cũ của đơn này để ghi đè dữ liệu mới nhất
    await supabase.from("roofing_order_groups").delete().eq("order_id", orderId);
    await supabase.from("roofing_order_accessories").delete().eq("order_id", orderId);

    // 3. Lưu từng nhóm tôn và các tấm cắt lẻ
    for (let gIdx = 0; gIdx < order.roofingGroups.length; gIdx++) {
      const grp = order.roofingGroups[gIdx];
      // Bỏ qua nếu nhóm hoàn toàn trắng không có tên và không có kích thước
      if (!grp.productName?.trim() && grp.items.every((it) => !it.length && !it.quantity)) {
        continue;
      }

      const { data: savedGroup, error: grpError } = await supabase
        .from("roofing_order_groups")
        .insert({
          order_id: orderId,
          product_name: grp.productName?.trim() || "Tôn Lợp",
          width: Number(grp.width) || 1.08,
          unit_price: Number(grp.unitPrice) || 0,
          total_pieces: Number(grp.totalPieces) || 0,
          total_meters: Number(grp.totalMeters) || 0,
          total_square_meters: Number(grp.totalSquareMeters) || 0,
          subtotal: Number(grp.subtotal) || 0,
          sort_order: gIdx,
        })
        .select("id")
        .single();

      if (grpError || !savedGroup) continue;

      const validCutItems = grp.items.filter(
        (it) => Number(it.length) > 0 || Number(it.quantity) > 0
      );

      if (validCutItems.length > 0) {
        const cutItemsPayload = validCutItems.map((item, iIdx) => ({
          group_id: savedGroup.id,
          length: Number(item.length) || 0,
          quantity: Number(item.quantity) || 0,
          total_meters: Number(item.totalMeters) || 0,
          sort_order: iIdx,
        }));
        await supabase.from("roofing_order_cut_items").insert(cutItemsPayload);
      }
    }

    // 4. Lưu các phụ kiện bán kèm (Lọc bỏ các dòng rỗng)
    const validAccessories = order.accessories.filter(
      (acc) => acc.name && acc.name.trim().length > 0
    );

    if (validAccessories.length > 0) {
      const accessoriesPayload = validAccessories.map((acc, aIdx) => ({
        order_id: orderId,
        name: acc.name.trim(),
        length: acc.length !== undefined && !isNaN(Number(acc.length)) ? Number(acc.length) : null,
        pieces: acc.pieces !== undefined && !isNaN(Number(acc.pieces)) ? Number(acc.pieces) : null,
        unit: acc.unit || "Cây",
        quantity: Number(acc.quantity) || 1,
        unit_price: Number(acc.unitPrice) || 0,
        subtotal: Number(acc.subtotal) || 0,
        sort_order: aIdx,
      }));
      await supabase.from("roofing_order_accessories").insert(accessoriesPayload);
    }

    // 5. Ghi log kiểm toán hoạt động
    await logActivity({
      action: "ROOFING_ORDER_SAVED",
      level: "INFO",
      resource: `Đơn hàng ${order.orderCode}`,
      metadata: {
        orderId,
        orderCode: order.orderCode,
        customerName: order.customer.name,
        totalAmount: order.totalAmount,
      },
    });

    // 6. Làm mới bộ nhớ cache của Next.js
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return {
      success: true,
      orderId,
      orderCode: order.orderCode,
      message: `Đã lưu đơn hàng ${order.orderCode} lên CSDL thành công!`,
    };
  } catch (err: unknown) {
    console.error("Lỗi saveRoofingOrderAction:", err);
    const message = err instanceof Error ? err.message : "Lỗi khi lưu đơn hàng vào CSDL.";
    return { success: false, error: message };
  }
}

export async function updateRoofingOrderStatusAction(
  id: string,
  status: "pending" | "cutting" | "completed" | "cancelled",
  orderCode: string
) {
  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

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
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

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

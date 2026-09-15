import { createClient } from "@/lib/supabase/server";
import { RoofingOrder } from "@/types/roofing";
import {
  DbOrderRow,
  mapDbOrderToRoofingOrder,
} from "@/lib/roofing-order-mapper";

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
 * Server-only: tải danh sách đơn cắt tôn từ Supabase
 */
export async function getRoofingOrdersServer(): Promise<RoofingOrder[]> {
  try {
    const supabase = await createClient();
    const { data: dbOrders, error } = await supabase
      .from("roofing_orders")
      .select(ROOFING_ORDER_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getRoofingOrdersServer:", error.message);
      return [];
    }

    return ((dbOrders || []) as unknown as DbOrderRow[]).map(mapDbOrderToRoofingOrder);
  } catch (err) {
    console.error("getRoofingOrdersServer:", err);
    return [];
  }
}

import React from "react";
import { getRoofingOrdersServer } from "@/lib/supabase/roofing-service.server";
import { OrderTableClient } from "@/components/admin/orders/OrderTableClient";
import type { RoofingOrder } from "@/types/roofing";

export const metadata = {
  title: "Danh Sách Đơn Cắt Tôn | Đại Lý Tôn Thép Tuấn Hương",
  description: "Quản lý đơn hàng cắt tôn lẻ, thông tin khách thầu và in phiếu xuất bán hàng",
};

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  let orders: RoofingOrder[] = [];

  try {
    orders = await getRoofingOrdersServer();
  } catch (err) {
    console.error("Lỗi khi tải đơn hàng:", err);
    orders = [];
  }

  return <OrderTableClient initialOrders={orders} />;
}

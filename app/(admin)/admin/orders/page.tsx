import React from "react";
import { getRoofingOrders } from "@/lib/supabase/roofing-service";
import { OrderTableClient } from "@/components/admin/orders/OrderTableClient";
import { SAMPLE_EXCEL_ORDER } from "@/lib/roofing-calc";

export const metadata = {
  title: "Danh Sách Đơn Cắt Tôn | Đại Lý Tôn Thép Tuấn Hương",
  description: "Quản lý đơn hàng cắt tôn lẻ, thông tin khách thầu và in phiếu xuất bán hàng",
};

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  let orders = [];

  try {
    orders = await getRoofingOrders();
    if (!orders || orders.length === 0) {
      orders = [SAMPLE_EXCEL_ORDER];
    }
  } catch (err) {
    console.error("Lỗi khi tải đơn hàng:", err);
    orders = [SAMPLE_EXCEL_ORDER];
  }

  return <OrderTableClient initialOrders={orders} />;
}

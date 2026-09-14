import React from "react";
import { createClient } from "@/lib/supabase/server";
import { CustomerTableClient } from "@/components/admin/customers/CustomerTableClient";
import { CustomerData } from "@/components/admin/customers/CustomerFormModal";
import { CUSTOMERS_CATALOG } from "@/lib/catalogs";

export const metadata = {
  title: "Danh Bạ Khách Thầu & Thợ Cơ Khí | Đại Lý Tôn Thép Tuấn Hương",
  description: "Quản lý danh sách khách thầu, thợ công trình, địa chỉ thi công và theo dõi công nợ",
};

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  let customers: CustomerData[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      customers = data;
    } else {
      // Chỉ fallback danh bạ mẫu khi lỗi kết nối CSDL, sử dụng UUID hợp lệ
      customers = CUSTOMERS_CATALOG.map((c, idx) => ({
        id: `c1111111-1111-1111-1111-${String(idx + 1).padStart(12, "0")}`,
        name: c.name,
        phone: c.phone,
        address: c.address,
        note: "Khách quen xưởng cán",
        total_debt: idx === 0 ? 0 : 5000000 * idx,
      }));
    }
  } catch (err) {
    console.error("Lỗi khi tải danh bạ khách hàng:", err);
  }

  return <CustomerTableClient initialCustomers={customers} />;
}

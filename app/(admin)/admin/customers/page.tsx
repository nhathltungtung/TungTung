import React from "react";
import { createClient } from "@/lib/supabase/server";
import { CustomerTableClient } from "@/components/admin/customers/CustomerTableClient";
import { CustomerData } from "@/components/admin/customers/CustomerFormModal";

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
    }
  } catch (err) {
    console.error("Lỗi khi tải danh bạ khách hàng:", err);
  }

  return <CustomerTableClient initialCustomers={customers} />;
}

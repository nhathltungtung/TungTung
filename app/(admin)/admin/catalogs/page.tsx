import React from "react";
import { getUnitsOfMeasure } from "@/lib/supabase/uom-service";
import { UomTableClient } from "@/components/admin/catalogs/UomTableClient";
import { UnitOfMeasure } from "@/types/uom";

export const metadata = {
  title: "Danh Mục Đơn Vị Tính (UOM Catalog) | Đại Lý Tôn Thép Tuấn Hương",
  description: "Quản lý danh mục đơn vị tính chuẩn hoá dùng chung cho Kho Hàng TT88 và Bàn Tính Cắt Tôn",
};

export const dynamic = "force-dynamic";

export default async function CatalogsPage() {
  let uoms: UnitOfMeasure[] = [];

  try {
    uoms = await getUnitsOfMeasure(true);
  } catch (err) {
    console.error("Lỗi khi tải danh mục đơn vị tính:", err);
  }

  return <UomTableClient initialUoms={uoms} />;
}

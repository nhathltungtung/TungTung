import { Metadata } from "next";
import { RoofingOrderForm } from "@/components/roofing/RoofingOrderForm";

export const metadata: Metadata = {
  title: "Tạo Đơn Hàng & Cắt Tôn | Đại Lý Tôn Thép Tuấn Hương",
  description: "Bàn tính quy cách cắt tôn, nhập liệu phím nhanh, tự động tính m² và in hoá đơn",
};

export default function CreateRoofingOrderPage() {
  return (
    <div className="mx-auto max-w-7xl print:m-0 print:p-0 print:max-w-none print:w-full">
      <RoofingOrderForm />
    </div>
  );
}

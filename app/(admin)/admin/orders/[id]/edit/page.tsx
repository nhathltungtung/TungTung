import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RoofingOrderForm } from "@/components/roofing/RoofingOrderForm";
import { getRoofingOrderByIdAction } from "@/app/(admin)/admin/orders/actions";

export const metadata: Metadata = {
  title: "Sửa Đơn Hàng Cắt Tôn | Đại Lý Tôn Thép Tuấn Hương",
  description: "Chỉnh sửa quy cách cắt tôn, phụ kiện và thông tin khách thầu",
};

export const dynamic = "force-dynamic";

interface EditRoofingOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRoofingOrderPage({
  params,
}: EditRoofingOrderPageProps) {
  const { id } = await params;
  const order = await getRoofingOrderByIdAction(id);

  if (!order) {
    notFound();
  }

  if (order.status === "cancelled") {
    redirect("/admin/orders");
  }

  return (
    <div className="mx-auto max-w-7xl print:m-0 print:p-0 print:max-w-none print:w-full">
      <RoofingOrderForm mode="edit" initialOrder={order} />
    </div>
  );
}

"use client";

import React from "react";
import { RoofingOrder } from "@/types/roofing";
import { formatCurrency } from "@/lib/roofing-calc";

interface OrderListPrintProps {
  orders: RoofingOrder[];
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
}

function formatDate(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const day = Number.isNaN(d.getTime()) ? new Date().getDate() : d.getDate();
  const month = Number.isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(day)}/${pad(month)}/${year}`;
}

export function OrderListPrint({
  orders,
  shopName = "ĐẠI LÝ TUẤN HƯƠNG",
  shopAddress = "Mặt Đường Quốc Lộ 39A, cách cây xăng Trương Xá 200m, Trương Xá – Toàn Thắng, Kim Động – Hưng Yên",
  shopPhone = "0373208038 – 0989734768",
}: OrderListPrintProps) {
  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalDeposit = orders.reduce((sum, o) => sum + (Number(o.deposit) || 0), 0);
  const totalRemaining = orders.reduce((sum, o) => sum + (Number(o.remainingAmount) || 0), 0);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Đã hoàn thành";
      case "cutting":
        return "Đang cán tôn";
      case "cancelled":
        return "Đã huỷ";
      default:
        return "Chờ xử lý";
    }
  };

  return (
    <div
      id="order-list-print-area"
      className="bg-white text-black p-4 sm:p-6 md:p-8 max-w-[950px] mx-auto text-xs sm:text-sm print:p-0 print:m-0 print:max-w-none print:w-full print:text-[10pt] print:leading-tight print:bg-white print:text-black print:[print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* Header đại lý */}
      <div className="border-b border-black pb-2 mb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-bold uppercase text-black">
              {shopName}
            </h1>
            <p className="font-bold text-xs md:text-sm text-black">
              Chuyên: Sắt, Tôn lợp, Inox, Nhôm thanh định hình, Tấm trần nội thất,
            </p>
            <p className="text-xs md:text-sm text-black">
              Địa chỉ: {shopAddress}
            </p>
            <p className="text-xs md:text-sm text-black">
              Hotline/Zalo: <span className="font-bold">{shopPhone}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs md:text-sm text-black font-semibold">
              Ngày in: {formatDate()}
            </p>
            <p className="text-xs text-slate-500 italic mt-0.5">
              Hệ thống kế toán & quản lý TungTung ERP
            </p>
          </div>
        </div>
      </div>

      {/* Tiêu đề báo cáo */}
      <div className="text-center my-3">
        <h2 className="text-lg md:text-xl font-bold uppercase text-black tracking-wide">
          BÁO CÁO DANH SÁCH ĐƠN HÀNG CẮT TÔN
        </h2>
        <p className="text-xs text-slate-600 italic mt-0.5">
          (Bảng kê tổng hợp các đơn đặt hàng cắt tôn, phụ kiện và tình hình thanh toán)
        </p>
      </div>

      {/* Khối thống kê tóm tắt */}
      <div className="grid grid-cols-4 gap-2 mb-3 border border-black p-2 text-xs print:p-1.5 print:text-[9.5pt]">
        <div>
          <span className="font-semibold text-slate-700">Tổng số đơn:</span>{" "}
          <strong className="text-black font-bold">{orders.length} đơn</strong>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Tổng doanh thu:</span>{" "}
          <strong className="text-black font-bold">{formatCurrency(totalAmount)}</strong>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Đã thu / Đặt cọc:</span>{" "}
          <strong className="text-emerald-700 font-bold">{formatCurrency(totalDeposit)}</strong>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Công nợ còn lại:</span>{" "}
          <strong className="text-rose-700 font-bold">{formatCurrency(totalRemaining)}</strong>
        </div>
      </div>

      {/* Bảng chi tiết danh sách đơn hàng */}
      <table className="w-full border-collapse border border-black text-left table-fixed mb-4 text-xs md:text-sm print:text-[9pt]">
        <thead>
          <tr className="bg-[#D9D9D9] text-black font-bold uppercase text-center print:text-[8.5pt]">
            <th className="border border-black px-1 py-1.5 w-[5%]">STT</th>
            <th className="border border-black px-1.5 py-1.5 w-[14%]">Mã Đơn</th>
            <th className="border border-black px-1.5 py-1.5 w-[21%]">Khách Hàng</th>
            <th className="border border-black px-1 py-1.5 w-[11%]">Điện Thoại</th>
            <th className="border border-black px-1 py-1.5 w-[10%]">Ngày Đơn</th>
            <th className="border border-black px-1.5 py-1.5 w-[14%] text-right">Tổng Tiền</th>
            <th className="border border-black px-1.5 py-1.5 w-[12%] text-right">Đặt Cọc</th>
            <th className="border border-black px-1.5 py-1.5 w-[13%] text-right">Còn Nợ</th>
            <th className="border border-black px-1 py-1.5 w-[12%] text-center">Trạng Thái</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, idx) => (
            <tr key={order.id || idx} className="hover:bg-slate-50 print:hover:bg-transparent">
              <td className="border border-black px-1 py-1 text-center font-normal">
                {idx + 1}
              </td>
              <td className="border border-black px-1.5 py-1 font-bold text-black">
                {order.orderCode}
              </td>
              <td className="border border-black px-1.5 py-1 font-semibold text-black truncate">
                {order.customer?.name || "Khách lẻ"}
              </td>
              <td className="border border-black px-1 py-1 text-center font-mono">
                {order.customer?.phone || "---"}
              </td>
              <td className="border border-black px-1 py-1 text-center">
                {formatDate(order.createdAt)}
              </td>
              <td className="border border-black px-1.5 py-1 text-right font-bold">
                {formatCurrency(order.totalAmount)}
              </td>
              <td className="border border-black px-1.5 py-1 text-right font-medium text-emerald-800">
                {order.deposit ? formatCurrency(order.deposit) : "0 đ"}
              </td>
              <td className="border border-black px-1.5 py-1 text-right font-bold text-rose-800">
                {order.remainingAmount ? formatCurrency(order.remainingAmount) : "0 đ"}
              </td>
              <td className="border border-black px-1 py-1 text-center text-[10px]">
                {getStatusLabel(order.status)}
              </td>
            </tr>
          ))}

          {/* Dòng tổng kết cuối bảng */}
          <tr className="font-bold bg-slate-100 text-black print:bg-slate-100/50">
            <td colSpan={5} className="border border-black px-2 py-1.5 text-right font-bold uppercase">
              TỔNG CỘNG TOÀN BỘ ({orders.length} ĐƠN)
            </td>
            <td className="border border-black px-1.5 py-1.5 text-right font-bold text-black">
              {formatCurrency(totalAmount)}
            </td>
            <td className="border border-black px-1.5 py-1.5 text-right font-bold text-emerald-800">
              {formatCurrency(totalDeposit)}
            </td>
            <td className="border border-black px-1.5 py-1.5 text-right font-bold text-rose-800">
              {formatCurrency(totalRemaining)}
            </td>
            <td className="border border-black px-1 py-1.5 text-center">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      {/* Khối chữ ký */}
      <div className="grid grid-cols-2 text-center text-xs md:text-sm mt-4 pt-2 print:break-inside-avoid">
        <div>
          <p className="font-bold uppercase text-black">Người Lập Báo Cáo</p>
          <p className="text-[10px] md:text-xs text-slate-600 italic">(Ký, ghi rõ họ tên)</p>
          <div className="h-16 print:h-14"></div>
        </div>
        <div>
          <p className="font-bold uppercase text-black">Chủ Cơ Sở / Đại Lý</p>
          <p className="text-[10px] md:text-xs text-slate-600 italic">(Ký, đóng dấu)</p>
          <div className="h-16 print:h-14 flex items-end justify-center">
            <p className="font-semibold text-black">{shopName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

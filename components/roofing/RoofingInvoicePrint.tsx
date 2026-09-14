"use client";

import React from "react";
import { RoofingOrder } from "@/types/roofing";
import { formatCurrency, formatNumber, numberToVietnameseWords } from "@/lib/roofing-calc";

interface RoofingInvoicePrintProps {
  order: RoofingOrder;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
}

export function RoofingInvoicePrint({
  order,
  shopName = "ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG",
  shopAddress = "Trương Xá, Nghĩa Dân, Hưng Yên",
  shopPhone = "0331 810 0459",
}: RoofingInvoicePrintProps) {
  let sttCounter = 1;

  return (
    <div
      id="invoice-print-area"
      className="bg-white text-black p-4 sm:p-6 md:p-8 max-w-[820px] mx-auto text-xs sm:text-sm print:p-0 print:m-0 print:max-w-none print:w-full print:text-[11px] print:leading-tight print:bg-white print:text-black print:[print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
    >
      {/* Header đại lý */}
      <div className="border-b-2 border-slate-900 pb-2.5 mb-3 print:pb-1.5 print:mb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <h1 className="text-lg md:text-xl font-black uppercase tracking-wide text-slate-900 print:text-base">
              {shopName}
            </h1>
            <p className="text-slate-700 font-semibold text-xs print:text-[10px]">
              Chuyên: Tôn Lợp Olympic, Hoa Sen, Đông Á, Xà Gồ, Thép Hộp, Phụ Kiện Tôn Xốp
            </p>
            <p className="text-slate-600 text-xs print:text-[10px]">Địa chỉ: {shopAddress}</p>
            <p className="text-slate-600 text-xs print:text-[10px]">
              Hotline / Zalo: <span className="font-bold text-slate-900">{shopPhone}</span>
            </p>
          </div>
          <div className="text-right">
            <div
              suppressHydrationWarning
              className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-400 rounded font-mono text-xs font-bold text-slate-900 print:text-[11px]"
            >
              {order.orderCode}
            </div>
            <p suppressHydrationWarning className="text-xs text-slate-500 mt-1 print:text-[10px]">
              Ngày: {order.createdAt}
            </p>
          </div>
        </div>
      </div>

      {/* Tiêu đề hoá đơn */}
      <div className="text-center my-2.5 print:my-1.5">
        <h2 className="text-base md:text-lg font-black uppercase text-slate-900 tracking-wider print:text-sm">
          HOÁ ĐƠN BÁN HÀNG & QUY CÁCH CẮT TÔN
        </h2>
      </div>

      {/* Thông tin khách hàng */}
      <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2.5 rounded border border-slate-300 text-xs print:p-2 print:mb-2 print:text-[10.5px]">
        <div>
          <p>
            <span className="text-slate-500 font-medium">Khách hàng:</span>{" "}
            <strong className="text-slate-900 text-sm print:text-xs">{order.customer.name || "Khách lẻ"}</strong>
          </p>
          <p>
            <span className="text-slate-500 font-medium">Điện thoại:</span>{" "}
            <span className="font-mono font-semibold">{order.customer.phone || "---"}</span>
          </p>
        </div>
        <div>
          <p>
            <span className="text-slate-500 font-medium">Địa chỉ giao:</span>{" "}
            <span>{order.customer.address || "Nhận tại xưởng"}</span>
          </p>
          <p>
            <span className="text-slate-500 font-medium">Ghi chú:</span>{" "}
            <span className="italic">{order.customer.note || "---"}</span>
          </p>
        </div>
      </div>

      {/* Bảng chi tiết quy cách cắt tôn & phụ kiện chuẩn khổ A4 (table-fixed 100%) */}
      <div className="overflow-x-auto mb-3 print:overflow-visible print:mb-2">
        <table className="w-full border-collapse border border-slate-400 text-left table-fixed">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-bold text-xs uppercase print:text-[10px]">
              <th className="border border-slate-400 px-1 py-1.5 text-center w-[5%]">STT</th>
              <th className="border border-slate-400 px-1.5 py-1.5 w-[27%]">Tên Hàng / Quy Cách</th>
              <th className="border border-slate-400 px-1 py-1.5 text-right w-[10%]">Chiều Dài (m)</th>
              <th className="border border-slate-400 px-1 py-1.5 text-right w-[8%]">Số Tấm</th>
              <th className="border border-slate-400 px-1 py-1.5 text-right w-[10%]">Mét Dài</th>
              <th className="border border-slate-400 px-1 py-1.5 text-center w-[8%]">Khổ / ĐVT</th>
              <th className="border border-slate-400 px-1 py-1.5 text-right w-[10%]">Tổng m²</th>
              <th className="border border-slate-400 px-1 py-1.5 text-right w-[10%]">Đơn Giá</th>
              <th className="border border-slate-400 px-1 py-1.5 text-right w-[12%]">Thành Tiền</th>
            </tr>
          </thead>
          <tbody className="text-xs print:text-[10px]">
            {order.roofingGroups.map((group) => (
              <React.Fragment key={group.id}>
                {group.items.map((item, idx) => {
                  const currentStt = sttCounter++;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                      <td className="border border-slate-300 px-1 py-1 text-center text-slate-600 font-mono print:py-0.5">
                        {currentStt}
                      </td>
                      {idx === 0 ? (
                        <td
                          rowSpan={group.items.length}
                          className="border border-slate-300 px-1.5 py-1 font-bold text-slate-900 bg-white align-top print:py-0.5"
                        >
                          {group.productName || "Tôn Lợp"}
                        </td>
                      ) : null}
                      <td className="border border-slate-300 px-1 py-1 text-right font-mono print:py-0.5">
                        {item.length ? formatNumber(item.length, 2) : "---"}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-right font-mono font-medium print:py-0.5">
                        {item.quantity || "---"}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-right font-mono print:py-0.5">
                        {item.totalMeters ? formatNumber(item.totalMeters, 2) : "---"}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-center text-slate-500 font-mono print:py-0.5">
                        {idx === 0 ? formatNumber(group.width, 2) : ""}
                      </td>
                      <td className="border border-slate-300 px-1 py-1 text-right text-slate-400 print:py-0.5"></td>
                      <td className="border border-slate-300 px-1 py-1 text-right text-slate-400 print:py-0.5"></td>
                      <td className="border border-slate-300 px-1 py-1 text-right text-slate-400 print:py-0.5"></td>
                    </tr>
                  );
                })}

                {/* Dòng tổng hợp nhóm tôn */}
                <tr className="bg-slate-100 font-bold text-slate-900 print:bg-slate-100/70">
                  <td className="border border-slate-400 px-1 py-1 text-center font-mono print:py-0.5">
                    {sttCounter++}
                  </td>
                  <td className="border border-slate-400 px-1.5 py-1 italic font-bold print:py-0.5">
                    Tổng loại: {group.productName || "Tôn"}
                  </td>
                  <td className="border border-slate-400 px-1 py-1 text-right text-slate-400 print:py-0.5">---</td>
                  <td className="border border-slate-400 px-1 py-1 text-right font-mono text-blue-900 print:py-0.5">
                    {group.totalPieces}
                  </td>
                  <td className="border border-slate-400 px-1 py-1 text-right font-mono text-blue-900 print:py-0.5">
                    {formatNumber(group.totalMeters, 2)}
                  </td>
                  <td className="border border-slate-400 px-1 py-1 text-center font-mono print:py-0.5">
                    {formatNumber(group.width, 2)}
                  </td>
                  <td className="border border-slate-400 px-1 py-1 text-right font-mono font-bold text-emerald-800 print:py-0.5">
                    {formatNumber(group.totalSquareMeters, 4)}
                  </td>
                  <td className="border border-slate-400 px-1 py-1 text-right font-mono print:py-0.5">
                    {formatCurrency(group.unitPrice)}
                  </td>
                  <td className="border border-slate-400 px-1 py-1 text-right font-mono font-bold text-slate-900 print:py-0.5">
                    {formatCurrency(group.subtotal)}
                  </td>
                </tr>
              </React.Fragment>
            ))}

            {/* Phụ kiện bán kèm */}
            {order.accessories.map((acc) => (
              <tr key={acc.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                <td className="border border-slate-300 px-1 py-1 text-center text-slate-600 font-mono print:py-0.5">
                  {sttCounter++}
                </td>
                <td className="border border-slate-300 px-1.5 py-1 font-semibold text-slate-800 print:py-0.5">
                  {acc.name}
                </td>
                <td className="border border-slate-300 px-1 py-1 text-right font-mono print:py-0.5">
                  {acc.length ? formatNumber(acc.length, 2) : "---"}
                </td>
                <td className="border border-slate-300 px-1 py-1 text-right font-mono print:py-0.5">
                  {acc.pieces || "---"}
                </td>
                <td className="border border-slate-300 px-1 py-1 text-right font-mono font-semibold print:py-0.5">
                  {formatNumber(acc.quantity, 2)}
                </td>
                <td className="border border-slate-300 px-1 py-1 text-center font-bold text-slate-700 print:py-0.5">
                  {acc.unit}
                </td>
                <td className="border border-slate-300 px-1 py-1 text-right text-slate-400 print:py-0.5">---</td>
                <td className="border border-slate-300 px-1 py-1 text-right font-mono print:py-0.5">
                  {formatCurrency(acc.unitPrice)}
                </td>
                <td className="border border-slate-300 px-1 py-1 text-right font-mono font-bold text-slate-900 print:py-0.5">
                  {formatCurrency(acc.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Khối thanh toán tổng hợp */}
      <div className="flex justify-end mb-3 print:break-inside-avoid print:mb-2">
        <div className="w-72 md:w-80 space-y-1 text-xs md:text-sm border border-slate-300 rounded p-2.5 bg-slate-50 print:p-2 print:text-[11px]">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-600 font-medium">Tổng tiền hàng:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between py-0.5 text-rose-600">
              <span>Chiết khấu / Giảm giá:</span>
              <span className="font-mono font-bold">-{formatCurrency(order.discount)}</span>
            </div>
          )}

          {order.deposit > 0 && (
            <div className="flex justify-between py-0.5 text-emerald-700">
              <span>Khách đã đặt cọc:</span>
              <span className="font-mono font-bold">-{formatCurrency(order.deposit)}</span>
            </div>
          )}

          <div className="border-t-2 border-slate-400 pt-1 flex justify-between text-xs md:text-sm font-bold">
            <span className="text-slate-900">Còn lại thanh toán:</span>
            <span className="font-mono text-rose-700 font-extrabold">{formatCurrency(order.remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Số tiền bằng chữ */}
      <div className="p-2 mb-4 bg-slate-100 rounded text-xs italic text-slate-800 border border-slate-200 print:p-1.5 print:mb-3 print:text-[10px] print:break-inside-avoid">
        <strong>Số tiền bằng chữ: </strong> {numberToVietnameseWords(order.remainingAmount || order.totalAmount)}
      </div>

      {/* Khối Ký nhận */}
      <div className="grid grid-cols-3 text-center text-xs mt-4 pt-3 border-t border-slate-300 print:break-inside-avoid print:mt-3 print:pt-2 print:text-[10.5px]">
        <div>
          <p className="font-bold uppercase text-slate-800">Khách Hàng</p>
          <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
          <div className="h-14 print:h-12"></div>
          <p className="font-semibold text-slate-900">{order.customer.name || ""}</p>
        </div>
        <div>
          <p className="font-bold uppercase text-slate-800">Thợ Cán Tôn</p>
          <p className="text-[10px] text-slate-500 italic">(Xác nhận quy cách cắt)</p>
          <div className="h-14 print:h-12"></div>
        </div>
        <div>
          <p className="font-bold uppercase text-slate-800">Người Lập Phiếu</p>
          <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
          <div className="h-14 print:h-12"></div>
          <p className="font-semibold text-slate-900">Đại lý Tuấn Hương</p>
        </div>
      </div>

      <div className="mt-4 text-center text-[10px] text-slate-400 italic print:mt-3 print:break-inside-avoid">
        Cảm ơn Quý khách đã tin tưởng và ủng hộ! Xin vui lòng kiểm tra kỹ số lượng & quy cách trước khi rời xưởng.
      </div>
    </div>
  );
}

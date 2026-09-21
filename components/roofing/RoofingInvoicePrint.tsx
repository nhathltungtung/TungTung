"use client";

import React from "react";
import { RoofingOrder } from "@/types/roofing";
import { formatCurrency, formatNumber, numberToVietnameseWords, cleanProductName } from "@/lib/roofing-calc";

interface RoofingInvoicePrintProps {
  order: RoofingOrder;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
}

function formatInvoiceDate(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const day = Number.isNaN(d.getTime()) ? new Date().getDate() : d.getDate();
  const month = Number.isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(day)}/${pad(month)}/${year}`;
}

export function RoofingInvoicePrint({
  order,
  shopName = "ĐẠI LÝ TUẤN HƯƠNG",
  shopAddress = "Mặt Đường Quốc Lộ 39A, cách cây xăng Trương Xá 200m, Trương Xá – Toàn Thắng, Kim Động – Hưng Yên",
  shopPhone = "0373208038 – 0989734768",
}: RoofingInvoicePrintProps) {
  let sttCounter = 1;

  // Tính tổng số dòng dữ liệu thực tế để bổ sung dòng trống kẻ viền chuẩn khổ giấy
  let totalDataLines = 0;
  for (const group of order.roofingGroups) {
    const cutItems = group.items.filter((it) => Number(it.length) > 0 || Number(it.quantity) > 0);
    totalDataLines += Math.max(1, cutItems.length) + 1; // cut items + 1 group total
  }
  totalDataLines += order.accessories.filter((a) => a.name?.trim()).length;

  // Số dòng trống bổ sung để bảng đạt tối thiểu 10 dòng gọn gàng, tiết kiệm giấy
  const MIN_TABLE_ROWS = 10;
  const emptyRowsCount = Math.max(0, MIN_TABLE_ROWS - totalDataLines);

  return (
    <div
      id="invoice-print-area"
      className="bg-white text-black p-4 sm:p-6 md:p-8 max-w-[850px] mx-auto text-xs sm:text-sm print:p-0 print:m-0 print:max-w-none print:w-full print:text-[11pt] print:leading-tight print:bg-white print:text-black print:[print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* 1. Header Đại Lý theo mẫu HoaDonBanHang_DaiLyTuanHuong (1).xlsx */}
      <div className="border-b border-black pb-2 mb-2 print:pb-1.5 print:mb-1.5">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-0.5 flex-1">
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-black print:text-xl">
              {shopName}
            </h1>
            <p className="text-black font-bold text-xs md:text-sm print:text-[11pt]">
              Chuyên: Sắt, Tôn lợp, Inox, Nhôm thanh định hình, Tấm trần nội thất,
            </p>
            <p className="text-black font-bold text-xs md:text-sm print:text-[10.5pt]">
              Địa chỉ : Mặt Đường Quốc Lộ 39A, cách cây xăng Trương Xá 200m,
            </p>
            <p className="text-black font-bold text-xs md:text-sm print:text-[10.5pt]">
              Trương Xá – Toàn Thắng &nbsp;&nbsp; Kim Động – Hưng Yên
            </p>
            <p className="text-black font-bold text-xs md:text-sm print:text-[10.5pt]">
              Hotline/Zalo: <span className="font-bold">{shopPhone}</span>
            </p>
          </div>
          <div className="text-right shrink-0 min-w-[140px]">
            <div
              suppressHydrationWarning
              className="inline-block px-3 py-1.5 border-2 border-black rounded font-bold text-sm md:text-base text-black print:text-sm"
            >
              {order.orderCode || "HĐ-2026"}
            </div>
            <p suppressHydrationWarning className="text-xs md:text-sm text-black font-medium mt-1.5 print:text-[10.5pt]">
              Ngày: {formatInvoiceDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tiêu đề hoá đơn */}
      <div className="text-center my-3 print:my-2">
        <h2 className="text-lg md:text-xl font-bold uppercase text-black tracking-wider print:text-base">
          HOÁ ĐƠN BÁN HÀNG
        </h2>
      </div>

      {/* 3. Thông tin khách hàng & Giao hàng (2 cột dòng 10-11) */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-3 text-xs md:text-sm print:mb-2 print:text-[11pt]">
        <div className="space-y-1">
          <p>
            <span className="font-medium">Khách hàng:</span>{" "}
            <strong className="text-black font-bold">{order.customer.name || ". . . . . . . . . . . . . . . ."}</strong>
          </p>
          <p>
            <span className="font-medium">Điện Thoại:</span>{" "}
            <span className="font-semibold">{order.customer.phone || ". . . . . . . . . . . . . . . ."}</span>
          </p>
        </div>
        <div className="space-y-1">
          <p>
            <span className="font-medium">Địa chỉ giao:</span>{" "}
            <span>{order.customer.address || ". . . . . . . . . . . . . . . ."}</span>
          </p>
          <p>
            <span className="font-medium">Ghi chú:</span>{" "}
            <span className="italic">{order.customer.note || ". . . . . . . . . . . . . . . ."}</span>
          </p>
        </div>
      </div>

      {/* 4. Bảng chi tiết quy cách & thành tiền theo chuẩn mẫu 9 cột dòng 14 */}
      <div className="overflow-x-auto mb-2 print:overflow-visible">
        <table className="w-full border-collapse border border-black text-left table-fixed">
          <thead>
            <tr className="bg-[#D9D9D9] text-black font-bold text-xs md:text-sm uppercase print:text-[10pt]">
              <th className="border border-black px-1 py-1.5 text-center w-[5%]">STT</th>
              <th className="border border-black px-1.5 py-1.5 text-center w-[27%]">Tên sản phẩm</th>
              <th className="border border-black px-1 py-1.5 text-center w-[10%]">Chiều dài</th>
              <th className="border border-black px-1 py-1.5 text-center w-[8%]">Số tấm</th>
              <th className="border border-black px-1 py-1.5 text-center w-[10%]">Mét dài</th>
              <th className="border border-black px-1 py-1.5 text-center w-[8%]">Khổ</th>
              <th className="border border-black px-1 py-1.5 text-center w-[10%]">Tổng m²</th>
              <th className="border border-black px-1 py-1.5 text-center w-[10%]">Đơn giá</th>
              <th className="border border-black px-1 py-1.5 text-center w-[12%]">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-sm print:text-[10pt]">
            {order.roofingGroups.map((group) => {
              const cutItems = group.items.filter((it) => Number(it.length) > 0 || Number(it.quantity) > 0);
              const itemsToRender = cutItems.length > 0 ? cutItems : group.items.slice(0, 1);

              return (
                <React.Fragment key={group.id}>
                  {itemsToRender.map((item, idx) => {
                    const currentStt = sttCounter++;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                        <td className="border border-black px-1 py-1 text-center font-normal">
                          {currentStt}
                        </td>
                        {idx === 0 ? (
                          <td
                            rowSpan={itemsToRender.length}
                            className="border border-black px-1.5 py-1 font-semibold text-black bg-white align-top"
                          >
                            {cleanProductName(group.productName) || "Tôn Lợp"}
                          </td>
                        ) : null}
                        <td className="border border-black px-1 py-1 text-right">
                          {item.length ? formatNumber(item.length, 2) : "---"}
                        </td>
                        <td className="border border-black px-1 py-1 text-right">
                          {item.quantity || "---"}
                        </td>
                        <td className="border border-black px-1 py-1 text-right">
                          {item.totalMeters ? formatNumber(item.totalMeters, 2) : "---"}
                        </td>
                        <td className="border border-black px-1 py-1 text-center">
                          {idx === 0 ? "" : ""}
                        </td>
                        <td className="border border-black px-1 py-1 text-right"></td>
                        <td className="border border-black px-1 py-1 text-right"></td>
                        <td className="border border-black px-1 py-1 text-right"></td>
                      </tr>
                    );
                  })}

                  {/* Dòng tổng hợp nhóm tôn (Tổng loại) */}
                  <tr className="bg-slate-100/60 font-bold text-black print:bg-slate-100/40">
                    <td className="border border-black px-1 py-1 text-center">
                      {sttCounter++}
                    </td>
                    <td className="border border-black px-1.5 py-1 italic font-bold">
                      Tổng loại: {cleanProductName(group.productName) || "Tôn"}
                    </td>
                    <td className="border border-black px-1 py-1 text-right text-slate-400">---</td>
                    <td className="border border-black px-1 py-1 text-right font-bold">
                      {group.totalPieces}
                    </td>
                    <td className="border border-black px-1 py-1 text-right font-bold">
                      {formatNumber(group.totalMeters, 2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {formatNumber(group.width, 2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right font-bold">
                      {formatNumber(group.totalSquareMeters, 3)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {formatCurrency(group.unitPrice)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right font-bold">
                      {formatCurrency(group.subtotal)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* Phụ kiện bán kèm */}
            {order.accessories.map((acc) => (
              <tr key={acc.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                <td className="border border-black px-1 py-1 text-center font-normal">
                  {sttCounter++}
                </td>
                <td className="border border-black px-1.5 py-1 font-medium text-black">
                  {cleanProductName(acc.name)}
                </td>
                <td className="border border-black px-1 py-1 text-right">
                  {acc.length ? formatNumber(acc.length, 2) : "---"}
                </td>
                <td className="border border-black px-1 py-1 text-right">
                  {acc.pieces || "---"}
                </td>
                <td className="border border-black px-1 py-1 text-right font-medium">
                  {formatNumber(acc.quantity, 2)}
                </td>
                <td className="border border-black px-1 py-1 text-center font-medium">
                  {acc.unit}
                </td>
                <td className="border border-black px-1 py-1 text-right text-slate-400">---</td>
                <td className="border border-black px-1 py-1 text-right">
                  {formatCurrency(acc.unitPrice)}
                </td>
                <td className="border border-black px-1 py-1 text-right font-bold text-black">
                  {formatCurrency(acc.subtotal)}
                </td>
              </tr>
            ))}

            {/* Các dòng trống bổ sung để giữ bảng ngay ngắn như mẫu hoá đơn giấy */}
            {Array.from({ length: emptyRowsCount }).map((_, idx) => (
              <tr key={`empty-row-${idx}`}>
                <td className="border border-black px-1 py-1 text-center text-slate-400">
                  {sttCounter++}
                </td>
                <td className="border border-black px-1.5 py-1">&nbsp;</td>
                <td className="border border-black px-1 py-1">&nbsp;</td>
                <td className="border border-black px-1 py-1">&nbsp;</td>
                <td className="border border-black px-1 py-1">&nbsp;</td>
                <td className="border border-black px-1 py-1">&nbsp;</td>
                <td className="border border-black px-1 py-1">&nbsp;</td>
                <td className="border border-black px-1 py-1">&nbsp;</td>
                <td className="border border-black px-1 py-1">&nbsp;</td>
              </tr>
            ))}

            {/* 5. Dòng TỔNG CỘNG (Dòng 40 theo mẫu) */}
            <tr className="font-bold text-black bg-white">
              <td colSpan={8} className="border border-black px-2 py-1.5 text-right font-bold uppercase text-xs md:text-sm">
                TỔNG CỘNG
              </td>
              <td className="border border-black px-1 py-1.5 text-right font-bold text-xs md:text-sm">
                {formatCurrency(order.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Khối thanh toán chiết khấu / đặt cọc nếu có */}
      {(order.discount > 0 || order.deposit > 0 || ((order.unpaidAmount || 0) > 0)) && (
        <div className="flex justify-end mb-2 print:break-inside-avoid">
          <div className="w-72 md:w-80 space-y-0.5 text-xs md:text-sm border border-black p-2 bg-slate-50 print:bg-transparent print:p-1.5">
            {order.discount > 0 && (
              <div className="flex justify-between py-0.5 text-rose-700">
                <span>Chiết khấu / Giảm giá:</span>
                <span className="font-bold">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.deposit > 0 && (
              <div className="flex justify-between py-0.5 text-emerald-800">
                <span>Khách đã đặt cọc:</span>
                <span className="font-bold">-{formatCurrency(order.deposit)}</span>
              </div>
            )}
            {((order.unpaidAmount || 0) > 0) && (
              <div className="flex justify-between py-0.5 text-amber-900">
                <span>HĐ chưa thanh toán:</span>
                <span className="font-bold">+{formatCurrency(order.unpaidAmount || 0)}</span>
              </div>
            )}
            <div className="border-t border-black pt-1 flex justify-between font-bold">
              <span>Còn lại thanh toán:</span>
              <span className="text-black font-bold">{formatCurrency(order.remainingAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Số tiền bằng chữ */}
      <div className="p-1.5 mb-3 bg-slate-50 rounded text-xs md:text-sm italic text-black border border-slate-300 print:bg-transparent print:p-1 print:mb-2 print:border-none print:break-inside-avoid">
        <strong>Số tiền bằng chữ: </strong> {numberToVietnameseWords(order.remainingAmount || order.totalAmount)}
      </div>

      {/* 6. Khối Ký nhận đúng chuẩn 2 cột dòng 42-43 */}
      <div className="grid grid-cols-2 text-center text-xs md:text-sm mt-3 pt-2 print:break-inside-avoid print:mt-2 print:pt-1">
        <div>
          <p className="font-bold uppercase text-black">Người mua hàng</p>
          <p className="text-[10px] md:text-xs text-slate-600 italic">(Ký, ghi rõ họ tên)</p>
          <div className="h-16 print:h-14 flex items-end justify-center">
            <p className="font-semibold text-black">{order.customer.name || ""}</p>
          </div>
        </div>
        <div>
          <p className="font-bold uppercase text-black">Chủ cửa hàng</p>
          <p className="text-[10px] md:text-xs text-slate-600 italic">(Ký, ghi rõ họ tên)</p>
          <div className="h-16 print:h-14 flex items-end justify-center">
            <p className="font-semibold text-black">{shopName}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-[10.5px] text-slate-500 italic print:mt-2 print:break-inside-avoid">
        Cảm ơn Quý khách đã tin tưởng và ủng hộ! Xin vui lòng kiểm tra kỹ số lượng & quy cách trước khi nhận hàng.
      </div>
    </div>
  );
}

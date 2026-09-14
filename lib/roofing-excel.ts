import * as XLSX from "xlsx";
import { RoofingOrder } from "@/types/roofing";

/**
 * Xuất dữ liệu đơn hàng ra file Excel .xlsx chuẩn biểu mẫu giống file "hoá đơn tôn bản chính.xlsx"
 */
export function exportRoofingOrderToExcel(order: RoofingOrder, fileName?: string) {
  // Tạo mảng dữ liệu 2D (row-by-row)
  const rows: (string | number)[][] = [
    // Header đơn vị bán
    ["ĐẠI LÝ TUẤN HƯƠNG - CHUYÊN TÔN LỢP, XÀ GỒ, THÉP HỘP, PHỤ KIỆN"],
    ["Địa chỉ: Trương Xá, Nghĩa Dân, Hưng Yên - ĐT: 033181004590"],
    ["HOÁ ĐƠN BÁN LẺ & QUY CÁCH CẮT TÔN"],
    [""],
    // Thông tin khách hàng & đơn hàng
    [`Mã đơn: ${order.orderCode}`, "", "", "", "", `Ngày lập: ${order.createdAt}`],
    [`Khách hàng: ${order.customer.name}`, "", "", "", "", `SĐT: ${order.customer.phone}`],
    [`Địa chỉ: ${order.customer.address}`],
    [`Ghi chú: ${order.customer.note || "Không có"}`],
    [""],
    // Tiêu đề bảng (Dòng 10 chuẩn như file Excel mẫu)
    ["STT", "Tên hàng", "Chiều dài", "Số tấm", "Mét dài", "Khổ", "Tổng m²", "Đơn giá", "Thành tiền"],
  ];

  let stt = 1;

  // 1. Nhóm các tấm tôn
  order.roofingGroups.forEach((group) => {
    group.items.forEach((item, index) => {
      rows.push([
        stt++,
        index === 0 ? group.productName : "", // Dòng đầu ghi tên loại tôn
        item.length,
        item.quantity,
        item.totalMeters,
        "",
        "",
        "",
        "",
      ]);
    });

    // Dòng tổng loại tôn (như Dòng 22 trong file mẫu)
    rows.push([
      stt++,
      "Tổng loại",
      "",
      group.totalPieces,
      group.totalMeters,
      group.width,
      group.totalSquareMeters,
      group.unitPrice,
      group.subtotal,
    ]);
  });

  // 2. Phụ kiện đi kèm (như Dòng 23-26 trong file mẫu)
  order.accessories.forEach((acc) => {
    rows.push([
      stt++,
      acc.name,
      acc.length !== undefined ? acc.length : "",
      acc.pieces !== undefined ? acc.pieces : "",
      acc.quantity,
      acc.unit,
      "",
      acc.unitPrice,
      acc.subtotal,
    ]);
  });

  // Dòng kẻ ngăn cách
  rows.push(["", "", "", "", "", "", "", "", "------------------------"]);

  // Tổng cộng
  rows.push(["", "", "", "", "", "", "", "Tổng đơn hàng:", order.totalAmount]);

  if (order.discount > 0) {
    rows.push(["", "", "", "", "", "", "", "Chiết khấu / Giảm giá:", order.discount]);
  }

  if (order.deposit > 0) {
    rows.push(["", "", "", "", "", "", "", "Đã đặt cọc:", order.deposit]);
  }

  rows.push(["", "", "", "", "", "", "", "Còn lại phải thu:", order.remainingAmount]);

  // Chuyển mảng thành Worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Đặt độ rộng các cột cho đẹp mắt
  ws["!cols"] = [
    { wch: 6 },  // STT
    { wch: 38 }, // Tên hàng
    { wch: 12 }, // Chiều dài
    { wch: 10 }, // Số tấm
    { wch: 12 }, // Mét dài
    { wch: 10 }, // Khổ
    { wch: 12 }, // Tổng m²
    { wch: 14 }, // Đơn giá
    { wch: 18 }, // Thành tiền
  ];

  // Tạo Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoá đơn tôn");

  // Tải file về máy
  const exportName = fileName || `Hoa_Don_${order.orderCode || "Ton"}.xlsx`;
  XLSX.writeFile(wb, exportName);
}

import type ExcelJS from "exceljs";
import { RoofingOrder } from "@/types/roofing";
import { cleanProductName } from "@/lib/roofing-calc";

/** Giữ helper cũ (một số test/util vẫn dùng tỷ lệ nghìn đồng) */
export function toExcelThousand(vnd: number): number {
  return Number((Number(vnd) / 1000).toFixed(6));
}

export type RoofingExcelCell = string | number | null;

export interface RoofingExcelDataRow {
  stt: number;
  name: string;
  length: RoofingExcelCell;
  pieces: RoofingExcelCell;
  meters: RoofingExcelCell;
  widthOrUnit: RoofingExcelCell;
  squareMeters: RoofingExcelCell;
  unitPrice: RoofingExcelCell;
  subtotal: RoofingExcelCell;
  kind: "cut" | "group_total" | "accessory";
  /** Merge cột Tên hàng (B) cho các dòng cắt cùng nhóm */
  mergeNameRows?: number;
  /** Merge cột Khổ/ĐVT F:G như phụ kiện */
  mergeUnitCols?: boolean;
}

/**
 * Dựng các dòng dữ liệu khớp layout mẫu "phieu_thanh_toan_mau.xlsx"
 * (bắt đầu từ dòng 11). Đơn giá / thành tiền theo đồng đầy đủ.
 */
export function buildRoofingExcelDataRows(order: RoofingOrder): RoofingExcelDataRow[] {
  const rows: RoofingExcelDataRow[] = [];
  let stt = 1;

  for (const group of order.roofingGroups) {
    const cutItems = group.items.filter(
      (it) => Number(it.length) > 0 || Number(it.quantity) > 0
    );
    if (cutItems.length === 0 && !group.productName?.trim()) continue;

    const items = cutItems.length > 0 ? cutItems : group.items.slice(0, 1);
    const nameMerge = items.length;

    items.forEach((item, index) => {
      rows.push({
        stt: stt++,
        name: index === 0 ? cleanProductName(group.productName) || "" : "",
        length: Number(item.length) || 0,
        pieces: Number(item.quantity) || 0,
        meters: Number(item.totalMeters) || 0,
        widthOrUnit: null,
        squareMeters: null,
        unitPrice: null,
        subtotal: null,
        kind: "cut",
        mergeNameRows: index === 0 ? nameMerge : undefined,
      });
    });

    rows.push({
      stt: stt++,
      name: "Tổng loại",
      length: null,
      pieces: Number(group.totalPieces) || 0,
      meters: Number(group.totalMeters) || 0,
      widthOrUnit: Number(group.width) || 0,
      squareMeters: Number(group.totalSquareMeters) || 0,
      unitPrice: Number(group.unitPrice) || 0,
      subtotal: Number(group.subtotal) || 0,
      kind: "group_total",
    });
  }

  for (const acc of order.accessories) {
    if (!acc.name?.trim()) continue;
    const hasLength = acc.length !== undefined && !Number.isNaN(Number(acc.length));
    const hasPieces = acc.pieces !== undefined && !Number.isNaN(Number(acc.pieces));

    rows.push({
      stt: stt++,
      name: cleanProductName(acc.name).trim(),
      length: hasLength ? Number(acc.length) : null,
      pieces: hasPieces ? Number(acc.pieces) : null,
      meters: Number(acc.quantity) || 0,
      widthOrUnit: acc.unit || "",
      squareMeters: null,
      unitPrice: Number(acc.unitPrice) || 0,
      subtotal: Number(acc.subtotal) || 0,
      kind: "accessory",
      mergeUnitCols: true,
    });
  }

  return rows;
}

const TEMPLATE_PUBLIC_PATH = "/templates/hoa-don-dai-ly-tuan-huong.xlsx";
const TEMPLATE_FS_PATH = "public/templates/hoa-don-dai-ly-tuan-huong.xlsx";
const DATA_START_ROW = 15;
const TEMPLATE_DATA_END_ROW = 39;
const FOOTER_LABEL_ROW = 40; // Dòng "TỔNG CỘNG"
const MAX_COLS = 9;

function formatInvoiceDate(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const day = Number.isNaN(d.getTime()) ? new Date().getDate() : d.getDate();
  const month = Number.isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Ngày: ${pad(day)}/${pad(month)}/${year}`;
}

async function loadTemplateBuffer(): Promise<ArrayBuffer> {
  if (typeof window !== "undefined") {
    const res = await fetch(TEMPLATE_PUBLIC_PATH);
    if (!res.ok) {
      // Fallback nếu public route khác
      const fallbackRes = await fetch("/templates/phieu-thanh-toan.xlsx");
      if (!fallbackRes.ok) {
        throw new Error("Không tải được mẫu Excel hoá đơn.");
      }
      return fallbackRes.arrayBuffer();
    }
    return res.arrayBuffer();
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  let filePath = path.join(process.cwd(), TEMPLATE_FS_PATH);
  try {
    const buf = await fs.readFile(filePath);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    filePath = path.join(process.cwd(), "docs/required/HoaDonBanHang_DaiLyTuanHuong (1).xlsx");
    const buf = await fs.readFile(filePath);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

function clearCell(cell: ExcelJS.Cell) {
  cell.value = null;
}

function setNumber(
  cell: ExcelJS.Cell,
  value: RoofingExcelCell,
  numFmt?: string
) {
  if (value === null || value === "") {
    clearCell(cell);
    return;
  }
  if (typeof value === "number") {
    cell.value = value;
    if (numFmt) cell.numFmt = numFmt;
    return;
  }
  cell.value = value;
}

/**
 * Xuất đơn hàng ra .xlsx đúng form mẫu "HoaDonBanHang_DaiLyTuanHuong (1).xlsx"
 * (header đại lý, mã hoá đơn H1:I2, ngày H3:I3, khách hàng B10..F11, bảng hàng dòng 15..39, TỔNG CỘNG dòng 40, chữ ký).
 */
export async function exportRoofingOrderToExcel(
  order: RoofingOrder,
  fileName?: string
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const buffer = await loadTemplateBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet =
    workbook.getWorksheet("HoaDon") || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Mẫu Excel không có sheet dữ liệu.");
  }

  // 1. Header: Mã đơn hàng & Ngày hoá đơn
  const orderCode = order.orderCode || "HĐ-2026";
  worksheet.getCell("H1").value = orderCode;
  worksheet.getCell("H3").value = formatInvoiceDate(order.createdAt);

  // 2. Thông tin khách hàng & giao hàng
  const custName = order.customer?.name?.trim() || "";
  const custPhone = order.customer?.phone?.trim() || "";
  const custAddress = order.customer?.address?.trim() || "";
  const custNote = order.customer?.note?.trim() || "";

  worksheet.getCell("B10").value = `Khách hàng: ${custName || ". . . . . . . . . . ."}`;
  worksheet.getCell("F10").value = `Địa chỉ giao: ${custAddress || ". . . . . . . . ."}`;
  worksheet.getCell("B11").value = `Điện Thoại: ${custPhone || ". . . . . . . . . . ."}`;
  worksheet.getCell("F11").value = `Ghi chú: ${custNote || ". . . . . . . . . . ."}`;

  // 3. Chuẩn bị dữ liệu bảng hàng
  const dataRows = buildRoofingExcelDataRows(order);
  const neededEndRow = DATA_START_ROW + dataRows.length - 1;

  let totalLabelRow = FOOTER_LABEL_ROW;
  if (neededEndRow > TEMPLATE_DATA_END_ROW) {
    const insertCount = neededEndRow - TEMPLATE_DATA_END_ROW;
    worksheet.spliceRows(
      totalLabelRow,
      0,
      ...Array.from({ length: insertCount }, () => [])
    );
    totalLabelRow = FOOTER_LABEL_ROW + insertCount;

    // Gán border và định dạng cho các dòng mới chèn
    for (let r = TEMPLATE_DATA_END_ROW + 1; r <= neededEndRow; r++) {
      const row = worksheet.getRow(r);
      row.height = 15.75;
      for (let c = 1; c <= MAX_COLS; c++) {
        const cell = row.getCell(c);
        cell.font = { name: "Times New Roman", size: 11 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      row.commit();
    }
  }

  // 4. Xóa công thức / nội dung cũ ở các ô dữ liệu (giữ STT nếu chưa dùng)
  const maxCleanRow = Math.max(neededEndRow, TEMPLATE_DATA_END_ROW);
  for (let r = DATA_START_ROW; r <= maxCleanRow; r++) {
    const row = worksheet.getRow(r);
    for (let c = 2; c <= MAX_COLS; c++) {
      clearCell(row.getCell(c));
    }
    row.commit();
  }

  // 5. Điền dữ liệu thực tế
  const pendingNameMerges: Array<{ start: number; end: number }> = [];

  dataRows.forEach((data, index) => {
    const rowNumber = DATA_START_ROW + index;
    const row = worksheet.getRow(rowNumber);

    // Cột 1: STT
    row.getCell(1).value = data.stt;
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(1).font = { name: "Times New Roman", size: 11 };

    // Cột 2: Tên sản phẩm
    if (data.name) {
      row.getCell(2).value = data.name;
      row.getCell(2).font = {
        name: "Times New Roman",
        size: 11,
        bold: data.kind === "group_total",
        italic: data.kind === "group_total",
      };
      row.getCell(2).alignment = {
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
      };
    }

    if (data.kind === "cut") {
      setNumber(row.getCell(3), data.length, "#,##0.00");
      setNumber(row.getCell(4), data.pieces, "#,##0");
      setNumber(row.getCell(5), data.meters, "0.00");
      row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    } else if (data.kind === "group_total") {
      setNumber(row.getCell(4), data.pieces, "#,##0");
      setNumber(row.getCell(5), data.meters, "0.00");
      setNumber(row.getCell(6), data.widthOrUnit, "#,##0.00");
      setNumber(row.getCell(7), data.squareMeters, "#,##0.000");
      setNumber(row.getCell(8), data.unitPrice, "#,##0");
      setNumber(row.getCell(9), data.subtotal, "#,##0");
      [4, 5, 7, 8, 9].forEach((col) => {
        row.getCell(col).alignment = { horizontal: "right", vertical: "middle" };
        row.getCell(col).font = { name: "Times New Roman", size: 11, bold: true };
      });
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
    } else if (data.kind === "accessory") {
      setNumber(row.getCell(3), data.length, "#,##0.00");
      setNumber(row.getCell(4), data.pieces, "#,##0");
      const metersFmt =
        data.length === null && data.pieces === null ? "#,##0" : "0.00";
      setNumber(row.getCell(5), data.meters, metersFmt);
      if (data.widthOrUnit !== null && data.widthOrUnit !== "") {
        row.getCell(6).value = data.widthOrUnit;
      }
      setNumber(row.getCell(8), data.unitPrice, "#,##0");
      setNumber(row.getCell(9), data.subtotal, "#,##0");

      if (data.length) row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
      if (data.pieces) row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(9).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(9).font = { name: "Times New Roman", size: 11, bold: true };
    }

    row.commit();

    if (data.mergeNameRows && data.mergeNameRows > 1) {
      pendingNameMerges.push({
        start: rowNumber,
        end: rowNumber + data.mergeNameRows - 1,
      });
    }
  });

  // Merge cột tên sản phẩm cho các dòng cắt cùng nhóm
  for (const m of pendingNameMerges) {
    try {
      worksheet.mergeCells(m.start, 2, m.end, 2);
    } catch {
      // ignore
    }
  }

  // 6. Điền tổng tiền hàng vào ô I của dòng TỔNG CỘNG
  const totalCell = worksheet.getCell(totalLabelRow, 9);
  totalCell.value = Number(order.totalAmount) || 0;
  totalCell.numFmt = "#,##0";
  totalCell.font = { name: "Times New Roman", size: 12, bold: true };
  totalCell.alignment = { horizontal: "right", vertical: "middle" };

  const exportName =
    fileName || `Hoa_Don_${order.orderCode || "TuanHuong"}.xlsx`;
  const outBuffer = await workbook.xlsx.writeBuffer();

  if (typeof window !== "undefined") {
    const blob = new Blob([outBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const fs = await import("fs/promises");
  await fs.writeFile(exportName, Buffer.from(outBuffer));
}

/**
 * Helper format ngày sang DD/MM/YYYY
 */
function formatVietnameseDate(isoDate?: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    // Có thể là chuỗi DD/MM/YYYY sẵn
    if (isoDate.includes("/")) return isoDate;
    return isoDate;
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Helper nhãn trạng thái tiếng Việt khớp giao diện
 */
function getOrderStatusVietnamese(status?: string): string {
  switch (status) {
    case "completed":
      return "Hoàn Tất";
    case "cutting":
      return "Đang Cán Tôn";
    case "cancelled":
      return "Đã Huỷ";
    case "pending":
    default:
      return "Chờ Cắt";
  }
}

/**
 * Xuất Danh Sách Đơn Hàng Cắt Tôn ra file Excel (.xlsx)
 * Định dạng thẩm mỹ chuyên nghiệp, các cột và số liệu khớp 100% như bảng giao diện web.
 */
export async function exportRoofingOrdersListToExcel(
  orders: RoofingOrder[],
  fileName?: string
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TungTung ERP - Đại Lý Tuấn Hương";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Danh Sách Đơn Hàng", {
    views: [{ showGridLines: true }],
  });

  // Độ rộng các cột chuẩn hóa khớp 100% giao diện
  worksheet.columns = [
    { key: "stt", width: 7 },              // A: STT
    { key: "orderCode", width: 17 },        // B: Mã Đơn Hàng
    { key: "orderDate", width: 14 },        // C: Ngày Tạo
    { key: "customerName", width: 28 },     // D: Khách Hàng / Công Trình
    { key: "customerPhone", width: 16 },    // E: Số Điện Thoại
    { key: "customerAddress", width: 32 },  // F: Địa Chỉ
    { key: "totalAmount", width: 20 },      // G: Tổng Tiền (đ)
    { key: "deposit", width: 18 },          // H: Đã Cọc / Trả (đ)
    { key: "remainingAmount", width: 20 },  // I: Còn Phải Thu (đ)
    { key: "status", width: 16 },           // J: Trạng Thái
    { key: "note", width: 26 },             // K: Ghi Chú
  ];

  // 1. Header Đại Lý
  worksheet.mergeCells("A1:K1");
  const headerShop = worksheet.getCell("A1");
  headerShop.value = "ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG";
  headerShop.font = { name: "Times New Roman", size: 13, bold: true, color: { argb: "FF1E3A8A" } };
  headerShop.alignment = { vertical: "middle" };

  worksheet.mergeCells("A2:K2");
  const subHeader = worksheet.getCell("A2");
  subHeader.value = "Địa chỉ: Mặt Đường QL 39A, Trương Xá – Toàn Thắng, Kim Động, Hưng Yên  |  Hotline/Zalo: 0373.208.038 – 0989.734.768";
  subHeader.font = { name: "Times New Roman", size: 10, italic: true, color: { argb: "FF4B5563" } };
  subHeader.alignment = { vertical: "middle" };

  // 2. Tiêu đề Báo Cáo
  worksheet.mergeCells("A4:K4");
  const titleCell = worksheet.getCell("A4");
  titleCell.value = "BÁO CÁO DANH SÁCH ĐƠN HÀNG CẮT TÔN & TÌNH HÌNH THANH TOÁN";
  titleCell.font = { name: "Times New Roman", size: 15, bold: true, color: { argb: "FF0F172A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(4).height = 28;

  worksheet.mergeCells("A5:K5");
  const dateCell = worksheet.getCell("A5");
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  dateCell.value = `Ngày xuất: ${dateStr}  •  Tổng cộng: ${orders.length} đơn hàng`;
  dateCell.font = { name: "Times New Roman", size: 10, italic: true, color: { argb: "FF64748B" } };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };

  // 3. Khối Tóm Tắt Nhanh (Thống Kê Kế Toán)
  const sumTotal = orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const sumDeposit = orders.reduce((acc, o) => acc + (Number(o.deposit) || 0), 0);
  const sumRemaining = orders.reduce((acc, o) => acc + (Number(o.remainingAmount) || 0), 0);

  const summaryRow = worksheet.getRow(7);
  summaryRow.height = 24;

  worksheet.mergeCells("B7:C7");
  worksheet.getCell("B7").value = "Tổng Doanh Thu:";
  worksheet.getCell("B7").font = { name: "Times New Roman", size: 11, bold: true };
  worksheet.getCell("B7").alignment = { horizontal: "right", vertical: "middle" };
  worksheet.getCell("D7").value = sumTotal;
  worksheet.getCell("D7").numFmt = "#,##0";
  worksheet.getCell("D7").font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FF1E3A8A" } };
  worksheet.getCell("D7").alignment = { horizontal: "right", vertical: "middle" };

  worksheet.mergeCells("E7:F7");
  worksheet.getCell("E7").value = "Đã Cọc / Thu:";
  worksheet.getCell("E7").font = { name: "Times New Roman", size: 11, bold: true };
  worksheet.getCell("E7").alignment = { horizontal: "right", vertical: "middle" };
  worksheet.getCell("G7").value = sumDeposit;
  worksheet.getCell("G7").numFmt = "#,##0";
  worksheet.getCell("G7").font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FF047857" } };
  worksheet.getCell("G7").alignment = { horizontal: "right", vertical: "middle" };

  worksheet.mergeCells("H7:I7");
  worksheet.getCell("H7").value = "Còn Phải Thu:";
  worksheet.getCell("H7").font = { name: "Times New Roman", size: 11, bold: true };
  worksheet.getCell("H7").alignment = { horizontal: "right", vertical: "middle" };
  worksheet.getCell("J7").value = sumRemaining;
  worksheet.getCell("J7").numFmt = "#,##0";
  worksheet.getCell("J7").font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFB91C1C" } };
  worksheet.getCell("J7").alignment = { horizontal: "right", vertical: "middle" };

  // Khung viền mỏng cho khối thống kê
  for (let c = 2; c <= 10; c++) {
    worksheet.getRow(7).getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8FAFC" },
    };
    worksheet.getRow(7).getCell(c).border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  }

  // 4. Tiêu đề các Cột (Header Row) tại dòng 9
  const tableHeaderRow = worksheet.getRow(9);
  tableHeaderRow.height = 26;
  const headers = [
    "STT",
    "Mã Đơn Hàng",
    "Ngày Tạo",
    "Khách Hàng / Công Trình",
    "Số Điện Thoại",
    "Địa Chỉ",
    "Tổng Tiền (đ)",
    "Đã Cọc / Trả (đ)",
    "Còn Phải Thu (đ)",
    "Trạng Thái",
    "Ghi Chú",
  ];

  headers.forEach((title, idx) => {
    const cell = tableHeaderRow.getCell(idx + 1);
    cell.value = title;
    cell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3C50E0" }, // Màu xanh thương hiệu TailAdmin
    };
    cell.alignment = {
      horizontal: idx === 0 || idx === 1 || idx === 2 || idx === 4 || idx === 9 ? "center" : idx === 6 || idx === 7 || idx === 8 ? "right" : "left",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF1E293B" } },
      bottom: { style: "medium", color: { argb: "FF1E293B" } },
      left: { style: "thin", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FF94A3B8" } },
    };
  });

  // 5. Điền từng dòng dữ liệu (bắt đầu từ dòng 10)
  const START_ROW = 10;
  orders.forEach((order, index) => {
    const rIdx = START_ROW + index;
    const row = worksheet.getRow(rIdx);
    row.height = 22;

    const isEven = index % 2 === 1;
    const rowBgColor = isEven ? "FFF8FAFC" : "FFFFFFFF";

    const totalAmt = Number(order.totalAmount) || 0;
    const depAmt = Number(order.deposit) || 0;
    const remAmt = Number(order.remainingAmount) || 0;

    // Cột 1: STT
    const cellA = row.getCell(1);
    cellA.value = index + 1;
    cellA.alignment = { horizontal: "center", vertical: "middle" };

    // Cột 2: Mã đơn hàng
    const cellB = row.getCell(2);
    cellB.value = order.orderCode;
    cellB.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FF0F172A" } };
    cellB.alignment = { horizontal: "center", vertical: "middle" };

    // Cột 3: Ngày tạo
    const cellC = row.getCell(3);
    cellC.value = formatVietnameseDate(order.createdAt);
    cellC.alignment = { horizontal: "center", vertical: "middle" };

    // Cột 4: Khách hàng
    const cellD = row.getCell(4);
    cellD.value = order.customer?.name || "Khách lẻ";
    cellD.font = { name: "Times New Roman", size: 11, bold: true };
    cellD.alignment = { horizontal: "left", vertical: "middle" };

    // Cột 5: SĐT
    const cellE = row.getCell(5);
    cellE.value = order.customer?.phone || "—";
    cellE.numFmt = "@";
    cellE.alignment = { horizontal: "center", vertical: "middle" };

    // Cột 6: Địa chỉ
    const cellF = row.getCell(6);
    cellF.value = order.customer?.address || "—";
    cellF.alignment = { horizontal: "left", vertical: "middle" };

    // Cột 7: Tổng tiền
    const cellG = row.getCell(7);
    cellG.value = totalAmt;
    cellG.numFmt = "#,##0";
    cellG.font = { name: "Times New Roman", size: 11, bold: true };
    cellG.alignment = { horizontal: "right", vertical: "middle" };

    // Cột 8: Đã cọc/trả
    const cellH = row.getCell(8);
    cellH.value = depAmt;
    cellH.numFmt = "#,##0";
    cellH.font = { name: "Times New Roman", size: 11, color: { argb: "FF047857" } };
    cellH.alignment = { horizontal: "right", vertical: "middle" };

    // Cột 9: Còn phải thu
    const cellI = row.getCell(9);
    cellI.value = remAmt;
    cellI.numFmt = "#,##0";
    cellI.font = {
      name: "Times New Roman",
      size: 11,
      bold: remAmt > 0,
      color: remAmt > 0 ? { argb: "FFB91C1C" } : { argb: "FF047857" },
    };
    cellI.alignment = { horizontal: "right", vertical: "middle" };

    // Cột 10: Trạng thái
    const cellJ = row.getCell(10);
    cellJ.value = getOrderStatusVietnamese(order.status);
    cellJ.alignment = { horizontal: "center", vertical: "middle" };
    if (order.status === "completed") {
      cellJ.font = { name: "Times New Roman", size: 11, color: { argb: "FF047857" }, bold: true };
    } else if (order.status === "cutting") {
      cellJ.font = { name: "Times New Roman", size: 11, color: { argb: "FF1D4ED8" }, bold: true };
    } else if (order.status === "cancelled") {
      cellJ.font = { name: "Times New Roman", size: 11, color: { argb: "FFE11D48" }, bold: true };
    } else {
      cellJ.font = { name: "Times New Roman", size: 11, color: { argb: "FFD97706" }, bold: true };
    }

    // Cột 11: Ghi chú
    const cellK = row.getCell(11);
    cellK.value = order.customer?.note || "";
    cellK.alignment = { horizontal: "left", vertical: "middle" };

    // Gán border và màu nền cho từng ô
    for (let c = 1; c <= 11; c++) {
      const cell = row.getCell(c);
      if (!cell.font) cell.font = { name: "Times New Roman", size: 11 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBgColor },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    }
  });

  // 6. Dòng Tổng Kết Cuối Bảng
  const endRowIdx = START_ROW + orders.length;
  const totalRow = worksheet.getRow(endRowIdx);
  totalRow.height = 26;

  worksheet.mergeCells(`A${endRowIdx}:F${endRowIdx}`);
  const totalLabelCell = worksheet.getCell(`A${endRowIdx}`);
  totalLabelCell.value = `TỔNG CỘNG TOÀN BỘ (${orders.length} ĐƠN)`;
  totalLabelCell.font = { name: "Times New Roman", size: 11, bold: true, color: { argb: "FF0F172A" } };
  totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  const cellTotG = totalRow.getCell(7);
  cellTotG.value = sumTotal;
  cellTotG.numFmt = "#,##0";
  cellTotG.font = { name: "Times New Roman", size: 12, bold: true };
  cellTotG.alignment = { horizontal: "right", vertical: "middle" };

  const cellTotH = totalRow.getCell(8);
  cellTotH.value = sumDeposit;
  cellTotH.numFmt = "#,##0";
  cellTotH.font = { name: "Times New Roman", size: 12, bold: true, color: { argb: "FF047857" } };
  cellTotH.alignment = { horizontal: "right", vertical: "middle" };

  const cellTotI = totalRow.getCell(9);
  cellTotI.value = sumRemaining;
  cellTotI.numFmt = "#,##0";
  cellTotI.font = { name: "Times New Roman", size: 12, bold: true, color: { argb: "FFB91C1C" } };
  cellTotI.alignment = { horizontal: "right", vertical: "middle" };

  for (let c = 1; c <= 11; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0F172A" } },
      bottom: { style: "double", color: { argb: "FF0F172A" } }, // Viền đôi kế toán
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  }

  // 7. Khối Chữ Ký
  const sigRowIdx = endRowIdx + 2;
  worksheet.mergeCells(`B${sigRowIdx}:D${sigRowIdx}`);
  const sigLeft = worksheet.getCell(`B${sigRowIdx}`);
  sigLeft.value = "NGƯỜI LẬP BÁO CÁO";
  sigLeft.font = { name: "Times New Roman", size: 11, bold: true };
  sigLeft.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`G${sigRowIdx}:J${sigRowIdx}`);
  const sigRight = worksheet.getCell(`G${sigRowIdx}`);
  sigRight.value = "CHỦ CƠ SỞ / ĐẠI LÝ";
  sigRight.font = { name: "Times New Roman", size: 11, bold: true };
  sigRight.alignment = { horizontal: "center", vertical: "middle" };

  const sigSubIdx = sigRowIdx + 1;
  worksheet.mergeCells(`B${sigSubIdx}:D${sigSubIdx}`);
  const sigLeftSub = worksheet.getCell(`B${sigSubIdx}`);
  sigLeftSub.value = "(Ký, ghi rõ họ tên)";
  sigLeftSub.font = { name: "Times New Roman", size: 10, italic: true };
  sigLeftSub.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`G${sigSubIdx}:J${sigSubIdx}`);
  const sigRightSub = worksheet.getCell(`G${sigSubIdx}`);
  sigRightSub.value = "(Ký, đóng dấu)";
  sigRightSub.font = { name: "Times New Roman", size: 10, italic: true };
  sigRightSub.alignment = { horizontal: "center", vertical: "middle" };

  const exportName =
    fileName ||
    `Danh_Sach_Don_Hang_Cat_Ton_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.xlsx`;

  const outBuffer = await workbook.xlsx.writeBuffer();

  if (typeof window !== "undefined") {
    const blob = new Blob([outBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const fs = await import("fs/promises");
  await fs.writeFile(exportName, Buffer.from(outBuffer));
}

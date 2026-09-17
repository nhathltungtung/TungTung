import type ExcelJS from "exceljs";
import { RoofingOrder } from "@/types/roofing";

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
        name: index === 0 ? group.productName || "" : "",
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
      name: acc.name.trim(),
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

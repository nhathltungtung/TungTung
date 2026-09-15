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

const TEMPLATE_PUBLIC_PATH = "/templates/phieu-thanh-toan.xlsx";
const TEMPLATE_FS_PATH = "public/templates/phieu-thanh-toan.xlsx";
const DATA_START_ROW = 11;
const FOOTER_LABEL_ROW = 43; // "Tổng đơn hàng"
const MAX_COLS = 9;

function formatInvoiceDate(isoDate?: string): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const day = Number.isNaN(d.getTime()) ? new Date().getDate() : d.getDate();
  const month = Number.isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  const year = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  return `Ngày  ${day}   tháng  ${month} năm ${year}`;
}

function formatCustomerLine(order: RoofingOrder): string {
  const name = order.customer?.name?.trim() || "";
  const address = order.customer?.address?.trim() || "";
  const phone = order.customer?.phone?.trim() || "";
  const parts = [name, address, phone].filter(Boolean);
  const detail = parts.length > 0 ? parts.join(" - ") : ". . . . . . . . . . . . . . . . . . . . . . . . . . .";
  return `Khách hàng, địa chỉ: ${detail}`;
}

async function loadTemplateBuffer(): Promise<ArrayBuffer> {
  if (typeof window !== "undefined") {
    const res = await fetch(TEMPLATE_PUBLIC_PATH);
    if (!res.ok) {
      throw new Error("Không tải được mẫu Excel phiếu thanh toán.");
    }
    return res.arrayBuffer();
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), TEMPLATE_FS_PATH);
  const buf = await fs.readFile(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
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
 * Xuất đơn hàng ra .xlsx đúng form mẫu "phieu_thanh_toan_mau.xlsx"
 * (header đại lý chữ, ngày, khách hàng, bảng hàng, tổng I43, chữ ký).
 */
export async function exportRoofingOrderToExcel(
  order: RoofingOrder,
  fileName?: string
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const buffer = await loadTemplateBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Mẫu Excel không có sheet dữ liệu.");
  }

  // Ngày + khách hàng
  worksheet.getCell("F6").value = formatInvoiceDate(order.createdAt);
  worksheet.getCell("A8").value = formatCustomerLine(order);

  // Gỡ merge động vùng data (giữ header + footer A43+)
  const mergesToRemove = [...(worksheet.model.merges || [])].filter((m) => {
    const startRow = parseInt(m.replace(/^[A-Z]+/, "").split(":")[0], 10);
    return startRow >= DATA_START_ROW && startRow < FOOTER_LABEL_ROW;
  });
  for (const merge of mergesToRemove) {
    try {
      worksheet.unMergeCells(merge);
    } catch {
      // ignore
    }
  }

  // Xóa nội dung + công thức mẫu vùng data
  for (let r = DATA_START_ROW; r < FOOTER_LABEL_ROW; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= MAX_COLS; c++) {
      clearCell(row.getCell(c));
    }
    row.commit();
  }

  const dataRows = buildRoofingExcelDataRows(order);
  const neededEndRow = DATA_START_ROW + dataRows.length - 1;

  let totalLabelRow = FOOTER_LABEL_ROW;
  if (neededEndRow >= FOOTER_LABEL_ROW) {
    const insertCount = neededEndRow - FOOTER_LABEL_ROW + 3;
    worksheet.spliceRows(
      FOOTER_LABEL_ROW,
      0,
      ...Array.from({ length: insertCount }, () => [])
    );
    totalLabelRow = FOOTER_LABEL_ROW + insertCount;
  }

  const pendingNameMerges: Array<{ start: number; end: number }> = [];
  const pendingUnitMerges: number[] = [];

  dataRows.forEach((data, index) => {
    const rowNumber = DATA_START_ROW + index;
    const row = worksheet.getRow(rowNumber);

    if (data.stt > 0) {
      row.getCell(1).value = data.stt;
    }

    if (data.name) {
      row.getCell(2).value = data.name;
    }

    if (data.kind === "cut") {
      setNumber(row.getCell(3), data.length, "#,##0.00");
      setNumber(row.getCell(4), data.pieces, "#,##0");
      setNumber(row.getCell(5), data.meters, "0.00");
    } else if (data.kind === "group_total") {
      setNumber(row.getCell(4), data.pieces, "#,##0");
      setNumber(row.getCell(5), data.meters, "0.00");
      setNumber(row.getCell(6), data.widthOrUnit, "#,##0.00");
      setNumber(row.getCell(7), data.squareMeters, "#,##0.000");
      setNumber(row.getCell(8), data.unitPrice, "#,##0");
      setNumber(row.getCell(9), data.subtotal, "#,##0");
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
    }

    row.commit();

    if (data.mergeNameRows && data.mergeNameRows > 1) {
      pendingNameMerges.push({
        start: rowNumber,
        end: rowNumber + data.mergeNameRows - 1,
      });
    }
    if (data.mergeUnitCols) {
      pendingUnitMerges.push(rowNumber);
    }
  });

  for (const m of pendingNameMerges) {
    worksheet.mergeCells(m.start, 2, m.end, 2);
  }
  for (const r of pendingUnitMerges) {
    worksheet.mergeCells(r, 6, r, 7);
  }

  // Tổng đơn hàng ở cột Thành tiền (I) của dòng footer
  const totalCell = worksheet.getCell(totalLabelRow, 9);
  totalCell.value = Number(order.totalAmount) || 0;
  totalCell.numFmt = "#,##0";
  totalCell.font = { ...(totalCell.font || {}), bold: true };

  const exportName =
    fileName || `Phieu_Thanh_Toan_${order.orderCode || "Ton"}.xlsx`;
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

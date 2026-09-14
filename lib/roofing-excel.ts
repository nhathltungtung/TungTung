import type ExcelJS from "exceljs";
import { RoofingOrder } from "@/types/roofing";

/** Đơn giá / thành tiền trên file mẫu lưu theo nghìn đồng (111 = 111.000đ) */
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
  kind: "cut" | "group_total" | "accessory" | "separator" | "grand_total";
  /** Merge cột Tên hàng (B) cho các dòng cắt cùng nhóm */
  mergeNameRows?: number;
  /** Merge cột Khổ/ĐVT F:G như phụ kiện trong mẫu */
  mergeUnitCols?: boolean;
}

/**
 * Dựng các dòng dữ liệu khớp layout file mẫu "hoá đơn tôn bản chính.xlsx"
 * (bắt đầu từ dòng 11, sau hàng tiêu đề cột).
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
      unitPrice: toExcelThousand(group.unitPrice),
      subtotal: toExcelThousand(group.subtotal),
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
      unitPrice: toExcelThousand(acc.unitPrice),
      subtotal: toExcelThousand(acc.subtotal),
      kind: "accessory",
      mergeUnitCols: true,
    });
  }

  rows.push({
    stt: 0,
    name: "",
    length: null,
    pieces: null,
    meters: null,
    widthOrUnit: null,
    squareMeters: null,
    unitPrice: null,
    subtotal: "------------------------",
    kind: "separator",
  });

  rows.push({
    stt: 0,
    name: "",
    length: null,
    pieces: null,
    meters: null,
    widthOrUnit: null,
    squareMeters: null,
    unitPrice: null,
    subtotal: toExcelThousand(order.totalAmount),
    kind: "grand_total",
  });

  return rows;
}

const TEMPLATE_PUBLIC_PATH = "/templates/hoa-don-ton-ban-chinh.xlsx";
const TEMPLATE_FS_PATH = "public/templates/hoa-don-ton-ban-chinh.xlsx";
const DATA_START_ROW = 11; // Dòng đầu tiên sau tiêu đề cột (dòng 10)
const FOOTER_LABEL_ROW = 43; // "Tổng đơn hàng" trong mẫu

async function loadTemplateBuffer(): Promise<ArrayBuffer> {
  if (typeof window !== "undefined") {
    const res = await fetch(TEMPLATE_PUBLIC_PATH);
    if (!res.ok) {
      throw new Error("Không tải được mẫu Excel hoá đơn tôn bản chính.");
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
 * Xuất đơn hàng ra .xlsx đúng form mẫu "hoá đơn tôn bản chính.xlsx"
 * (giữ header ảnh đại lý, cột, merge, định dạng số nghìn đồng).
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

  // Gỡ merge động của vùng dữ liệu mẫu (giữ A1:I9 header và footer A43+)
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

  // Xóa nội dung vùng dữ liệu trước footer
  for (let r = DATA_START_ROW; r < FOOTER_LABEL_ROW; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 9; c++) {
      clearCell(row.getCell(c));
    }
    row.commit();
  }

  const dataRows = buildRoofingExcelDataRows(order);
  const neededEndRow = DATA_START_ROW + dataRows.length - 1;

  // Nếu dữ liệu dài hơn khoảng trống trước footer → chèn thêm dòng
  if (neededEndRow >= FOOTER_LABEL_ROW) {
    const insertCount = neededEndRow - FOOTER_LABEL_ROW + 3;
    worksheet.spliceRows(FOOTER_LABEL_ROW, 0, ...Array.from({ length: insertCount }, () => []));
  }

  const pendingNameMerges: Array<{ start: number; end: number }> = [];
  const pendingUnitMerges: number[] = [];

  dataRows.forEach((data, index) => {
    const rowNumber = DATA_START_ROW + index;
    const row = worksheet.getRow(rowNumber);

    if (data.kind === "separator") {
      setNumber(row.getCell(9), data.subtotal);
      row.commit();
      return;
    }

    if (data.kind === "grand_total") {
      setNumber(row.getCell(9), data.subtotal, "#,##0.000");
      row.getCell(9).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" },
      };
      row.getCell(9).font = { bold: true };
      row.commit();
      return;
    }

    if (data.stt > 0) {
      row.getCell(1).value = data.stt;
    }

    // Chỉ ghi tên khi có nội dung — tránh ghi null vào vùng merge làm mất giá trị master
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
      setNumber(row.getCell(9), data.subtotal, "#,##0.000");
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
      setNumber(row.getCell(9), data.subtotal, "#,##0.000");
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

  // Merge sau khi ghi xong toàn bộ dòng — tránh bị ghi đè null làm mất tên hàng
  for (const m of pendingNameMerges) {
    worksheet.mergeCells(m.start, 2, m.end, 2);
  }
  for (const r of pendingUnitMerges) {
    worksheet.mergeCells(r, 6, r, 7);
  }

  const exportName = fileName || `Hoa_Don_${order.orderCode || "Ton"}.xlsx`;
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

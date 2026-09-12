import * as XLSX from "xlsx";

/**
 * Tiện ích xuất dữ liệu mảng đối tượng ra file Excel (.xlsx)
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: readonly T[],
  fileName: string = "export"
) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Chuyển mảng dữ liệu JSON thành Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data as T[]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Xuất file
  const fullFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
}

/**
 * Tiện ích xuất dữ liệu ra file CSV chuẩn UTF-8
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: readonly T[],
  fileName: string = "export"
) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data as T[]);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  // Thêm BOM UTF-8 để Excel đọc không bị lỗi font Tiếng Việt
  const blob = new Blob(["\uFEFF" + csvOutput], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const fullFileName = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", fullFileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

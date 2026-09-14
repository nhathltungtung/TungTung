"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export interface ImportColumnDefinition {
  key: string;
  label: string;
  example: string;
  required?: boolean;
}

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  templateFileName?: string;
  columns: ImportColumnDefinition[];
  onImport: (rows: Record<string, unknown>[]) => Promise<{ success: boolean; count?: number; error?: string }>;
}

export function DataImportModal({
  isOpen,
  onClose,
  title,
  description = "Tải lên file Excel (.xlsx) hoặc CSV để nạp nhanh nhiều bản ghi vào hệ thống.",
  templateFileName = "import_template",
  columns,
  onImport,
}: DataImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [columnErrors, setColumnErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset state on close
  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setColumnErrors([]);
    onClose();
  };

  // 1. Download Sample Excel Template
  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const sampleRow: Record<string, string> = {};
      columns.forEach((col) => {
        sampleRow[col.label] = col.example;
      });

      const worksheet = XLSX.utils.json_to_sheet([sampleRow]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, `${templateFileName}.xlsx`);
      toast.success("Đã tải xuống file mẫu thành công!");
    } catch {
      toast.error("Không thể tạo file mẫu, vui lòng thử lại.");
    }
  };

  // 2. Parse Excel/CSV File
  const handleFileSelect = async (selectedFile: File) => {
    const isExcel = selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls");
    const isCsv = selectedFile.name.endsWith(".csv");

    if (!isExcel && !isCsv) {
      toast.error("Vui lòng chọn định dạng file .xlsx, .xls hoặc .csv");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setColumnErrors([]);

    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (!rawData || rawData.length === 0) {
        toast.error("File tải lên không có dữ liệu!");
        setParsedRows([]);
        setIsParsing(false);
        return;
      }

      // Validate required columns
      const firstRow = rawData[0];
      const uploadedHeaders = Object.keys(firstRow).map((h) => h.trim().toLowerCase());
      const missingRequiredCols = columns
        .filter((c) => c.required)
        .filter((c) => {
          const keyMatch = uploadedHeaders.includes(c.key.toLowerCase());
          const labelMatch = uploadedHeaders.includes(c.label.toLowerCase());
          return !keyMatch && !labelMatch;
        });

      if (missingRequiredCols.length > 0) {
        setColumnErrors(missingRequiredCols.map((c) => c.label));
      }

      // Map rows to normalized object keys
      const normalizedRows = rawData.map((row) => {
        const normalizedItem: Record<string, unknown> = {};
        columns.forEach((col) => {
          // Find matching key either by label or by key
          const val =
            row[col.label] !== undefined
              ? row[col.label]
              : row[col.key] !== undefined
              ? row[col.key]
              : "";
          normalizedItem[col.key] = val;
        });
        return normalizedItem;
      });

      setParsedRows(normalizedRows);
      toast.success(`Đã đọc ${normalizedRows.length} bản ghi từ file.`);
    } catch {
      toast.error("Lỗi khi đọc file Excel, vui lòng kiểm tra lại định dạng.");
    } finally {
      setIsParsing(false);
    }
  };

  // 3. Submit Import Action
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    if (columnErrors.length > 0) {
      toast.error("File thiếu các cột bắt buộc. Vui lòng kiểm tra lại.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await onImport(parsedRows);
      if (res.success) {
        toast.success(`Nạp thành công ${res.count ?? parsedRows.length} bản ghi vào hệ thống!`);
        handleClose();
      } else {
        toast.error(res.error || "Nạp dữ liệu thất bại.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi nạp dữ liệu.";
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Step 1: Download template bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-300">
              Bạn chưa có file theo đúng cấu trúc chuẩn?
            </p>
            <p className="text-blue-700 dark:text-blue-400 mt-0.5 text-[11px]">
              Tải file mẫu để điền dữ liệu chính xác trước khi nạp vào hệ thống.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file mẫu (.xlsx)</span>
          </button>
        </div>

        {/* Step 2: Drag and drop zone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-slate-300 dark:border-[#2e3a47] hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-[#24303f]/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Kéo thả file vào đây hoặc <span className="text-blue-600 dark:text-blue-400 underline">duyệt từ máy tính</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Định dạng hỗ trợ: .xlsx, .xls, .csv (Dung lượng tối đa 10MB)
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* File info bar */
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{file.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} dòng dữ liệu
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setParsedRows([]);
                setColumnErrors([]);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              title="Chọn file khác"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Missing Column Warnings */}
        {columnErrors.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">File của bạn thiếu các cột bắt buộc sau:</p>
              <p className="mt-0.5">{columnErrors.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Step 3: Data Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Xem trước dữ liệu ({parsedRows.length} bản ghi)
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Hiển thị tối đa 5 dòng đầu
              </span>
            </div>

            <div className="border border-slate-200 dark:border-[#2e3a47] rounded-xl overflow-hidden overflow-x-auto max-h-48 text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-[#1c2434] text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-[#2e3a47]">
                  <tr>
                    <th className="p-2.5">#</th>
                    {columns.map((col) => (
                      <th key={col.key} className="p-2.5 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2e3a47] text-slate-700 dark:text-slate-300">
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#24303f]/50">
                      <td className="p-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      {columns.map((col) => (
                        <td key={col.key} className="p-2.5 whitespace-nowrap max-w-xs truncate">
                          {String(row[col.key] || "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2e3a47]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#24303f] transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0 || columnErrors.length > 0 || isImporting || isParsing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors cursor-pointer shadow-md shadow-blue-600/20"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang nạp dữ liệu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận nạp {parsedRows.length} bản ghi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

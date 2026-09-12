"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, CheckCircle2, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

export interface FileUploaderProps {
  onFileSelect?: (file: File | null, fileUrl?: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  initialPreviewUrl?: string;
  className?: string;
}

export function FileUploader({
  onFileSelect,
  accept = "image/png,image/jpeg,image/webp,image/gif",
  maxSizeMB = 5,
  label,
  helperText = "Hỗ trợ định dạng PNG, JPG, WEBP (Dung lượng tối đa 5MB)",
  initialPreviewUrl,
  className,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const processFile = (file: File) => {
    // Validate File Size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error("Tệp quá dung lượng cho phép!", {
        description: `Tệp tải lên (${fileSizeMB.toFixed(1)}MB) vượt quá hạn mức tối đa ${maxSizeMB}MB.`,
      });
      return;
    }

    // Validate File Type
    if (accept) {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const isAccepted = acceptedTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", ""));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        toast.error("Định dạng tệp không được hỗ trợ!", {
          description: `Vui lòng chỉ chọn các tệp thuộc định dạng: ${accept}`,
        });
        return;
      }
    }

    setSelectedFile(file);

    // Create local preview if image
    if (file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }

    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success("Tải tệp lên thành công!");
          if (onFileSelect) {
            onFileSelect(file, file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined);
          }
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={accept}
        className="hidden"
      />

      {previewUrl ? (
        /* Preview Card */
        <div className="relative p-3 rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#24303f] flex items-center gap-3 animate-in fade-in duration-150">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
              {selectedFile?.name || "Ảnh đại diện đã chọn"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(0)} KB`
                : "Đã sẵn sàng tải lên"}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Đã kiểm tra hợp lệ
            </span>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Gỡ bỏ tệp này"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer",
            dragOver
              ? "border-blue-500 bg-blue-500/5"
              : "border-slate-200 dark:border-[#2e3a47] bg-slate-50/50 dark:bg-[#24303f]/30 hover:bg-slate-100/60 dark:hover:bg-[#24303f]/60 hover:border-slate-300 dark:hover:border-slate-600"
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
            <UploadCloud className="w-5 h-5" />
          </div>

          <p className="text-xs font-semibold text-slate-800 dark:text-white">
            <span className="text-blue-600 dark:text-blue-400 hover:underline">
              Bấm để chọn tệp
            </span>{" "}
            hoặc kéo thả tệp vào đây
          </p>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {helperText}
          </p>
        </div>
      )}

      {/* Progress Bar when uploading */}
      {isUploading && (
        <div className="space-y-1 pt-1 animate-in fade-in">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tải tệp lên máy chủ...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-[#24303f] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-200 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

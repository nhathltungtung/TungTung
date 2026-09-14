"use client";

import React, { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, X, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  bucket: "avatars" | "product-images";
  folder?: string;
  label?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
  aspectRatio?: "square" | "banner" | "auto";
}

export function ImageUploader({
  value,
  onChange,
  bucket,
  folder,
  label = "Tải ảnh lên",
  maxSizeMB = 5,
  disabled = false,
  className,
  aspectRatio = "square",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (disabled || isUploading) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn định dạng file ảnh hợp lệ (PNG, JPG, WEBP, SVG).");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Dung lượng ảnh vượt quá giới hạn cho phép (${maxSizeMB} MB).`);
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = folder
        ? `${folder}/${Date.now()}-${sanitizedName}`
        : `${Date.now()}-${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(publicUrlData.publicUrl);
      toast.success("Tải ảnh lên thành công!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi tải ảnh lên.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        // Image Preview State
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-[#2e3a47] bg-slate-50 dark:bg-[#1c2434] p-1.5">
          <div
            onClick={() => setPreviewOpen(true)}
            className={cn(
              "relative rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 cursor-zoom-in",
              aspectRatio === "square" ? "h-36 w-full" : "h-28 w-full"
            )}
            title="Nhấp để xem ảnh phóng to"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            />
          </div>

          {!disabled ? (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="p-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 shadow-md cursor-pointer transition-colors"
                title="Xem ảnh phóng to"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-md cursor-pointer transition-colors"
              >
                Đổi ảnh
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer transition-colors"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setPreviewOpen(true)}
              className="absolute inset-0 flex items-center justify-center cursor-zoom-in bg-black/0 hover:bg-black/20 transition-colors"
              title="Nhấp để xem ảnh phóng to"
            />
          )}

          <ImagePreviewModal
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
            imageUrl={value}
            title={label || "Hình ảnh"}
          />
        </div>
      ) : (
        // Dropzone State
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
              : "border-slate-300 dark:border-[#2e3a47] hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-[#1c2434]/60",
            disabled && "opacity-50 cursor-not-allowed",
            aspectRatio === "square" ? "h-36" : "h-28"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Đang tải ảnh lên...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Kéo thả hoặc <span className="text-blue-600 dark:text-blue-400 underline">duyệt ảnh</span>
              </div>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, WEBP tối đa {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

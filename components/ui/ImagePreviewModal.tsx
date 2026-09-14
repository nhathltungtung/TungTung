"use client";

import React, { useEffect, useCallback, useState } from "react";
import { X, ExternalLink, Download, Loader2, ImageOff } from "lucide-react";

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  description?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  description,
}: ImagePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [prevUrl, setPrevUrl] = useState(imageUrl);
  if (prevUrl !== imageUrl) {
    setPrevUrl(imageUrl);
    setIsLoading(true);
    setHasError(false);
  }

  // Handle ESC key press
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Top Control Bar */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between gap-4 mb-3 text-white">
        <div className="flex flex-col min-w-0 pr-4">
          <h4 className="text-base sm:text-lg font-semibold truncate tracking-tight text-white drop-shadow-sm">
            {title || "Xem trước hình ảnh"}
          </h4>
          {description && (
            <p className="text-xs text-white/70 truncate">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Open Original in New Tab */}
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-colors shadow-xs"
            title="Mở ảnh gốc trong tab mới"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mở ảnh gốc</span>
          </a>

          {/* Download button */}
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Tải ảnh về"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white hover:text-rose-300 transition-colors cursor-pointer"
            title="Đóng (ESC)"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="relative z-10 max-w-5xl max-h-[82vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="text-xs">Đang tải hình ảnh...</span>
          </div>
        )}

        {/* Error Fallback */}
        {hasError ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-white/70">
            <ImageOff className="w-12 h-12 text-rose-400" />
            <p className="text-sm font-medium text-white">Không thể tải hình ảnh</p>
            <p className="text-xs text-white/50 max-w-md text-center truncate">
              {imageUrl}
            </p>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={title || "Preview image"}
            className={`max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        )}
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 mt-3 text-xs text-white/50 text-center">
        Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white/90 font-mono text-[11px]">ESC</kbd> hoặc nhấp vùng tối để đóng
      </div>
    </div>
  );
}

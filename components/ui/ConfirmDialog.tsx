"use client";

import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle, AlertOctagon, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertOctagon,
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    buttonBg: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    buttonBg: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    buttonBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác Nhận",
  cancelText = "Hủy Bỏ",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border mb-4",
            config.iconBg
          )}
        >
          <IconComponent className={cn("w-6 h-6", config.iconColor)} />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
          {title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {description}
        </p>

        <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-[#2e3a47] flex items-center gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-1/2 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2e3a47] text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "w-1/2 py-2.5 px-4 text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50",
              config.buttonBg
            )}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

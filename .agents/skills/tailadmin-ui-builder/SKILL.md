---
name: tailadmin-ui-builder
description: >-
  Runbook for designing, constructing, and styling UI components following the TailAdmin
  design system in Base Next.js (Tailwind CSS v4, Dark mode tokens, interactive primitives).
---

# TailAdmin UI Builder - Design System Runbook

Use this skill whenever you need to create new UI components, dashboard widgets, modal dialogs, or customize layouts while maintaining strict design consistency with TailAdmin.

---

## 🎨 1. Core Visual Tokens & Tailwind v4

All styling follows the design language defined in `app/globals.css`:

### Surfaces & Backgrounds
- **Card Container**: `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-xs`
- **Page Background**: `bg-gray-50 dark:bg-gray-900`
- **Subtle Surface / Hover**: `hover:bg-gray-50 dark:hover:bg-gray-700/40`

### Typography & Headings
- **Page Header**: `text-2xl font-bold text-gray-900 dark:text-white`
- **Section Subtitle**: `text-sm text-gray-500 dark:text-gray-400`
- **Body Text**: `text-sm text-gray-700 dark:text-gray-300`

### Brand Colors & Badges
- **Primary / Brand**: Blue accent `bg-blue-600 hover:bg-blue-700 text-white`
- **Success Badge**: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60`
- **Warning Badge**: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60`
- **Danger Badge**: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60`
- **Neutral Badge**: `bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600`

---

## 🧩 2. Reusable Primitives Catalog

Before creating custom components from scratch, leverage existing primitives in `components/ui/`:

### A. Modal Dialog (`@/components/ui/Modal.tsx`)
```tsx
import { Modal } from "@/components/ui/Modal";

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Thêm Bản Ghi Mới">
  <form onSubmit={handleSubmit}>
    {/* Form contents */}
  </form>
</Modal>
```

### B. Slide-over Drawer (`@/components/ui/Drawer.tsx`)
```tsx
import { Drawer } from "@/components/ui/Drawer";

<Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Chi Tiết Đơn Hàng">
  <div className="space-y-4">
    {/* Detailed info */}
  </div>
</Drawer>
```

### C. Confirmation Dialog (`@/components/ui/ConfirmDialog.tsx`)
```tsx
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

<ConfirmDialog
  isOpen={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  onConfirm={handleDelete}
  title="Xác nhận xóa"
  description="Hành động này sẽ xóa vĩnh viễn dữ liệu và không thể hoàn tác."
  confirmText="Xác nhận xóa"
  cancelText="Hủy bỏ"
  type="danger"
  isLoading={isDeleting}
/>
```

### D. File Uploader (`@/components/ui/FileUploader.tsx`)
```tsx
import { FileUploader } from "@/components/ui/FileUploader";

<FileUploader
  accept="image/*"
  maxSizeMB={5}
  onUploadSuccess={(url) => setAvatarUrl(url)}
/>
```

---

## 📊 3. Dashboard KPI StatCard Pattern

When building overview metrics:

```tsx
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
}

export function StatCard({ title, value, change, isPositive, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-700/60 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        <span className={`inline-flex items-center text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isPositive ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
          {change}
        </span>
      </div>
    </div>
  );
}
```

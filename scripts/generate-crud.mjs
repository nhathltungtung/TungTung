#!/usr/bin/env node

/**
 * Base Next.js - Production-Grade Enterprise CRUD Module Generator
 * 
 * Usage:
 *   node scripts/generate-crud.mjs <entity-name> [singular-label] [plural-label]
 * Example:
 *   node scripts/generate-crud.mjs customers "Khách hàng" "Khách hàng"
 *   node scripts/generate-crud.mjs categories "Danh mục" "Danh mục sản phẩm"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
\x1b[36mBase Next.js Enterprise CRUD Generator\x1b[0m
---------------------------------------------
Usage:
  node scripts/generate-crud.mjs <entity-name> [singular-label] [plural-label]

Examples:
  node scripts/generate-crud.mjs customers "Khách hàng" "Khách hàng"
  node scripts/generate-crud.mjs categories "Danh mục" "Danh mục sản phẩm"
  node scripts/generate-crud.mjs suppliers "Nhà cung cấp" "Nhà cung cấp"
`);
  process.exit(0);
}

const rawName = args[0].toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
const entitySingular = rawName.endsWith("s") ? rawName.slice(0, -1) : rawName;
const entityPlural = rawName.endsWith("s") ? rawName : rawName + "s";

// PascalCase names
const toPascalCase = (str) =>
  str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");

const entitySingularPascal = toPascalCase(entitySingular);
const entityPluralPascal = toPascalCase(entityPlural);

// Labels
const singularLabel = args[1] || entitySingularPascal;
const pluralLabel = args[2] || (singularLabel + " (Danh sách)");

console.log(`\n🚀 Generating Enterprise CRUD Module: \x1b[32m${entityPlural}\x1b[0m`);
console.log(`   Singular: \x1b[33m${entitySingularPascal}\x1b[0m ("${singularLabel}")`);
console.log(`   Plural:   \x1b[33m${entityPluralPascal}\x1b[0m ("${pluralLabel}")\n`);

const timestamp = new Date()
  .toISOString()
  .replace(/[-:T]/g, "")
  .slice(0, 14);

// 1. TypeScript types: types/<entitySingular>.ts
const typesContent = `export type ${entitySingularPascal}Status = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface ${entitySingularPascal} {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ${entitySingularPascal}Status;
  created_at: string;
  updated_at?: string;
}

export interface Create${entitySingularPascal}Input {
  name: string;
  code: string;
  description?: string;
  status: ${entitySingularPascal}Status;
}

export type Update${entitySingularPascal}Input = Partial<Create${entitySingularPascal}Input>;
`;

// 2. SQL Migration: supabase/migrations/<timestamp>_create_<entityPlural>.sql
const sqlMigrationContent = `-- Migration: ${timestamp}_create_${entityPlural}.sql
-- Description: Create table public.${entityPlural}, indexes, RLS, and seed data

CREATE TABLE IF NOT EXISTS public.${entityPlural} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_${entityPlural}_status ON public.${entityPlural}(status);
CREATE INDEX IF NOT EXISTS idx_${entityPlural}_created_at ON public.${entityPlural}(created_at DESC);

-- Enable RLS
ALTER TABLE public.${entityPlural} ENABLE ROW LEVEL SECURITY;

-- Read policy for authenticated users
CREATE POLICY "Allow authenticated read ${entityPlural}"
  ON public.${entityPlural}
  FOR SELECT
  TO authenticated
  USING (true);

-- Management policy for admin/manager
CREATE POLICY "Allow admin/manager manage ${entityPlural}"
  ON public.${entityPlural}
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Sample seed data
INSERT INTO public.${entityPlural} (name, code, description, status)
VALUES
  ('${singularLabel} Mẫu 01', '${entitySingular.toUpperCase()}-001', 'Mô tả chi tiết cho ${singularLabel} mẫu số 1', 'ACTIVE'),
  ('${singularLabel} Mẫu 02', '${entitySingular.toUpperCase()}-002', 'Mô tả chi tiết cho ${singularLabel} mẫu số 2', 'ACTIVE'),
  ('${singularLabel} Mẫu 03', '${entitySingular.toUpperCase()}-003', 'Mô tả chi tiết cho ${singularLabel} mẫu số 3', 'INACTIVE')
ON CONFLICT (code) DO NOTHING;
`;

// 3. Schemas: app/(admin)/admin/<entityPlural>/schemas.ts
const schemasContent = `import { z } from "zod";

export const ${entitySingular}Schema = z.object({
  name: z.string().min(2, "Tên ${singularLabel.toLowerCase()} tối thiểu 2 ký tự"),
  code: z.string().min(2, "Mã ${singularLabel.toLowerCase()} tối thiểu 2 ký tự").toUpperCase(),
  description: z.string().optional().default(""),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"], {
    errorMap: () => ({ message: "Trạng thái không hợp lệ" }),
  }),
});

export type ${entitySingularPascal}FormValues = z.infer<typeof ${entitySingular}Schema>;

export const batchDeleteSchema = z.object({
  ids: z.array(z.string().uuid("ID không hợp lệ")).min(1, "Vui lòng chọn ít nhất 1 bản ghi"),
});
`;

// 4. Server Actions: app/(admin)/admin/<entityPlural>/actions.ts
const actionsContent = `"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ${entitySingular}Schema, batchDeleteSchema, ${entitySingularPascal}FormValues } from "./schemas";
import { logActivity } from "@/lib/audit";

export async function create${entitySingularPascal}Action(input: ${entitySingularPascal}FormValues) {
  try {
    const validated = ${entitySingular}Schema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("${entityPlural}")
      .insert({
        name: validated.name,
        code: validated.code,
        description: validated.description,
        status: validated.status,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Mã ${singularLabel.toLowerCase()} đã tồn tại trong hệ thống" };
      }
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "CREATE_${entitySingular.toUpperCase()}",
      level: "INFO",
      resource: "${entityPlural}",
      metadata: { id: data.id, name: data.name, code: data.code },
    });

    revalidatePath("/admin/${entityPlural}");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Lỗi xử lý thêm mới" };
  }
}

export async function update${entitySingularPascal}Action(id: string, input: ${entitySingularPascal}FormValues) {
  try {
    const validated = ${entitySingular}Schema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("${entityPlural}")
      .update({
        name: validated.name,
        code: validated.code,
        description: validated.description,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Mã ${singularLabel.toLowerCase()} đã tồn tại ở bản ghi khác" };
      }
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "UPDATE_${entitySingular.toUpperCase()}",
      level: "INFO",
      resource: "${entityPlural}",
      metadata: { id, name: data.name },
    });

    revalidatePath("/admin/${entityPlural}");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Lỗi xử lý cập nhật" };
  }
}

export async function delete${entitySingularPascal}Action(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("${entityPlural}").delete().eq("id", id);

    if (error) return { success: false, error: error.message };

    await logActivity({
      action: "DELETE_${entitySingular.toUpperCase()}",
      level: "WARNING",
      resource: "${entityPlural}",
      metadata: { id },
    });

    revalidatePath("/admin/${entityPlural}");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Lỗi xóa bản ghi" };
  }
}

export async function batchDelete${entityPluralPascal}Action(ids: string[]) {
  try {
    const validated = batchDeleteSchema.parse({ ids });
    const supabase = await createClient();

    const { error } = await supabase.from("${entityPlural}").delete().in("id", validated.ids);

    if (error) return { success: false, error: error.message };

    await logActivity({
      action: "BATCH_DELETE_${entityPlural.toUpperCase()}",
      level: "WARNING",
      resource: "${entityPlural}",
      metadata: { count: ids.length, ids },
    });

    revalidatePath("/admin/${entityPlural}");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Lỗi xóa hàng loạt" };
  }
}
`;

// 5. Page: app/(admin)/admin/<entityPlural>/page.tsx
const pageContent = `import React from "react";
import { createClient } from "@/lib/supabase/server";
import { ${entityPluralPascal}TableClient } from "@/components/admin/${entityPlural}/${entityPluralPascal}TableClient";
import { ${entitySingularPascal} } from "@/types";
import { Layers, CheckCircle2, XCircle } from "lucide-react";

export const metadata = {
  title: "Quản Lý ${pluralLabel} | Base Next.js",
  description: "Quản lý danh sách ${pluralLabel.toLowerCase()} đồng bộ dữ liệu PostgreSQL",
};

export default async function ${entityPluralPascal}Page() {
  const supabase = await createClient();

  const [totalRes, activeRes, inactiveRes, dataRes] = await Promise.all([
    supabase.from("${entityPlural}").select("*", { count: "exact", head: true }),
    supabase.from("${entityPlural}").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("${entityPlural}").select("*", { count: "exact", head: true }).in("status", ["INACTIVE", "ARCHIVED"]),
    supabase.from("${entityPlural}").select("*").order("created_at", { ascending: false }),
  ]);

  const totalCount = totalRes.count ?? 0;
  const activeCount = activeRes.count ?? 0;
  const inactiveCount = inactiveRes.count ?? 0;
  const items: ${entitySingularPascal}[] = (dataRes.data as ${entitySingularPascal}[]) || [];

  return (
    <${entityPluralPascal}TableClient
      initialItems={items}
      kpiOverview={
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng ${pluralLabel.toLowerCase()}</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalCount.toLocaleString("vi-VN")}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang hoạt động</span>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {activeCount.toLocaleString("vi-VN")}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tạm dừng / Lưu trữ</span>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {inactiveCount.toLocaleString("vi-VN")}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      }
    />
  );
}
`;

// 6. Loading: app/(admin)/admin/<entityPlural>/loading.tsx
const loadingContent = `import React from "react";

function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xs flex items-center justify-between animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg mt-2" />
      </div>
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50" />
    </div>
  );
}

export default function ${entityPluralPascal}Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-60 bg-slate-200 dark:bg-slate-700/60 rounded-xl animate-pulse" />
          <div className="h-3.5 w-96 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-700/60 rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] shadow-xs p-6 h-96 animate-pulse" />
    </div>
  );
}
`;

// 7. Table Client: components/admin/<entityPlural>/<entityPluralPascal>TableClient.tsx
const tableClientContent = `"use client";

import React, { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { ${entitySingularPascal}FormModal } from "./${entitySingularPascal}FormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ${entitySingularPascal} } from "@/types";
import { delete${entitySingularPascal}Action, batchDelete${entityPluralPascal}Action } from "@/app/(admin)/admin/${entityPlural}/actions";
import { Plus, Eye, Edit2, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialItems: ${entitySingularPascal}[];
  kpiOverview?: React.ReactNode;
}

export function ${entityPluralPascal}TableClient({ initialItems, kpiOverview }: Props) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | "view";
    item?: ${entitySingularPascal};
  }>({
    isOpen: false,
    mode: "create",
  });

  const [deleteTarget, setDeleteTarget] = useState<${entitySingularPascal} | null>(null);
  const [batchTarget, setBatchTarget] = useState<${entitySingularPascal}[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const getStatusBadge = (status: ${entitySingularPascal}["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hoạt động
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Tạm dừng
          </span>
        );
      case "ARCHIVED":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Lưu trữ
          </span>
        );
    }
  };

  const columns: ColumnDef<${entitySingularPascal}>[] = [
    {
      id: "select",
      size: 44,
      enableResizing: false,
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      ),
    },
    {
      id: "code",
      accessorKey: "code",
      size: 130,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono text-xs">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      size: 240,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tên ${singularLabel}" />,
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      id: "description",
      accessorKey: "description",
      size: 260,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mô tả" />,
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs inline-block">
          {row.getValue("description") || "—"}
        </span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      size: 140,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      size: 140,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
      cell: ({ row }) => {
        const val = row.getValue("created_at") as string;
        return (
          <span className="text-slate-500 dark:text-slate-400">
            {val ? new Date(val).toLocaleDateString("vi-VN") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      size: 120,
      header: "Thao tác",
      enableResizing: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalState({ isOpen: true, mode: "view", item: row.original });
            }}
            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalState({ isOpen: true, mode: "edit", item: row.original });
            }}
            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row.original);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await delete${entitySingularPascal}Action(deleteTarget.id);
      if (res.success) {
        toast.success(\`Đã xóa \${deleteTarget.name} thành công!\`);
        setDeleteTarget(null);
      } else {
        toast.error(res.error || "Xóa thất bại");
      }
    });
  };

  const handleBatchDeleteConfirm = () => {
    if (!batchTarget || batchTarget.length === 0) return;
    startTransition(async () => {
      const ids = batchTarget.map((i) => i.id);
      const res = await batchDelete${entityPluralPascal}Action(ids);
      if (res.success) {
        toast.success(\`Đã xóa \${ids.length} bản ghi thành công!\`);
        setBatchTarget(null);
      } else {
        toast.error(res.error || "Xóa hàng loạt thất bại");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản lý ${pluralLabel}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers className="w-3 h-3" /> PostgreSQL
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và đồng bộ thông tin ${pluralLabel.toLowerCase()}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalState({ isOpen: true, mode: "create" })}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm ${singularLabel.toLowerCase()} mới</span>
        </button>
      </div>

      {/* KPI Overview */}
      {kpiOverview}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={initialItems}
        searchKey="name"
        searchPlaceholder="Tìm kiếm theo tên hoặc mã..."
        filterColumn="status"
        filterTitle="Trạng thái"
        filterOptions={[
          { label: "Hoạt động", value: "ACTIVE" },
          { label: "Tạm dừng", value: "INACTIVE" },
          { label: "Lưu trữ", value: "ARCHIVED" },
        ]}
        exportFileName="${entityPlural}_data"
        batchActions={(selectedRows, resetSelection) => (
          <button
            type="button"
            onClick={() => {
              setBatchTarget(selectedRows);
              resetSelection();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa ({selectedRows.length})</span>
          </button>
        )}
      />

      {/* Unified Modal (Create / Edit / View - 50-50 Grid) */}
      <${entitySingularPascal}FormModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        item={modalState.item}
        onClose={() => setModalState({ isOpen: false, mode: "create" })}
        onModeChange={(nextMode) => setModalState((prev) => ({ ...prev, mode: nextMode }))}
      />

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Xác nhận xóa bản ghi"
        message={\`Bạn có chắc chắn muốn xóa "\${deleteTarget?.name}"? Thao tác này không thể hoàn tác.\`}
        type="danger"
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        isLoading={isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Batch Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!batchTarget}
        title="Xác nhận xóa hàng loạt"
        message={\`Bạn có chắc chắn muốn xóa \${batchTarget?.length || 0} bản ghi đã chọn? Thao tác này sẽ xóa vĩnh viễn khỏi hệ thống.\`}
        type="danger"
        confirmText="Xác nhận xóa tất cả"
        cancelText="Hủy bỏ"
        isLoading={isPending}
        onConfirm={handleBatchDeleteConfirm}
        onClose={() => setBatchTarget(null)}
      />
    </div>
  );
}
`;

// 8. Unified Modal: components/admin/<entityPlural>/<entitySingularPascal>FormModal.tsx
const modalContent = `"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/form";
import { ${entitySingular}Schema, ${entitySingularPascal}FormValues } from "@/app/(admin)/admin/${entityPlural}/schemas";
import { create${entitySingularPascal}Action, update${entitySingularPascal}Action } from "@/app/(admin)/admin/${entityPlural}/actions";
import { ${entitySingularPascal} } from "@/types";
import { toast } from "sonner";
import { Edit2, Loader2, Save } from "lucide-react";

interface Props {
  isOpen: boolean;
  mode: "create" | "edit" | "view";
  item?: ${entitySingularPascal};
  onClose: () => void;
  onModeChange?: (mode: "create" | "edit" | "view") => void;
}

export function ${entitySingularPascal}FormModal({
  isOpen,
  mode,
  item,
  onClose,
  onModeChange,
}: Props) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<${entitySingularPascal}FormValues>({
    resolver: zodResolver(${entitySingular}Schema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (item && (isEdit || isView)) {
      reset({
        name: item.name,
        code: item.code,
        description: item.description || "",
        status: item.status,
      });
    } else {
      reset({
        name: "",
        code: "",
        description: "",
        status: "ACTIVE",
      });
    }
  }, [item, isEdit, isView, reset, isOpen]);

  const onSubmit = async (values: ${entitySingularPascal}FormValues) => {
    if (isView) return;

    if (isEdit && item) {
      const res = await update${entitySingularPascal}Action(item.id, values);
      if (res.success) {
        toast.success("Cập nhật thông tin thành công!");
        onClose();
      } else {
        toast.error(res.error || "Cập nhật thất bại");
      }
    } else {
      const res = await create${entitySingularPascal}Action(values);
      if (res.success) {
        toast.success("Thêm mới bản ghi thành công!");
        onClose();
      } else {
        toast.error(res.error || "Thêm mới thất bại");
      }
    }
  };

  const getTitle = () => {
    if (isView) return "Chi Tiết ${singularLabel}";
    if (isEdit) return "Chỉnh Sửa ${singularLabel}";
    return "Thêm Mới ${singularLabel}";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      description={
        isView
          ? "Xem thông tin chi tiết của ${singularLabel.toLowerCase()}"
          : "Điền thông tin bên dưới và nhấn Lưu để hoàn tất"
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Balanced 50-50 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mã ${singularLabel}"
            required={!isView}
            disabled={isView}
            placeholder="VD: ${entitySingular.toUpperCase()}-001"
            error={errors.code?.message}
            {...register("code")}
          />

          <Input
            label="Tên ${singularLabel}"
            required={!isView}
            disabled={isView}
            placeholder="Nhập tên..."
            error={errors.name?.message}
            {...register("name")}
          />

          <Select
            label="Trạng thái"
            required={!isView}
            disabled={isView}
            error={errors.status?.message}
            {...register("status")}
            options={[
              { label: "Hoạt động", value: "ACTIVE" },
              { label: "Tạm dừng", value: "INACTIVE" },
              { label: "Lưu trữ", value: "ARCHIVED" },
            ]}
          />

          <div className="sm:col-span-2">
            <Textarea
              label="Mô tả ghi chú"
              disabled={isView}
              rows={3}
              placeholder="Nhập ghi chú thêm..."
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2e3a47]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2e3a47] bg-white dark:bg-[#1c2434] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#24303f] transition-colors cursor-pointer"
          >
            {isView ? "Đóng" : "Hủy bỏ"}
          </button>

          {isView ? (
            <button
              type="button"
              onClick={() => onModeChange?.("edit")}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Chuyển sang chỉnh sửa</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isEdit ? "Cập nhật" : "Lưu bản ghi"}</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
`;

// 9. Automated Vitest Unit Tests: tests/<entityPlural>/schemas.test.ts
const testContent = `import { describe, it, expect } from "vitest";
import { ${entitySingular}Schema, batchDeleteSchema } from "@/app/(admin)/admin/${entityPlural}/schemas";

describe("${entitySingularPascal} Module Schemas & Validation Test Suite", () => {
  describe("${entitySingularPascal} Schema Validation", () => {
    it("should validate a correct ${entitySingular} payload", () => {
      const payload = {
        name: "${singularLabel} Mẫu",
        code: "${entitySingular.toUpperCase()}-TEST-01",
        description: "Mô tả chi tiết kiểm thử tự động",
        status: "ACTIVE",
      };

      const result = ${entitySingular}Schema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("${singularLabel} Mẫu");
        expect(result.data.code).toBe("${entitySingular.toUpperCase()}-TEST-01");
        expect(result.data.status).toBe("ACTIVE");
      }
    });

    it("should reject payload when name is shorter than 2 characters", () => {
      const invalidPayload = {
        name: "A",
        code: "${entitySingular.toUpperCase()}-01",
        status: "ACTIVE",
      };

      const result = ${entitySingular}Schema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject payload with invalid status", () => {
      const invalidPayload = {
        name: "${singularLabel} Hợp lệ",
        code: "${entitySingular.toUpperCase()}-02",
        status: "INVALID_STATUS",
      };

      const result = ${entitySingular}Schema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Batch Delete Schema Validation", () => {
    it("should reject empty ids array", () => {
      const result = batchDeleteSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it("should accept valid UUIDs", () => {
      const result = batchDeleteSchema.safeParse({
        ids: ["123e4567-e89b-12d3-a456-426614174000"],
      });
      expect(result.success).toBe(true);
    });
  });
});
`;

// Helper to write file safely
function writeFile(targetPath, content) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(targetPath, content, "utf8");
  console.log(`  ✓ Created: \x1b[32m${path.relative(rootDir, targetPath)}\x1b[0m`);
}

// Create files
writeFile(path.join(rootDir, "types", `${entitySingular}.ts`), typesContent);
writeFile(
  path.join(rootDir, "supabase", "migrations", `${timestamp}_create_${entityPlural}.sql`),
  sqlMigrationContent
);
writeFile(path.join(rootDir, "app", "(admin)", "admin", entityPlural, "schemas.ts"), schemasContent);
writeFile(path.join(rootDir, "app", "(admin)", "admin", entityPlural, "actions.ts"), actionsContent);
writeFile(path.join(rootDir, "app", "(admin)", "admin", entityPlural, "page.tsx"), pageContent);
writeFile(path.join(rootDir, "app", "(admin)", "admin", entityPlural, "loading.tsx"), loadingContent);
writeFile(
  path.join(rootDir, "components", "admin", entityPlural, `${entityPluralPascal}TableClient.tsx`),
  tableClientContent
);
writeFile(
  path.join(rootDir, "components", "admin", entityPlural, `${entitySingularPascal}FormModal.tsx`),
  modalContent
);
writeFile(
  path.join(rootDir, "tests", entityPlural, "schemas.test.ts"),
  testContent
);

console.log(`
\x1b[32m✔ Thành công!\x1b[0m Đã tạo đầy đủ 9 file cho mô-đun \x1b[36m${entityPlural}\x1b[0m (kèm tự động sinh Vitest Test Suite).

\x1b[33mCác bước tiếp theo để kích hoạt:\x1b[0m
1. Nạp Migration vào PostgreSQL:
   \x1b[90mGet-Content supabase/migrations/${timestamp}_create_${entityPlural}.sql | docker exec -i supabase-db psql -U postgres -d postgres\x1b[0m

2. Export Type trong \x1b[36mtypes/index.ts\x1b[0m:
   \x1b[90mexport * from "./${entitySingular}";\x1b[0m

3. Thêm Menu vào Sidebar trong \x1b[36mlib/navigation.ts\x1b[0m:
   \x1b[90m{
     title: "${pluralLabel}",
     href: "/admin/${entityPlural}",
     icon: Layers,
   }\x1b[0m

4. Chạy kiểm thử tự động:
   \x1b[90mnpm run test\x1b[0m
`);


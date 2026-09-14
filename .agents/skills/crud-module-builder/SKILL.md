---
name: crud-module-builder
description: >-
  Step-by-step procedure to generate a complete end-to-end CRUD administrative module
  in Base Next.js (Database schema, TypeScript types, Server Actions, TanStack DataTable,
  Zod Form Modal, Drawer, ConfirmDialog, and Sidebar navigation registration).
---

# CRUD Module Builder - Runbook

Use this skill whenever you need to create a new administrative feature or entity (e.g. Products, Customers, Invoices, Categories, Inventory) in the Base Next.js project.

---

## 🚀 8-Step Implementation Procedure

### Step 1: Define TypeScript Types
Create `types/<entity>.ts` and export it in `types/index.ts`:

```typescript
// types/product.ts
export type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED";

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: ProductStatus;
  created_at: string;
  updated_at?: string;
}

export type CreateProductInput = Omit<Product, "id" | "created_at" | "updated_at">;
export type UpdateProductInput = Partial<CreateProductInput>;
```

---

### Step 2: Database Migration & RLS
Create a new migration in `supabase/migrations/<YYYYMMDD_HHMMSS>_create_<entity>.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON public.products
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update" ON public.products
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin delete" ON public.products
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
```

---

### Step 3: Server Actions & Data Access
Create `app/(admin)/admin/<entity>/actions.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm tối thiểu 2 ký tự"),
  sku: z.string().min(3, "Mã SKU tối thiểu 3 ký tự"),
  price: z.coerce.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  stock: z.coerce.number().int().min(0, "Tồn kho không được âm"),
  category: z.string().min(1, "Vui lòng chọn danh mục"),
  status: z.enum(["ACTIVE", "DRAFT", "OUT_OF_STOCK", "ARCHIVED"]),
});

export async function createProductAction(formData: unknown) {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, created_by: user?.id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  return { success: true, data };
}

export async function deleteProductAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  return { success: true };
}
```

---

### Step 4: Add / Edit Form Modal
Create `components/admin/<entity>/EntityFormModal.tsx` using `@/components/ui/Modal` and `@/components/ui/form/`:

- Use `react-hook-form` + `@hookform/resolvers/zod`.
- Import form primitives: `Input`, `Select`, `Switch`, etc.
- Trigger `toast.success(...)` or `toast.error(...)` via `sonner`.

---

### Step 5: TanStack Data Table
Create `components/admin/<entity>/EntityTable.tsx`:

- Import `DataTable` from `@/components/ui/table/DataTable`.
- Import `DataTableColumnHeader` from `@/components/ui/table/DataTableColumnHeader`.
- Configure column definitions with sorting, status badges, and an action dropdown/buttons (View, Edit, Delete).
- Hook up Excel & CSV export using `exportToExcel` and `exportToCSV` from `@/lib/export`.

---

### Step 6: Detail Drawer & Delete Confirmation
- Use `@/components/ui/Drawer` to inspect full record JSON/fields without leaving the page.
- Use `@/components/ui/ConfirmDialog` with `type="danger"` before invoking `deleteAction`.

---

### Step 7: Admin Page Layout
Create `app/(admin)/admin/<entity>/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { EntityTable } from "@/components/admin/<entity>/EntityTable";
import { Plus } from "lucide-react";

export default async function EntityPage() {
  const supabase = await createClient();
  const { data: items } = await supabase.from("<entity>").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Entity</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Xem và quản lý danh sách bản ghi</p>
        </div>
      </div>
      <EntityTable initialData={items || []} />
    </div>
  );
}
```

---

### Step 8: Register Route in Navigation Sidebar
Open `lib/navigation.ts` and add the new entry under the appropriate section:

```typescript
{
  title: "Sản phẩm",
  href: "/admin/products",
  icon: Package,
  badge: "Mới"
}
```

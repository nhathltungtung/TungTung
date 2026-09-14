---
name: nextjs-app-router
description: >-
  Advanced development guidelines and recipes for Next.js 16+ App Router, React 19,
  Server Actions, async request APIs, streaming, and error handling.
---

# Next.js 16+ App Router & React 19 - Best Practices

Use this skill when developing complex page layouts, streaming data with Suspense, refactoring route handlers, or optimizing Server Actions in Next.js 16+.

---

## ⚡ 1. Asynchronous Request APIs (Breaking in Next.js 15+)

In Next.js 16, dynamic values previously accessible synchronously are now **Promises**:

- `params`: Promise of route segments
- `searchParams`: Promise of query parameters
- `cookies()`: Asynchronous cookie store access
- `headers()`: Asynchronous header store access

### Page Component Pattern
```tsx
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductDetailPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const productId = params.id;
  const activeTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'overview';

  return (
    <div>
      <h1>Product: {productId}</h1>
      <p>Tab: {activeTab}</p>
    </div>
  );
}
```

---

## 🔄 2. Server Actions Architecture

Server Actions handle form submissions and database mutations without manual API route boilerplate:

### Pattern: Co-located Action with Zod Validation
```typescript
// app/(admin)/admin/inventory/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  reason: z.string().min(3),
});

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function adjustStockAction(payload: unknown): Promise<ActionResponse> {
  const validation = adjustStockSchema.safeParse(payload);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { productId, quantity, reason } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("adjust_inventory_stock", {
    p_product_id: productId,
    p_quantity: quantity,
    p_reason: reason,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/inventory");
  return { success: true, message: "Đã cập nhật tồn kho thành công" };
}
```

---

## 🌊 3. Streaming & Suspense Boundaries

Avoid blocking page rendering while fetching slow data. Wrap dynamic sections with `<Suspense>`:

```tsx
import { Suspense } from "react";
import { RecentOrdersSkeleton } from "@/components/dashboard/RecentOrdersSkeleton";
import { RecentOrdersSection } from "@/components/dashboard/RecentOrdersSection";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Fast loading KPI Cards */}
      <StatCardsGrid />

      {/* Heavy query wrapped in Suspense */}
      <Suspense fallback={<RecentOrdersSkeleton />}>
        <RecentOrdersSection />
      </Suspense>
    </div>
  );
}
```

---

## 🛡️ 4. Global Error & Not-Found Boundaries

- **`error.tsx`**: Must be a Client Component (`'use client'`). Catch unexpected runtime exceptions gracefully:
  ```tsx
  "use client";

  import { useEffect } from "react";

  export default function ErrorBoundary({
    error,
    reset,
  }: {
    error: Error & { digest?: string };
    reset: () => void;
  }) {
    useEffect(() => {
      console.error("Dashboard error:", error);
    }, [error]);

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Đã xảy ra lỗi!</h2>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
        <button onClick={() => reset()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Thử lại
        </button>
      </div>
    );
  }
  ```

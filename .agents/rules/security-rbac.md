# Security & Role-Based Access Control (RBAC) Rules

## 1. Authentication Lifecycle & Middleware

Authentication state and JWT refresh are managed automatically by `middleware.ts` using `@supabase/ssr`:

- **Unauthenticated requests** to `/admin/*` are automatically redirected to `/auth/signin?next={pathname}`.
- **Authenticated requests** to `/auth/*` (e.g. signin, signup) are redirected back to `/admin`.
- Session tokens are refreshed on every request via cookies, preventing unexpected session expiration.

## 2. Role-Based Access Control (RBAC) Hierarchy

The system defines three standard roles in `public.profiles`:

1. **`ADMIN`**:
   - Unrestricted access across all administration modules.
   - Allowed to manage users, modify roles, purge audit logs, and execute destructive operations.
2. **`MANAGER`**:
   - Access to operational modules (analytics, orders, inventory, transactions).
   - Read and write permissions for day-to-day business data, but cannot modify system settings or users.
3. **`USER`**:
   - Basic access level, restricted to their own data or read-only admin dashboards depending on business logic.

## 3. Client-Side Role Guarding (`<RoleGate />`)

To conditionally render UI elements (such as Delete buttons, Settings tabs, or Admin-only actions):

```tsx
import { RoleGate } from "@/components/auth/RoleGate";

// Example: Only ADMIN can delete
<RoleGate allowedRoles={['ADMIN']} fallback={<span className="text-xs text-gray-400">Chỉ Admin mới có quyền xóa</span>}>
  <button onClick={handleDelete} className="btn-danger">
    Xóa bản ghi
  </button>
</RoleGate>

// Example: ADMIN and MANAGER can export
<RoleGate allowedRoles={['ADMIN', 'MANAGER']}>
  <ExportButton data={records} />
</RoleGate>
```

## 4. Server-Side Protection (Server Actions & Route Handlers)

Client-side hiding is purely cosmetic for UX. Always enforce role checks on the server:

```tsx
"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteEntityAction(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Bạn phải đăng nhập để thực hiện thao tác này.");
  }

  // Check role in profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    throw new Error("Forbidden: Chỉ quản trị viên mới có quyền thực hiện thao tác này.");
  }

  // Proceed with deletion
  const { error } = await supabase.from("entities").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return { success: true };
}
```

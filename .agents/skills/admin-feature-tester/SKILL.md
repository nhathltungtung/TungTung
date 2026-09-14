---
name: admin-feature-tester
description: >-
  Comprehensive testing runbook and automated verification procedures for all
  administrative modules in Base Next.js: Real-time Dashboard, User Management,
  Audit Logs, Storage & File Upload, System Settings, DataTable Pagination, and
  CRUD CLI Generator.
---

# Admin Feature Tester - Runbook & Procedures

Use this skill whenever you need to verify, test, or troubleshoot the enterprise administrative features in Base Next.js.

---

## 📋 Comprehensive Feature Checklist

### 1. Phase 1: User Management (`/admin/users`)
- [ ] **Data Source**: Live data fetched from `public.profiles` table (RSC).
- [ ] **Metrics**: KPI cards display correct counts for Total Members, Admins, Managers, and Regular Users.
- [ ] **Unified Modal**: Create/Edit/View popup uses single `UserFormModal` with 50-50 grid (`grid grid-cols-1 sm:grid-cols-2 gap-4`).
- [ ] **Role & Status**: Toggle status (Active / Suspended) updates Postgres immediately.
- [ ] **Self-Delete Protection**: Current logged-in user cannot delete their own account.
- [ ] **Automated Test**: `tests/users/actions.test.ts` passes with 10/10 tests.

### 2. Phase 2: Automated Audit Logs (`/admin/audit-logs`)
- [ ] **Schema**: Table `public.audit_logs` has indexes on `action`, `level`, `created_at DESC`, `user_id`.
- [ ] **Triggering**: Performing any CRUD action in Products, Users, or Settings generates a log entry.
- [ ] **IP & Actor**: Client IP is extracted from `x-forwarded-for` or `x-real-ip` headers.
- [ ] **Payload Modal**: Clicking the eye icon opens the Unified Modal displaying formatted JSON metadata.
- [ ] **Level Filtering**: Tabs ("Tất cả", "INFO", "WARNING", "CRITICAL") filter entries accurately.

### 3. Phase 3: Supabase Storage & Upload
- [ ] **Buckets**: `avatars` and `product-images` exist with public read access.
- [ ] **Component**: `components/ui/form/ImageUploader.tsx` supports drag-and-drop, preview, and delete.
- [ ] **Size Validation**: Files > 5MB are rejected with an actionable toast error.
- [ ] **Product Integration**: Adding an image to a product displays the thumbnail in `ProductTableClient`.
- [ ] **Avatar Integration**: Camera button in Settings allows uploading a new avatar.

### 4. Phase 4: Real-Time PostgreSQL Dashboard (`/admin`)
- [ ] **Aggregations**:
  - Total Revenue = Sum of completed orders in `public.orders`.
  - Total Orders = Count of all rows in `public.orders`.
  - Active Members = Count of `public.profiles` where `status = 'Active'`.
  - Inventory Status = Total products and count of items with `stock < 10`.
- [ ] **Sync Button**: Clicking *"Đồng bộ dữ liệu"* calls `router.refresh()` and displays success toast.
- [ ] **Export Report**: Clicking *"Tải báo cáo"* downloads an Excel `.xlsx` spreadsheet with KPI summary, inventory metrics, and recent orders.

### 5. Phase 5: System Settings (`/admin/settings`)
- [ ] **Singleton Record**: Table `public.system_settings` contains exactly row `id = 1`.
- [ ] **General Settings Tab**: Tab 4 allows editing System Name, Support Email, Hotline, Maintenance Mode.
- [ ] **Security**: Tab is protected with `RoleGate` (Admin role required).
- [ ] **Audit Trail**: Updating settings writes an `UPDATE_SYSTEM_SETTINGS` record to `audit_logs`.

### 6. Phase 6: Big Data Server-Side Pagination & CRUD Generator
- [ ] **DataTable Props**: `<DataTable />` supports `manualPagination`, `pageCount`, `totalRows`, `paginationState`, and `onPaginationChange`.
- [ ] **Pagination Display**: Displays "Hiển thị 1 – 10 trong X kết quả" accurately based on `totalRows`.
- [ ] **Generator CLI**: Running `node scripts/generate-crud.mjs <name> [singular] [plural]` creates 8 production-grade files.
- [ ] **Help Command**: `npm run generate:crud --help` prints full usage instructions.

---

## 🚀 Step-by-Step Automated Verification Procedures

### Procedure 1: Run Full Automated Verification Script
Run the automated verification script that tests database tables, storage buckets, Server Action schemas, and HTTP endpoints:

```bash
node scripts/verify-all-features.mjs
```

### Procedure 2: Run Vitest Unit & Integration Suites
Execute all automated unit and integration tests:

```bash
npm run test
```

### Procedure 3: Validate Production Build
Ensure TypeScript strict mode and Next.js compiler find zero errors:

```bash
npm run build
```

### Procedure 4: Test CRUD Generator in Isolation
Generate a test entity (e.g. `suppliers`) to verify generation integrity:

```bash
node scripts/generate-crud.mjs suppliers "Nhà cung cấp" "Nhà cung cấp"
```

---

## 🔍 Database Sanity Check Queries

Run these queries via PostgreSQL Docker:

```powershell
# 1. Count records in all core tables
docker exec -i supabase-db psql -U postgres -d postgres -c "
SELECT 'profiles' AS table_name, count(*) FROM public.profiles
UNION ALL SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'audit_logs', count(*) FROM public.audit_logs
UNION ALL SELECT 'orders', count(*) FROM public.orders
UNION ALL SELECT 'system_settings', count(*) FROM public.system_settings;
"

# 2. Check storage buckets
docker exec -i supabase-db psql -U postgres -d postgres -c "
SELECT id, name, public FROM storage.buckets;
"
```

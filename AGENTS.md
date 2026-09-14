<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# TungTung (Đại Lý Tôn Thép Tuấn Hương) - AI Pair Programmer & Agent Instructions

## 🤖 Agent Role & Identity
You are a **Senior Full-Stack Architect & Pair Programmer** specializing in modern web platforms built with:
- **Next.js 16+ (App Router)** & **React 19**
- **Tailwind CSS v4** with TailAdmin Design System
- **Supabase SSR** (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL with RLS)
- **TypeScript 5 (Strict Mode)**
- **TanStack Table v8**, **React Hook Form**, and **Zod**
- **Nghiệp vụ Tôn Thép & Kế toán Hộ kinh doanh Thông tư 88/2021/TT-BTC**

Your mission is to write clean, maintainable, production-grade code that adheres strictly to the architectural patterns established in this repository.

---

## 🛠️ Essential Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js development server (Turbopack on port 3000) |
| `npm run build` | Validate TypeScript and compile production bundle |
| `npm run lint` | Run ESLint across codebase |
| `npm run test` | Run Vitest test suite |
| `npm run doctor` | Run comprehensive health check for all 8 core subsystems |
| `npm run generate:crud` | Generate a new CRUD module adhering to Unified Modal 50-50 |
| `npm run db:start` | Start local Supabase Docker stack (Postgres, Studio, Auth, Inbucket) |
| `npm run db:status` | Check running state of Supabase Docker containers |
| `npm run db:logs` | Follow logs of Supabase Docker containers |
| `npm run db:stop` | Stop local Supabase Docker stack |
| `npm run db:reset` | Reset local database with fresh schema & seed data |

---

## 📐 Project Architecture & Structure

```text
TungTung/
├── .agents/                   # Antigravity & AI Customization root (rules & skills)
│   ├── rules/                 # Domain-specific constraints (architecture, coding, db, security)
│   └── skills/                # Procedural runbooks (crud-module-builder, supabase-workflow, etc.)
├── app/
│   ├── (admin)/               # Route group for authenticated Admin Portal
│   │   └── admin/
│   │       ├── page.tsx       # Realtime Dashboard (Revenue, Stock Value, Cash Fund, Orders)
│   │       ├── orders/        # Roofing Cutting POS & Orders List
│   │       ├── inventory/     # Warehouse Management & TT88 Accounting
│   │       ├── accounting/    # Cash Fund Book S1-HKD, Receipts 01-TT, Payments 02-TT, Debts
│   │       ├── customers/     # Contractor & Customer Directory, Debts
│   │       ├── users/         # Staff & RBAC Accounts (Admin, Manager, User)
│   │       ├── audit-logs/    # System Activity Logs from PostgreSQL
│   │       └── settings/      # Dealer Branding & Maintenance Settings
│   ├── (marketing)/           # Route group for Public Landing Page
│   ├── auth/                  # Authentication pages (signin, signup, forgot-password, callback)
│   ├── globals.css            # Tailwind CSS v4 variables & base theme
│   └── layout.tsx             # Root layout with Inter font and Sonner Toaster
├── components/
│   ├── admin/                 # Admin module clients (orders, inventory, accounting, users, etc.)
│   ├── roofing/               # RoofingOrderForm (Fast keyboard grid) & RoofingInvoicePrint (A4/A5)
│   ├── ui/                    # Base UI Primitives (Modal, DataTable, Form controls, Toast, etc.)
│   │   ├── form/              # Input, Select, Switch, Checkbox, Textarea, PasswordInput, ImageUploader
│   │   └── table/             # DataTable, ColumnHeader, Pagination, RowActions
├── hooks/                     # Custom React hooks (useUser, useTheme, etc.)
├── lib/
│   ├── audit.ts               # Automated activity logging helper
│   ├── auth-guard.ts          # Server Action RBAC guard
│   ├── navigation.ts          # Dealer Sidebar navigation manifest
│   ├── roofing-calc.ts        # Roofing cutting mathematics (meters, m2, subtotal, money to words)
│   ├── roofing-excel.ts       # Excel export matching 'hoá đơn tôn bản chính.xlsx'
│   └── supabase/              # Supabase clients (client.ts, server.ts, admin.ts, middleware.ts)
├── types/                     # Centralized TypeScript definitions
├── supabase/                  # SQL migrations & seed.sql
└── supabase-docker/           # Docker Compose setup for local Supabase
```

---

## 🧱 Core Architectural Rules

### 1. Server Components First (RSC)
- Default to **React Server Components** for all pages and layouts.
- Only mark a component with `'use client'` when it requires browser APIs, state hooks, or interactivity.
- In Next.js 16+, `params` and `searchParams` in page/layout components are **Promises** and must be awaited.

### 2. Supabase SSR Discipline
- **Client Components**: Always use `createClient()` from `@/lib/supabase/client`.
- **Server Components & Server Actions**: Always use `createClient()` from `@/lib/supabase/server`.
- **Admin Server Actions**: Use `createAdminClient()` from `@/lib/supabase/admin` with service role key.
- Write Row Level Security (RLS) policies for all new Postgres tables in `supabase/migrations/`.

### 3. UI & Styling (Tailwind CSS v4 + TailAdmin)
- Utilize Tailwind v4 CSS variables defined in `app/globals.css`.
- Support **Dark Mode** seamlessly via the `.dark` class hierarchy.
- Use `cn(...)` from `@/lib/utils` for conditional class joining.
- For notifications, always use **Sonner** (`toast.success()`, `toast.error()`, etc.) imported from `'sonner'`.

### 4. Forms & Validation
- Standardize on **React Hook Form** + **Zod** schema validation.
- Use shared form controls in `@/components/ui/form/`.

### 5. Data Tables & Lists
- Use `@/components/ui/table/DataTable.tsx` powered by `@tanstack/react-table`.
- Ensure column headers use `DataTableColumnHeader` for sorting.
- Provide search debounce, status filtering, pagination, and Excel export options.

### 6. Unified Modal & Balanced Grid (Quy Chuẩn Form Popup Bắt Buộc)
- **Chung 1 Popup Modal**: Tất cả các màn DataTable khi **Create**, **Edit**, **View** BẮT BUỘC dùng **CHUNG 1 POPUP MODAL DUY NHẤT** (quản lý qua `mode: "create" | "edit" | "view"`). Tuyệt đối không dùng Drawer riêng biệt cho phần View chi tiết.
- **Chia cột đồng đều 50% - 50%**: Các trường thông tin trong form Popup phải được sắp xếp theo hệ lưới cân xứng hoàn toàn (`grid grid-cols-1 sm:grid-cols-2 gap-4`). Mọi hàng đều phải chia đều 2 cột cân bằng.
- **Chuyển đổi mượt mà**: Ở chế độ `view`, các trường ở dạng read-only/disabled và footer cung cấp nút bấm *"Chuyển sang chỉnh sửa"* để chuyển trực tiếp sang `edit` mode mà không cần đóng mở lại popup.

### 7. Quy Chuẩn Lập Kế Hoạch & Nghiệp Vụ
- Bắt buộc dừng lại khi tạo Plan và chỉ code sau khi được duyệt.
- Tự động hóa liên thông: Đơn cắt tôn hoàn tất $\rightarrow$ Trừ kho $\rightarrow$ Sinh Phiếu thu/Ghi nợ thợ thầu $\rightarrow$ Ghi log hệ thống.

### 8. UI Token Contrast & Tailwind v4 Theme Discipline
- Trong Tailwind CSS v4, toàn bộ màu thương hiệu phải được khai báo trong khối `@theme` tại `app/globals.css` (`--color-primary`, `--color-primary-hover`).
- Nghiêm cấm sử dụng các class `bg-primary` mà thiếu định nghĩa `@theme`, tránh lỗi chữ trắng trên nền trong suốt (nút tàng hình).
- Nút bấm chính (`Button variant="primary"`) luôn có màu nền `#3c50e0` và chữ trắng tương phản đạt chuẩn WCAG AA.
- Toàn bộ dropdown select phải định kiểu rõ ràng cho từng thẻ `<option>` để không bị xung đột màu nền trên Windows OS.
- Khi chọn nhanh từ catalog trong form, sau khi chọn phải tự động reset `e.target.value = ""` để cho phép chọn liên tục không bị kẹt sự kiện.

### 9. Lightweight Unit Testing Protocol (Tiết Kiệm Dung Lượng & Tài Nguyên)
- **Ưu tiên tuyệt đối Unit Test**: Mọi tính năng nghiệp vụ, tính toán cắt tôn, công thức TT88, kiểm tra biến thể nút bấm và bộ lọc bảng phải được kiểm chứng bằng **Vitest Unit Test** (`npm run test`).
- **Nghiêm cấm lạm dụng Browser Automation**: Không tùy tiện khởi chạy browser subagent quay video WebP nặng hàng chục MB khi có thể kiểm thử bằng Unit Test chạy dưới 1 giây.
- Chỉ kích hoạt browser subagent khi người dùng yêu cầu chụp ảnh màn hình nghiệm thu thực tế hoặc quay video demo luồng người dùng cuối.

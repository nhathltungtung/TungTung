# Next.js Admin Dashboard Base Project

> **Kiến trúc nền tảng (Base Template)** cho toàn bộ các dự án ứng dụng web quản trị sử dụng **Next.js 16+ (App Router)**, phong cách giao diện **TailAdmin (Tailwind CSS v4)** và tích hợp **Supabase SSR**.

---

## 🌟 Tính Năng & Điểm Nổi Bật

- **Next.js 16+ App Router & Turbopack**: Cấu trúc route groups `(marketing)` và `(admin)`, ưu tiên Server Components, tách biệt rõ ràng `'use client'` và `'use server'`.
- **Strict TypeScript**: 100% Type-safe với hệ thống types định nghĩa tập trung tại `types/`.
- **Giao diện TailAdmin UI Chuẩn Hóa**:
  - **Landing Page**: Thiết kế hiện đại giới thiệu tính năng, kiến trúc, bảng metrics và CTA vào Admin.
  - **Admin Sidebar**: Hỗ trợ collapse trên desktop, drawer trượt trên mobile, danh mục phân cấp đa tầng, active state chỉn chu.
  - **Header**: Thanh tìm kiếm phím tắt (`Ctrl + K`), Dark mode switcher tức thì, thông báo badge và user profile dropdown.
  - **Dashboard Overview**: 4 thẻ KPI StatCards trực quan (Doanh thu, Đơn hàng, Khách hàng, Tăng trưởng), biểu đồ tăng trưởng doanh số và bảng dữ liệu gần đây có badge trạng thái.
- **Supabase SSR Tách Biệt**:
  - Quản lý cookie chuẩn qua `@supabase/ssr`.
  - Tách riêng `lib/supabase/client.ts` cho Client Components và `lib/supabase/server.ts` cho Server Components / Actions.
  - Proxy/Middleware tự động refresh JWT token trên từng route request.
- **Hỗ trợ Supabase Docker Local Cực Kỳ Tiện Lợi**: Tích hợp sẵn cụm container (Postgres, Studio, Auth, Storage, Mailcatcher) quản lý qua npm scripts.

---

## 📋 Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js**: Phiên bản `>= 18.18.0` (Khuyên dùng `v20.x` hoặc `v22+` LTS). Kiểm tra: `node -v`
- **Package Manager**: `npm` (đi kèm Node.js) hoặc `yarn`, `pnpm`, `bun`.
- **Docker & Docker Desktop** *(Tùy chọn)*: Chỉ cần thiết nếu bạn muốn chạy cụm Supabase CSDL cục bộ trên máy.

---

## 🚀 Hướng Dẫn Chạy Local (Quick Start)

### Lựa Chọn 1: Chạy Nhanh Giao Diện Frontend (Không cần Docker)

Nếu bạn chỉ cần kiểm tra giao diện Landing Page và Admin Dashboard với dữ liệu mẫu (Mock Data):

#### 1. Cài đặt thư viện phụ thuộc
```bash
npm install
```

#### 2. Tạo file cấu hình môi trường `.env.local`
Sao chép file `.env.example` thành `.env.local`:

- **Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env.local
  ```
- **Windows (CMD):**
  ```cmd
  copy .env.example .env.local
  ```
- **macOS / Linux / Git Bash:**
  ```bash
  cp .env.example .env.local
  ```

*(File `.env.local` đã điền sẵn các giá trị cấu hình mặc định để chạy thử nghiệm)*

#### 3. Khởi động máy chủ phát triển (Dev Server)
```bash
npm run dev
```

Sau khi máy chủ khởi động thành công:
- 🌐 **Landing Page**: [http://localhost:3000](http://localhost:3000)
- 📊 **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- 🔐 **Đăng nhập Quản trị**: [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)
- 📝 **Đăng ký Tài khoản**: [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)

---

### Lựa Chọn 2: Chạy Đầy Đủ Backend & Database (Supabase Local Docker)

Nếu bạn muốn trải nghiệm trọn vẹn luồng Đăng ký, Đăng nhập, phân quyền và lưu trữ dữ liệu thực tế vào CSDL Postgres cục bộ:

#### 1. Khởi động Docker Desktop
Đảm bảo phần mềm Docker Desktop trên máy bạn đang ở trạng thái **Running**.

#### 2. Khởi động cụm dịch vụ Supabase
```bash
npm run db:start
```
Lệnh này sẽ tự động tải các image cần thiết và khởi chạy các dịch vụ Supabase trong nền:
- **Supabase Studio (Dashboard Web Quản Trị CSDL)**: [http://127.0.0.1:54323](http://127.0.0.1:54323)
  - *Tài khoản*: `supabase`
  - *Mật khẩu*: `supabaseadmin123`
- **PostgreSQL Database**: `localhost:54322` (User: `postgres` / Pass: `postgres`)
- **API Gateway (Kong/Envoy)**: [http://127.0.0.1:54321](http://127.0.0.1:54321)
- **Inbucket (Xem Mail / OTP xác thực)**: [http://127.0.0.1:54324](http://127.0.0.1:54324)

*Tài khoản Admin mẫu nạp sẵn trong database:*
- **Email**: `admin@tailadmin.dev`
- **Password**: `admin123456`

#### 3. Khởi chạy ứng dụng Next.js
Mở một cửa sổ Terminal mới và chạy:
```bash
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000) để bắt đầu.

---

## 🛠️ Danh Sách Lệnh NPM Scripts Hữu Ích

| Lệnh | Chức Năng |
|---|---|
| `npm run dev` | Khởi chạy Next.js development server với Turbopack trên cổng 3000 |
| `npm run build` | Kiểm tra và build bản đóng gói sản phẩm (Production build) |
| `npm run start` | Chạy ứng dụng từ bản build production |
| `npm run lint` | Chạy kiểm tra chuẩn mã nguồn ESLint |
| `npm run db:start` | Khởi động cụm dịch vụ Supabase Docker |
| `npm run db:status` | Kiểm tra trạng thái các container Supabase |
| `npm run db:logs` | Xem log trực tiếp của cụm Supabase (`Ctrl + C` để thoát) |
| `npm run db:stop` | Dừng cụm Supabase Docker |
| `npm run db:reset` | Xóa sạch database và khởi động lại với dữ liệu seed ban đầu |

---

## 📂 Cấu Trúc Thư Mục Chuẩn

```
base-nextjs/
├── app/
│   ├── (admin)/                   # Route group dành cho trang Quản trị
│   │   └── admin/
│   │       ├── analytics/         # Trang Báo cáo Phân tích chi tiết
│   │       ├── layout.tsx         # Layout bọc Sidebar + Header quản trị
│   │       └── page.tsx           # Dashboard Tổng quan (KPIs, Charts, Orders)
│   ├── (marketing)/               # Route group dành cho trang Khách hàng (Landing Page)
│   │   ├── layout.tsx             # Layout chung cho Marketing (Navbar, Footer)
│   │   └── page.tsx               # Trang chủ giới thiệu nền tảng
│   ├── auth/                      # Các trang xác thực (Signin, Signup, Callback)
│   ├── globals.css                # CSS Variables, Dark mode & Custom Utilities
│   └── layout.tsx                 # Root Layout với tối ưu hóa font Inter
├── components/
│   ├── dashboard/                 # Thẻ KPI, biểu đồ, bảng đơn hàng
│   ├── landing/                   # Các khối section của Landing Page
│   └── layout/                    # Sidebar, Header, DarkModeToggle, UserDropdown
├── lib/
│   ├── utils.ts                   # Tiện ích cn() (clsx + tailwind-merge) & formatters
│   ├── navigation.ts              # Cấu hình danh mục menu điều hướng
│   ├── sample-data.ts             # Dữ liệu mock phục vụ hiển thị
│   └── supabase/                  # Khởi tạo Supabase client/server/middleware
├── types/                         # TypeScript interfaces (Dashboard, Navigation, User)
├── supabase/                      # Migrations SQL và dữ liệu khởi tạo `seed.sql`
├── supabase-docker/               # Cấu hình Docker Compose cho Supabase Local
├── middleware.ts                  # Middleware làm mới session Supabase Auth
├── .env.example                   # Biến môi trường mẫu
├── .env.local                     # Biến môi trường cục bộ
└── docs/
    ├── DEPLOYMENT.md              # Hướng dẫn chi tiết triển khai lên Vercel
    └── SUPABASE_DOCKER.md         # Cẩm nang vận hành chi tiết cụm Supabase Docker
```

---

## ❓ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Cổng 3000 đang bị ứng dụng khác chiếm dụng
Nếu bạn nhận được thông báo cổng 3000 đã được sử dụng:
- Next.js sẽ tự động chuyển sang cổng tiếp theo (ví dụ: `http://localhost:3001`).
- Hoặc bạn có thể chỉ định cổng cụ thể khi chạy:
  ```bash
  npx next dev -p 3005
  ```

### 2. Lỗi kết nối Docker khi chạy `npm run db:start`
- **Nguyên nhân**: Docker Desktop chưa được bật hoặc Docker engine chưa sẵn sàng.
- **Khắc phục**: Mở ứng dụng Docker Desktop trên máy tính, đợi đến khi biểu tượng trạng thái chuyển sang màu xanh (Docker is running), sau đó chạy lại `npm run db:start`.
- *Lưu ý*: Nếu bạn chỉ phát triển giao diện UI, bạn không bắt buộc phải bật Docker. Ứng dụng đã có sẵn dữ liệu mock để hiển thị.

### 3. Lỗi PowerShell: `Execution of scripts is disabled on this system`
- **Khắc phục**: Mở PowerShell với quyền Administrator và chạy:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

---

## 📖 Tài Liệu Chi Tiết

- Hướng dẫn cấu hình triển khai lên **Vercel**: Xem [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- Cẩm nang quản trị chuyên sâu cụm **Supabase Docker**: Xem [docs/SUPABASE_DOCKER.md](docs/SUPABASE_DOCKER.md).

# Vercel Deployment & Production Checklist (@DevOpsAgent)

Tài liệu này cung cấp hướng dẫn chi tiết từ **@DevOpsAgent** để triển khai dự án **Base Next.js Admin Dashboard** lên nền tảng **Vercel** kết nối với **Supabase SSR**.

---

## 1. Kiểm tra Trước Khi Triển Khai (Pre-flight Checklist)

Trước khi đẩy mã nguồn lên Git và Vercel, hãy đảm bảo toàn bộ mã nguồn vượt qua các bước kiểm tra chất lượng sau:

- [x] **TypeScript Type Check**: `npx tsc --noEmit` hoàn thành không có lỗi (Strict Mode).
- [x] **Production Build**: `npm run build` biên dịch thành công 100% với Next.js Turbopack.
- [x] **Không rò rỉ Service Role Key**: Khóa bảo mật `SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng ở server-side / server actions, tuyệt đối không đặt tiền tố `NEXT_PUBLIC_`.
- [x] **Bảo mật Cookie**: Đã cấu hình Middleware cập nhật phiên làm việc tự động qua `@supabase/ssr`.

---

## 2. Các Bước Triển Khai Lên Vercel

### Bước 2.1: Kết Nối Kho Chứa Git
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard) và chọn **Add New... -> Project**.
2. Chọn kho lưu trữ Git của dự án (`base-nextjs`).
3. Vercel sẽ tự động nhận diện framework preset là **Next.js**.
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Bước 2.2: Cấu Hình Biến Môi Trường Trên Vercel
Trong mục **Environment Variables** trên Vercel, thêm các khóa sau cho cả 3 môi trường (**Production**, **Preview**, **Development**):

| Tên Biến Môi Trường | Giá Trị Mẫu | Mô Tả |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzcompany.supabase.co` | URL Project của Supabase (lấy tại Project Settings -> API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Public API Key an toàn cho client-side với RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | *(Tùy chọn)* Chỉ dùng cho Server Actions/Admin Cron (Bảo mật cao) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | URL chính thức của ứng dụng sau khi deploy |

---

## 3. Cấu Hình Supabase Authentication Đón Domain Vercel

Khi deploy lên Vercel, bạn cần cập nhật URL domain vào Supabase để tính năng Đăng nhập & Xác thực qua Cookie/Email Redirect hoạt động chính xác:

1. Vào [Supabase Dashboard](https://supabase.com/dashboard) -> Chọn dự án của bạn.
2. Vào **Authentication** -> **URL Configuration**.
3. Cập nhật:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**:
     - `http://localhost:3000/**` (cho phát triển cục bộ)
     - `https://your-app.vercel.app/**` (cho production)
     - `https://*-yourteam.vercel.app/**` (cho các preview deployments của Vercel PR)

---

## 4. Lệnh Hữu Ích Cho Đội Ngũ Phát Triển

```bash
# Chạy môi trường phát triển cục bộ
npm run dev

# Kiểm tra type TypeScript
npx tsc --noEmit

# Chạy build kiểm tra tương thích trước khi commit
npm run build

# Chạy ứng dụng production cục bộ
npm run start
```

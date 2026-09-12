# Hướng Dẫn Vận Hành Supabase Trên Docker (@DevOpsAgent)

Tài liệu này hướng dẫn chi tiết cách vận hành, quản trị và tích hợp hệ thống **Supabase chạy trên Docker** cho dự án **Base Next.js** (`@supabase/ssr`).

---

## 1. Kiến Trúc Dịch Vụ & Phân Bổ Cổng Mạng (Port Allocation)

Hệ thống Supabase Docker được cấu hình với dải port độc lập, tránh xung đột 100% với các dịch vụ đang chạy trên máy (như PostgreSQL cổng `5432` hoặc Next.js cổng `3000`):

| Dịch Vụ Container | Tên Container | Cổng Host (Địa chỉ truy cập) | Mục Đích |
|---|---|---|---|
| **API Gateway (Envoy/Kong)** | `supabase-envoy` | `http://127.0.0.1:54321` | Cổng API chính cho Next.js SSR (`/rest/v1`, `/auth/v1`, `/storage/v1`) |
| **Supabase Studio (Dashboard)** | `supabase-studio` | `http://127.0.0.1:54323` | Giao diện Web quản trị CSDL, bảng biểu, RLS, Auth Users |
| **PostgreSQL Database** | `supabase-db` / `supabase-pooler` | `localhost:54322` | Kết nối trực tiếp qua DBeaver, TablePlus, hoặc `psql` |
| **Inbucket (Mailcatcher)** | `supabase-mail` | `http://127.0.0.1:54324` | Giao diện xem email xác thực/OTP đăng ký tài khoản |
| **Supabase Auth (GoTrue)** | `supabase-auth` | Qua Gateway `/auth/v1` | Dịch vụ xác thực người dùng, JWT, Cookies |
| **PostgREST** | `supabase-rest` | Qua Gateway `/rest/v1` | Tự động sinh RESTful API từ schema Postgres |
| **Storage API & imgproxy** | `supabase-storage` | Qua Gateway `/storage/v1` | Quản lý file, bucket upload và xử lý ảnh |

---

## 2. Thông Tin Đăng Nhập Mẫu Sẵn Có

### 2.1 Tài khoản Supabase Studio (Web Dashboard)
- **URL**: [http://127.0.0.1:54323](http://127.0.0.1:54323)
- **Username**: `supabase`
- **Password**: `supabaseadmin123`

### 2.2 Tài khoản Quản trị Admin Demo trong Ứng dụng Next.js
Hệ thống đã nạp sẵn tài khoản mẫu qua `supabase/seed.sql`:
- **Email**: `admin@tailadmin.dev`
- **Password**: `admin123456`
- **Role**: `admin`

---

## 3. Các Lệnh Điều Khiển Hệ Thống (NPM Scripts)

Bạn có thể quản trị Supabase Docker tiện lợi thông qua các lệnh NPM đã được tích hợp sẵn trong `package.json`:

```bash
# Khởi động toàn bộ cụm Supabase Docker
npm run db:start

# Kiểm tra trạng thái các container đang chạy
npm run db:status

# Xem logs theo thời gian thực (nhấn Ctrl+C để thoát)
npm run db:logs

# Dừng hệ thống Supabase
npm run db:stop

# Xóa toàn bộ dữ liệu & khởi động lại database sạch từ đầu
npm run db:reset
```

Hoặc bạn có thể dùng lệnh Docker Compose trực tiếp từ thư mục gốc:
```bash
docker compose -f ./supabase-docker/docker-compose.yml up -d
docker compose -f ./supabase-docker/docker-compose.yml ps
docker compose -f ./supabase-docker/docker-compose.yml down
```

---

## 4. Tích Hợp Vào Ứng Dụng Base Next.js

File `.env.local` của ứng dụng đã được cấu hình tự động:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Quy trình kiểm thử tính năng Xác thực:
1. Chạy Supabase: `npm run db:start`
2. Chạy Next.js: `npm run dev`
3. Truy cập [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup) để đăng ký tài khoản mới:
   - Hệ thống tự động xác thực email (Auto-confirm đã bật).
   - Trigger PostgreSQL `on_auth_user_created` tự động tạo bản ghi trong bảng `public.profiles`.
4. Truy cập [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin) để đăng nhập và kiểm tra chuyển hướng vào `/admin`.

---

## 5. Hướng Dẫn Triển Khai Lên Máy Chủ VPS

Khi muốn chuyển hệ thống này lên VPS Ubuntu/Debian:
1. Cài đặt Docker & Docker Compose trên VPS.
2. Sao chép thư mục `supabase-docker` lên VPS (ví dụ `/opt/supabase`).
3. Mở file `.env` trên VPS và thay đổi các mật khẩu bảo mật:
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET` (chuỗi ngẫu nhiên tối thiểu 32 ký tự)
   - `DASHBOARD_PASSWORD`
   - Đổi `SITE_URL` thành domain thực tế của bạn (ví dụ: `https://yourdomain.com`).
4. Khởi động trên VPS:
   ```bash
   cd /opt/supabase
   docker compose up -d
   ```
5. Cấu hình Nginx / Cloudflare trỏ Reverse Proxy vào port `54321` (API) hoặc mở tường lửa tương ứng.

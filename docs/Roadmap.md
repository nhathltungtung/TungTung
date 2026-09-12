# Lộ Trình Nâng Cấp Nền Tảng (Base Next.js Architecture Roadmap)

> Tài liệu định hướng kiến trúc và lộ trình hoàn thiện các module chuẩn doanh nghiệp, giúp biến **Base Next.js** thành bộ khung hoàn chỉnh ("dùng được cho mọi dự án" như SaaS, ERP, CRM, E-commerce).

---

## 🗺️ Sơ Đồ Tổng Thể Lộ Trình Triển Khai

```mermaid
flowchart LR
    A[Giai đoạn 1: Bảo mật & Phân quyền] --> B[Giai đoạn 2: UI Primitives & Toast/Form]
    B --> C[Giai đoạn 3: Bảng Dữ Liệu DataTable]
    C --> D[Giai đoạn 4: Quản lý User & Upload File]
    style A fill:#10b981,stroke:#059669,color:#fff
    style B fill:#10b981,stroke:#059669,color:#fff
    style C fill:#10b981,stroke:#059669,color:#fff
    style D fill:#10b981,stroke:#059669,color:#fff
```

---

## 📌 Chi Tiết Từng Giai Đoạn (Toàn Bộ Đã Hoàn Thành 100%)

### ✅ Giai đoạn 1: Bảo Mật & Phân Quyền (Auth & RBAC) — *[ĐÃ HOÀN THÀNH]*
- [x] **Bảo vệ Route (Middleware Route Guard)**: Tự động chuyển hướng khách chưa đăng nhập khi truy cập `/admin/*` về `/auth/signin?next={path}`, và chuyển hướng người đã đăng nhập khỏi các trang `/auth/*`.
- [x] **Hệ thống phân quyền theo vai trò (RBAC)**: Hỗ trợ 3 cấp bậc `ADMIN`, `MANAGER`, `USER` với component `<RoleGate />` để ẩn/hiện các thao tác nhạy cảm theo quyền hạn.
- [x] **Trang Cài đặt & Hồ sơ cá nhân (`/admin/settings`)**:
  - Tab Hồ sơ: Cập nhật Họ tên, Số điện thoại, Chức vụ, Giới thiệu (Bio), hiển thị Role badge.
  - Tab Bảo mật: Form đổi mật khẩu mới bảo mật.
  - Tab RBAC: Khu vực thao tác nguy hiểm dành riêng cho Quản trị viên (Admin Only).
- [x] **Luồng Quên mật khẩu (`/auth/forgot-password`)**: Giao diện gửi link khôi phục mật khẩu qua email.
- [x] **Đăng xuất & User Dropdown**: Header hiển thị thông tin thực tế từ `useUser()`, nút Sign Out dọn sạch phiên và redirect.

---

### ✅ Giai đoạn 2: Bộ UI Primitives & Form Controls Chuẩn (Design System) — *[ĐÃ HOÀN THÀNH]*
- [x] **Toast Notifications (`sonner`)**: Hệ thống thông báo pop-up thông minh (Success, Error, Warning, Info, Promise async) đồng bộ với Dark Mode của TailAdmin.
- [x] **Modal / Dialog**: Component popup hộp thoại có backdrop làm mờ, hỗ trợ phím Escape, click outside để đóng và khóa cuộn trang.
- [x] **Confirm Dialog**: Hộp thoại xác nhận hành động nhạy cảm (Xóa, Cảnh báo) với trạng thái loading spinner.
- [x] **Drawer / Sheet**: Khay trượt từ cạnh phải màn hình để xem nhanh chi tiết bản ghi hoặc nhập liệu form phụ.
- [x] **Bộ Form Controls kết hợp Zod + React Hook Form**:
  - `Input`, `PasswordInput` (toggle ẩn/hiện mật khẩu), `Select`, `Switch` (toggle bật/tắt), `Checkbox`, `Textarea`.
  - Tự động bắt lỗi validation thời gian thực và hiển thị text cảnh báo màu đỏ.
- [x] **Skeleton Shimmer Loaders & Empty State**:
  - Khung xương shimmer cho Avatar, Thẻ KPI (Card), Bảng (Table Row).
  - Empty State chuẩn hoá khi chưa có dữ liệu kèm nút Call To Action (CTA).
- [x] **Trang Trưng Bày Thử Nghiệm (`/admin/ui-components`)**: Màn hình demo tương tác thực tế toàn bộ components.

---

### ✅ Giai đoạn 3: Bảng Dữ Liệu Nâng Cao (Universal Data Table) — *[ĐÃ HOÀN THÀNH]*
- [x] **Component `<DataTable />` Generic hoàn toàn**: Dựa trên `@tanstack/react-table` v8 stable, Type-safe 100% cho mọi cấu trúc dữ liệu.
- [x] **Tìm kiếm & Bộ lọc thông minh**: Ô tìm kiếm Debounce theo cột hoặc toàn cục, bộ lọc theo trạng thái (Status Filter).
- [x] **Sắp xếp theo cột (Column Sorting)**: Bấm tiêu đề cột để đảo chiều sắp xếp (Ascending / Descending) có icon chỉ hướng.
- [x] **Hành động hàng loạt (Batch Actions)**: Checkbox chọn nhiều dòng hiển thị thanh công cụ nổi (Đánh dấu Hoàn tất, Xóa hàng loạt).
- [x] **Phân trang linh hoạt (Pagination)**: Tùy chọn 5, 10, 20, 50 dòng/trang, các nút chuyển trang và hiển thị số lượng bản ghi.
- [x] **Xuất dữ liệu Excel & CSV**: Nút xuất file `.xlsx` và `.csv` hỗ trợ font Tiếng Việt UTF-8 chuẩn hóa.
- [x] **Trang Màn Hình Bảng Thực Tế (`/admin/tables`)**: Trang quản trị đơn hàng giao dịch mẫu tích hợp Drawer xem chi tiết và ConfirmDialog xóa đơn.

---

### ✅ Giai đoạn 4: Quản Lý Người Dùng & Tải Lên Tệp (User Management & Storage) — *[ĐÃ HOÀN THÀNH]*
- [x] **Trang Quản lý người dùng (`/admin/users`)**: Bảng danh sách thành viên, gán vai trò (`admin`, `manager`, `user`), khóa / mở khóa tài khoản, tạo mới người dùng với Modal.
- [x] **Trình Upload Tệp Kéo Thả (`FileUploader`)**: Hỗ trợ drag & drop, kiểm tra MIME type, dung lượng tối đa, xem trước ảnh tức thì và thanh tiến trình tải lên (Progress bar).
- [x] **Nhật ký hoạt động (Audit Logs) (`/admin/audit-logs`)**: Ghi lại lịch sử thao tác hệ thống (Timestamp, Actor, Action, Level: INFO/WARN/CRITICAL, IP Address) và xem chi tiết payload JSON qua Drawer.
- [x] **Đồng bộ Sidebar**: Bổ sung liên kết `Users Management` và `Audit Logs` lên thanh menu điều hướng.

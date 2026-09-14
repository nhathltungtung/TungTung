# Kế Hoạch Số Hoá Hệ Thống Bán Hàng & Quản Lý Kho Tôn Thép (Thay Thế Dần Excel)

> **Dự án**: Số hoá quy trình tính toán cắt tôn theo quy cách, in phiếu bán hàng và quản lý kho hộ kinh doanh (dựa trên 2 file mẫu thực tế: `hoá đơn tôn bản chính.xlsx` và `54qr.xlsx`).  
> **Định hướng chiến lược**: Số hoá từng bước (Phased Digitalization), **tạm thời chưa dùng VietQR**, tập trung vào tốc độ nhập phím nhanh, tính diện tích $m^2$ chính xác, in ấn chuẩn xưởng và xuất Excel tương thích 2 chiều.

---

## 🎯 Mục Tiêu Cốt Lõi
1. **Giải quyết triệt để bài toán tính cắt tôn**: Cho phép thợ/kế toán nhập danh sách tấm tôn lẻ (Dài $\times$ Số tấm) bằng bàn phím (Enter nhảy dòng), tự động tính tổng mét dài, tổng diện tích $m^2$, cộng tiền phụ kiện (sườn, máng, vít, keo).
2. **In ấn & Xuất file chuyên nghiệp**: Mẫu in A4/A5 chuẩn xưởng rõ nét chỉ với 1-click, đồng thời xuất ngược ra file `.xlsx` đúng form của `hoá đơn tôn bản chính.xlsx` để gửi Zalo cho khách.
3. **Lưu trữ dữ liệu tập trung & Chống đơ giật**: Thay thế file Excel `54qr.xlsx` nặng gần 10MB bằng cơ sở dữ liệu Supabase/PostgreSQL, hỗ trợ xuất báo cáo chuẩn Thông tư 88/2021/TT-BTC.

---

## 📋 Danh Sách Hạng Mục Triển Khai Chi Tiết (Checklist)

### 🟢 Giai Đoạn 1: Module Lập Đơn & Bàn Tính Cắt Tôn (Roofing POS & In Hoá Đơn) — *[ĐÃ HOÀN THÀNH 100%]*
> **Trọng tâm**: Xây dựng màn hình lập đơn tại `/admin/orders/create` và mẫu in hoá đơn sắc nét.

- [x] **1.1. Giao diện Thông tin Khách hàng & Đơn hàng**
  - [x] Nhập thông tin khách hàng: Họ tên, Số điện thoại, Địa chỉ giao hàng, Ngày lập đơn.
  - [x] Hỗ trợ lưu nhanh thông tin khách quen & mã đơn tự sinh.

- [x] **1.2. Bàn tính Quy cách Cắt Tôn (Fast Dimension Grid)**
  - [x] Chọn loại tôn (ví dụ: *Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng*), nhập khổ hiệu dụng (mặc định `1.08m` hoặc tuỳ chỉnh) và đơn giá (đ/m²).
  - [x] Bảng nhập quy cách cắt lẻ:
    - Cột `Chiều dài` (m) và Cột `Số tấm`.
    - Hỗ trợ phím tắt: gõ số $\rightarrow$ gõ `Enter` hoặc `Tab` để nhảy ô, tự động thêm dòng mới khi nhấn Enter ở dòng cuối.
    - Tự động tính từng dòng: $\text{Mét dài} = \text{Chiều dài} \times \text{Số tấm}$.
  - [x] Hàng tổng kết loại tôn (như Dòng 22 trong file mẫu):
    - Tổng số tấm, Tổng mét dài = $\sum \text{Mét dài}$.
    - Tổng diện tích $m^2 = \text{Tổng mét dài} \times \text{Khổ tôn}$.
    - Thành tiền = $\text{Tổng } m^2 \times \text{Đơn giá}$.

- [x] **1.3. Bảng Phụ kiện Bán Kèm (Accessories Grid)**
  - [x] Thêm các dòng phụ kiện linh hoạt đơn vị tính (Sườn tôn, Máng inox, Keo A500, Vít 4...) kèm nút thêm nhanh 1 chạm.

- [x] **1.4. Khối Tổng kết Thanh toán**
  - [x] Tổng tiền hàng thời gian thực.
  - [x] Chiết khấu / Giảm giá.
  - [x] Tiền khách đặt cọc / Trả trước.
  - [x] Số tiền còn lại phải thu & Tự động dịch số tiền thành chữ Tiếng Việt.

- [x] **1.5. Mẫu In Hoá Đơn / Phiếu Bán Lẻ Khổ A4/A5**
  - [x] Thiết kế mẫu in sạch đẹp, bố cục chuẩn như file `hoá đơn tôn bản chính.xlsx`.
  - [x] Tích hợp CSS `@media print` để khi bấm nút **"In Hoá Đơn"** (`window.print()`) sẽ chỉ in phiếu xuất, ẩn sạch menu/sidebar.
  - [x] Modal xem trước trực quan trên màn hình.

- [x] **1.6. Xuất File Excel Hoá Đơn (.xlsx)**
  - [x] Tích hợp thư viện `xlsx` để xuất file `.xlsx` định dạng giống hệt file Excel mẫu của khách hàng để gửi Zalo.

---

### 🟡 Giai Đoạn 2: Cơ Sở Dữ Liệu Supabase & Quản Lý Đơn Hàng — *[ĐÃ HOÀN THÀNH 100%]*
> **Trọng tâm**: Lưu trữ đơn hàng, lịch sử bán hàng và khách hàng lên Cloud & hỗ trợ Offline Mode.

- [x] **2.1. Thiết kế Schema CSDL trên Supabase**
  - [x] File migration SQL chuẩn: `supabase/migrations/20260912000000_create_roofing_management_schema.sql`.
  - [x] Bảng `customers`: Quản lý danh sách khách hàng (tên, sđt, địa chỉ, công nợ).
  - [x] Bảng `products`: Danh mục tôn cuộn, chủng loại tôn, phụ kiện, đơn giá tiêu chuẩn.
  - [x] Bảng `roofing_orders`: Thông tin đơn hàng (mã đơn, ngày tạo, khách hàng, tổng tiền, cọc, còn lại, trạng thái).
  - [x] Bảng `roofing_order_groups` & `roofing_order_cut_items`: Lưu từng nhóm tôn và chi tiết từng tấm tôn cắt theo chiều dài và số tấm.
  - [x] Bảng `roofing_order_accessories`: Chi tiết phụ kiện kèm theo đơn.
  - [x] Kích hoạt RLS và Indexes tối ưu truy vấn.
  - [x] Bổ sung dữ liệu khởi tạo mẫu thực tế vào `supabase/seed.sql`.

- [x] **2.2. Trang Quản Lý Danh Sách Đơn Hàng (`/admin/orders`)**
  - [x] Hiển thị danh sách đơn hàng đã lưu với bộ lọc tìm kiếm theo tên, sđt, mã đơn.
  - [x] Xem nhanh chi tiết đơn hàng qua Modal xem trước & In ấn trực tiếp.
  - [x] Nút in lại hoá đơn hoặc xuất lại file Excel bất kỳ lúc nào.
  - [x] Đã tích hợp liên kết điều hướng vào Sidebar ("Đơn Cắt Tôn").

- [x] **2.3. Tích Hợp Supabase Service (`lib/supabase/roofing-service.ts`)**
  - [x] Hàm `saveRoofingOrder`: Lưu đơn hàng lên Supabase với cơ chế tự động Fallback sang LocalStorage khi offline.
  - [x] Hàm `getRoofingOrders`: Tải danh sách đơn hàng từ CSDL Cloud.
  - [x] Trạng thái `isSaving` với icon loading trên nút bấm.

---

### 🟣 Giai Đoạn 3: Quản Lý Kho & Nghiệp Vụ Kế Toán Hộ Kinh Doanh (TT 88) — *[ĐÃ HOÀN THÀNH 100%]*
> **Trọng tâm**: Thay thế hoàn toàn file `54qr.xlsx` (9.5MB).

- [x] **3.1. Công cụ Import Danh mục Hàng hoá từ Excel**
  - [x] Trích xuất và nạp sẵn 60 mã hàng nguyên bản từ sheet `2-Khai bao Ma-Hang` của file `54qr.xlsx`.
  - [x] Hỗ trợ tải lên file Excel `.xlsx` bất kỳ để tự động bóc tách danh mục mã hàng.

- [x] **3.2. Quản Lý Nhập - Xuất - Tồn Kho (`/admin/inventory`)**
  - [x] Bảng điều khiển quản lý tồn kho trực quan với 4 thẻ KPI: Tổng mã hàng (60), Tổng giá trị tồn (319 triệu), Tổng số lượng, Mã hết hàng.
  - [x] Bộ lọc nhanh theo phân loại hàng hoá: Thép hộp, Ống tròn, Nhôm, Tôn lợp, Phụ kiện, Vật tư khác.

- [x] **3.3. Tính Giá Vốn Tự Động**
  - [x] Tự động tính đơn giá vốn bình quân theo phương pháp Thông tư 88, loại bỏ các công thức Excel làm treo máy ở sheet `4-Kiem tra Gia von`.

- [x] **3.4. Xuất Báo Cáo Chuẩn Thông Tư 88/2021/TT-BTC**
  - [x] Xuất file Excel `Phiếu xuất kho (Mẫu số 04-VT)` chuẩn biểu mẫu Bộ Tài chính.
  - [x] Xuất file Excel `Sổ chi tiết vật liệu dụng cụ sản phẩm hàng hoá (Mẫu S2-HKD)` theo từng mã hàng.
  - [x] Đã tích hợp liên kết điều hướng "Kho & Kế Toán TT88" vào Sidebar.

---

### 🔵 Giai Đoạn 4: Full CRUD Kho, Kế Toán TT88 (Sổ Quỹ S1-HKD, Thu-Chi, Công Nợ & Báo Cáo Thuế) — *[ĐANG LÊN PLAN & TRIỂN KHAI]*
> **Mục tiêu**: Hoàn thiện 100% các thao tác tác nghiệp thực tế của thủ kho và kế toán hộ kinh doanh để đóng vĩnh viễn file Excel 54qr.xlsx.

- [ ] **4.1. Full CRUD Quản Lý Kho Hàng (`/admin/inventory`)**
  - [ ] **Thêm mới hàng hoá (Create)**: Modal thêm mã hàng, tên quy cách, ĐVT, phân loại, tồn kho đầu kỳ, đơn giá vốn, giá bán.
  - [ ] **Chỉnh sửa hàng hoá (Update)**: Cập nhật tên, đơn vị tính, sửa giá vốn hoặc số lượng tồn sau kiểm kê bãi sắt.
  - [ ] **Xoá hàng hoá (Delete)**: Modal xác nhận xóa an toàn.
  - [ ] Lưu trữ đồng bộ vào Supabase `products` và `localStorage`.

- [ ] **4.2. Nghiệp Vụ Nhập Kho (Stock In) & Phiếu Nhập Mẫu 03-VT**
  - [ ] Màn hình Tạo Phiếu Nhập Kho từ nhà máy tôn (Olympic, Hoa Sen, Đông Á, Thép Hòa Phát...).
  - [ ] Tự động cộng dồn số lượng tồn kho.
  - [ ] Tự động tính lại đơn giá vốn bình quân gia quyền theo đúng chuẩn TT88:
    $$\text{Đơn giá vốn mới} = \frac{\text{Giá trị tồn cũ} + \text{Giá trị nhập mới}}{\text{Số lượng tồn cũ} + \text{Số lượng nhập mới}}$$
  - [ ] Xuất file Excel và in `Phiếu nhập kho (Mẫu số 03-VT)` chuẩn BTC.

- [ ] **4.3. Phân Hệ Kế Toán Hộ Kinh Doanh TT88 (`/admin/accounting`)**
  - [ ] **Sổ Quỹ Tiền Mặt (Mẫu S1-HKD)**: Theo dõi Thu - Chi - Tồn quỹ tiền mặt và tài khoản ngân hàng.
  - [ ] **CRUD Phiếu Thu (Mẫu số 01-TT)**: Tạo, sửa, xoá, in ấn phiếu thu tiền bán tôn, thu nợ khách hàng.
  - [ ] **CRUD Phiếu Chi (Mẫu số 02-TT)**: Tạo, sửa, xoá, in ấn phiếu chi trả NCC, tiền điện xưởng, chi phí vận chuyển xe cẩu, lương thợ.
  - [ ] Xuất file Excel `Sổ quỹ tiền mặt Mẫu S1-HKD` chuẩn biểu mẫu BTC.

- [ ] **4.4. Quản Lý Sổ Nợ Khách Hàng & Thợ Thầu**
  - [ ] Danh sách thợ thầu nợ tiền tôn, số tiền nợ, lịch sử mua và trả nợ theo từng công trình.
  - [ ] Nghiệp vụ Thu Nợ 1-Click: Nhập số tiền trả $\rightarrow$ Tự động trừ công nợ và tự động sinh Phiếu Thu vào Sổ Quỹ.
  - [ ] In giấy biên nhận thu tiền / Giấy đối soát công nợ gửi Zalo cho khách thầu.

- [ ] **4.5. Báo Cáo Tổng Hợp NXT Toàn Bộ Kho Nộp Thuế (`/admin/inventory/reports` & Sheet 6 `54qr.xlsx`)**
  - [ ] Báo cáo tổng hợp toàn bộ 60 mã hàng theo Quý (Quý I, II, III, IV) hoặc Cả năm.
  - [ ] Cảnh báo mặt hàng bị âm kho (như dòng 11 sheet 5 của file cũ).
  - [ ] Xuất file Excel nộp thuế chuẩn biểu mẫu Thông tư 88.

- [ ] **4.6. Tự Động Trừ Tồn Kho Khi Bán Đơn Cắt Tôn**
  - [ ] Khi lưu đơn hàng tại `/admin/orders/create` $\rightarrow$ tự động trừ mét tôn, phụ kiện trong kho hàng.

---

## 🧪 Kết Quả Kiểm Thử & Nghiệm Thu (Verification) — *[ĐÃ ĐẠT 100%]*

### ✅ 1. Nghiệm thu tính toán số học (Khớp 100% file gốc):
- [x] **Tổng mét dài tôn**: Nhập 11 tấm lẻ từ 2.96m đến 4.5m $\rightarrow$ Hệ thống tự động cộng ra đúng **$40.13\text{ m}$**.
- [x] **Tổng diện tích**: $40.13\text{ m} \times 1.08\text{ m}$ khổ tôn $\rightarrow$ Hệ thống tự động tính ra **$43.3404\text{ m}^2$**.
- [x] **Tiền tôn Olympic 11 sóng**: $43.3404\text{ m}^2 \times 111,000\text{ đ}$ $\rightarrow$ **$4,810,784\text{ đ}$**.
- [x] **Tiền phụ kiện**: Sườn ($114,000\text{ đ}$) + Máng Inox ($1,216,060\text{ đ}$) + Keo A500 ($240,000\text{ đ}$) + Vít 4 ($300,000\text{ đ}$) $\rightarrow$ **$1,870,000\text{ đ}$**.
- [x] **Tổng giá trị đơn hàng**: $4,810,784\text{ đ} + 1,870,000\text{ đ} = \mathbf{6,680,844\text{ đ}}$ *(Khớp chính xác từng đồng)*.
- [x] **Đọc số tiền thành chữ**: Tự động dịch thành *"Sáu triệu sáu trăm tám mươi nghìn tám trăm bốn mươi bốn đồng chẵn."*

### ✅ 2. Nghiệm thu trải nghiệm & In ấn / Xuất file:
- [x] **Nhập liệu bàn phím siêu tốc**: Gõ Chiều dài $\rightarrow$ Enter $\rightarrow$ Số tấm $\rightarrow$ Enter để tự thêm dòng tiếp theo mà không cần chạm chuột.
- [x] **Xem & In hoá đơn**: CSS `@media print` ẩn toàn bộ sidebar/navbar, in sắc nét khổ A4/A5 kèm chữ ký các bên.
- [x] **Xuất file Excel hoá đơn**: Tải về file `.xlsx` đúng form chuẩn gửi Zalo cho khách.
- [x] **Xuất báo cáo thuế TT88**: Xuất Phiếu xuất kho `Mẫu 04-VT` và Sổ chi tiết `Mẫu S2-HKD` chuẩn biểu mẫu BTC.

### ✅ 3. Nghiệm thu kỹ thuật & Tinh gọn hệ thống:
- [x] **Cơ sở dữ liệu Supabase**: Đã tạo schema 6 bảng quan hệ kèm cơ chế Fallback Offline Mode.
- [x] **Dọn dẹp module thừa**: Đã xoá bỏ 100% các trang demo mẫu template không liên quan (`tables`, `ui-components`, `analytics`, menu rác).
- [x] **Biên dịch cuối cùng**: `npm run build` hoàn thành 100% không có bất kỳ lỗi nào.

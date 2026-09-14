---
name: roofing-tt88-engine
description: >-
  Domain runbook for roofing cutting mathematics, accessories, TT88/2021/TT-BTC accounting
  (weighted-average cost, S1-HKD cash fund, S2-HKD inventory), customer debt management,
  and A4/A5 invoice printing in TungTung (Đại Lý Tôn Thép Tuấn Hương).
---

# Roofing POS & TT88 Accounting Engine Runbook

Use this skill whenever working on roofing cutting calculations, accessories, inventory valuation, cash receipts/payments, or contractor debts.

---

## 📐 1. Roofing Mathematics Specifications

### Công thức tính toán chuẩn:
1. **Mét dài từng dòng**: $\text{Chiều dài} \times \text{Số tấm} = \text{Tổng mét dài}$
2. **Tổng mét dài của nhóm tôn**: Tổng các dòng cắt lẻ trong nhóm.
3. **Diện tích tính tiền ($m^2$)**: $\text{Tổng mét dài} \times \text{Khổ hữu dụng}$ (Ví dụ khổ chuẩn $1.08\text{m}$).
4. **Thành tiền nhóm tôn**: $\text{Diện tích } (m^2) \times \text{Đơn giá } (\text{đ}/m^2)$.
5. **Tổng tiền đơn hàng**: $\sum \text{Tiền Tôn} + \sum \text{Tiền Phụ Kiện} - \text{Chiết Khấu}$.
6. **Còn phải thu**: $\text{Tổng Tiền} - \text{Tiền Khách Cọc/Trả}$.

---

## 📚 2. Kế Toán Hộ Kinh Doanh (Thông tư 88/2021/TT-BTC)

### Giá Vốn Bình Quân Gia Quyền:
$$\text{Đơn giá vốn mới} = \frac{\text{Giá trị tồn cũ} + (\text{Số lượng nhập} \times \text{Đơn giá nhập})}{\text{Số lượng tồn cũ} + \text{Số lượng nhập}}$$

### Các mẫu biểu liên thông:
- **Mẫu 01-TT**: Phiếu thu (Thu tiền mặt hoặc chuyển khoản từ khách hàng).
- **Mẫu 02-TT**: Phiếu chi (Chi tiền mua vật tư, trả nhà máy, chi phí xưởng).
- **Mẫu 03-VT**: Phiếu nhập kho (Cộng dồn tồn kho và cập nhật giá vốn).
- **Sổ S1-HKD**: Sổ quỹ tiền mặt (Tự động ghi nhận số dư theo từng giao dịch).
- **Sổ S2-HKD**: Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa.

---

## 🖨️ 3. Quy Chuẩn In Ấn Hoá Đơn (A4 / A5)
- Hỗ trợ in trực tiếp từ trình duyệt (`window.print()`).
- Bố cục gồm 2 liên: Liên 1 (Lưu xưởng cán tôn), Liên 2 (Giao cho khách hàng/thợ thầu).
- Tự động chuyển đổi tổng tiền số thành chữ tiếng Việt chuẩn (Ví dụ: *"Sáu triệu sáu trăm tám mươi nghìn..."*).

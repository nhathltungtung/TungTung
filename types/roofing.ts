export interface RoofingCutItem {
  id: string;
  length: number; // Chiều dài (mét), ví dụ: 2.96
  quantity: number; // Số tấm, ví dụ: 1
  totalMeters: number; // Mét dài = length * quantity
}

export interface RoofingGroup {
  id: string;
  productName: string; // Tên hàng: Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng
  width: number; // Khổ tôn (mét), ví dụ: 1.08
  unitPrice: number; // Đơn giá (đ/m²), ví dụ: 111000
  items: RoofingCutItem[];
  // Computed values
  totalPieces: number; // Tổng số tấm
  totalMeters: number; // Tổng mét dài
  totalSquareMeters: number; // Tổng m² = totalMeters * width
  subtotal: number; // Thành tiền = totalSquareMeters * unitPrice
}

export interface AccessoryItem {
  id: string;
  name: string; // Tên phụ kiện: Sườn 300, Máng Inox 304, Keo A500, Vít 4
  length?: number; // Chiều dài (nếu có, ví dụ: 3m, 5.7m)
  pieces?: number; // Số tấm / số cây (nếu có, ví dụ: 1, 2)
  unit: string; // ĐVT: md, kg, Lọ, Túi, Hộp, Cây
  quantity: number; // Khối lượng hoặc số lượng tính tiền (mét dài, kg, số lọ)
  unitPrice: number; // Đơn giá
  subtotal: number; // Thành tiền = quantity * unitPrice
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

export type RoofingOrderStatus = "pending" | "cutting" | "completed" | "cancelled";

export interface RoofingOrder {
  id: string;
  orderCode: string; // Ví dụ: DH-20260912-001
  createdAt: string; // Ngày lập
  customer: CustomerInfo;
  roofingGroups: RoofingGroup[];
  accessories: AccessoryItem[];
  discount: number; // Giảm giá / Chiết khấu
  deposit: number; // Tiền khách đặt cọc / trả trước
  unpaidAmount?: number; // Tiền từ các HĐ chưa thanh toán / nợ cũ
  totalAmount: number; // Tổng giá trị đơn hàng
  remainingAmount: number; // Còn lại phải thu = (totalAmount - discount - deposit) + unpaidAmount
  status: RoofingOrderStatus;
}

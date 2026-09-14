import { RoofingCutItem, RoofingGroup, AccessoryItem, RoofingOrder } from "../types/roofing";

/**
 * Tính toán cho 1 nhóm tôn (cùng loại, cùng khổ, cùng đơn giá)
 */
export function calculateRoofingGroup(group: Partial<RoofingGroup>): RoofingGroup {
  const items = group.items || [];
  const width = Number(group.width) || 1.08;
  const unitPrice = Number(group.unitPrice) || 0;

  let totalPieces = 0;
  let totalMeters = 0;

  const processedItems: RoofingCutItem[] = items.map((item, index) => {
    const length = Number(item.length) || 0;
    const quantity = Number(item.quantity) || 0;
    const totalItemMeters = Math.round(length * quantity * 1000) / 1000;

    totalPieces += quantity;
    totalMeters += totalItemMeters;

    return {
      id: item.id || `item-${index}-${Date.now()}`,
      length,
      quantity,
      totalMeters: totalItemMeters,
    };
  });

  totalMeters = Math.round(totalMeters * 1000) / 1000;
  const totalSquareMeters = Math.round(totalMeters * width * 10000) / 10000;
  const subtotal = Math.round(totalSquareMeters * unitPrice);

  return {
    id: group.id || `group-${Date.now()}`,
    productName: group.productName !== undefined ? group.productName : "",
    width,
    unitPrice,
    items: processedItems,
    totalPieces,
    totalMeters,
    totalSquareMeters,
    subtotal,
  };
}

/**
 * Tính toán cho 1 phụ kiện
 */
export function calculateAccessory(acc: Partial<AccessoryItem>): AccessoryItem {
  const quantity = Number(acc.quantity) || 0;
  const unitPrice = Number(acc.unitPrice) || 0;
  const subtotal = Math.round(quantity * unitPrice);

  return {
    id: acc.id || `acc-${Date.now()}`,
    name: acc.name || "",
    length: acc.length !== undefined ? Number(acc.length) : undefined,
    pieces: acc.pieces !== undefined ? Number(acc.pieces) : undefined,
    unit: acc.unit || "Cái",
    quantity,
    unitPrice,
    subtotal,
  };
}

/**
 * Tính toán tổng thể đơn hàng
 */
export function calculateOrderTotals(
  roofingGroups: RoofingGroup[],
  accessories: AccessoryItem[],
  discount: number = 0,
  deposit: number = 0
): { totalAmount: number; remainingAmount: number; roofingTotal: number; accessoriesTotal: number } {
  const roofingTotal = roofingGroups.reduce((sum, g) => sum + (g.subtotal || 0), 0);
  const accessoriesTotal = accessories.reduce((sum, a) => sum + (a.subtotal || 0), 0);
  const totalAmount = roofingTotal + accessoriesTotal;
  const remainingAmount = Math.max(0, totalAmount - (Number(discount) || 0) - (Number(deposit) || 0));

  return {
    totalAmount,
    remainingAmount,
    roofingTotal,
    accessoriesTotal,
  };
}

/**
 * Định dạng tiền tệ VND (ví dụ: 4,810,784 đ)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + " đ";
}

/**
 * Định dạng số thập phân gọn gàng
 */
export function formatNumber(value: number, maxDecimals: number = 4): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return Number(value.toFixed(maxDecimals)).toString();
}

/**
 * Chuyển đổi số tiền thành chữ Tiếng Việt (Dùng cho hoá đơn)
 */
export function numberToVietnameseWords(n: number): string {
  if (!n || isNaN(n)) return "Không đồng";
  const num = Math.round(Math.abs(n));
  if (num === 0) return "Không đồng";

  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

  function readBlockThree(threeDigits: number, hasHigher: boolean): string {
    const a = Math.floor(threeDigits / 100);
    const b = Math.floor((threeDigits % 100) / 10);
    const c = threeDigits % 10;
    let res = "";

    if (a > 0 || hasHigher) {
      res += digits[a] + " trăm ";
    }

    if (b > 1) {
      res += digits[b] + " mươi ";
      if (c === 1) res += "mốt ";
      else if (c === 5) res += "lăm ";
      else if (c > 0) res += digits[c] + " ";
    } else if (b === 1) {
      res += "mười ";
      if (c === 5) res += "lăm ";
      else if (c > 0) res += digits[c] + " ";
    } else if (b === 0 && c > 0) {
      if (a > 0 || hasHigher) res += "lẻ ";
      res += digits[c] + " ";
    }

    return res.trim();
  }

  let strNum = num.toString();
  const blocks: number[] = [];
  while (strNum.length > 0) {
    blocks.unshift(parseInt(strNum.slice(-3), 10));
    strNum = strNum.slice(0, -3);
  }

  let result = "";
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b > 0) {
      const blockStr = readBlockThree(b, i > 0);
      const unit = units[blocks.length - 1 - i];
      result += blockStr + " " + unit + " ";
    }
  }

  result = result.trim();
  if (!result) return "Không đồng";
  // Viết hoa chữ cái đầu tiên và thêm chữ đồng
  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng chẵn.";
}

/**
 * Đơn hàng mẫu lấy chính xác từ file "hoá đơn tôn bản chính.xlsx"
 */
export const SAMPLE_EXCEL_ORDER: RoofingOrder = {
  id: "sample-order-001",
  orderCode: "HĐ-2026-0832",
  createdAt: new Date().toISOString().split("T")[0],
  customer: {
    name: "Anh Việt (Khách thầu)",
    phone: "0988 123 456",
    address: "Trương Xá, Nghĩa Dân, Hưng Yên",
    note: "Giao tại công trình trước 10h sáng",
  },
  roofingGroups: [
    calculateRoofingGroup({
      id: "grp-1",
      productName: "Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng",
      width: 1.08,
      unitPrice: 111000,
      items: [
        { id: "cut-1", length: 2.96, quantity: 1, totalMeters: 2.96 },
        { id: "cut-2", length: 3.09, quantity: 1, totalMeters: 3.09 },
        { id: "cut-3", length: 3.21, quantity: 1, totalMeters: 3.21 },
        { id: "cut-4", length: 3.33, quantity: 1, totalMeters: 3.33 },
        { id: "cut-5", length: 3.46, quantity: 1, totalMeters: 3.46 },
        { id: "cut-6", length: 3.58, quantity: 1, totalMeters: 3.58 },
        { id: "cut-7", length: 3.72, quantity: 1, totalMeters: 3.72 },
        { id: "cut-8", length: 3.85, quantity: 1, totalMeters: 3.85 },
        { id: "cut-9", length: 4.15, quantity: 1, totalMeters: 4.15 },
        { id: "cut-10", length: 4.28, quantity: 1, totalMeters: 4.28 },
        { id: "cut-11", length: 4.5, quantity: 1, totalMeters: 4.5 },
      ],
    }),
  ],
  accessories: [
    calculateAccessory({
      id: "acc-1",
      name: "Sườn 300",
      length: 3,
      pieces: 1,
      unit: "md",
      quantity: 3,
      unitPrice: 38000,
    }),
    calculateAccessory({
      id: "acc-2",
      name: "Máng 400 Inox 304",
      length: 5.7,
      pieces: 2,
      unit: "kg",
      quantity: 14.83,
      unitPrice: 82000,
    }),
    calculateAccessory({
      id: "acc-3",
      name: "Keo A500",
      unit: "Lọ",
      quantity: 5,
      unitPrice: 48000,
    }),
    calculateAccessory({
      id: "acc-4",
      name: "Vít 4",
      unit: "Túi",
      quantity: 4,
      unitPrice: 75000,
    }),
  ],
  discount: 0,
  deposit: 2000000,
  totalAmount: 6680844,
  remainingAmount: 4680844,
  status: "cutting",
};

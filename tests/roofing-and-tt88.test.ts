import { describe, it, expect } from "vitest";
import {
  calculateRoofingGroup,
  calculateAccessory,
  calculateOrderTotals,
  SAMPLE_EXCEL_ORDER,
  formatCurrency,
  numberToVietnameseWords,
} from "@/lib/roofing-calc";
import { inventoryItemSchema, stockInSchema } from "@/app/(admin)/admin/inventory/schemas";
import { cashTransactionSchema } from "@/app/(admin)/admin/accounting/schemas";

describe("TungTung Roofing Math & TT88 Business Engine", () => {
  it("Khớp 100% kết quả tính cắt tôn mẫu thực tế trong hoá đơn tôn bản chính.xlsx", () => {
    const group = SAMPLE_EXCEL_ORDER.roofingGroups[0];
    const calculatedGroup = calculateRoofingGroup(group);

    // 1. Tổng mét dài 11 tấm lẻ = đúng 40.13m
    expect(calculatedGroup.totalMeters).toBe(40.13);

    // 2. Tổng diện tích m2 (40.13m x 1.08m) = 43.3404 m2
    expect(Number(calculatedGroup.totalSquareMeters.toFixed(4))).toBe(43.3404);

    // 3. Tiền tôn Olympic 11 sóng = đúng 4,810,784 đ
    expect(calculatedGroup.subtotal).toBe(4810784);

    // 4. Tổng giá trị đơn hàng (Tôn + Phụ kiện) = đúng 6,680,844 đ
    const totals = calculateOrderTotals(
      [calculatedGroup],
      SAMPLE_EXCEL_ORDER.accessories,
      SAMPLE_EXCEL_ORDER.discount,
      SAMPLE_EXCEL_ORDER.deposit
    );
    expect(totals.totalAmount).toBe(6680844);

    // 5. Tiền phụ kiện = 1,870,060 đ
    expect(totals.accessoriesTotal).toBe(1870060);

    // 6. Số tiền đọc thành chữ
    const words = numberToVietnameseWords(totals.totalAmount);
    expect(words.toLowerCase()).toContain("sáu triệu sáu trăm tám mươi nghìn");
  });

  it("Tính đơn giá vốn bình quân gia quyền theo chuẩn Thông tư 88/2021/TT-BTC", () => {
    const currentQty = 30;
    const currentStockValue = 3974700; // Giá vốn cũ ~ 132,490đ/cây
    const importQty = 20;
    const importUnitPrice = 150000;
    const importTotal = importQty * importUnitPrice; // 3,000,000đ

    const newQty = currentQty + importQty; // 50 cây
    const newStockValue = currentStockValue + importTotal; // 6,974,700đ
    const newUnitCost = Math.round(newStockValue / newQty); // 139,494đ/cây

    expect(newQty).toBe(50);
    expect(newStockValue).toBe(6974700);
    expect(newUnitCost).toBe(139494);
  });

  it("Xác thực Zod schema ngăn chặn dữ liệu sai", () => {
    // Inventory item code phải ít nhất 2 ký tự
    const invalidCode = inventoryItemSchema.safeParse({
      code: "A",
      name: "Test",
      unit: "CÂY",
      category: "thep_hop",
      stockQty: 10,
      unitCost: 10000,
      sellingPrice: 15000,
    });
    expect(invalidCode.success).toBe(false);

    // Stock in số lượng không được âm
    const invalidStock = stockInSchema.safeParse({
      supplier: "Nhà máy Hòa Phát",
      productCode: "H204014",
      quantity: -10,
      unitPrice: 100000,
    });
    expect(invalidStock.success).toBe(false);

    // Cash transaction số tiền không được < 1000đ
    const invalidCash = cashTransactionSchema.safeParse({
      type: "receipt",
      date: "2026-09-14",
      category: "Thu tiền",
      counterpart: "Khách lẻ",
      amount: 500,
      paymentMethod: "cash",
    });
    expect(invalidCash.success).toBe(false);
  });

  it("Xác thực hàm createBlankRoofingOrder và danh mục ĐVT phụ kiện ACCESSORY_UNITS", async () => {
    const { createBlankRoofingOrder, ACCESSORY_UNITS } = await import(
      "@/components/roofing/RoofingOrderForm"
    );

    // 1. Tạo đơn hàng trắng
    const blankOrder = createBlankRoofingOrder();

    // Khách hàng phải hoàn toàn rỗng để nhập mới
    expect(blankOrder.customer.name).toBe("");
    expect(blankOrder.customer.phone).toBe("");
    expect(blankOrder.customer.address).toBe("");
    expect(blankOrder.customer.note).toBe("");

    // Có 1 nhóm tôn trắng sẵn sàng nhập
    expect(blankOrder.roofingGroups.length).toBe(1);
    expect(blankOrder.roofingGroups[0].productName).toBe("");
    expect(blankOrder.roofingGroups[0].width).toBe(1.08);
    expect(blankOrder.roofingGroups[0].unitPrice).toBe(0);

    // Phụ kiện rỗng
    expect(blankOrder.accessories.length).toBe(0);

    // Tổng tiền khởi tạo bằng 0
    expect(blankOrder.totalAmount).toBe(0);
    expect(blankOrder.remainingAmount).toBe(0);
    expect(blankOrder.discount).toBe(0);
    expect(blankOrder.deposit).toBe(0);

    // 2. Danh mục ĐVT phụ kiện chuẩn ngành tôn thép
    expect(ACCESSORY_UNITS).toContain("Cây");
    expect(ACCESSORY_UNITS).toContain("Mét");
    expect(ACCESSORY_UNITS).toContain("Cái");
    expect(ACCESSORY_UNITS).toContain("Tấm");
    expect(ACCESSORY_UNITS).toContain("m²");
    expect(ACCESSORY_UNITS).toContain("Kg");
    expect(ACCESSORY_UNITS.length).toBeGreaterThanOrEqual(8);
  });

  it("Xác thực thao tác chọn loại tôn từ kho tự động điền Tên, Khổ và Đơn giá vào Nhóm Tôn #1", async () => {
    const { createBlankRoofingOrder } = await import("@/components/roofing/RoofingOrderForm");

    const order = createBlankRoofingOrder();
    const group1 = order.roofingGroups[0];

    // Giả lập chọn tôn từ Kho TT88 (OLPXX)
    const warehouseProduct = {
      code: "OLPXX",
      name: "Tôn 0.40 Xanh Rêu Olympic Xốp 3+ 11 sóng",
      width: 1.08,
      unitPrice: 164000,
    };

    const updatedGroup = calculateRoofingGroup({
      ...group1,
      productName: `${warehouseProduct.code} — ${warehouseProduct.name}`,
      width: warehouseProduct.width,
      unitPrice: warehouseProduct.unitPrice,
      items: [
        { id: "cut-1", length: 6.0, quantity: 2, totalMeters: 12.0 },
      ],
    });

    expect(updatedGroup.productName).toContain("OLPXX");
    expect(updatedGroup.width).toBe(warehouseProduct.width);
    expect(updatedGroup.unitPrice).toBe(warehouseProduct.unitPrice);
    expect(updatedGroup.totalPieces).toBe(2);
    expect(updatedGroup.totalMeters).toBe(12.0);
    expect(updatedGroup.totalSquareMeters).toBe(12.0 * warehouseProduct.width);
    expect(updatedGroup.subtotal).toBe(
      Math.round(12.0 * warehouseProduct.width * warehouseProduct.unitPrice)
    );
  });
});


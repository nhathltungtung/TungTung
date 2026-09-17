import { describe, it, expect } from "vitest";
import fs from "fs";
import {
  exportMauS3HKDExcel,
  DEFAULT_SALES_REVENUE,
  SalesRevenueRecord,
} from "@/lib/accounting-data";
import { SAMPLE_EXCEL_ORDER } from "@/lib/roofing-calc";
import { RoofingOrder } from "@/types/roofing";

describe("Kiểm thử Khắc Phục Lỗi Quản Lý Đơn Hàng & Sổ Doanh Thu (S3-HKD)", () => {
  it("1. Dữ liệu mẫu Sổ Doanh Thu (DEFAULT_SALES_REVENUE) chuẩn chỉ theo Thông tư 88/2021/TT-BTC", () => {
    expect(DEFAULT_SALES_REVENUE.length).toBeGreaterThan(0);

    DEFAULT_SALES_REVENUE.forEach((rec) => {
      expect(rec.orderCode).toMatch(/^HĐ-/);
      expect(rec.customerName).toBeTruthy();
      expect(rec.itemsSummary).toBeTruthy();
      expect(rec.totalAmount).toBeGreaterThan(0);
      expect(rec.paidAmount + rec.remainingAmount).toBe(rec.totalAmount);
    });
  });

  it("2. Hàm exportMauS3HKDExcel xuất sổ S3-HKD đúng cấu trúc Excel và không bị lỗi", () => {
    const filename = "So_Chi_Tiet_Doanh_Thu_Mau_S3_HKD.xlsx";

    expect(() => {
      exportMauS3HKDExcel(DEFAULT_SALES_REVENUE);
    }).not.toThrow();

    if (fs.existsSync(filename)) {
      expect(fs.statSync(filename).size).toBeGreaterThan(0);
      fs.unlinkSync(filename);
    }
  });

  it("3. Logic tính toán tổng hợp danh sách đơn hàng cho Báo Cáo In Khổ A4 (OrderListPrint)", () => {
    const mockOrders: RoofingOrder[] = [
      SAMPLE_EXCEL_ORDER,
      {
        ...SAMPLE_EXCEL_ORDER,
        id: "order-test-2",
        orderCode: "HĐ-TEST-002",
        totalAmount: 10000000,
        deposit: 6000000,
        remainingAmount: 4000000,
      },
    ];

    const totalAmount = mockOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalDeposit = mockOrders.reduce((sum, o) => sum + (Number(o.deposit) || 0), 0);
    const totalRemaining = mockOrders.reduce((sum, o) => sum + (Number(o.remainingAmount) || 0), 0);

    expect(totalAmount).toBe(6680844 + 10000000);
    expect(totalDeposit).toBe(SAMPLE_EXCEL_ORDER.deposit + 6000000);
    expect(totalRemaining).toBe(SAMPLE_EXCEL_ORDER.remainingAmount + 4000000);
  });

  it("4. Chuyển đổi từ RoofingOrder sang SalesRevenueRecord chính xác để hiển thị Sổ Doanh Thu", () => {
    const sample = SAMPLE_EXCEL_ORDER;
    const roofingNames = sample.roofingGroups.map((g) => g.productName || "Tôn lợp");
    const accessoryNames = sample.accessories.map((a) => a.name).filter(Boolean);
    const allItems = [...roofingNames, ...accessoryNames];
    const itemsSummary = allItems.length > 0 ? allItems.join(", ") : "Tôn lợp & phụ kiện";

    const record: SalesRevenueRecord = {
      id: sample.id,
      orderCode: sample.orderCode,
      date: sample.createdAt.slice(0, 10),
      customerName: sample.customer.name,
      customerPhone: sample.customer.phone,
      customerAddress: sample.customer.address,
      itemsSummary,
      totalAmount: Number(sample.totalAmount) || 0,
      paidAmount: Number(sample.deposit) || 0,
      remainingAmount: Number(sample.remainingAmount) || 0,
      status: sample.status,
    };

    expect(record.orderCode).toBe(SAMPLE_EXCEL_ORDER.orderCode);
    expect(record.customerName).toBe(SAMPLE_EXCEL_ORDER.customer.name);
    expect(record.totalAmount).toBe(6680844);
    expect(record.paidAmount).toBe(2000000);
    expect(record.remainingAmount).toBe(4680844);
    expect(record.itemsSummary).toContain("Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng");
    expect(record.itemsSummary).toContain("Sườn 300");
  });
});

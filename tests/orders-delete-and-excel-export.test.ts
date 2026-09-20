import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import {
  saveToLocalStorage,
  getFromLocalStorage,
  deleteFromLocalStorage,
  LOCAL_STORAGE_KEY,
  DELETED_ORDERS_KEY,
} from "@/lib/supabase/roofing-service";
import { exportRoofingOrdersListToExcel } from "@/lib/roofing-excel";
import { SAMPLE_EXCEL_ORDER } from "@/lib/roofing-calc";
import { RoofingOrder } from "@/types/roofing";

// Mock localStorage in Node.js test environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe("Kiểm thử Khắc phục Lỗi Xoá Đơn Hàng & Chuẩn Hoá Xuất Excel Danh Sách", () => {
  let originalWindow: typeof globalThis.window;
  let originalLocalStorage: typeof globalThis.localStorage;

  beforeEach(() => {
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;

    const mockStorage = new LocalStorageMock();
    (global as unknown as { window: unknown }).window = {};
    (global as unknown as { localStorage: unknown }).localStorage = mockStorage;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  });

  describe("1. Cơ chế LocalStorage & Tombstone (Ngăn ngừa đơn bị hồi sinh)", () => {
    it("Xoá đơn hàng khỏi LocalStorage và ghi nhận vào Tombstone", () => {
      const order1: RoofingOrder = {
        ...SAMPLE_EXCEL_ORDER,
        id: "order-uuid-1",
        orderCode: "HĐ-TEST-001",
      };
      const order2: RoofingOrder = {
        ...SAMPLE_EXCEL_ORDER,
        id: "order-uuid-2",
        orderCode: "HĐ-TEST-002",
      };

      // 1. Lưu 2 đơn vào bộ nhớ
      saveToLocalStorage(order1);
      saveToLocalStorage(order2);

      let orders = getFromLocalStorage();
      expect(orders.length).toBe(2);
      expect(orders.some((o) => o.orderCode === "HĐ-TEST-001")).toBe(true);

      // 2. Thực hiện xoá đơn 1
      deleteFromLocalStorage("HĐ-TEST-001", "order-uuid-1");

      orders = getFromLocalStorage();
      expect(orders.length).toBe(1);
      expect(orders.some((o) => o.orderCode === "HĐ-TEST-001")).toBe(false);
      expect(orders[0].orderCode).toBe("HĐ-TEST-002");

      // 3. Kiểm tra danh sách Tombstone (DELETED_ORDERS_KEY)
      const tombstone = JSON.parse(
        global.localStorage.getItem(DELETED_ORDERS_KEY) || "[]"
      );
      expect(tombstone).toContain("HĐ-TEST-001");
    });

    it("Cơ chế Tombstone ngăn chặn đơn đã xoá bị đẩy ngược lại vào danh sách", () => {
      // Giả sử có một dữ liệu cũ trong localStorage chứa đơn đã xoá
      const deletedCode = "HĐ-DA-XOA-999";
      deleteFromLocalStorage(deletedCode);

      // Dữ liệu rác cố ý chèn vào bộ nhớ
      const corruptedStorage: RoofingOrder[] = [
        {
          ...SAMPLE_EXCEL_ORDER,
          id: "ghost-id",
          orderCode: deletedCode,
        },
        {
          ...SAMPLE_EXCEL_ORDER,
          id: "valid-id",
          orderCode: "HĐ-HOP-LE-123",
        },
      ];
      global.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(corruptedStorage)
      );

      // getFromLocalStorage phải lọc sạch đơn đã xoá
      const result = getFromLocalStorage();
      expect(result.length).toBe(1);
      expect(result[0].orderCode).toBe("HĐ-HOP-LE-123");
      expect(result.some((o) => o.orderCode === deletedCode)).toBe(false);
    });
  });

  describe("2. Xuất Excel Danh Sách Đơn Cắt Tôn (exportRoofingOrdersListToExcel)", () => {
    const testExcelFile = path.join(process.cwd(), "test-orders-list.xlsx");

    afterEach(async () => {
      if (fs.existsSync(testExcelFile)) {
        try {
          fs.unlinkSync(testExcelFile);
        } catch {
          // ignore
        }
      }
    });

    it("Xuất file Excel danh sách với cấu trúc, tiêu đề và định dạng số chính xác 100%", async () => {
      // Gỡ mock window để test chạy theo nhánh Node file writing
      // @ts-expect-error Reset window
      delete global.window;

      const mockOrders: RoofingOrder[] = [
        {
          ...SAMPLE_EXCEL_ORDER,
          id: "order-1",
          orderCode: "HĐ-2026-0001",
          createdAt: "2026-09-15",
          customer: {
            name: "Anh Tuấn (Thợ Thầu)",
            phone: "0989123456",
            address: "Kim Động, Hưng Yên",
          },
          totalAmount: 15500000,
          deposit: 5000000,
          remainingAmount: 10500000,
          status: "pending",
        },
        {
          ...SAMPLE_EXCEL_ORDER,
          id: "order-2",
          orderCode: "HĐ-2026-0002",
          createdAt: "2026-09-16",
          customer: {
            name: "Chị Lan (Công trình nhà xưởng)",
            phone: "0977888999",
            address: "Toàn Thắng, Hưng Yên",
          },
          totalAmount: 24000000,
          deposit: 24000000,
          remainingAmount: 0,
          status: "completed",
        },
        {
          ...SAMPLE_EXCEL_ORDER,
          id: "order-3",
          orderCode: "HĐ-2026-0003",
          createdAt: "2026-09-17",
          customer: {
            name: "Bác Hùng",
            phone: "0912345678",
            address: "Khoái Châu",
          },
          totalAmount: 8500000,
          deposit: 3000000,
          remainingAmount: 5500000,
          status: "cutting",
        },
      ];

      await exportRoofingOrdersListToExcel(mockOrders, testExcelFile);

      expect(fs.existsSync(testExcelFile)).toBe(true);
      expect(fs.statSync(testExcelFile).size).toBeGreaterThan(1000);

      // Đọc lại file bằng ExcelJS để kiểm chứng nội dung từng ô
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(testExcelFile);

      const ws = workbook.getWorksheet("Danh Sách Đơn Hàng");
      expect(ws).toBeDefined();

      // Kiểm tra Header Đại lý
      expect(ws!.getCell("A1").value).toContain("ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG");
      expect(ws!.getCell("A4").value).toContain("BÁO CÁO DANH SÁCH ĐƠN HÀNG CẮT TÔN");

      // Kiểm tra Tiêu đề cột tại dòng 9
      expect(ws!.getCell("A9").value).toBe("STT");
      expect(ws!.getCell("B9").value).toBe("Mã Đơn Hàng");
      expect(ws!.getCell("C9").value).toBe("Ngày Tạo");
      expect(ws!.getCell("D9").value).toBe("Khách Hàng / Công Trình");
      expect(ws!.getCell("E9").value).toBe("Số Điện Thoại");
      expect(ws!.getCell("F9").value).toBe("Địa Chỉ");
      expect(ws!.getCell("G9").value).toBe("Tổng Tiền (đ)");
      expect(ws!.getCell("H9").value).toBe("Đã Cọc / Trả (đ)");
      expect(ws!.getCell("I9").value).toBe("Còn Phải Thu (đ)");
      expect(ws!.getCell("J9").value).toBe("Trạng Thái");
      expect(ws!.getCell("K9").value).toBe("Ghi Chú");

      // Kiểm tra Dòng dữ liệu 1 (Dòng 10)
      expect(ws!.getCell("A10").value).toBe(1);
      expect(ws!.getCell("B10").value).toBe("HĐ-2026-0001");
      expect(ws!.getCell("D10").value).toBe("Anh Tuấn (Thợ Thầu)");
      expect(ws!.getCell("E10").value).toBe("0989123456");
      expect(ws!.getCell("G10").value).toBe(15500000);
      expect(ws!.getCell("G10").numFmt).toBe("#,##0");
      expect(ws!.getCell("H10").value).toBe(5000000);
      expect(ws!.getCell("I10").value).toBe(10500000);
      expect(ws!.getCell("J10").value).toBe("Chờ Cắt");

      // Kiểm tra Dòng dữ liệu 2 (Dòng 11) - Trạng thái Hoàn Tất
      expect(ws!.getCell("A11").value).toBe(2);
      expect(ws!.getCell("B11").value).toBe("HĐ-2026-0002");
      expect(ws!.getCell("G11").value).toBe(24000000);
      expect(ws!.getCell("H11").value).toBe(24000000);
      expect(ws!.getCell("I11").value).toBe(0);
      expect(ws!.getCell("J11").value).toBe("Hoàn Tất");

      // Kiểm tra Dòng dữ liệu 3 (Dòng 12) - Trạng thái Đang Cán Tôn
      expect(ws!.getCell("A12").value).toBe(3);
      expect(ws!.getCell("B12").value).toBe("HĐ-2026-0003");
      expect(ws!.getCell("J12").value).toBe("Đang Cán Tôn");

      // Kiểm tra Dòng Tổng Kết Cuối Bảng (Dòng 13)
      const totalRowIdx = 13;
      expect(ws!.getCell(`A${totalRowIdx}`).value).toContain("TỔNG CỘNG TOÀN BỘ (3 ĐƠN)");
      expect(ws!.getCell(`G${totalRowIdx}`).value).toBe(15500000 + 24000000 + 8500000); // 48,000,000
      expect(ws!.getCell(`H${totalRowIdx}`).value).toBe(5000000 + 24000000 + 3000000);  // 32,000,000
      expect(ws!.getCell(`I${totalRowIdx}`).value).toBe(10500000 + 0 + 5500000);        // 16,000,000
    });
  });
});

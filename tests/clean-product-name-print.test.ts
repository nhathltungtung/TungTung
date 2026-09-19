import { describe, it, expect } from "vitest";
import { cleanProductName, calculateRoofingGroup, calculateAccessory, calculateOrderTotals } from "@/lib/roofing-calc";
import { buildRoofingExcelDataRows } from "@/lib/roofing-excel";
import { RoofingOrder } from "@/types/roofing";
import fs from "fs";
import path from "path";

describe("Loại Bỏ Mã Sản Phẩm Khi In Ấn & Xuất Excel (Chỉ Hiển Thị Tên Sản Phẩm)", () => {
  describe("1. Hàm cleanProductName loại bỏ chuẩn xác các tiền tố mã hàng", () => {
    it("Loại bỏ tiền tố mã với dấu gạch ngang dài (em dash '—')", () => {
      const input = "OLPXX — Tôn 0.40 Xanh Rêu Olympic Xốp 3+ 11 sóng";
      expect(cleanProductName(input)).toBe("Tôn 0.40 Xanh Rêu Olympic Xốp 3+ 11 sóng");
    });

    it("Loại bỏ tiền tố mã với dấu gạch ngang thông thường ('-')", () => {
      const input = "H132614 - 13X26x1,4";
      expect(cleanProductName(input)).toBe("13X26x1,4");
    });

    it("Loại bỏ tiền tố mã trong ngoặc vuông ('[CODE]')", () => {
      const input = "[OLP1LXR] Tôn 0.40 Xanh Rêu Olympic 1 Lớp 11 sóng";
      expect(cleanProductName(input)).toBe("Tôn 0.40 Xanh Rêu Olympic 1 Lớp 11 sóng");
    });

    it("Loại bỏ tiền tố mã trong ngoặc tròn ('(CODE)')", () => {
      const input = "(NOC300O) Nóc 300";
      expect(cleanProductName(input)).toBe("Nóc 300");
    });

    it("Loại bỏ tiền tố mã với dấu hai chấm ('CODE: ')", () => {
      const input = "OLP1LD: Tôn 0.40 Đỏ Olympic 1 Lớp 11 sóng";
      expect(cleanProductName(input)).toBe("Tôn 0.40 Đỏ Olympic 1 Lớp 11 sóng");
    });

    it("Xử lý lặp mã nhiều lần (VD: 'OLPX3DTON040 — OLPX3D — Tôn...')", () => {
      const input = "OLPX3DTON040 — OLPX3D — Tôn 0.40 Đỏ Olympic Xốp 3+ Bạc Hoa 11 sóng";
      expect(cleanProductName(input)).toBe("Tôn 0.40 Đỏ Olympic Xốp 3+ Bạc Hoa 11 sóng");
    });

    it("Giữ nguyên các tên sản phẩm thuần túy hoặc kích thước không có tiền tố mã", () => {
      expect(cleanProductName("Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng")).toBe("Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng");
      expect(cleanProductName("13X26x1,4")).toBe("13X26x1,4");
      expect(cleanProductName("Sườn 300")).toBe("Sườn 300");
      expect(cleanProductName("Máng 400 Inox 304")).toBe("Máng 400 Inox 304");
      expect(cleanProductName("Keo A500")).toBe("Keo A500");
      expect(cleanProductName("Vít 4")).toBe("Vít 4");
    });

    it("Xử lý chuỗi rỗng, null hoặc undefined an toàn", () => {
      expect(cleanProductName("")).toBe("");
      expect(cleanProductName(undefined)).toBe("");
      expect(cleanProductName(null as unknown as string)).toBe("");
    });
  });

  describe("2. buildRoofingExcelDataRows không chứa mã sản phẩm khi xuất Excel", () => {
    it("Tên nhóm tôn và tên phụ kiện trong các dòng Excel hoàn toàn sạch mã", () => {
      const sampleOrderWithCodes: RoofingOrder = {
        id: "order-test-clean",
        orderCode: "HĐ-2026-999",
        createdAt: "2026-09-19",
        customer: { name: "Anh Nam", phone: "0912345678", address: "Hưng Yên" },
        roofingGroups: [
          calculateRoofingGroup({
            id: "grp-1",
            productName: "OLPXX — Tôn 0.40 Xanh Rêu Olympic Xốp 3+ 11 sóng",
            width: 1.08,
            unitPrice: 164000,
            items: [
              { id: "cut-1", length: 3.5, quantity: 2, totalMeters: 7.0 },
            ],
          }),
          calculateRoofingGroup({
            id: "grp-2",
            productName: "NOC30 — NÓC 300",
            width: 1.0,
            unitPrice: 38000,
            items: [
              { id: "cut-2", length: 2.0, quantity: 3, totalMeters: 6.0 },
            ],
          }),
        ],
        accessories: [
          calculateAccessory({
            id: "acc-1",
            name: "H132614 - 13X26x1,4",
            quantity: 5,
            unitPrice: 108000,
            unit: "Cây",
          }),
          calculateAccessory({
            id: "acc-2",
            name: "[LUOI] LƯỚI B40",
            quantity: 20,
            unitPrice: 28000,
            unit: "Kg",
          }),
        ],
        discount: 0,
        deposit: 0,
        totalAmount: 0,
        remainingAmount: 0,
        status: "pending",
      };

      const rows = buildRoofingExcelDataRows(sampleOrderWithCodes);

      // Kiểm tra tên dòng cắt nhóm 1
      const cutRow1 = rows.find((r) => r.stt === 1);
      expect(cutRow1?.name).toBe("Tôn 0.40 Xanh Rêu Olympic Xốp 3+ 11 sóng");
      expect(cutRow1?.name).not.toContain("OLPXX");

      // Kiểm tra phụ kiện
      const accRow1 = rows.find((r) => r.kind === "accessory" && r.name.includes("13X26"));
      expect(accRow1?.name).toBe("13X26x1,4");
      expect(accRow1?.name).not.toContain("H132614");

      const accRow2 = rows.find((r) => r.kind === "accessory" && r.name.includes("LƯỚI"));
      expect(accRow2?.name).toBe("LƯỚI B40");
      expect(accRow2?.name).not.toContain("LUOI");
    });
  });

  describe("3. RoofingInvoicePrint và RoofingOrderForm được cấu hình chuẩn", () => {
    it("RoofingInvoicePrint.tsx sử dụng cleanProductName cho mọi tên hiển thị", () => {
      const invoiceFilePath = path.join(
        process.cwd(),
        "components/roofing/RoofingInvoicePrint.tsx"
      );
      const content = fs.readFileSync(invoiceFilePath, "utf8");

      expect(content).toContain("cleanProductName");
      expect(content).toContain("cleanProductName(group.productName)");
      expect(content).toContain("cleanProductName(acc.name)");
    });

    it("RoofingOrderForm.tsx không tự động ghép tiền tố mã khi chọn từ kho", () => {
      const formFilePath = path.join(
        process.cwd(),
        "components/roofing/RoofingOrderForm.tsx"
      );
      const content = fs.readFileSync(formFilePath, "utf8");

      expect(content).toContain("cleanProductName");
      // Không còn tồn tại đoạn ghép chuỗi `${product.code} — ${product.name}`
      expect(content).not.toContain("`${product.code} — ${product.name}`");
      expect(content).toContain("const cleanName = cleanProductName(product.name)");
    });
  });
});

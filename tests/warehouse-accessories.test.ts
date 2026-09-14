import { describe, it, expect } from "vitest";
import {
  ACCESSORIES_CATALOG,
  normalizeAccessoryUnit,
  SHARED_UOM_NAMES,
} from "@/lib/catalogs";
import { calculateAccessory } from "@/lib/roofing-calc";
import { getWarehouseAccessories } from "@/lib/supabase/roofing-service";

describe("Phụ Kiện Bán Kèm - Danh Mục Kho Hàng & Tự Động Điền Dữ Liệu", () => {
  // ===========================================================================
  // 1. CHUẨN HÓA ĐƠN VỊ TÍNH (normalizeAccessoryUnit)
  // ===========================================================================
  describe("1. Chuẩn hóa ĐVT từ kho hàng (normalizeAccessoryUnit)", () => {
    it("Chuyển đổi các mã ĐVT viết tắt phổ biến trong kho sang tên hiển thị chuẩn", () => {
      // Mét dài dập xưởng
      expect(normalizeAccessoryUnit("MD")).toBe("Mét dài");
      expect(normalizeAccessoryUnit("md")).toBe("Mét dài");
      expect(normalizeAccessoryUnit("MET DAI")).toBe("Mét dài");
      expect(normalizeAccessoryUnit("mét dài")).toBe("Mét dài");

      // Lọ keo Apollo
      expect(normalizeAccessoryUnit("LO")).toBe("Lọ");
      expect(normalizeAccessoryUnit("lo")).toBe("Lọ");
      expect(normalizeAccessoryUnit("LỌ")).toBe("Lọ");

      // Túi vít
      expect(normalizeAccessoryUnit("TUI")).toBe("Túi");
      expect(normalizeAccessoryUnit("tui")).toBe("Túi");
      expect(normalizeAccessoryUnit("TÚI")).toBe("Túi");

      // Cây thép / nhôm
      expect(normalizeAccessoryUnit("CAY")).toBe("Cây");
      expect(normalizeAccessoryUnit("CÂY")).toBe("Cây");

      // Cái
      expect(normalizeAccessoryUnit("CAI")).toBe("Cái");
      expect(normalizeAccessoryUnit("CÁI")).toBe("Cái");

      // Kg
      expect(normalizeAccessoryUnit("KG")).toBe("Kg");
      expect(normalizeAccessoryUnit("kg")).toBe("Kg");

      // Bộ, Cuộn, Tấm
      expect(normalizeAccessoryUnit("BO")).toBe("Bộ");
      expect(normalizeAccessoryUnit("CUON")).toBe("Cuộn");
      expect(normalizeAccessoryUnit("TAM")).toBe("Tấm");
    });

    it("Các ĐVT chuẩn trong SHARED_UOM_NAMES được giữ nguyên", () => {
      for (const u of SHARED_UOM_NAMES) {
        expect(normalizeAccessoryUnit(u)).toBe(u);
      }
    });

    it("Xử lý an toàn khi đầu vào rỗng hoặc không xác định", () => {
      expect(normalizeAccessoryUnit("")).toBe("Cây");
      expect(normalizeAccessoryUnit("Thùng carton")).toBe("Thùng carton");
    });
  });

  // ===========================================================================
  // 2. DANH MỤC ACCESSORIES_CATALOG & TỒN KHO MẶC ĐỊNH
  // ===========================================================================
  describe("2. Danh mục phụ kiện có đầy đủ mã hàng (code) & tồn kho (stockQty)", () => {
    it("Mọi phụ kiện trong catalog đều có mã code, tên, đơn giá hợp lệ", () => {
      expect(ACCESSORIES_CATALOG.length).toBeGreaterThan(5);

      for (const acc of ACCESSORIES_CATALOG) {
        expect(acc.id).toBeDefined();
        expect(acc.name.length).toBeGreaterThan(0);
        expect(acc.unitPrice).toBeGreaterThan(0);
        expect(acc.unit).toBeDefined();
        expect(acc.code).toBeDefined();
        expect(typeof acc.code).toBe("string");
      }
    });

    it("Các phụ kiện chủ lực trong kho có mã nhận diện chuẩn", () => {
      const codes = ACCESSORIES_CATALOG.map((a) => a.code);
      expect(codes).toContain("MANG300");
      expect(codes).toContain("XOI300");
      expect(codes).toContain("SUON300");
      expect(codes).toContain("NOC300");
      expect(codes).toContain("KEO-A500");
      expect(codes).toContain("VIT-4");
      expect(codes).toContain("VIT-5");
    });

    it("Các phụ kiện chủ lực có số lượng tồn kho định mức > 0", () => {
      for (const acc of ACCESSORIES_CATALOG) {
        if (acc.stockQty !== undefined) {
          expect(acc.stockQty).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  // ===========================================================================
  // 3. TÌM KIẾM THÔNG MINH THEO MÃ HÀNG HOẶC TÊN TRONG KHO
  // ===========================================================================
  describe("3. Tìm kiếm phụ kiện thông minh theo mã hoặc tên (Search / Autocomplete)", () => {
    it("Tìm kiếm chính xác theo mã hàng (VD: 'MANG300')", () => {
      const query = "MANG300".toLowerCase();
      const matches = ACCESSORIES_CATALOG.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          (a.code && a.code.toLowerCase().includes(query))
      );

      expect(matches.length).toBe(1);
      expect(matches[0].name).toContain("Máng Inox");
      expect(matches[0].unitPrice).toBe(304000);
    });

    it("Tìm kiếm theo tiền tố mã hàng (VD: 'VIT')", () => {
      const query = "vit";
      const matches = ACCESSORIES_CATALOG.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          (a.code && a.code.toLowerCase().includes(query))
      );

      expect(matches.length).toBeGreaterThanOrEqual(3);
      for (const item of matches) {
        expect(item.name.toLowerCase().includes("vít") || item.code?.toLowerCase().includes("vit")).toBe(true);
      }
    });

    it("Tìm kiếm theo tên phụ kiện tiếng Việt không phân biệt hoa thường", () => {
      const query = "úp nóc";
      // Nóc dập mạ màu
      const matches = ACCESSORIES_CATALOG.filter(
        (a) =>
          a.name.toLowerCase().includes("nóc") ||
          (a.code && a.code.toLowerCase().includes("noc"))
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].code).toBe("NOC300");
    });
  });

  // ===========================================================================
  // 4. TỰ ĐỘNG ĐIỀN ĐƠN GIÁ, ĐVT & TÍNH TOÁN THÀNH TIỀN KHI CHỌN TỪ KHO
  // ===========================================================================
  describe("4. Tính toán thành tiền khi chọn phụ kiện từ kho hàng", () => {
    it("Tự động điền giá keo Apollo A500 và tính thành tiền theo số lượng lọ", () => {
      const keo = ACCESSORIES_CATALOG.find((a) => a.code === "KEO-A500")!;
      expect(keo).toBeDefined();

      const accRow = calculateAccessory({
        id: "acc-test-1",
        name: keo.name,
        unit: normalizeAccessoryUnit(keo.unit),
        quantity: 5,
        unitPrice: keo.unitPrice,
      });

      expect(accRow.unit).toBe("Lọ");
      expect(accRow.unitPrice).toBe(48000);
      expect(accRow.quantity).toBe(5);
      // 5 lọ * 48,000 = 240,000 đ
      expect(accRow.subtotal).toBe(240000);
    });

    it("Tự động điền giá Sườn 300 và tính thành tiền theo mét dài (chiều dài x số cây)", () => {
      const suon = ACCESSORIES_CATALOG.find((a) => a.code === "SUON300")!;
      expect(suon).toBeDefined();

      const accRow = calculateAccessory({
        id: "acc-test-2",
        name: suon.name,
        unit: normalizeAccessoryUnit(suon.unit),
        length: 2.5,
        pieces: 4,
        quantity: 10,
        unitPrice: suon.unitPrice,
      });

      expect(accRow.unit).toBe("Mét dài");
      expect(accRow.unitPrice).toBe(38000);
      // 2.5m * 4 cây = 10m * 38,000 = 380,000 đ
      expect(accRow.subtotal).toBe(380000);
    });
  });

  // ===========================================================================
  // 5. HÀM DỊCH VỤ getWarehouseAccessories()
  // ===========================================================================
  describe("5. Dịch vụ nạp phụ kiện từ kho (getWarehouseAccessories)", () => {
    it("Trả về danh sách phụ kiện hợp nhất không rỗng", async () => {
      const list = await getWarehouseAccessories();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(ACCESSORIES_CATALOG.length);

      // Đảm bảo không bị trùng lặp mã code
      const codes = list.map((item) => item.code?.toLowerCase()).filter(Boolean);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });
  });
});

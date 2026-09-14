import { describe, it, expect } from "vitest";
import {
  FALLBACK_UNITS_OF_MEASURE,
  getUnitsOfMeasure,
  formatUomSelectOptions,
  getUomNames,
} from "@/lib/supabase/uom-service";
import {
  SHARED_UOM_NAMES,
  UNITS_CATALOG,
} from "@/lib/catalogs";
import { ACCESSORY_UNITS } from "@/components/roofing/RoofingOrderForm";

describe("Danh Mục Đơn Vị Tính (UOM Catalog) Dùng Chung Kho Hàng & Đơn Cắt Tôn", () => {
  // ===========================================================================
  // 1. KIỂM TRA TÍNH TOÀN VẸN CỦA BẢNG CATALOG ĐVT
  // ===========================================================================
  describe("1. Tính toàn vẹn của bảng Catalog ĐVT", () => {
    it("Chứa đầy đủ 14 đơn vị tính chuẩn ngành tôn thép của Đại Lý Tuấn Hương", () => {
      expect(FALLBACK_UNITS_OF_MEASURE).toHaveLength(14);

      const codes = FALLBACK_UNITS_OF_MEASURE.map((u) => u.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(14); // Không có mã code nào bị trùng lặp

      // Kiểm tra các đơn vị tính cốt lõi
      expect(codes).toContain("CAY");
      expect(codes).toContain("MET");
      expect(codes).toContain("M2");
      expect(codes).toContain("KG");
      expect(codes).toContain("CAI");
      expect(codes).toContain("TAM");
      expect(codes).toContain("CUON");
      expect(codes).toContain("HOP");
      expect(codes).toContain("BAO");
      expect(codes).toContain("BINH");
      expect(codes).toContain("BO");
      expect(codes).toContain("LO");
      expect(codes).toContain("TUI");
      expect(codes).toContain("MD");
    });

    it("Mọi đơn vị tính đều có đầy đủ thông tin: tên tiếng Việt, mô tả, phân loại, thứ tự hiển thị", () => {
      FALLBACK_UNITS_OF_MEASURE.forEach((u) => {
        expect(u.id).toBeTruthy();
        expect(u.code).toBeTruthy();
        expect(u.name).toBeTruthy();
        expect(u.description).toBeTruthy();
        expect(u.category).toBeTruthy();
        expect(u.sortOrder).toBeGreaterThan(0);
        expect(u.isActive).toBe(true);
      });
    });

    it("Các đơn vị tính được sắp xếp tăng dần theo sortOrder", () => {
      for (let i = 0; i < FALLBACK_UNITS_OF_MEASURE.length - 1; i++) {
        expect(FALLBACK_UNITS_OF_MEASURE[i].sortOrder).toBeLessThan(
          FALLBACK_UNITS_OF_MEASURE[i + 1].sortOrder
        );
      }
    });
  });

  // ===========================================================================
  // 2. DÙNG CHUNG CHO CẢ KHO HÀNG (INVENTORY) VÀ ĐƠN CẮT TÔN (ROOFING)
  // ===========================================================================
  describe("2. Tính dùng chung giữa Kho Hàng và Đơn Cắt Tôn", () => {
    it("SHARED_UOM_NAMES và ACCESSORY_UNITS đồng bộ 100% với danh mục ĐVT", () => {
      // ACCESSORY_UNITS trong form cắt tôn trỏ thẳng đến SHARED_UOM_NAMES dùng chung
      expect(ACCESSORY_UNITS).toBe(SHARED_UOM_NAMES);
      expect(ACCESSORY_UNITS).toHaveLength(14);

      // Đầy đủ các đơn vị cắt tôn và phụ kiện
      expect(ACCESSORY_UNITS).toContain("Cây");
      expect(ACCESSORY_UNITS).toContain("Mét");
      expect(ACCESSORY_UNITS).toContain("m²");
      expect(ACCESSORY_UNITS).toContain("Kg");
      expect(ACCESSORY_UNITS).toContain("Cái");
      expect(ACCESSORY_UNITS).toContain("Tấm");
      expect(ACCESSORY_UNITS).toContain("Cuộn");
      expect(ACCESSORY_UNITS).toContain("Hộp");
      expect(ACCESSORY_UNITS).toContain("Bao");
      expect(ACCESSORY_UNITS).toContain("Bình");
      expect(ACCESSORY_UNITS).toContain("Bộ");
      expect(ACCESSORY_UNITS).toContain("Lọ");
      expect(ACCESSORY_UNITS).toContain("Túi");
      expect(ACCESSORY_UNITS).toContain("Mét dài");
    });

    it("UNITS_CATALOG của Kho hàng hỗ trợ cả đơn vị mới lẫn legacy unit trong database", () => {
      const values = UNITS_CATALOG.map((u) => u.value);

      // Chứa các đơn vị trực quan mới
      expect(values).toContain("Cây");
      expect(values).toContain("m²");
      expect(values).toContain("Kg");
      expect(values).toContain("Cái");
      expect(values).toContain("Mét dài");

      // Đồng thời giữ alias tương thích ngược với 4 đơn vị cũ trong bảng inventory_items
      expect(values).toContain("CÂY");
      expect(values).toContain("M2");
      expect(values).toContain("KG");
      expect(values).toContain("MD");
    });

    it("Hàm formatUomSelectOptions tạo đúng cấu trúc options cho Form Select", () => {
      const options = formatUomSelectOptions(FALLBACK_UNITS_OF_MEASURE);
      expect(options).toHaveLength(14);
      expect(options[0]).toHaveProperty("value", "Cây");
      expect(options[0]).toHaveProperty("code", "CAY");
      expect(options[0]).toHaveProperty("category", "thep_hop");
      expect(options[0].label).toContain("Cây");
    });

    it("Hàm getUomNames trích xuất danh sách tên chuẩn xác", () => {
      const names = getUomNames(FALLBACK_UNITS_OF_MEASURE);
      expect(names).toEqual([
        "Cây",
        "Mét",
        "m²",
        "Kg",
        "Cái",
        "Tấm",
        "Cuộn",
        "Hộp",
        "Bao",
        "Bình",
        "Bộ",
        "Lọ",
        "Túi",
        "Mét dài",
      ]);
    });
  });

  // ===========================================================================
  // 3. PHÂN LOẠI NHÓM HÀNG HÓA (CATEGORY FILTERING)
  // ===========================================================================
  describe("3. Phân loại nhóm ngành hàng áp dụng", () => {
    it("Lọc đúng nhóm Thép hộp (thep_hop)", () => {
      const thepHopUnits = FALLBACK_UNITS_OF_MEASURE.filter((u) => u.category === "thep_hop");
      expect(thepHopUnits.map((u) => u.name)).toContain("Cây");
    });

    it("Lọc đúng nhóm Tôn lợp (ton_lop)", () => {
      const tonLopUnits = FALLBACK_UNITS_OF_MEASURE.filter((u) => u.category === "ton_lop");
      const names = tonLopUnits.map((u) => u.name);
      expect(names).toContain("m²");
      expect(names).toContain("Tấm");
      expect(names).toContain("Cuộn");
    });

    it("Lọc đúng nhóm Phụ kiện (phu_kien)", () => {
      const phuKienUnits = FALLBACK_UNITS_OF_MEASURE.filter((u) => u.category === "phu_kien");
      const names = phuKienUnits.map((u) => u.name);
      expect(names).toContain("Cái");
      expect(names).toContain("Bộ");
      expect(names).toContain("Lọ");
      expect(names).toContain("Túi");
      expect(names).toContain("Mét dài");
    });

    it("Lọc đúng nhóm Vật tư khác & Kim khí (vat_tu_khac)", () => {
      const vatTuUnits = FALLBACK_UNITS_OF_MEASURE.filter((u) => u.category === "vat_tu_khac");
      const names = vatTuUnits.map((u) => u.name);
      expect(names).toContain("Kg");
      expect(names).toContain("Hộp");
      expect(names).toContain("Bao");
      expect(names).toContain("Bình");
    });
  });

  // ===========================================================================
  // 4. KIỂM TRA HÀM ASYNC GETUNITSOFMEASURE KÈM CACHE & FALLBACK
  // ===========================================================================
  describe("4. Cơ chế truy vấn getUnitsOfMeasure", () => {
    it("Trả về danh sách ĐVT hợp lệ và không văng lỗi khi gọi nhiều lần", async () => {
      const units1 = await getUnitsOfMeasure();
      const units2 = await getUnitsOfMeasure();

      expect(units1).toBeDefined();
      expect(units1.length).toBeGreaterThanOrEqual(14);
      expect(units2).toBeDefined();
      expect(units2.length).toBe(units1.length);
    });
  });
});

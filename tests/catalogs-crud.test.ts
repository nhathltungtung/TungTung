import { describe, it, expect } from "vitest";
import { uomSchema, uomCategoryEnum } from "@/app/(admin)/admin/catalogs/schemas";
import {
  createUomAction,
  updateUomAction,
  deleteUomAction,
  toggleUomActiveAction,
} from "@/app/(admin)/admin/catalogs/actions";

describe("CRUD Danh Mục Đơn Vị Tính (UOM Catalog) - Validation & Actions", () => {
  // ===========================================================================
  // 1. KIỂM THỬ ZOD SCHEMA (XÁC THỰC DỮ LIỆU ĐẦU VÀO)
  // ===========================================================================
  describe("1. Xác thực Zod Schema uomSchema", () => {
    it("Chấp nhận dữ liệu đơn vị tính hợp lệ", () => {
      const validData = {
        code: "BO",
        name: "Bộ",
        symbol: "bộ",
        category: "phu_kien",
        description: "Bộ phụ kiện nóc máng xối trọn gói",
        sortOrder: 15,
        isActive: true,
      };

      const result = uomSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("BO");
        expect(result.data.name).toBe("Bộ");
        expect(result.data.category).toBe("phu_kien");
        expect(result.data.sortOrder).toBe(15);
      }
    });

    it("Tự động chuyển đổi mã code sang chữ HOA và loại bỏ khoảng trắng thừa", () => {
      const input = {
        code: "  cay_thep  ",
        name: "Cây thép 6m",
        category: "thep_hop",
      };

      const result = uomSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("CAY_THEP");
      }
    });

    it("Từ chối khi mã code bị rỗng", () => {
      const invalid = {
        code: "",
        name: "Cây",
        category: "thep_hop",
      };

      const result = uomSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("không được để trống");
      }
    });

    it("Từ chối khi mã code chứa ký tự đặc biệt không hợp lệ", () => {
      const invalidChars = ["CAY@", "M2$", "MET 123", "KG!"];

      invalidChars.forEach((code) => {
        const result = uomSchema.safeParse({
          code,
          name: "Test",
          category: "all",
        });
        expect(result.success).toBe(false);
      });
    });

    it("Từ chối khi tên đơn vị tính bị để trống", () => {
      const invalid = {
        code: "TEST",
        name: "   ",
        category: "ton_lop",
      };

      const result = uomSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("Từ chối khi thứ tự sắp xếp sortOrder là số âm", () => {
      const invalid = {
        code: "TEST",
        name: "Test",
        category: "all",
        sortOrder: -5,
      };

      const result = uomSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("lớn hơn hoặc bằng 0");
      }
    });

    it("Xác thực nhóm ngành hàng category phải thuộc enum cho phép", () => {
      expect(uomCategoryEnum.options).toEqual([
        "all",
        "thep_hop",
        "ton_lop",
        "phu_kien",
        "vat_tu_khac",
      ]);

      const invalidCategory = {
        code: "TEST",
        name: "Test",
        category: "danh_muc_la",
      };

      const result = uomSchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });
  });

  // ===========================================================================
  // 2. KIỂM THỬ SERVER ACTIONS TỪ CHỐI DỮ LIỆU LỖI
  // ===========================================================================
  describe("2. Kiểm thử Server Actions xử lý lỗi an toàn", () => {
    it("createUomAction từ chối và trả về lỗi rõ ràng khi payload không hợp lệ", async () => {
      const invalidPayload = {
        code: "",
        name: "",
      };

      const result = await createUomAction(invalidPayload);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("updateUomAction từ chối khi payload sai định dạng", async () => {
      const invalidPayload = {
        code: "123",
        name: "", // Tên rỗng
        category: "all",
      };

      const result = await updateUomAction("any-id", invalidPayload);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("Các hàm actions tồn tại và là hàm có thể thực thi", () => {
      expect(typeof createUomAction).toBe("function");
      expect(typeof updateUomAction).toBe("function");
      expect(typeof deleteUomAction).toBe("function");
      expect(typeof toggleUomActiveAction).toBe("function");
    });
  });
});

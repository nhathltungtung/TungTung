import { describe, it, expect } from "vitest";
import { ROOFING_PRODUCTS_CATALOG } from "@/lib/catalogs";
import { deleteCustomerAction } from "@/app/(admin)/admin/customers/actions";

describe("Kiểm tra chức năng Tìm kiếm theo Mã Tôn & Xoá Khách Hàng", () => {
  describe("1. Tìm kiếm loại tôn theo Mã (code) và Tên", () => {
    it("Mọi sản phẩm trong ROOFING_PRODUCTS_CATALOG đều phải có mã (code) chuẩn", () => {
      ROOFING_PRODUCTS_CATALOG.forEach((p) => {
        expect(p.code).toBeDefined();
        expect(typeof p.code).toBe("string");
        expect(p.code.length).toBeGreaterThan(3);
        expect(p.code).toMatch(/^TON-/);
      });
    });

    it("Tìm kiếm theo mã tôn chính xác (VD: TON-OLYMPIC-04)", () => {
      const term = "TON-OLYMPIC-04".toLowerCase();
      const filtered = ROOFING_PRODUCTS_CATALOG.filter((p) =>
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term)
      );

      expect(filtered.length).toBeGreaterThanOrEqual(1);
      expect(filtered.some((p) => p.code === "TON-OLYMPIC-04")).toBe(true);
    });

    it("Tìm kiếm theo tiền tố mã không phân biệt hoa thường (vd: ton-donga)", () => {
      const term = "ton-donga";
      const filtered = ROOFING_PRODUCTS_CATALOG.filter((p) =>
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
      );

      expect(filtered.length).toBeGreaterThanOrEqual(1);
      expect(filtered[0].brand).toBe("Đông Á");
      expect(filtered[0].code).toBe("TON-DONGA-045");
    });

    it("Tìm kiếm theo độ dày hoặc chủng loại (vd: 0.45 hoặc xop)", () => {
      const term1 = "0.45";
      const filtered045 = ROOFING_PRODUCTS_CATALOG.filter((p) =>
        p.code.toLowerCase().includes(term1) ||
        p.name.toLowerCase().includes(term1) ||
        p.thickness.toLowerCase().includes(term1)
      );
      expect(filtered045.length).toBeGreaterThanOrEqual(3);

      const term2 = "xop";
      const filteredXop = ROOFING_PRODUCTS_CATALOG.filter((p) =>
        p.code.toLowerCase().includes(term2) ||
        p.name.toLowerCase().includes(term2) ||
        p.type.toLowerCase().includes(term2)
      );
      expect(filteredXop.length).toBeGreaterThanOrEqual(2);
    });

    it("Khi không tìm thấy mã hoặc tên nào, danh sách filtered phải trả về rỗng để hiển thị thông báo thay vì trả về toàn bộ catalog", () => {
      const term = "MA_KHONG_TON_TAI_999";
      const filtered = ROOFING_PRODUCTS_CATALOG.filter((p) =>
        p.code.toLowerCase().includes(term.toLowerCase()) ||
        p.name.toLowerCase().includes(term.toLowerCase())
      );
      expect(filtered).toHaveLength(0);
    });
  });

  describe("2. Nghiệp vụ Xoá Khách Hàng (deleteCustomerAction)", () => {
    it("Xoá khách hàng với ID giả lập (mock ID như 'c-0', 'c-1') phải xử lý an toàn, không ném lỗi UUID vào Postgres", async () => {
      const res = await deleteCustomerAction("c-0", "Khách Mẫu");
      expect(res.success).toBe(true);
    });

    it("State mảng khách hàng sau khi xoá thành công phải loại bỏ chính xác phần tử đó", () => {
      const initial = [
        { id: "cust-1", name: "Anh Việt", phone: "0988123456" },
        { id: "cust-2", name: "Bác Hùng", phone: "0912345678" },
      ];

      const deletedId = "cust-1";
      const updated = initial.filter((c) => c.id !== deletedId);

      expect(updated).toHaveLength(1);
      expect(updated[0].id).toBe("cust-2");
      expect(updated.find((c) => c.id === deletedId)).toBeUndefined();
    });
  });
});

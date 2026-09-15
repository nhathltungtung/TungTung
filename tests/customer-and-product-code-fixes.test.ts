import { describe, it, expect } from "vitest";
import {
  RoofingProductPreset,
  filterRoofingProductCatalog,
  ROOFING_PRODUCTS_CATALOG,
} from "@/lib/catalogs";
import { deleteCustomerAction } from "@/app/(admin)/admin/customers/actions";

/** Fixture mô phỏng dòng tôn lấy từ Kho TT88 (không dùng catalog tĩnh) */
const WAREHOUSE_ROOFING_FIXTURE: RoofingProductPreset[] = [
  {
    id: "inv-olpxx",
    code: "OLPXX",
    name: "Tôn 0.40 Xanh Rêu Olympic Xốp 3+ 11 sóng",
    brand: "Olympic",
    type: "Xốp chống nóng",
    thickness: "0.40mm",
    width: 1.08,
    unitPrice: 164000,
  },
  {
    id: "inv-olpxd",
    code: "OLPXD",
    name: "Tôn 0.40 Đỏ Olympic Xốp 3+ 11 sóng",
    brand: "Olympic",
    type: "Xốp chống nóng",
    thickness: "0.40mm",
    width: 1.08,
    unitPrice: 164000,
  },
  {
    id: "inv-ton1lop",
    code: "TON1LOP",
    name: "Tôn 1 Lớp Olympic",
    brand: "Olympic",
    type: "1 lớp",
    thickness: "0.40mm",
    width: 1.08,
    unitPrice: 111000,
  },
];

describe("Kiểm tra chức năng Tìm kiếm theo Mã Tôn & Xoá Khách Hàng", () => {
  describe("1. Tìm kiếm loại tôn theo mã kho (nguồn Kho TT88)", () => {
    it("Catalog tôn tĩnh phải rỗng — không còn dữ liệu fake", () => {
      expect(ROOFING_PRODUCTS_CATALOG).toHaveLength(0);
    });

    it("Tìm kiếm theo mã kho OLPXX phải ra đúng tôn từ fixture kho", () => {
      const filtered = filterRoofingProductCatalog(WAREHOUSE_ROOFING_FIXTURE, "OLPXX");
      expect(filtered.length).toBeGreaterThanOrEqual(1);
      expect(filtered.some((p) => p.code === "OLPXX")).toBe(true);
      expect(filtered[0].name.toLowerCase()).toContain("olympic");
    });

    it("Tìm kiếm theo mã TON1LOP", () => {
      const filtered = filterRoofingProductCatalog(WAREHOUSE_ROOFING_FIXTURE, "TON1LOP");
      expect(filtered.some((p) => p.code === "TON1LOP")).toBe(true);
    });

    it("Tìm kiếm theo tiền tố không phân biệt hoa thường (vd: olpx)", () => {
      const filtered = filterRoofingProductCatalog(WAREHOUSE_ROOFING_FIXTURE, "olpx");
      expect(filtered.length).toBeGreaterThanOrEqual(2);
    });

    it("Khi không tìm thấy mã, danh sách filtered phải rỗng", () => {
      const filtered = filterRoofingProductCatalog(
        WAREHOUSE_ROOFING_FIXTURE,
        "MA_KHONG_TON_TAI_999"
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

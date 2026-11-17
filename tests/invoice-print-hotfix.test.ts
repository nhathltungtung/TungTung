import { describe, it, expect } from "vitest";
import { formatLength, calculateRoofingGroup } from "@/lib/roofing-calc";

describe("Hotfix in hoá đơn & nhập quy cách cắt", () => {
  it("chiều dài (m) luôn hiển thị đủ 2 chữ số thập phân", () => {
    expect(formatLength(1.6)).toBe("1.60");
    expect(formatLength(2)).toBe("2.00");
    expect(formatLength(3.65)).toBe("3.65");
    expect(formatLength(0.45)).toBe("0.45");
    expect(formatLength(NaN)).toBe("0.00");
  });

  it("dòng cắt mới để trống số tấm không bị cộng vào tổng loại", () => {
    const group = calculateRoofingGroup({
      id: "g1",
      productName: "Sườn 300",
      width: 1,
      unitPrice: 38000,
      items: [
        { id: "c1", length: 3.65, quantity: 1, totalMeters: 3.65 },
        { id: "c2", length: 2, quantity: 1, totalMeters: 2 },
        // Dòng trống tự sinh khi nhấn Enter ở ô Số tấm cuối cùng
        { id: "c3", length: 0, quantity: 0, totalMeters: 0 },
      ],
    });
    expect(group.totalPieces).toBe(2);
    expect(group.totalMeters).toBe(5.65);
  });
});

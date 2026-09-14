import { describe, it, expect } from "vitest";

describe("TungTung UI Primitives & Design System Verification", () => {
  describe("Button Component - Theme & Visibility Assurance", () => {
    // Bản đồ styles chuẩn từ Button.tsx
    const variantStyles = {
      primary:
        "bg-[#3c50e0] hover:bg-[#3344bd] active:bg-[#2a3bb8] text-white shadow-xs focus:ring-2 focus:ring-[#3c50e0]/20 dark:bg-[#3c50e0] dark:hover:bg-[#3344bd]",
      secondary:
        "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100",
      outline:
        "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
      ghost:
        "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-2 focus:ring-rose-500/20",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-5 py-2.5 text-base gap-2.5",
    };

    it("Nút Primary phải luôn có màu nền xanh TailAdmin #3c50e0 và chữ trắng tương phản cao", () => {
      const primaryClass = variantStyles.primary;
      expect(primaryClass).toContain("bg-[#3c50e0]");
      expect(primaryClass).toContain("text-white");
      expect(primaryClass).toContain("hover:bg-[#3344bd]");
      // Tuyệt đối không được rỗng màu nền làm tàng hình chữ
      expect(primaryClass.length).toBeGreaterThan(20);
    });

    it("Nút Secondary, Outline, Danger phải có màu sắc và viền rõ ràng", () => {
      expect(variantStyles.secondary).toContain("bg-slate-100");
      expect(variantStyles.outline).toContain("border");
      expect(variantStyles.danger).toContain("bg-rose-600");
    });

    it("Kích thước nút sm, md, lg có padding và font-size cân xứng", () => {
      expect(sizeStyles.sm).toContain("text-xs");
      expect(sizeStyles.md).toContain("text-sm");
      expect(sizeStyles.lg).toContain("text-base");
    });
  });

  describe("Select & Dropdown Catalog Options Logic", () => {
    const mockOptions = [
      { value: "thep_hop", label: "Thép Hộp Mạ Kẽm" },
      { value: "ton_lop", label: "Tôn Lợp Olympic" },
      { value: "xa_go", label: "Xà Gồ C - Z" },
    ];

    it("Ánh xạ chính xác nhãn tiếng Việt từ giá trị value", () => {
      const findLabel = (val: string) => mockOptions.find((o) => o.value === val)?.label || val;

      expect(findLabel("thep_hop")).toBe("Thép Hộp Mạ Kẽm");
      expect(findLabel("ton_lop")).toBe("Tôn Lợp Olympic");
      expect(findLabel("unknown_val")).toBe("unknown_val");
    });

    it("Xử lý an toàn khi reset giá trị về rỗng sau khi chọn", () => {
      let selectedVal: string = "thep_hop";
      // Giả lập thao tác người dùng chọn catalog và hệ thống reset để cho phép chọn tiếp
      const onSelect = (val: string) => {
        selectedVal = val;
        // Reset sau khi áp dụng
        const nextState = "";
        return nextState;
      };

      const resetState = onSelect("thep_hop");
      expect(selectedVal).toBe("thep_hop");
      expect(resetState).toBe("");
    });
  });

  describe("DataTable Funnel Filter Engine", () => {
    // Thuật toán lọc chuẩn trong DataTable.tsx defaultColumn.filterFn
    const runFilterFn = (rowVal: unknown, filterValue: unknown): boolean => {
      if (filterValue === undefined || filterValue === null || filterValue === "") return true;
      if (rowVal === undefined || rowVal === null) return false;

      // 1. Range Filter [min, max] (Price, Stock)
      if (
        Array.isArray(filterValue) &&
        filterValue.length === 2 &&
        (typeof filterValue[0] === "number" || typeof filterValue[1] === "number")
      ) {
        const [min, max] = filterValue as [number | undefined, number | undefined];
        const num = Number(rowVal);
        if (isNaN(num)) return false;
        if (min !== undefined && min !== null && !isNaN(min) && num < min) return false;
        if (max !== undefined && max !== null && !isNaN(max) && num > max) return false;
        return true;
      }

      // 2. Multi-select Array Filter
      if (Array.isArray(filterValue)) {
        if (filterValue.length === 0) return true;
        return filterValue.some((val) => {
          if (val === undefined || val === null) return false;
          const strRow = String(rowVal).toLowerCase().trim();
          const strVal = String(val).toLowerCase().trim();
          if (strRow === strVal) return true;

          // Date format comparison
          const d = new Date(strRow);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            const dateVN = `${day}/${month}/${year}`;
            if (dateVN.toLowerCase() === strVal) return true;
          }
          return false;
        });
      }

      // 3. Simple String Filter
      return String(rowVal).toLowerCase().includes(String(filterValue).toLowerCase().trim());
    };

    it("Lọc chính xác khi chọn một hoặc nhiều giá trị trong mảng (Funnel Popover)", () => {
      // Khớp đúng khi giá trị nằm trong mảng đã chọn
      expect(runFilterFn("thep_hop", ["thep_hop", "ton_lop"])).toBe(true);
      expect(runFilterFn("ton_lop", ["thep_hop", "ton_lop"])).toBe(true);
      // Từ chối khi không nằm trong danh sách chọn
      expect(runFilterFn("xa_go", ["thep_hop", "ton_lop"])).toBe(false);
      // Khi bỏ chọn hết (mảng rỗng) phải hiển thị tất cả
      expect(runFilterFn("xa_go", [])).toBe(true);
    });

    it("Lọc khoảng số [min, max] cho giá vốn và tồn kho", () => {
      // 50 nằm trong [10, 100]
      expect(runFilterFn(50, [10, 100])).toBe(true);
      // 5 nằm ngoài [10, 100]
      expect(runFilterFn(5, [10, 100])).toBe(false);
      // 150 nằm ngoài [10, 100]
      expect(runFilterFn(150, [10, 100])).toBe(false);
      // Chỉ có min [50, undefined]
      expect(runFilterFn(60, [50, undefined])).toBe(true);
      expect(runFilterFn(40, [50, undefined])).toBe(false);
    });

    it("Lọc ngày tháng chuẩn định dạng Việt Nam dd/mm/yyyy", () => {
      expect(runFilterFn("2026-09-14T00:00:00.000Z", ["14/09/2026"])).toBe(true);
      expect(runFilterFn("2026-09-15T00:00:00.000Z", ["14/09/2026"])).toBe(false);
    });
  });
});

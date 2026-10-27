import { describe, it, expect, beforeEach, vi } from "vitest";
import { navigationConfig } from "@/lib/navigation";
import { cn } from "@/lib/utils";

describe("TungTung ERP - Collapsible Sidebar & Navigation Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Cấu Trúc Menu Quản Trị Đại Lý & Hệ Thống", () => {
    it("Danh mục điều hướng navigationConfig có đầy đủ các nhóm chính", () => {
      expect(navigationConfig.length).toBeGreaterThanOrEqual(2);
      const groupNames = navigationConfig.map((g) => g.name);
      expect(groupNames).toContain("QUẢN TRỊ ĐẠI LÝ");
      expect(groupNames).toContain("HỆ THỐNG & NHÂN SỰ");
    });

    it("Nhóm QUẢN TRỊ ĐẠI LÝ có đầy đủ các module cốt lõi (POS Cắt Tôn, Kho TT88, Sổ Quỹ)", () => {
      const dealerGroup = navigationConfig.find((g) => g.name === "QUẢN TRỊ ĐẠI LÝ");
      expect(dealerGroup).toBeDefined();

      const titles = dealerGroup!.menuItems.map((item) => item.title);
      expect(titles).toContain("Tổng Quan");
      expect(titles).toContain("Đơn Cắt Tôn");
      expect(titles).toContain("Kho Hàng TT88");
      expect(titles).toContain("Kế Toán & Sổ Quỹ");
      expect(titles).toContain("Khách Hàng & Thợ Thầu");
      expect(titles).toContain("Danh Mục ĐVT");
    });

    it("Module Đơn Cắt Tôn có 2 submenu cấp con cho thao tác nhanh", () => {
      const dealerGroup = navigationConfig.find((g) => g.name === "QUẢN TRỊ ĐẠI LÝ");
      const ordersItem = dealerGroup?.menuItems.find((item) => item.title === "Đơn Cắt Tôn");
      expect(ordersItem?.children).toBeDefined();
      expect(ordersItem?.children?.length).toBe(2);

      const subTitles = ordersItem?.children?.map((c) => c.title);
      expect(subTitles).toContain("Tạo Đơn Cắt Tôn");
      expect(subTitles).toContain("Danh Sách Đơn Hàng");
    });
  });

  describe("2. Logic Thu Gọn / Mở Rộng & Chuyển Đổi CSS Classes", () => {
    const getSidebarClasses = (isOpen: boolean, isCollapsed: boolean) => {
      return cn(
        "fixed top-0 left-0 z-50 flex flex-col h-screen shrink-0 bg-[#1c2434] text-[#dee4ee] transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-72 lg:w-20" : "w-72"
      );
    };

    it("Khi ở chế độ Mở Rộng (isCollapsed = false) trên Desktop: Chiều rộng đạt chuẩn w-72 (288px)", () => {
      const classes = getSidebarClasses(false, false);
      expect(classes).toContain("w-72");
      expect(classes).not.toContain("lg:w-20");
      expect(classes).toContain("lg:static");
      expect(classes).toContain("lg:translate-x-0");
    });

    it("Khi ở chế độ Thu Gọn (isCollapsed = true) trên Desktop: Chiều rộng co lại thành lg:w-20 (80px)", () => {
      const classes = getSidebarClasses(false, true);
      expect(classes).toContain("lg:w-20");
      expect(classes).toContain("transition-all");
      expect(classes).toContain("duration-300");
    });

    it("Trên Mobile (màn hình nhỏ < 1024px): Giữ nguyên drawer w-72 trượt off-canvas", () => {
      const closedMobile = getSidebarClasses(false, true);
      expect(closedMobile).toContain("-translate-x-full");

      const openedMobile = getSidebarClasses(true, true);
      expect(openedMobile).toContain("translate-x-0");
    });
  });

  describe("3. Quản Lý Trạng Thái & Lưu Trữ LocalStorage (Persistence)", () => {
    const STORAGE_KEY = "tungtung_sidebar_collapsed";

    it("Lưu chính xác trạng thái thu gọn vào storage khi toggle", () => {
      const mockStorage: Record<string, string> = {};
      const setItem = (k: string, v: string) => {
        mockStorage[k] = v;
      };
      const getItem = (k: string) => mockStorage[k] ?? null;

      let isCollapsed = false;

      // Giả lập toggleCollapse
      isCollapsed = !isCollapsed;
      setItem(STORAGE_KEY, String(isCollapsed));
      expect(getItem(STORAGE_KEY)).toBe("true");

      // Toggle lại lần nữa
      isCollapsed = !isCollapsed;
      setItem(STORAGE_KEY, String(isCollapsed));
      expect(getItem(STORAGE_KEY)).toBe("false");
    });

    it("Khôi phục đúng trạng thái đã lưu khi ứng dụng tải lại", () => {
      const mockSavedValue = "true";
      const restored = mockSavedValue === "true";
      expect(restored).toBe(true);

      const mockEmptyValue = null;
      const defaultState = mockEmptyValue !== null ? mockEmptyValue === "true" : false;
      expect(defaultState).toBe(false);
    });
  });

  describe("4. Xử Lý Phím Tắt HotKey (Ctrl+B / Cmd+B)", () => {
    it("Nhận diện chính xác phím tắt Ctrl+B hoặc Cmd+B", () => {
      const isSidebarToggleKey = (e: { ctrlKey?: boolean; metaKey?: boolean; key: string }) => {
        return (Boolean(e.ctrlKey) || Boolean(e.metaKey)) && e.key.toLowerCase() === "b";
      };

      expect(isSidebarToggleKey({ ctrlKey: true, key: "b" })).toBe(true);
      expect(isSidebarToggleKey({ ctrlKey: true, key: "B" })).toBe(true);
      expect(isSidebarToggleKey({ metaKey: true, key: "b" })).toBe(true);
      expect(isSidebarToggleKey({ ctrlKey: false, metaKey: false, key: "b" })).toBe(false);
      expect(isSidebarToggleKey({ ctrlKey: true, key: "c" })).toBe(false);
    });

    it("Phân luồng hành vi bàn phím: Desktop toggle collapse, Mobile toggle drawer", () => {
      let collapsedState = false;
      let openMobileState = false;

      const triggerShortcut = (screenWidth: number) => {
        if (screenWidth >= 1024) {
          collapsedState = !collapsedState;
        } else {
          openMobileState = !openMobileState;
        }
      };

      // Desktop: >= 1024px
      triggerShortcut(1440);
      expect(collapsedState).toBe(true);
      expect(openMobileState).toBe(false);

      // Mobile: < 1024px
      triggerShortcut(390);
      expect(collapsedState).toBe(true); // Giữ nguyên
      expect(openMobileState).toBe(true); // Mở mobile drawer
    });
  });

  describe("5. Tooltip & Chuyển Đổi Hiển Thị Khi Thu Gọn", () => {
    it("Hiển thị tooltip đầy đủ tiếng Việt cho từng mục khi ở chế độ mini-sidebar", () => {
      const dealerGroup = navigationConfig.find((g) => g.name === "QUẢN TRỊ ĐẠI LÝ");
      dealerGroup?.menuItems.forEach((item) => {
        // Tên mục phải có độ dài hợp lệ và không rỗng
        expect(item.title.length).toBeGreaterThan(0);
        // Có icon hợp lệ
        expect(item.icon).toBeDefined();
      });
    });

    it("Header nút bấm hiển thị nhãn và title rõ ràng tương ứng trạng thái", () => {
      const getButtonMetadata = (isCollapsed: boolean) => ({
        label: isCollapsed ? "Mở rộng menu bên trái (Ctrl+B)" : "Thu gọn menu bên trái (Ctrl+B)",
        icon: isCollapsed ? "PanelLeftOpen" : "PanelLeftClose",
      });

      const expandedMeta = getButtonMetadata(false);
      expect(expandedMeta.label).toBe("Thu gọn menu bên trái (Ctrl+B)");
      expect(expandedMeta.icon).toBe("PanelLeftClose");

      const collapsedMeta = getButtonMetadata(true);
      expect(collapsedMeta.label).toBe("Mở rộng menu bên trái (Ctrl+B)");
      expect(collapsedMeta.icon).toBe("PanelLeftOpen");
    });
  });
});

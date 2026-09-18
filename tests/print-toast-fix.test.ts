import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Print & Toast Suppression Fix - Ngăn Chặn Thông Báo Đè Lên Hoá Đơn Khi In", () => {
  const rootDir = process.cwd();

  it("1. Kiểm tra CSS @media print trong app/globals.css có quy tắc ẩn toàn diện cho Sonner và Toasts", () => {
    const globalsCssPath = path.join(rootDir, "app", "globals.css");
    const content = fs.readFileSync(globalsCssPath, "utf-8");

    // Phải nằm trong khối @media print
    expect(content).toContain("@media print");

    // Phải ẩn toàn bộ các selector của Sonner Toaster
    expect(content).toContain("[data-sonner-toaster]");
    expect(content).toContain("[data-sonner-toast]");
    expect(content).toContain(".toaster");
    expect(content).toContain(".toast");
    expect(content).toContain('section[aria-label="Notifications"]');
    expect(content).toContain('[role="region"][aria-label*="Notification" i]');

    // Phải có display: none !important và visibility: hidden !important
    expect(content).toContain("display: none !important;");
    expect(content).toContain("visibility: hidden !important;");
  });

  it("2. Kiểm tra components/ui/Toast.tsx có cấu hình print:hidden và lắng nghe sự kiện beforeprint", () => {
    const toastFilePath = path.join(rootDir, "components", "ui", "Toast.tsx");
    const content = fs.readFileSync(toastFilePath, "utf-8");

    // Phải có class print:hidden trên Toaster
    expect(content).toContain('className="toaster group print:hidden"');
    expect(content).toContain('className: "print:hidden"');

    // Phải đăng ký sự kiện beforeprint để dismiss thông báo
    expect(content).toContain("beforeprint");
    expect(content).toContain("toast.dismiss()");
  });

  it("3. Kiểm tra components/roofing/RoofingOrderForm.tsx tự động đóng toast khi bấm In hoặc phím tắt Ctrl + P", () => {
    const formFilePath = path.join(
      rootDir,
      "components",
      "roofing",
      "RoofingOrderForm.tsx"
    );
    const content = fs.readFileSync(formFilePath, "utf-8");

    // Trong handlePrint phải gọi toast.dismiss() trước window.print()
    expect(content).toContain("const handlePrint = () => {");
    expect(content).toMatch(/handlePrint[\s\S]*?toast\.dismiss\(\)[\s\S]*?window\.print\(\)/);

    // Trong phím tắt Ctrl + P phải gọi toast.dismiss()
    expect(content).toMatch(
      /key\.toLowerCase\(\) === "p"[\s\S]*?toast\.dismiss\(\)[\s\S]*?window\.print\(\)/
    );
  });

  it("4. Kiểm tra components/admin/orders/OrderTableClient.tsx đóng toast trước khi in phiếu và in danh sách", () => {
    const tableFilePath = path.join(
      rootDir,
      "components",
      "admin",
      "orders",
      "OrderTableClient.tsx"
    );
    const content = fs.readFileSync(tableFilePath, "utf-8");

    // Cả 2 nút in (In Phiếu và In Danh Sách) đều phải gọi toast.dismiss()
    const matches = content.match(/toast\.dismiss\(\);\s*window\.print\(\);/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeGreaterThanOrEqual(2);
  });
});

---
name: unit-testing-workflow
description: >-
  Procedural runbook for writing, maintaining, and executing ultra-fast, zero-overhead unit tests
  with Vitest and Node.js in Base Next.js (TungTung ERP). Maximizes resource & disk conservation
  by eliminating heavy browser automation recordings whenever testable via unit tests.
---

# Lightweight Unit Testing Workflow & Resource Conservation Runbook

Use this skill whenever validating business calculations, UI component styling, Zod schemas, data table filters, or Server Actions.

---

## ⚡ 1. Core Philosophy: Unit Tests First (Tiết Kiệm Tài Nguyên Tuyệt Đối)

> [!IMPORTANT]
> **Chỉ đạo kỹ thuật bắt buộc**:
> Tuyệt đối không khởi chạy các tác vụ giả lập trình duyệt nặng (như browser subagent ghi video WebP tiêu tốn hàng chục MB đĩa và CPU) khi các kịch bản kiểm thử hoàn toàn có thể được kiểm chứng tức thì bằng **Vitest Unit Test** (< 1 giây, 0 MB video artifacts).

### Khi nào DÙNG Unit Test (Khuyến khích 95% trường hợp):
- Kiểm thử số học cắt tôn (mét dài, $m^2$, đơn giá, chiết khấu, tiền cọc).
- Kiểm thử kế toán Thông tư 88 (đơn giá vốn bình quân gia quyền, sổ S1-HKD, sổ S2-HKD).
- Kiểm thử xác thực Zod schemas (lọc bỏ dữ liệu lỗi, số âm, email sai định dạng).
- Kiểm thử logic bộ lọc DataTable (mảng đa giá trị, khoảng số [min, max], ngày tháng).
- Kiểm thử các mapping class giao diện và theme tokens (Button variants, badges).

### Khi nào mới dùng Browser Subagent (Tối đa 5% trường hợp):
- Chỉ khi khách hàng yêu cầu chụp ảnh màn hình hoàn thiện để nghiệm thu bàn giao trực quan.

---

## 🚀 2. Essential Commands

| Command | Target | Duration |
|---|---|---|
| `npm run test` | Run entire Vitest unit test suite | ~600ms |
| `npx vitest run tests/ui-components.test.ts` | Test only UI primitives & filters | ~100ms |
| `npx vitest run tests/roofing-and-tt88.test.ts` | Test only roofing math & TT88 | ~100ms |
| `npm run doctor` | Run full automated integration test suite | ~1.5s |
| `npx tsc --noEmit` | Validate strict TypeScript compilation | ~2s |

---

## 📝 3. Standard Test Suite Template (`tests/example.test.ts`)

```typescript
import { describe, it, expect } from "vitest";

describe("TungTung Component or Business Feature", () => {
  it("Xử lý đúng logic nghiệp vụ mong đợi", () => {
    const input = 40.13;
    const width = 1.08;
    const area = Number((input * width).toFixed(4));
    expect(area).toBe(43.3404);
  });

  it("Từ chối dữ liệu sai theo schema Zod", () => {
    const result = someSchema.safeParse({ invalidField: -1 });
    expect(result.success).toBe(false);
  });
});
```

---

## 🛡️ 4. Quality Checklist Before Commit
1. `npm run test` phải báo **all tests passed** (xanh 100%).
2. Không sinh file tạm, file log dư thừa trong thư mục dự án.
3. Không để lại `console.log` rác hoặc cảnh báo ESLint.

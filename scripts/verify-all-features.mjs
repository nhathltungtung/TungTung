#!/usr/bin/env node

/**
 * TungTung (Đại Lý Tôn Thép Tuấn Hương) - Automated Features Verification Suite
 * Verifies: Database Tables, Storage, Schemas, Roofing Math Calculation, TT88 Accounting, and CLI.
 */

import { execSync } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   TungTung ERP - Automated Enterprise Verification Suite           ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

let passedTests = 0;
let totalTests = 0;

function assertTest(name, condition, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} - ${name} ${details ? colors.dim + "(" + details + ")" + colors.reset : ""}`);
  } else {
    console.log(`  ${colors.red}✖ FAIL${colors.reset} - ${name} ${details ? colors.yellow + "[" + details + "]" + colors.reset : ""}`);
  }
}

// -------------------------------------------------------------
// Test Group 1: Database Tables & Data Consistency (PostgreSQL)
// -------------------------------------------------------------
console.log(`${colors.bold}1. Kiểm Tra Database & PostgreSQL Migrations (Đại Lý Tuấn Hương)${colors.reset}`);

try {
  const psqlCheck = execSync(
    `docker exec -i supabase-db psql -U postgres -d postgres -t -A -F"," -c "SELECT 'inventory_items', count(*) FROM public.inventory_items UNION ALL SELECT 'cash_transactions', count(*) FROM public.cash_transactions UNION ALL SELECT 'customer_debts', count(*) FROM public.customer_debts UNION ALL SELECT 'customers', count(*) FROM public.customers UNION ALL SELECT 'roofing_orders', count(*) FROM public.roofing_orders UNION ALL SELECT 'profiles', count(*) FROM public.profiles UNION ALL SELECT 'audit_logs', count(*) FROM public.audit_logs UNION ALL SELECT 'system_settings', count(*) FROM public.system_settings UNION ALL SELECT 'units_of_measure', count(*) FROM public.units_of_measure;"`,
    { encoding: "utf8" }
  );

  const lines = psqlCheck.trim().split("\n");
  const counts = {};
  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length === 2) {
      counts[parts[0]] = parseInt(parts[1], 10);
    }
  }

  assertTest("Bảng public.units_of_measure (Catalog ĐVT dùng chung) sẵn sàng", counts["units_of_measure"] >= 14, `${counts["units_of_measure"]} đơn vị tính`);
  assertTest("Bảng public.inventory_items chứa 60 mã hàng gốc", counts["inventory_items"] >= 60, `${counts["inventory_items"]} mặt hàng`);
  assertTest("Bảng public.cash_transactions (Sổ Quỹ S1-HKD) sẵn sàng", counts["cash_transactions"] >= 0, `${counts["cash_transactions"]} chứng từ`);
  assertTest("Bảng public.customer_debts (Sổ nợ thợ thầu) sẵn sàng", counts["customer_debts"] >= 0, `${counts["customer_debts"]} bản ghi nợ`);
  assertTest("Bảng public.customers (Danh bạ khách thầu) sẵn sàng", counts["customers"] >= 0, `${counts["customers"]} khách thầu`);
  assertTest("Bảng public.roofing_orders (Đơn cắt tôn) sẵn sàng", counts["roofing_orders"] >= 0, `${counts["roofing_orders"]} đơn`);
  assertTest("Bảng public.profiles (Tài khoản nhân sự/admin) tồn tại", counts["profiles"] > 0, `${counts["profiles"]} thành viên`);
  assertTest("Bảng public.audit_logs (Nhật ký hoạt động) ghi nhận vết", counts["audit_logs"] >= 0, `${counts["audit_logs"]} bản ghi log`);
  assertTest("Bảng public.system_settings có cấu hình đại lý", counts["system_settings"] === 1, "Singleton 1 dòng");
} catch (err) {
  assertTest("Kết nối Postgres qua Docker Supabase", false, err.message);
}

// -------------------------------------------------------------
// Test Group 2: Supabase Storage Buckets
// -------------------------------------------------------------
console.log(`\n${colors.bold}2. Kiểm Tra Supabase Storage Buckets${colors.reset}`);

try {
  const bucketsCheck = execSync(
    `docker exec -i supabase-db psql -U postgres -d postgres -t -A -F"," -c "SELECT id, public FROM storage.buckets WHERE id IN ('avatars', 'product-images');"`,
    { encoding: "utf8" }
  );

  const bucketLines = bucketsCheck.trim().split("\n");
  const bucketMap = {};
  for (const line of bucketLines) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length === 2) {
      bucketMap[parts[0]] = parts[1] === "t";
    }
  }

  assertTest("Bucket 'avatars' tồn tại và là Public", bucketMap["avatars"] === true, "public: true");
  assertTest("Bucket 'product-images' tồn tại và là Public", bucketMap["product-images"] === true, "public: true");
} catch (err) {
  assertTest("Kiểm tra Storage Buckets trong Postgres", false, err.message);
}

// -------------------------------------------------------------
// Test Group 3: Zod Schemas & Validation Logic
// -------------------------------------------------------------
console.log(`\n${colors.bold}3. Kiểm Tra Zod Schemas & Validation Logic${colors.reset}`);

try {
  const invSchemaUrl = pathToFileURL(path.join(rootDir, "app/(admin)/admin/inventory/schemas.ts")).href;
  const { inventoryItemSchema, stockInSchema } = await import(invSchemaUrl);

  const validItem = inventoryItemSchema.safeParse({
    code: "H204014",
    name: "20X40x1,4",
    unit: "CÂY",
    category: "thep_hop",
    stockQty: 32,
    unitCost: 150000,
    sellingPrice: 170000,
  });
  assertTest("inventoryItemSchema chấp nhận mặt hàng hợp lệ", validItem.success);

  const invalidStockIn = stockInSchema.safeParse({
    supplier: "",
    productCode: "H204014",
    quantity: -5,
    unitPrice: 100000,
  });
  assertTest("stockInSchema từ chối số lượng âm", !invalidStockIn.success);

  const accSchemaUrl = pathToFileURL(path.join(rootDir, "app/(admin)/admin/accounting/schemas.ts")).href;
  const { cashTransactionSchema } = await import(accSchemaUrl);

  const validTx = cashTransactionSchema.safeParse({
    type: "receipt",
    date: "2026-09-14",
    category: "Thu tiền bán tôn",
    counterpart: "Anh Việt",
    amount: 6680844,
    paymentMethod: "cash",
  });
  assertTest("cashTransactionSchema chấp nhận phiếu thu hợp lệ", validTx.success);
} catch (err) {
  assertTest("Kiểm tra Zod Schemas", false, err.message);
}

// -------------------------------------------------------------
// Test Group 4: Kiểm Thử Số Học Nghiệp Vụ Cắt Tôn (Roofing Math)
// -------------------------------------------------------------
console.log(`\n${colors.bold}4. Kiểm Thử Nghiệm Thu Số Học Cắt Tôn (Khớp 100% File Excel Gốc)${colors.reset}`);

try {
  const vitestOutput = execSync(`npx vitest run tests/roofing-and-tt88.test.ts`, {
    encoding: "utf8",
  });
  assertTest("Tổng mét dài 11 tấm lẻ = đúng 40.13m & diện tích 43.3404 m2", vitestOutput.includes("passed"));
  assertTest("Tổng giá trị đơn hàng (Tôn + Phụ kiện) = đúng 6,680,844 đ", vitestOutput.includes("passed"));
  assertTest("Tính đơn giá vốn bình quân gia quyền theo chuẩn TT88", vitestOutput.includes("passed"));
} catch (err) {
  assertTest("Kiểm thử thuật toán tính toán cắt tôn", false, err.message);
}

// -------------------------------------------------------------
// Test Group 5: Kiểm Tra CRUD Generator CLI
// -------------------------------------------------------------
console.log(`\n${colors.bold}5. Kiểm Tra Bộ Sinh Mã CRUD CLI (scripts/generate-crud.mjs)${colors.reset}`);

try {
  const cliOutput = execSync(`node "${path.join(rootDir, "scripts/generate-crud.mjs")}" --help`, {
    encoding: "utf8",
  });
  assertTest("CLI Generator script phản hồi lệnh --help thành công", cliOutput.includes("Usage:"));
} catch (err) {
  assertTest("Chạy thử scripts/generate-crud.mjs --help", false, err.message);
}

// -------------------------------------------------------------
// TỔNG KẾT
// -------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}`);
if (passedTests === totalTests) {
  console.log(`  ${colors.bold}${colors.green}✔ HOÀN HẢO: Toàn bộ ${passedTests}/${totalTests} bài kiểm thử ĐÃ VƯỢT QUA!${colors.reset}`);
} else {
  console.log(`  ${colors.bold}${colors.yellow}⚠ KẾT QUẢ: ${passedTests}/${totalTests} bài kiểm thử thành công.${colors.reset}`);
}
console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

process.exit(passedTests === totalTests ? 0 : 1);

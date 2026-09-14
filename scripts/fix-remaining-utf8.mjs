import { spawnSync } from "child_process";

console.log("=== SỬA TRIỆT ĐỂ TOÀN BỘ UTF-8 CÒN LẠI VÀ SEED DATA ===");

function executeSql(sql) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "-e", "PGCLIENTENCODING=UTF8", "supabase-db", "psql", "-U", "postgres", "-d", "postgres"],
    {
      input: Buffer.from(sql, "utf8"),
      encoding: "utf8",
    }
  );

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}

const fixSql = `
-- 1. Sửa default và các dòng bị lỗi trong audit_logs
ALTER TABLE public.audit_logs ALTER COLUMN actor_name SET DEFAULT 'Hệ Thống Tự Động';

UPDATE public.audit_logs 
SET actor_name = 'Hồ Long Nhật' 
WHERE id = 'a0000002-0000-0000-0000-000000000002';

UPDATE public.audit_logs 
SET actor_name = 'Hệ Thống Tự Động' 
WHERE id = 'a0000002-0000-0000-0000-000000000004' OR actor_name LIKE '%?%';

UPDATE public.audit_logs 
SET actor_name = 'Trần Minh Quang',
    resource = 'Product Catalog (Category: Thép hình)'
WHERE id = 'a0000002-0000-0000-0000-000000000005';

-- 2. Nạp dữ liệu chuẩn UTF-8 cho bảng public.customers
INSERT INTO public.customers (id, name, phone, address, note)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'Anh Việt (Khách thầu)', '0988 123 456', 'Trương Xá, Nghĩa Dân, Hưng Yên', 'Thợ thầu công trình quen xưởng cán'),
    ('c2222222-2222-2222-2222-222222222222', 'Bác Hùng (Xây nhà)', '0912 345 678', 'Nghĩa Dân, Kim Động, Hưng Yên', 'Khách làm mái nhà 2 tầng'),
    ('c3333333-3333-3333-3333-333333333333', 'Chú Bảy (Cơ khí Toàn Phát)', '0977 222 333', 'Thị Trấn Lương Bằng, Kim Động', 'Thợ cơ khí chuyên làm nhà tiền chế'),
    ('c4444444-4444-4444-4444-444444444444', 'Anh Tuấn (Mái Tôn Hiệp Hoà)', '0966 888 999', 'Hiệp Cường, Kim Động, Hưng Yên', 'Đội thợ thi công mái xưởng'),
    ('c5555555-5555-5555-5555-555555555555', 'Bác Năm (Trại Gà Vĩnh Xá)', '0933 444 555', 'Vĩnh Xá, Kim Động, Hưng Yên', 'Lợp tôn lạnh trang trại'),
    ('c6666666-6666-6666-6666-666666666666', 'Chị Lan (Tạp hoá Tân Dân)', '0918 666 777', 'Tân Dân, Khoái Châu, Hưng Yên', 'Thay mái hiên cửa hàng')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    note = EXCLUDED.note;

-- 3. Nạp danh mục sản phẩm tôn & phụ kiện chuẩn UTF-8 vào bảng public.products
INSERT INTO public.products (code, name, category, unit, default_width, unit_price, stock_quantity)
VALUES
    ('TON-OLYMPIC-04-XR', 'Tôn 0.40 Xanh Rêu Olympic 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 111000, 2500),
    ('TON-OLYMPIC-04-DD', 'Tôn 0.40 Đỏ Đậm Olympic 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 111000, 1800),
    ('TON-OLYMPIC-045-XR', 'Tôn 0.45 Xanh Rêu Olympic 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 122000, 1500),
    ('TON-OLYMPIC-04-XOP', 'Tôn Xốp Cách Nhiệt Olympic 0.40mm 11 sóng', 'ton_lop', 'm2', 1.08, 165000, 1200),
    ('TON-OLYMPIC-045-XOP', 'Tôn Xốp Cách Nhiệt Olympic 0.45mm 11 sóng', 'ton_lop', 'm2', 1.08, 178000, 950),
    ('TON-HOASEN-04-XD', 'Tôn 0.40 Xanh Dương Hoa Sen 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 112000, 2200),
    ('TON-HOASEN-045-XD', 'Tôn 0.45 Xanh Dương Hoa Sen 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 123000, 1600),
    ('TON-DONGA-04-XR', 'Tôn 0.40 Xanh Rêu Đông Á 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 110000, 2100),
    ('TON-DONGA-045-XR', 'Tôn 0.45 Xanh Rêu Đông Á 1 lớp 11 sóng', 'ton_lop', 'm2', 1.08, 121000, 1400),
    ('TON-VIETNHAT-04-XD', 'Tôn 0.40 Xanh Dương Việt Nhật 1 lớp', 'ton_lop', 'm2', 1.08, 108000, 1100),
    ('TON-VIETNHAT-045-XR', 'Tôn 0.45 Xanh Rêu Việt Nhật 1 lớp', 'ton_lop', 'm2', 1.08, 119000, 800),
    ('SUON-300', 'Sườn 300 xối máng gia công', 'phu_kien', 'md', 0, 38000, 450),
    ('XOI-300', 'Xối 300 tôn kẽm cán gấp', 'phu_kien', 'md', 0, 38000, 350),
    ('NOC-300', 'Nóc 300 dập sóng định hình', 'phu_kien', 'md', 0, 36000, 280),
    ('MANG-400-INOX', 'Máng 400 Inox 304 chấn CNC', 'phu_kien', 'kg', 0, 82000, 300),
    ('KEO-A500', 'Keo Apollo A500 chống thấm', 'phu_kien', 'lo', 0, 48000, 150),
    ('VIT-4', 'Vít bắn tôn mạ kẽm nhúng nóng 4 phân', 'phu_kien', 'tui', 0, 75000, 200),
    ('VIT-6', 'Vít bắn tôn 6 phân', 'phu_kien', 'tui', 0, 85000, 150),
    ('BIT-MANG', 'Đầu bịt máng xối tôn', 'phu_kien', 'cai', 0, 15000, 100)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    default_width = EXCLUDED.default_width,
    unit_price = EXCLUDED.unit_price,
    stock_quantity = EXCLUDED.stock_quantity;
`;

console.log("Đang thực thi sửa UTF-8 và seed data chuẩn...");
const out = executeSql(fixSql);
console.log("Kết quả:", out);
console.log("✔ Hoàn tất 100%!");

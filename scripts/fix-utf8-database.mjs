import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("=== BẮT ĐẦU SỬA LỖI UTF-8 TOÀN BỘ CƠ SỞ DỮ LIỆU ===");

// Hàm thực thi SQL trực tiếp vào container supabase-db với Buffer UTF-8 chuẩn xác
function executeSql(sql) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "-e", "PGCLIENTENCODING=UTF8", "supabase-db", "psql", "-U", "postgres", "-d", "postgres"],
    {
      input: Buffer.from(sql, "utf8"),
      encoding: "utf8",
    }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout;
}

// 1. CẬP NHẬT 60 MÃ HÀNG HOÁ TRONG public.inventory_items
const updateInventorySql = `
UPDATE public.inventory_items SET name = '14x14x1,1', unit = 'CÂY' WHERE code = 'H141411';
UPDATE public.inventory_items SET name = '14x14x1,4', unit = 'CÂY' WHERE code = 'H141414';
UPDATE public.inventory_items SET name = '16x16x1,2', unit = 'CÂY' WHERE code = 'H161612';
UPDATE public.inventory_items SET name = '16x16x1,4', unit = 'CÂY' WHERE code = 'H161614';
UPDATE public.inventory_items SET name = '20x20x1,0', unit = 'CÂY' WHERE code = 'H202010';
UPDATE public.inventory_items SET name = '20x20x1,4', unit = 'CÂY' WHERE code = 'H202014';
UPDATE public.inventory_items SET name = '25x25x1,1', unit = 'CÂY' WHERE code = 'H252511';
UPDATE public.inventory_items SET name = '25x25x1,4', unit = 'CÂY' WHERE code = 'H252514';
UPDATE public.inventory_items SET name = '30x30x1,4', unit = 'CÂY' WHERE code = 'H303014';
UPDATE public.inventory_items SET name = '40x40x1,4', unit = 'CÂY' WHERE code = 'H404014';
UPDATE public.inventory_items SET name = '40X40x1,8', unit = 'CÂY' WHERE code = 'H404018';
UPDATE public.inventory_items SET name = '50X50x1,4', unit = 'CÂY' WHERE code = 'H505014';
UPDATE public.inventory_items SET name = '50X50x1,8', unit = 'CÂY' WHERE code = 'H505018';
UPDATE public.inventory_items SET name = '13X26x1,4', unit = 'CÂY' WHERE code = 'H132614';
UPDATE public.inventory_items SET name = '20X40x1,2', unit = 'CÂY' WHERE code = 'H204012';
UPDATE public.inventory_items SET name = '20X40x1,4', unit = 'CÂY' WHERE code = 'H204014';
UPDATE public.inventory_items SET name = '25X50x1,2', unit = 'CÂY' WHERE code = 'H255012';
UPDATE public.inventory_items SET name = '25X50x1,4', unit = 'CÂY' WHERE code = 'H255014';
UPDATE public.inventory_items SET name = '20X50x1,8', unit = 'CÂY' WHERE code = 'H255018';
UPDATE public.inventory_items SET name = '30X60x1,4', unit = 'CÂY' WHERE code = 'H306014';
UPDATE public.inventory_items SET name = '30X60x1,8', unit = 'CÂY' WHERE code = 'H306018';
UPDATE public.inventory_items SET name = '40X80x1,4', unit = 'CÂY' WHERE code = 'H408014';
UPDATE public.inventory_items SET name = '40X80x1,8', unit = 'CÂY' WHERE code = 'H408018';
UPDATE public.inventory_items SET name = '50X100x1,4', unit = 'CÂY' WHERE code = 'H5010014';
UPDATE public.inventory_items SET name = '50X100x1,8', unit = 'CÂY' WHERE code = 'H5010018';
UPDATE public.inventory_items SET name = 'O 21x1,4', unit = 'CÂY' WHERE code = 'O2114';
UPDATE public.inventory_items SET name = 'O 21X1,6', unit = 'CÂY' WHERE code = 'O2116';
UPDATE public.inventory_items SET name = 'O 21X1,9', unit = 'CÂY' WHERE code = 'O2119';
UPDATE public.inventory_items SET name = 'O 27X1,4', unit = 'CÂY' WHERE code = 'O2714';
UPDATE public.inventory_items SET name = 'O 27X1,6', unit = 'CÂY' WHERE code = 'O2716';
UPDATE public.inventory_items SET name = 'O 27X1,9', unit = 'CÂY' WHERE code = 'O2719';
UPDATE public.inventory_items SET name = 'O 33X1,4', unit = 'CÂY' WHERE code = 'O3314';
UPDATE public.inventory_items SET name = 'O 33X1,6', unit = 'CÂY' WHERE code = 'O3316';
UPDATE public.inventory_items SET name = 'O 33X1,9', unit = 'CÂY' WHERE code = 'O3319';
UPDATE public.inventory_items SET name = 'O 42X1,4', unit = 'CÂY' WHERE code = 'O4214';
UPDATE public.inventory_items SET name = 'O 42X1,6', unit = 'CÂY' WHERE code = 'O4216';
UPDATE public.inventory_items SET name = 'O 42X1,9', unit = 'CÂY' WHERE code = 'O4219';
UPDATE public.inventory_items SET name = 'O 48X1,4', unit = 'CÂY' WHERE code = 'O4814';
UPDATE public.inventory_items SET name = 'O 48X1,6', unit = 'CÂY' WHERE code = 'O4816';
UPDATE public.inventory_items SET name = 'O 48X1,9', unit = 'CÂY' WHERE code = 'O4819';
UPDATE public.inventory_items SET name = 'O 60X1,9', unit = 'CÂY' WHERE code = 'O6019';
UPDATE public.inventory_items SET name = 'O 60X1,4', unit = 'CÂY' WHERE code = 'O6014';
UPDATE public.inventory_items SET name = 'O 76X2,1', unit = 'CÂY' WHERE code = 'O7621';
UPDATE public.inventory_items SET name = 'O 76X1,4', unit = 'CÂY' WHERE code = 'O7614';
UPDATE public.inventory_items SET name = 'O 90X21', unit = 'CÂY' WHERE code = 'O9021';
UPDATE public.inventory_items SET name = 'NHÔM TRẮNG SỨ CỎ', unit = 'KG' WHERE code = 'SUCO';
UPDATE public.inventory_items SET name = 'NHÔM VÂN GỖ NỘI THẤT CỎ', unit = 'KG' WHERE code = 'VGNTCO';
UPDATE public.inventory_items SET name = 'NHÔM YANGLI MÀU CAFÉ', unit = 'KG' WHERE code = 'CAFEYL';
UPDATE public.inventory_items SET name = 'NHÔM YANGLI MÀU CAFÉ BẢO HÀNH', unit = 'KG' WHERE code = 'CAFEYLBH';
UPDATE public.inventory_items SET name = 'NHÔM YANGLI MÀU VÂN GỖ NỘI THẤT', unit = 'KG' WHERE code = 'VGNTYL';
UPDATE public.inventory_items SET name = 'NHÔM YANGLI MÀU VÂN GỖ TRẮC', unit = 'KG' WHERE code = 'VGTYL';
UPDATE public.inventory_items SET name = 'TÔN 1 LỚP OLYMPIC', unit = 'M2' WHERE code = 'TON1LOP';
UPDATE public.inventory_items SET name = 'TÔN XỐP CÁCH NHIỆT', unit = 'M2' WHERE code = 'TONXOP';
UPDATE public.inventory_items SET name = 'MÁNG 300 INOX', unit = 'MD' WHERE code = 'MANG300';
UPDATE public.inventory_items SET name = 'XỐI 300', unit = 'MD' WHERE code = 'XOI300';
UPDATE public.inventory_items SET name = 'NÓC 300', unit = 'MD' WHERE code = 'NOC300';
UPDATE public.inventory_items SET name = 'SƯỜN 300', unit = 'MD' WHERE code = 'SUON300';
UPDATE public.inventory_items SET name = 'INOX 304 CUỘN', unit = 'KG' WHERE code = 'INOX304';
UPDATE public.inventory_items SET name = 'LƯỚI B40', unit = 'KG' WHERE code = 'LUOI';
UPDATE public.inventory_items SET name = 'SẮT BÁN THEO CÂN', unit = 'KG' WHERE code = 'SATCAN';
`;

console.log("1. Đang sửa UTF-8 cho bảng public.inventory_items...");
executeSql(updateInventorySql);
console.log("✔ Đã sửa xong 60 mã hàng trong public.inventory_items.");

// 2. CẬP NHẬT 14 ĐƠN VỊ TÍNH TRONG public.units_of_measure
const updateUomSql = `
UPDATE public.units_of_measure SET 
  name = 'Cây', 
  symbol = 'cây', 
  description = 'Thép hộp mạ kẽm, ống tròn Hòa Phát, nhôm cây định hình 6m' 
WHERE code = 'CAY';

UPDATE public.units_of_measure SET 
  name = 'Mét', 
  symbol = 'm', 
  description = 'Mét dài tôn cắt theo quy cách, phụ kiện xối máng cắt lẻ' 
WHERE code = 'MET';

UPDATE public.units_of_measure SET 
  name = 'm²', 
  symbol = 'm²', 
  description = 'Diện tích m² tôn lợp 1 lớp, tôn xốp PU, tôn ngói Ruby' 
WHERE code = 'M2';

UPDATE public.units_of_measure SET 
  name = 'Kg', 
  symbol = 'kg', 
  description = 'Nhôm định hình, Inox 304, lưới B40, sắt phôi cân ký' 
WHERE code = 'KG';

UPDATE public.units_of_measure SET 
  name = 'Cái', 
  symbol = 'cái', 
  description = 'Đầu bịt máng xối, nẹp chỉ tôn, phụ kiện gia công nhỏ' 
WHERE code = 'CAI';

UPDATE public.units_of_measure SET 
  name = 'Tấm', 
  symbol = 'tấm', 
  description = 'Tấm tôn thành phẩm đã dập cắt theo kích thước' 
WHERE code = 'TAM';

UPDATE public.units_of_measure SET 
  name = 'Cuộn', 
  symbol = 'cuộn', 
  description = 'Cuộn tôn nguyên khổ nhà máy (Olympic, Hoa Sen, Đông Á)' 
WHERE code = 'CUON';

UPDATE public.units_of_measure SET 
  name = 'Hộp', 
  symbol = 'hộp', 
  description = 'Vít bắn tôn đóng hộp, que hàn, linh kiện' 
WHERE code = 'HOP';

UPDATE public.units_of_measure SET 
  name = 'Bao', 
  symbol = 'bao', 
  description = 'Đinh dù, vật tư đóng bao lớn' 
WHERE code = 'BAO';

UPDATE public.units_of_measure SET 
  name = 'Bình', 
  symbol = 'bình', 
  description = 'Keo bọt chống cháy, bình xịt mỡ bảo dưỡng' 
WHERE code = 'BINH';

UPDATE public.units_of_measure SET 
  name = 'Bộ', 
  symbol = 'bộ', 
  description = 'Bộ phụ kiện nóc máng trọn gói công trình' 
WHERE code = 'BO';

UPDATE public.units_of_measure SET 
  name = 'Lọ', 
  symbol = 'lọ', 
  description = 'Keo Silicone Apollo A500, A300 chống dột mái' 
WHERE code = 'LO';

UPDATE public.units_of_measure SET 
  name = 'Túi', 
  symbol = 'túi', 
  description = 'Vít mạ kẽm đóng túi nhỏ 100 - 200 con' 
WHERE code = 'TUI';

UPDATE public.units_of_measure SET 
  name = 'Mét dài', 
  symbol = 'md', 
  description = 'Đơn vị kế toán mét dài dập xưởng Thông tư 88' 
WHERE code = 'MD';
`;

console.log("2. Đang sửa UTF-8 cho bảng public.units_of_measure...");
executeSql(updateUomSql);
console.log("✔ Đã sửa xong 14 đơn vị tính trong public.units_of_measure.");

// 3. CẬP NHẬT GIAO DỊCH SỔ QUỸ public.cash_transactions
const updateCashSql = `
UPDATE public.cash_transactions SET 
  category = 'Thu tiền bán tôn lợp & phụ kiện mái',
  counterpart = 'Anh Việt (Khách thầu)',
  note = 'Thanh toán hoá đơn cắt tôn 11 tấm'
WHERE voucher_code = 'PT001';

UPDATE public.cash_transactions SET 
  category = 'Thu tiền công nợ khách thầu',
  counterpart = 'Xưởng Mái Tôn Hải Yến',
  note = 'Thanh toán đợt 1 công trình Nghĩa Dân'
WHERE voucher_code = 'PT002';

UPDATE public.cash_transactions SET 
  category = 'Chi tiền nhập cuộn tôn mạ kẽm',
  counterpart = 'Nhà máy Tôn Olympic',
  note = 'Nhập cuộn tôn 0.4 xanh rêu'
WHERE voucher_code = 'PC001';
`;

console.log("3. Đang sửa UTF-8 cho bảng public.cash_transactions...");
executeSql(updateCashSql);
console.log("✔ Đã sửa xong giao dịch trong public.cash_transactions.");

// 4. CẬP NHẬT THƯƠNG HIỆU ĐẠI LÝ public.system_settings
const updateSettingsSql = `
UPDATE public.system_settings SET 
  system_name = 'TungTung ERP',
  company_name = 'Đại Lý Tôn Thép Tuấn Hương',
  support_email = 'tuanhuong@tonthanh.vn',
  hotline = '0331 810 0459'
WHERE id = 1;
`;

console.log("4. Đang sửa UTF-8 cho bảng public.system_settings...");
executeSql(updateSettingsSql);
console.log("✔ Đã cập nhật xong thương hiệu Đại Lý Tôn Thép Tuấn Hương.");

console.log("=== HOÀN TẤT SỬA LỖI UTF-8! KIỂM TRA LẠI DỮ LIỆU... ===");

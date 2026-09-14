-- ==============================================================================
-- SCHEMA QUẢN LÝ KHO TT88 & KẾ TOÁN HỘ KINH DOANH (ĐẠI LÝ TUẤN HƯƠNG)
-- Phục vụ số hoá thay thế file 54qr.xlsx (60 mã hàng, Sổ Quỹ S1-HKD, Mẫu 03-VT, 04-VT)
-- ==============================================================================

-- 1. Bảng Danh Mục Hàng Hoá & Tồn Kho (Inventory Items)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'CÂY',
    category TEXT NOT NULL CHECK (category IN ('thep_hop', 'ong_tron', 'nhom', 'ton_lop', 'phu_kien', 'vat_tu_khac')),
    stock_qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stock_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Đơn giá vốn bình quân gia quyền TT88
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Giá bán niêm yết
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Lịch Sử Nhập / Xuất Kho (Stock Transactions - Mẫu 03-VT & 04-VT)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code TEXT UNIQUE NOT NULL, -- PNK001 (Nhập 03-VT), PXK001 (Xuất 04-VT)
    type TEXT NOT NULL CHECK (type IN ('import', 'export', 'adjustment')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    product_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    partner_name TEXT, -- Nhà cung cấp (Olympic, Hòa Phát...) hoặc Khách thầu
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Sổ Quỹ Tiền Mặt (Cash Transactions - Mẫu S1-HKD, 01-TT, 02-TT)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_code TEXT UNIQUE NOT NULL, -- PT001 (Phiếu thu 01-TT), PC001 (Phiếu chi 02-TT)
    type TEXT NOT NULL CHECK (type IN ('receipt', 'payment')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL, -- Lý do thu / chi
    counterpart TEXT NOT NULL, -- Người nộp hoặc người nhận tiền
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer')),
    reference_id TEXT, -- Mã đơn hàng cắt tôn hoặc mã chứng từ liên quan
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Sổ Công Nợ Thợ Thầu & Khách Hàng (Customer Debts)
CREATE TABLE IF NOT EXISTS public.customer_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    total_purchased NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remaining_debt NUMERIC(15, 2) NOT NULL DEFAULT 0,
    last_payment_date DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes tối ưu hiệu năng truy vấn
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON public.inventory_items(code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON public.stock_transactions(date);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product_code ON public.stock_transactions(product_code);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_customer_debts_customer_id ON public.customer_debts(customer_id);

-- RLS Policies
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on inventory_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on stock_transactions" ON public.stock_transactions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on stock_transactions" ON public.stock_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on cash_transactions" ON public.cash_transactions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on cash_transactions" ON public.cash_transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on customer_debts" ON public.customer_debts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update/delete on customer_debts" ON public.customer_debts FOR ALL USING (true) WITH CHECK (true);

-- NẠP 60 MÃ HÀNG GỐC TỪ SHEET 2 '54qr.xlsx'
INSERT INTO public.inventory_items (code, name, unit, category, stock_qty, stock_value, unit_cost, selling_price)
VALUES
  ('H141411', '14x14x1,1', 'CÂY', 'thep_hop', 52, 3413800, 65650, 75000),
  ('H141414', '14x14x1,4', 'CÂY', 'thep_hop', 40, 2678000, 66950, 78000),
  ('H161612', '16x16x1,2', 'CÂY', 'thep_hop', 15, 1016550, 67770, 79000),
  ('H161614', '16x16x1,4', 'CÂY', 'thep_hop', 21, 1635270, 77870, 89000),
  ('H202010', '20x20x1,0', 'CÂY', 'thep_hop', 72, 4129200, 57350, 68000),
  ('H202014', '20x20x1,4', 'CÂY', 'thep_hop', 6, 594120, 99020, 112000),
  ('H252511', '25x25x1,1', 'CÂY', 'thep_hop', 45, 3579300, 79540, 92000),
  ('H252514', '25x25x1,4', 'CÂY', 'thep_hop', 32, 3975360, 124230, 140000),
  ('H303014', '30x30x1,4', 'CÂY', 'thep_hop', 37, 5666180, 153140, 172000),
  ('H404014', '40x40x1,4', 'CÂY', 'thep_hop', 19, 3880218, 204222, 230000),
  ('H404018', '40X40x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 290000),
  ('H505014', '50X50x1,4', 'CÂY', 'thep_hop', 20, 5223400, 261170, 295000),
  ('H505018', '50X50x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 360000),
  ('H132614', '13X26x1,4', 'CÂY', 'thep_hop', 34, 3227960, 94940, 108000),
  ('H204012', '20X40x1,2', 'CÂY', 'thep_hop', 30, 3974700, 132490, 150000),
  ('H204014', '20X40x1,4', 'CÂY', 'thep_hop', 32, 4828608, 150894, 170000),
  ('H255012', '25X50x1,2', 'CÂY', 'thep_hop', 32, 5268160, 164630, 185000),
  ('H255014', '25X50x1,4', 'CÂY', 'thep_hop', 30, 5810190, 193673, 218000),
  ('H255018', '20X50x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 275000),
  ('H306014', '30X60x1,4', 'CÂY', 'thep_hop', 30, 6926700, 230890, 260000),
  ('H306018', '30X60x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 325000),
  ('H408014', '40X80x1,4', 'CÂY', 'thep_hop', 25, 7767000, 310680, 350000),
  ('H408018', '40X80x1,8', 'CÂY', 'thep_hop', 8, 3168960, 396120, 445000),
  ('H5010014', '50X100x1,4', 'CÂY', 'thep_hop', 9, 3516030, 390670, 440000),
  ('H5010018', '50X100x1,8', 'CÂY', 'thep_hop', 0, 0, 0, 560000),
  ('O2114', 'O 21x1,4', 'CÂY', 'ong_tron', 17, 1449760, 85280, 98000),
  ('O2116', 'O 21X1,6', 'CÂY', 'ong_tron', 20, 5439000, 271950, 305000),
  ('O2119', 'O 21X1,9', 'CÂY', 'ong_tron', 0, 0, 0, 350000),
  ('O2714', 'O 27X1,4', 'CÂY', 'ong_tron', 14, 1522920, 108780, 125000),
  ('O2716', 'O 27X1,6', 'CÂY', 'ong_tron', 21, 4549500, 216643, 245000),
  ('O2719', 'O 27X1,9', 'CÂY', 'ong_tron', 0, 0, 0, 290000),
  ('O3314', 'O 33X1,4', 'CÂY', 'ong_tron', 12, 1659840, 138320, 158000),
  ('O3316', 'O 33X1,6', 'CÂY', 'ong_tron', 0, 0, 0, 185000),
  ('O3319', 'O 33X1,9', 'CÂY', 'ong_tron', 3, 720000, 240000, 275000),
  ('O4214', 'O 42X1,4', 'CÂY', 'ong_tron', 0, 0, 0, 210000),
  ('O4216', 'O 42X1,6', 'CÂY', 'ong_tron', 18, 4851000, 269500, 305000),
  ('O4219', 'O 42X1,9', 'CÂY', 'ong_tron', 0, 0, 0, 360000),
  ('O4814', 'O 48X1,4', 'CÂY', 'ong_tron', 6, 1864056, 310676, 355000),
  ('O4816', 'O 48X1,6', 'CÂY', 'ong_tron', 15, 4620000, 308000, 350000),
  ('O4819', 'O 48X1,9', 'CÂY', 'ong_tron', 7, 2481500, 354500, 400000),
  ('O6019', 'O 60X1,9', 'CÂY', 'ong_tron', 11, 4889500, 444500, 500000),
  ('O6014', 'O 60X1,4', 'CÂY', 'ong_tron', 8, 1648320, 206040, 235000),
  ('O7621', 'O 76X2,1', 'CÂY', 'ong_tron', 7, 4256000, 608000, 690000),
  ('O7614', 'O 76X1,4', 'CÂY', 'ong_tron', 0, 0, 0, 450000),
  ('O9021', 'O 90X21', 'CÂY', 'ong_tron', 4, 2820000, 705000, 800000),
  ('SUCO', 'NHÔM TRẮNG SỨ CỎ', 'KG', 'nhom', 200, 21000000, 105000, 120000),
  ('VGNTCO', 'NHÔM VÂN GỖ NỘI THẤT CỎ', 'KG', 'nhom', 108, 12528000, 116000, 132000),
  ('CAFEYL', 'NHÔM YANGLI MÀU CAFÉ', 'KG', 'nhom', 421, 46310000, 110000, 125000),
  ('CAFEYLBH', 'NHÔM YANGLI MÀU CAFÉ BẢO HÀNH', 'KG', 'nhom', 9.56, 1108960, 116000, 132000),
  ('VGNTYL', 'NHÔM YANGLI MÀU VÂN GỖ NỘI THẤT', 'KG', 'nhom', 221, 26962000, 122000, 138000),
  ('VGTYL', 'NHÔM YANGLI MÀU VÂN GỖ TRẮC', 'KG', 'nhom', 52.78, 6439160, 122000, 138000),
  ('TON1LOP', 'TÔN 1 LỚP OLYMPIC', 'M2', 'ton_lop', 243, 15066000, 62000, 111000),
  ('TONXOP', 'TÔN XỐP CÁCH NHIỆT', 'M2', 'ton_lop', 68, 8840000, 130000, 165000),
  ('MANG300', 'MÁNG 300 INOX', 'MD', 'phu_kien', 62, 1674000, 27000, 45000),
  ('XOI300', 'XỐI 300', 'MD', 'phu_kien', 59, 1593000, 27000, 45000),
  ('NOC300', 'NÓC 300', 'MD', 'phu_kien', 46, 1242000, 27000, 45000),
  ('SUON300', 'SƯỜN 300', 'MD', 'phu_kien', 49, 1323000, 27000, 45000),
  ('INOX304', 'INOX 304 CUỘN', 'KG', 'vat_tu_khac', 597.92, 35695824, 59700, 72000),
  ('LUOI', 'LƯỚI B40', 'KG', 'vat_tu_khac', 270, 5886000, 21800, 28000),
  ('SATCAN', 'SẮT BÁN THEO CÂN', 'KG', 'vat_tu_khac', 721.65, 10319595, 14300, 18000)
ON CONFLICT (code) DO NOTHING;

-- Nạp giao dịch Sổ Quỹ Tiền Mặt mẫu
INSERT INTO public.cash_transactions (voucher_code, type, date, category, counterpart, amount, payment_method, note)
VALUES
  ('PT001', 'receipt', CURRENT_DATE, 'Thu tiền bán tôn lợp & phụ kiện mái', 'Anh Việt (Khách thầu)', 6680844, 'cash', 'Thanh toán hoá đơn cắt tôn 11 tấm'),
  ('PT002', 'receipt', CURRENT_DATE - 1, 'Thu tiền công nợ khách thầu', 'Xưởng Mái Tôn Hải Yến', 15000000, 'bank_transfer', 'Thanh toán đợt 1 công trình Nghĩa Dân'),
  ('PC001', 'payment', CURRENT_DATE - 2, 'Chi tiền nhập cuộn tôn mạ kẽm', 'Nhà máy Tôn Olympic', 25000000, 'bank_transfer', 'Nhập cuộn tôn 0.4 xanh rêu')
ON CONFLICT (voucher_code) DO NOTHING;

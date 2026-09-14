-- ==============================================================================
-- SCHEMA BẢNG DANH MỤC ĐƠN VỊ TÍNH DÙNG CHUNG (UNITS OF MEASURE CATALOG)
-- Dùng chung cho Quản lý Kho Hàng TT88 và Đơn Hàng Cắt Tôn (Đại Lý Tuấn Hương)
-- ==============================================================================

-- 1. Tạo bảng danh mục đơn vị tính (units_of_measure)
CREATE TABLE IF NOT EXISTS public.units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,            -- Mã code chuẩn: CAY, MET, M2, KG, CAI, TAM, CUON, HOP, BAO, BINH, BO, LO, TUI, MD
    name VARCHAR(50) NOT NULL,                   -- Tên hiển thị chuẩn: Cây, Mét, m², Kg, Cái, Tấm, Cuộn, Hộp, Bao, Bình, Bộ, Lọ, Túi, Mét dài
    symbol VARCHAR(20),                          -- Ký hiệu viết tắt: cây, m, m², kg, cái, tấm...
    category VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (category IN ('all', 'thep_hop', 'ton_lop', 'phu_kien', 'vat_tu_khac')),
    description TEXT,                            -- Mô tả áp dụng
    sort_order INT NOT NULL DEFAULT 0,           -- Thứ tự hiển thị ưu tiên
    is_active BOOLEAN NOT NULL DEFAULT true,     -- Trạng thái kích hoạt
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Đánh chỉ mục (Indexes) để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_uom_code ON public.units_of_measure(code);
CREATE INDEX IF NOT EXISTS idx_uom_category ON public.units_of_measure(category);
CREATE INDEX IF NOT EXISTS idx_uom_sort_order ON public.units_of_measure(sort_order);
CREATE INDEX IF NOT EXISTS idx_uom_is_active ON public.units_of_measure(is_active);

-- 3. Kích hoạt Row Level Security (RLS)
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;

-- 4. Chính sách bảo mật RLS:
-- Mọi người dùng (kể cả khách / anon và authenticated) đều được phép đọc danh mục ĐVT
DROP POLICY IF EXISTS "Allow read access to all users for units_of_measure" ON public.units_of_measure;
CREATE POLICY "Allow read access to all users for units_of_measure"
ON public.units_of_measure FOR SELECT
USING (true);

-- Chỉ admin / service role được phép chỉnh sửa danh mục ĐVT
DROP POLICY IF EXISTS "Allow admin write access for units_of_measure" ON public.units_of_measure;
CREATE POLICY "Allow admin write access for units_of_measure"
ON public.units_of_measure FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 5. Nạp dữ liệu khởi tạo 14 đơn vị tính chuẩn ngành tôn thép (Seed Data)
INSERT INTO public.units_of_measure (code, name, symbol, category, description, sort_order, is_active)
VALUES
    ('CAY', 'Cây', 'cây', 'thep_hop', 'Thép hộp mạ kẽm, ống tròn Hòa Phát, nhôm cây định hình 6m', 1, true),
    ('MET', 'Mét', 'm', 'all', 'Mét dài tôn cắt theo quy cách, phụ kiện xối máng cắt lẻ', 2, true),
    ('M2', 'm²', 'm²', 'ton_lop', 'Diện tích m² tôn lợp 1 lớp, tôn xốp PU, tôn ngói Ruby', 3, true),
    ('KG', 'Kg', 'kg', 'vat_tu_khac', 'Nhôm định hình, Inox 304, lưới B40, sắt phôi cân ký', 4, true),
    ('CAI', 'Cái', 'cái', 'phu_kien', 'Đầu bịt máng xối, nẹp chỉ tôn, phụ kiện gia công nhỏ', 5, true),
    ('TAM', 'Tấm', 'tấm', 'ton_lop', 'Tấm tôn thành phẩm đã dập cắt theo kích thước', 6, true),
    ('CUON', 'Cuộn', 'cuộn', 'ton_lop', 'Cuộn tôn nguyên khổ nhà máy (Olympic, Hoa Sen, Đông Á)', 7, true),
    ('HOP', 'Hộp', 'hộp', 'vat_tu_khac', 'Vít bắn tôn đóng hộp, que hàn, linh kiện', 8, true),
    ('BAO', 'Bao', 'bao', 'vat_tu_khac', 'Đinh dù, vật tư đóng bao lớn', 9, true),
    ('BINH', 'Bình', 'bình', 'vat_tu_khac', 'Keo bọt chống cháy, bình xịt mỡ bảo dưỡng', 10, true),
    ('BO', 'Bộ', 'bộ', 'phu_kien', 'Bộ phụ kiện nóc máng trọn gói công trình', 11, true),
    ('LO', 'Lọ', 'lọ', 'phu_kien', 'Keo Silicone Apollo A500, A300 chống dột mái', 12, true),
    ('TUI', 'Túi', 'túi', 'phu_kien', 'Vít mạ kẽm đóng túi nhỏ 100 - 200 con', 13, true),
    ('MD', 'Mét dài', 'md', 'phu_kien', 'Đơn vị kế toán mét dài dập xưởng Thông tư 88', 14, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());

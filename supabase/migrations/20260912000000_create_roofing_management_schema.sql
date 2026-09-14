-- ==============================================================================
-- SCHEMA QUẢN LÝ BÁN HÀNG & KHO TÔN THÉP (ĐẠI LÝ TUẤN HƯƠNG)
-- Phục vụ số hoá theo quy cách cắt tôn, phụ kiện và theo dõi đơn hàng
-- ==============================================================================

-- 1. Bảng Khách Hàng (Customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    note TEXT,
    total_debt NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Danh Mục Sản Phẩm & Phụ Kiện (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ton_lop' CHECK (category IN ('ton_lop', 'phu_kien', 'thep_hop', 'xa_go', 'khac')),
    unit TEXT NOT NULL DEFAULT 'm2',
    default_width NUMERIC(6, 2) DEFAULT 1.08,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stock_quantity NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Đơn Hàng Cắt Tôn (Roofing Orders)
CREATE TABLE IF NOT EXISTS public.roofing_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deposit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cutting', 'completed', 'cancelled')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Nhóm Tôn Trong Đơn Hàng (Roofing Order Groups)
CREATE TABLE IF NOT EXISTS public.roofing_order_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.roofing_orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    width NUMERIC(6, 2) NOT NULL DEFAULT 1.08,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_pieces INT NOT NULL DEFAULT 0,
    total_meters NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_square_meters NUMERIC(12, 4) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

-- 5. Bảng Chi Tiết Tấm Cắt Tôn Lẻ (Roofing Order Cut Items)
CREATE TABLE IF NOT EXISTS public.roofing_order_cut_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.roofing_order_groups(id) ON DELETE CASCADE,
    length NUMERIC(8, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_meters NUMERIC(10, 2) NOT NULL,
    sort_order INT DEFAULT 0
);

-- 6. Bảng Phụ Kiện Kèm Theo Đơn Hàng (Roofing Order Accessories)
CREATE TABLE IF NOT EXISTS public.roofing_order_accessories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.roofing_orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    length NUMERIC(8, 2),
    pieces INT,
    unit TEXT NOT NULL DEFAULT 'Cái',
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    sort_order INT DEFAULT 0
);

-- ==============================================================================
-- INDEXES & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_roofing_orders_customer_id ON public.roofing_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_roofing_orders_order_date ON public.roofing_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_roofing_orders_status ON public.roofing_orders(status);
CREATE INDEX IF NOT EXISTS idx_roofing_order_groups_order_id ON public.roofing_order_groups(order_id);
CREATE INDEX IF NOT EXISTS idx_roofing_order_cut_items_group_id ON public.roofing_order_cut_items(group_id);
CREATE INDEX IF NOT EXISTS idx_roofing_order_accessories_order_id ON public.roofing_order_accessories(order_id);

-- Kích hoạt RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_order_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_order_cut_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofing_order_accessories ENABLE ROW LEVEL SECURITY;

-- Cho phép người dùng đã xác thực (hoặc anon trong chế độ dev local) thao tác
CREATE POLICY "Allow public read access for customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow public read access for products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_orders" ON public.roofing_orders FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_order_groups" ON public.roofing_order_groups FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_order_cut_items" ON public.roofing_order_cut_items FOR ALL USING (true);
CREATE POLICY "Allow public read access for roofing_order_accessories" ON public.roofing_order_accessories FOR ALL USING (true);

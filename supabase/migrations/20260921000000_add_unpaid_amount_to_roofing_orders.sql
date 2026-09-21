-- Migration: Bổ sung trường unpaid_amount vào bảng roofing_orders
-- Mục đích: Quản lý số tiền từ các đơn hàng / hoá đơn cũ chưa thanh toán cần cộng dồn vào đơn hiện tại.

ALTER TABLE public.roofing_orders
ADD COLUMN IF NOT EXISTS unpaid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.roofing_orders.unpaid_amount IS 'Tiền từ các HĐ / đơn hàng cũ chưa thanh toán cộng dồn vào đơn hiện tại';

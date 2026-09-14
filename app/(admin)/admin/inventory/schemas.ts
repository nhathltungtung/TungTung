import { z } from "zod";

export const inventoryCategoryEnum = z.enum([
  "thep_hop",
  "ong_tron",
  "nhom",
  "ton_lop",
  "phu_kien",
  "vat_tu_khac",
]);

export const inventoryItemSchema = z.object({
  code: z.string().min(2, "Mã hàng phải có ít nhất 2 ký tự").toUpperCase(),
  name: z.string().min(2, "Tên quy cách không được để trống"),
  unit: z.string().min(1, "Đơn vị tính không được để trống"),
  category: inventoryCategoryEnum,
  stockQty: z.coerce.number().min(0, "Số lượng tồn kho không được âm"),
  unitCost: z.coerce.number().min(0, "Đơn giá vốn không được âm"),
  sellingPrice: z.coerce.number().min(0, "Đơn giá bán không được âm"),
  note: z.string().optional().default(""),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

export const stockInSchema = z.object({
  supplier: z.string().min(2, "Nhà cung cấp không được để trống"),
  productCode: z.string().min(2, "Vui lòng chọn hoặc nhập mã hàng"),
  quantity: z.coerce.number().min(0.01, "Số lượng nhập phải lớn hơn 0"),
  unitPrice: z.coerce.number().min(0, "Đơn giá nhập không được âm"),
  note: z.string().optional().default("Nhập kho từ nhà máy"),
});

export type StockInFormValues = z.infer<typeof stockInSchema>;

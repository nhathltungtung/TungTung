import { z } from "zod";

export const uomCategoryEnum = z.enum([
  "all",
  "thep_hop",
  "ton_lop",
  "phu_kien",
  "vat_tu_khac",
]);

export const uomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Mã đơn vị tính không được để trống")
    .max(20, "Mã tối đa 20 ký tự")
    .regex(/^[A-Za-z0-9_]+$/, "Mã chỉ chứa chữ hoa, số hoặc gạch dưới (VD: CAY, M2, MD)")
    .toUpperCase(),
  name: z
    .string()
    .trim()
    .min(1, "Tên đơn vị tính không được để trống")
    .max(50, "Tên tối đa 50 ký tự"),
  symbol: z.string().trim().max(20, "Ký hiệu tối đa 20 ký tự").optional().nullable(),
  category: uomCategoryEnum,
  description: z.string().trim().max(255, "Mô tả tối đa 255 ký tự").optional().nullable(),
  sortOrder: z.coerce
    .number()
    .int("Thứ tự hiển thị phải là số nguyên")
    .min(0, "Thứ tự sắp xếp phải lớn hơn hoặc bằng 0")
    .default(0),
  isActive: z.boolean().default(true),
});

export type UomFormValues = z.infer<typeof uomSchema>;

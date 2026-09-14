import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ban đầu tối thiểu 6 ký tự"),
  role: z.enum(["admin", "manager", "user"] as const, {
    message: "Vai trò không hợp lệ",
  }),
  department: z.string().min(1, "Vui lòng chọn phòng ban / đơn vị"),
  status: z.enum(["Active", "Suspended"] as const).default("Active"),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  email: z.string().email("Địa chỉ email không hợp lệ").optional(),
  role: z.enum(["admin", "manager", "user"] as const, {
    message: "Vai trò không hợp lệ",
  }),
  department: z.string().min(1, "Vui lòng chọn phòng ban / đơn vị"),
  status: z.enum(["Active", "Suspended"] as const),
  phone: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const batchDeleteSchema = z.object({
  ids: z.array(z.string().uuid("ID không hợp lệ")).min(1, "Vui lòng chọn ít nhất 1 bản ghi"),
});
export type BatchDeleteInput = z.infer<typeof batchDeleteSchema>;

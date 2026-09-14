import { z } from "zod";

export const systemSettingsSchema = z.object({
  systemName: z.string().min(2, "Tên hệ thống tối thiểu 2 ký tự"),
  companyName: z.string().min(2, "Tên công ty tối thiểu 2 ký tự"),
  logoUrl: z.string().optional().nullable(),
  supportEmail: z.string().email("Địa chỉ email không hợp lệ"),
  hotline: z.string().min(6, "Hotline tối thiểu 6 ký tự"),
  maintenanceMode: z.boolean().default(false),
});

export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>;

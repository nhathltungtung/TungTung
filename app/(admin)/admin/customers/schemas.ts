import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Họ tên khách thầu không được để trống"),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  note: z.string().optional().default(""),
  totalDebt: z.coerce.number().min(0, "Công nợ không được âm").default(0),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

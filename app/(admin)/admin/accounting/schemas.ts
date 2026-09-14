import { z } from "zod";

export const cashTransactionTypeEnum = z.enum(["receipt", "payment"]);
export const paymentMethodEnum = z.enum(["cash", "bank_transfer"]);

export const cashTransactionSchema = z.object({
  type: cashTransactionTypeEnum,
  date: z.string().min(1, "Ngày lập phiếu không được để trống"),
  category: z.string().min(2, "Lý do thu/chi không được để trống"),
  counterpart: z.string().min(2, "Họ tên người nộp/nhận không được để trống"),
  amount: z.coerce.number().min(1000, "Số tiền giao dịch tối thiểu là 1.000đ"),
  paymentMethod: paymentMethodEnum,
  referenceId: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export type CashTransactionFormValues = z.infer<typeof cashTransactionSchema>;

export const debtCollectionSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(2, "Tên khách thầu không được để trống"),
  amount: z.coerce.number().min(1000, "Số tiền thu nợ tối thiểu là 1.000đ"),
  paymentMethod: paymentMethodEnum,
  note: z.string().optional().default("Thu tiền công nợ khách thầu"),
});

export type DebtCollectionFormValues = z.infer<typeof debtCollectionSchema>;

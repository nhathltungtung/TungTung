export type UomCategory = "all" | "thep_hop" | "ton_lop" | "phu_kien" | "vat_tu_khac";

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
  category: UomCategory;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UomSelectOption {
  value: string;
  label: string;
  code: string;
  name: string;
  category: UomCategory;
}

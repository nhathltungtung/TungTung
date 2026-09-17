import { createClient } from "./client";
import { UnitOfMeasure, UomSelectOption } from "@/types/uom";

/**
 * Danh mục Đơn Vị Tính (UOM) dự phòng chất lượng cao.
 * Đảm bảo hệ thống hoạt động 100% không bị gián đoạn khi offline hoặc trong quá trình SSR.
 */
export const FALLBACK_UNITS_OF_MEASURE: UnitOfMeasure[] = [
  {
    id: "uom-cay",
    code: "CAY",
    name: "Cây",
    symbol: "cây",
    category: "thep_hop",
    description: "Thép hộp mạ kẽm, ống tròn Hòa Phát, nhôm cây 6m",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "uom-met",
    code: "MET",
    name: "Mét",
    symbol: "m",
    category: "all",
    description: "Mét dài tôn cắt theo quy cách, phụ kiện xối máng cắt lẻ",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "uom-m2",
    code: "M2",
    name: "m²",
    symbol: "m²",
    category: "ton_lop",
    description: "Diện tích m² tôn lợp 1 lớp, tôn xốp PU, tôn ngói Ruby",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "uom-kg",
    code: "KG",
    name: "Kg",
    symbol: "kg",
    category: "vat_tu_khac",
    description: "Nhôm định hình, Inox 304, lưới B40, sắt phôi cân ký",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "uom-cai",
    code: "CAI",
    name: "Cái",
    symbol: "cái",
    category: "phu_kien",
    description: "Đầu bịt máng xối, nẹp chỉ tôn, phụ kiện gia công nhỏ",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "uom-tam",
    code: "TAM",
    name: "Tấm",
    symbol: "tấm",
    category: "ton_lop",
    description: "Tấm tôn thành phẩm đã dập cắt theo kích thước",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "uom-cuon",
    code: "CUON",
    name: "Cuộn",
    symbol: "cuộn",
    category: "ton_lop",
    description: "Cuộn tôn nguyên khổ nhà máy (Olympic, Hoa Sen, Đông Á)",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: "uom-hop",
    code: "HOP",
    name: "Hộp",
    symbol: "hộp",
    category: "vat_tu_khac",
    description: "Vít bắn tôn đóng hộp, que hàn, linh kiện",
    sortOrder: 8,
    isActive: true,
  },
  {
    id: "uom-bao",
    code: "BAO",
    name: "Bao",
    symbol: "bao",
    category: "vat_tu_khac",
    description: "Đinh dù, vật tư đóng bao lớn",
    sortOrder: 9,
    isActive: true,
  },
  {
    id: "uom-binh",
    code: "BINH",
    name: "Bình",
    symbol: "bình",
    category: "vat_tu_khac",
    description: "Keo bọt chống cháy, bình xịt mỡ bảo dưỡng",
    sortOrder: 10,
    isActive: true,
  },
  {
    id: "uom-bo",
    code: "BO",
    name: "Bộ",
    symbol: "bộ",
    category: "phu_kien",
    description: "Bộ phụ kiện nóc máng trọn gói công trình",
    sortOrder: 11,
    isActive: true,
  },
  {
    id: "uom-lo",
    code: "LO",
    name: "Lọ",
    symbol: "lọ",
    category: "phu_kien",
    description: "Keo Silicone Apollo A500, A300 chống dột mái",
    sortOrder: 12,
    isActive: true,
  },
  {
    id: "uom-tui",
    code: "TUI",
    name: "Túi",
    symbol: "túi",
    category: "phu_kien",
    description: "Vít mạ kẽm đóng túi nhỏ 100 - 200 con",
    sortOrder: 13,
    isActive: true,
  },
  {
    id: "uom-md",
    code: "MD",
    name: "Mét dài",
    symbol: "md",
    category: "phu_kien",
    description: "Đơn vị kế toán mét dài dập xưởng Thông tư 88",
    sortOrder: 14,
    isActive: true,
  },
];

let cachedUnits: UnitOfMeasure[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // Cache 60 giây

interface RawUomRow {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
  category: "all" | "thep_hop" | "ton_lop" | "phu_kien" | "vat_tu_khac";
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lấy danh sách Đơn Vị Tính từ bảng public.units_of_measure (Supabase)
 * Có in-memory cache & fallback an toàn tuyệt đối.
 */
export async function getUnitsOfMeasure(forceRefresh = false): Promise<UnitOfMeasure[]> {
  const now = Date.now();
  if (!forceRefresh && cachedUnits && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedUnits;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    cachedUnits = FALLBACK_UNITS_OF_MEASURE;
    lastCacheTime = now;
    return FALLBACK_UNITS_OF_MEASURE;
  }

  try {
    const supabase = createClient();
    const queryPromise = supabase
      .from("units_of_measure")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("UOM query timeout") }), 600)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error || !data || data.length === 0) {
      cachedUnits = FALLBACK_UNITS_OF_MEASURE;
      lastCacheTime = now;
      return FALLBACK_UNITS_OF_MEASURE;
    }

    const mapped: UnitOfMeasure[] = (data as RawUomRow[]).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      symbol: row.symbol,
      category: row.category,
      description: row.description,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    cachedUnits = mapped;
    lastCacheTime = now;
    return mapped;
  } catch (err) {
    console.warn("Lỗi khi tải units_of_measure từ Supabase, chuyển sang Fallback:", err);
    cachedUnits = FALLBACK_UNITS_OF_MEASURE;
    lastCacheTime = now;
    return FALLBACK_UNITS_OF_MEASURE;
  }
}

/**
 * Lấy danh sách lựa chọn cho dropdown Select (value = name hoặc code)
 */
export function formatUomSelectOptions(units: UnitOfMeasure[]): UomSelectOption[] {
  return units.map((u) => ({
    value: u.name, // Dùng tên trực quan: "Cây", "Mét", "m²", "Kg"...
    label: `${u.name} - ${u.description || u.code}`,
    code: u.code,
    name: u.name,
    category: u.category,
  }));
}

/**
 * Lấy danh sách tên ĐVT thuần túy (Array of strings) dùng chung cho Kho và Đơn cắt tôn
 */
export function getUomNames(units: UnitOfMeasure[] = FALLBACK_UNITS_OF_MEASURE): string[] {
  return units.map((u) => u.name);
}

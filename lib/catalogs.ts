/**
 * HỆ THỐNG CATALOGS CHUẨN ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG
 * Cho phép chọn nhanh bằng dropdown / combobox / gợi ý thay vì phải gõ tay
 */

export interface RoofingProductPreset {
  id: string;
  code: string; // Mã kho / mã loại tôn (VD: OLPXX, TON-OLYMPIC-04, ...)
  name: string;
  brand: "Olympic" | "Hoa Sen" | "Đông Á" | "Việt Nhật" | "Khác";
  type: "1 lớp" | "Xốp chống nóng" | "Sóng ngói" | "6 sóng CN";
  thickness: string;
  width: number; // Khổ hiệu dụng (m)
  unitPrice: number; // Đơn giá tiêu chuẩn (đ/m2)
}

/** Tìm loại tôn theo mã kho, tên, hãng, chủng loại, độ dày */
export function filterRoofingProductCatalog(
  products: RoofingProductPreset[],
  rawTerm: string
): RoofingProductPreset[] {
  const term = (rawTerm || "").trim().toLowerCase();
  if (!term) return products;

  return products.filter((p) => {
    const haystack = [
      p.code,
      p.name,
      p.brand,
      p.type,
      p.thickness,
      p.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

export interface AccessoryPreset {
  id: string;
  code?: string; // Mã phụ kiện trong kho (VD: MANG300, XOI300, SUON300, KEO-A500, VIT-4, ...)
  name: string;
  unit: string; // Đơn vị tính chuẩn (Mét dài, Lọ, Túi, Cái, Bộ, Cây, Kg...)
  unitPrice: number; // Đơn giá (đ)
  category: "phu_kien_ton" | "vat_tu_phu" | "phu_kien" | "vat_tu_khac" | string;
  defaultQty?: number;
  stockQty?: number; // Số lượng tồn kho thực tế
}

export interface CustomerPreset {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: "Thợ thầu" | "Đại lý cấp 2" | "Khách công trình" | "Khách lẻ";
}

export interface SupplierPreset {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  category: "Tôn cuộn" | "Thép hộp" | "Nhôm định hình" | "Vật tư kim khí";
}

export interface UnitOfMeasurePreset {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface CategoryPreset {
  id: string;
  name: string;
  description: string;
}

// 1. Catalog tôn tĩnh đã GỠ — Tên Loại Tôn & Chủng Loại chỉ lấy từ Kho Vật Tư TT88 (inventory_items)
/** @deprecated Không dùng làm nguồn UI. Giữ mảng rỗng để tương thích test cũ đã migrate. */
export const ROOFING_PRODUCTS_CATALOG: RoofingProductPreset[] = [];

// 2. CATALOG PHỤ KIỆN TÔN & VẬT TƯ THI CÔNG MÁI
export const ACCESSORIES_CATALOG: AccessoryPreset[] = [
  {
    id: "mang-inox-300",
    code: "MANG300",
    name: "Máng Inox 304 Khổ 300",
    unit: "Mét dài",
    unitPrice: 304000,
    category: "phu_kien_ton",
    defaultQty: 4,
    stockQty: 62,
  },
  {
    id: "xoi-ton-300",
    code: "XOI300",
    name: "Xối Tôn Kẽm Mạ Màu Khổ 300",
    unit: "Mét dài",
    unitPrice: 45000,
    category: "phu_kien_ton",
    defaultQty: 6,
    stockQty: 59,
  },
  {
    id: "suon-ton-300",
    code: "SUON300",
    name: "Sườn Tôn Dập Mạ Màu Khổ 300",
    unit: "Mét dài",
    unitPrice: 38000,
    category: "phu_kien_ton",
    defaultQty: 3,
    stockQty: 49,
  },
  {
    id: "noc-ton-300",
    code: "NOC300",
    name: "Nóc Tôn Dập Mạ Màu Khổ 300",
    unit: "Mét dài",
    unitPrice: 38000,
    category: "phu_kien_ton",
    defaultQty: 5,
    stockQty: 46,
  },
  {
    id: "keo-apollo-a500",
    code: "KEO-A500",
    name: "Keo Silicone Apollo A500 Trắng Sữa",
    unit: "Lọ",
    unitPrice: 48000,
    category: "vat_tu_phu",
    defaultQty: 5,
    stockQty: 150,
  },
  {
    id: "keo-apollo-a300",
    code: "KEO-A300",
    name: "Keo Apollo A300 Axit Trong Suốt",
    unit: "Lọ",
    unitPrice: 45000,
    category: "vat_tu_phu",
    defaultQty: 2,
    stockQty: 80,
  },
  {
    id: "vit-ton-4",
    code: "VIT-4",
    name: "Vít Bắn Tôn Mạ Kẽm 4 Phân (Túi 200 con)",
    unit: "Túi",
    unitPrice: 75000,
    category: "vat_tu_phu",
    defaultQty: 4,
    stockQty: 200,
  },
  {
    id: "vit-ton-5",
    code: "VIT-5",
    name: "Vít Bắn Tôn Mạ Kẽm 5 Phân (Túi 200 con)",
    unit: "Túi",
    unitPrice: 85000,
    category: "vat_tu_phu",
    defaultQty: 2,
    stockQty: 120,
  },
  {
    id: "vit-inox-4",
    code: "VIT-INOX-4",
    name: "Vít Bắn Tôn Đầu Inox 4 Phân Chống Rỉ",
    unit: "Túi",
    unitPrice: 110000,
    category: "vat_tu_phu",
    defaultQty: 1,
    stockQty: 50,
  },
  {
    id: "bit-dau-mang",
    code: "BIT-MANG",
    name: "Bịt Đầu Máng Nước Inox Dập Sẵn",
    unit: "Cái",
    unitPrice: 25000,
    category: "phu_kien_ton",
    defaultQty: 2,
    stockQty: 100,
  },
];

// 3. CATALOG KHÁCH HÀNG & THỢ THẦU QUEN
export const CUSTOMERS_CATALOG: CustomerPreset[] = [
  {
    id: "cust-viet",
    name: "Anh Việt (Khách thầu)",
    phone: "0988 567 890",
    address: "Xã Nghĩa Dân, Huyện Kim Động, Hưng Yên",
    type: "Thợ thầu",
  },
  {
    id: "cust-thang",
    name: "Anh Thắng (Cơ khí Kim Động)",
    phone: "0912 345 678",
    address: "Thị Trấn Lương Bằng, Kim Động, Hưng Yên",
    type: "Thợ thầu",
  },
  {
    id: "cust-hai",
    name: "Xưởng Mái Tôn Hải Yến",
    phone: "0976 112 233",
    address: "Trương Xá, Nghĩa Dân, Hưng Yên",
    type: "Thợ thầu",
  },
  {
    id: "cust-truong",
    name: "Công Trình Nhà Chú Trường",
    phone: "0904 888 999",
    address: "Thôn Trương Xá, Nghĩa Dân, Hưng Yên",
    type: "Khách công trình",
  },
  {
    id: "cust-tuan-nhom",
    name: "Xưởng Nhôm Kính Tuấn Phát",
    phone: "0983 667 788",
    address: "Ngã Tư Dân Tiến, Khoái Châu, Hưng Yên",
    type: "Đại lý cấp 2",
  },
  {
    id: "cust-le",
    name: "Khách Mua Lẻ Tại Quầy",
    phone: "",
    address: "Tại xưởng Tuấn Hương",
    type: "Khách lẻ",
  },
];

// 4. CATALOG NHÀ CUNG CẤP TÔN THÉP
export const SUPPLIERS_CATALOG: SupplierPreset[] = [
  {
    id: "sup-olympic",
    code: "NCC_OLYMPIC",
    name: "Công Ty Tôn Olympic (Mỹ Việt)",
    phone: "024 3789 9999",
    address: "KCN Phố Nối A, Hưng Yên",
    category: "Tôn cuộn",
  },
  {
    id: "sup-hoasen",
    code: "NCC_HOASEN",
    name: "Tập Đoàn Hoa Sen - Chi Nhánh Hưng Yên",
    phone: "1800 1515",
    address: "Như Quỳnh, Văn Lâm, Hưng Yên",
    category: "Tôn cuộn",
  },
  {
    id: "sup-donga",
    code: "NCC_DONGA",
    name: "Công Ty CP Tôn Đông Á",
    phone: "0274 3737 494",
    address: "KCN Sóng Thần 1, Dĩ An, Bình Dương",
    category: "Tôn cuộn",
  },
  {
    id: "sup-hoaphat",
    code: "NCC_HOAPHAT",
    name: "Công Ty Ống Thép Hoà Phát Hưng Yên",
    phone: "0221 3948 888",
    address: "KCN Phố Nối A, Giai Phạm, Yên Mỹ, Hưng Yên",
    category: "Thép hộp",
  },
  {
    id: "sup-vietduc",
    code: "NCC_VIETDUC",
    name: "Công Ty Thép Việt Đức (VGS)",
    phone: "0211 3888 666",
    address: "KCN Bình Xuyên, Vĩnh Phúc",
    category: "Thép hộp",
  },
  {
    id: "sup-yangli",
    code: "NCC_YANGLI",
    name: "Nhà Phân Phối Nhôm Yangli Việt Nam",
    phone: "0903 222 333",
    address: "Cụm CN Tân Lập, Yên Mỹ, Hưng Yên",
    category: "Nhôm định hình",
  },
  {
    id: "sup-apollo",
    code: "NCC_APOLLO",
    name: "Đại Lý Keo Apollo & Kim Khí Tổng Hợp",
    phone: "0982 777 888",
    address: "TP Hưng Yên",
    category: "Vật tư kim khí",
  },
];

// 5. CATALOG PHÂN LOẠI HÀNG HOÁ KHO
export const CATEGORIES_CATALOG: CategoryPreset[] = [
  { id: "thep_hop", name: "Thép Hộp Mạ Kẽm", description: "Hộp vuông, chữ nhật (CÂY)" },
  { id: "ong_tron", name: "Thép Ống Tròn", description: "Ống tròn phi 21 đến 90 (CÂY)" },
  { id: "nhom", name: "Nhôm Định Hình", description: "Nhôm trắng sứ, vân gỗ, Yangli (KG)" },
  { id: "ton_lop", name: "Tôn Lợp & Tôn Cuộn", description: "Tôn 1 lớp, tôn xốp PU (M2)" },
  { id: "phu_kien", name: "Phụ Kiện Dập Xưởng", description: "Máng, xối, nóc, sườn (MD)" },
  { id: "vat_tu_khac", name: "Vật Tư & Kim Khí Khác", description: "Inox 304, Lưới B40, Sắt cân, Keo, Vít (KG/LỌ)" },
];

// 6. CATALOG ĐƠN VỊ TÍNH (ĐVT) DÙNG CHUNG KHO HÀNG & ĐƠN CẮT TÔN (Từ bảng public.units_of_measure)
export const SHARED_UOM_NAMES = [
  "Cây",
  "Mét",
  "m²",
  "Kg",
  "Cái",
  "Tấm",
  "Cuộn",
  "Hộp",
  "Bao",
  "Bình",
  "Bộ",
  "Lọ",
  "Túi",
  "Mét dài",
] as const;

export type SharedUomName = (typeof SHARED_UOM_NAMES)[number];

/**
 * Chuẩn hóa đơn vị tính từ kho hàng (viết hoa/viết tắt như MD, LO, TUI...) sang danh mục chuẩn SHARED_UOM_NAMES
 */
export function normalizeAccessoryUnit(rawUnit: string): string {
  if (!rawUnit) return "Cây";
  const trimmed = rawUnit.trim();
  const upper = trimmed.toUpperCase();

  switch (upper) {
    case "MD":
    case "MET DAI":
    case "MÉT DÀI":
      return "Mét dài";
    case "M":
    case "MET":
    case "MÉT":
      return "Mét";
    case "M2":
    case "M²":
      return "m²";
    case "LO":
    case "LỌ":
      return "Lọ";
    case "TUI":
    case "TÚI":
      return "Túi";
    case "CAY":
    case "CÂY":
      return "Cây";
    case "CAI":
    case "CÁI":
      return "Cái";
    case "KG":
      return "Kg";
    case "BO":
    case "BỘ":
      return "Bộ";
    case "CUON":
    case "CUỘN":
      return "Cuộn";
    case "TAM":
    case "TẤM":
      return "Tấm";
    case "HOP":
    case "HỘP":
      return "Hộp";
    case "BAO":
      return "Bao";
    case "BINH":
    case "BÌNH":
      return "Bình";
    default: {
      const matched = SHARED_UOM_NAMES.find(
        (n) => n.toLowerCase() === trimmed.toLowerCase()
      );
      return matched || trimmed;
    }
  }
}

export const UNITS_CATALOG = [
  // Nhóm đơn vị dùng phổ biến cho cả Kho Hàng và Đơn Cắt Tôn
  { value: "Cây", label: "Cây (Thép hộp, ống tròn Hòa Phát, nhôm cây 6m)" },
  { value: "Mét", label: "Mét (Mét dài tôn cắt theo quy cách, phụ kiện xối máng)" },
  { value: "m²", label: "m² (Diện tích tôn lợp 1 lớp, tôn xốp PU, tôn ngói Ruby)" },
  { value: "Kg", label: "Kg (Nhôm định hình, Inox 304, lưới B40, sắt phôi cân ký)" },
  { value: "Cái", label: "Cái (Đầu bịt máng xối, nẹp chỉ tôn, phụ kiện lắp ghép)" },
  { value: "Tấm", label: "Tấm (Tấm tôn thành phẩm đã dập cắt theo quy cách)" },
  { value: "Cuộn", label: "Cuộn (Cuộn tôn nguyên khổ Olympic, Hoa Sen, Đông Á)" },
  { value: "Hộp", label: "Hộp (Vít bắn tôn đóng hộp, que hàn, linh kiện)" },
  { value: "Bao", label: "Bao (Đinh dù, vật tư đóng bao lớn)" },
  { value: "Bình", label: "Bình (Keo bọt chống cháy, bình xịt mỡ bảo dưỡng)" },
  { value: "Bộ", label: "Bộ (Bộ phụ kiện nóc máng trọn gói công trình)" },
  { value: "Lọ", label: "Lọ (Keo Silicone Apollo A500, A300 chống dột mái)" },
  { value: "Túi", label: "Túi (Vít mạ kẽm đóng túi nhỏ 100 - 200 con)" },
  { value: "Mét dài", label: "Mét dài (Đơn vị kế toán mét dài dập xưởng TT88)" },
  // Giữ alias tương thích ngược với dữ liệu cũ viết hoa trong sổ kho
  { value: "CÂY", label: "CÂY (Thép hộp, ống tròn - Legacy)" },
  { value: "M2", label: "M2 (Tôn lợp, tôn xốp - Legacy)" },
  { value: "MD", label: "MD (Mét dài phụ kiện máng, xối - Legacy)" },
  { value: "KG", label: "KG (Nhôm, Inox 304, sắt cân - Legacy)" },
];

// 7. CATALOG KHOẢN MỤC THU TIỀN (MẪU 01-TT)
export const RECEIPT_REASONS_CATALOG = [
  { id: "thu_ban_ton", label: "Thu tiền bán tôn lợp & phụ kiện mái", category: "revenue" },
  { id: "thu_ban_thep", label: "Thu tiền bán thép hộp, ống tròn, nhôm", category: "revenue" },
  { id: "thu_cong_no", label: "Thu tiền công nợ khách thầu / thợ công trình", category: "debt_recovery" },
  { id: "thu_dat_coc", label: "Thu tiền đặt cọc đơn hàng cắt tôn theo yêu cầu", category: "deposit" },
  { id: "thu_phe_lieu", label: "Thu tiền bán sắt mẩu, đầu phôi tôn vụn xưởng", category: "other_income" },
  { id: "thu_khac", label: "Thu khác (hoàn ứng, thu tiền dịch vụ xẻ tôn)", category: "other" },
];

// 8. CATALOG KHOẢN MỤC CHI TIỀN (MẪU 02-TT)
export const PAYMENT_REASONS_CATALOG = [
  { id: "chi_nhap_ton", label: "Chi trả tiền cuộn tôn cho Nhà cung cấp", category: "cogs" },
  { id: "chi_nhap_thep", label: "Chi trả tiền thép hộp, ống tròn Hòa Phát", category: "cogs" },
  { id: "chi_nhap_phu_kien", label: "Chi mua keo Apollo, vít tôn, vật tư kim khí", category: "cogs" },
  { id: "chi_tien_dien", label: "Chi tiền điện sản xuất xưởng cán tôn", category: "operation" },
  { id: "chi_xe_cau", label: "Chi cước xe cẩu / vận chuyển giao công trình", category: "shipping" },
  { id: "chi_luong_tho", label: "Chi lương / ứng lương thợ cán tôn", category: "salary" },
  { id: "chi_dau_mo", label: "Chi dầu máy cắt, mỡ bôi trơn máy cán tôn", category: "maintenance" },
  { id: "chi_thue", label: "Chi nộp thuế môn bài / thuế hộ kinh doanh TT88", category: "tax" },
  { id: "chi_khac", label: "Chi phí sinh hoạt, văn phòng phẩm, tiếp khách", category: "other" },
];

// 9. CATALOG PHƯƠNG THỨC THANH TOÁN
export const PAYMENT_METHODS_CATALOG = [
  { id: "cash", label: "Tiền mặt tại két (Quỹ tiền mặt S1-HKD)" },
  { id: "bank_transfer", label: "Chuyển khoản Ngân hàng (Tài khoản kinh doanh)" },
];

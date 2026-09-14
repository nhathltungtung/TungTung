/**
 * HỆ THỐNG CATALOGS CHUẨN ĐẠI LÝ TÔN THÉP TUẤN HƯƠNG
 * Cho phép chọn nhanh bằng dropdown / combobox / gợi ý thay vì phải gõ tay
 */

export interface RoofingProductPreset {
  id: string;
  name: string;
  brand: "Olympic" | "Hoa Sen" | "Đông Á" | "Việt Nhật" | "Khác";
  type: "1 lớp" | "Xốp chống nóng" | "Sóng ngói" | "6 sóng CN";
  thickness: string;
  width: number; // Khổ hiệu dụng (m)
  unitPrice: number; // Đơn giá tiêu chuẩn (đ/m2)
}

export interface AccessoryPreset {
  id: string;
  name: string;
  unit: "MD" | "LỌ" | "TÚI" | "CÁI" | "BỘ" | "CÂY" | "KG";
  unitPrice: number; // Đơn giá (đ)
  category: "phu_kien_ton" | "vat_tu_phu";
  defaultQty?: number;
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

export interface CategoryPreset {
  id: string;
  name: string;
  description: string;
}

// 1. CATALOG CÁC LOẠI TÔN LỢP PHỔ BIẾN TẠI XƯỞNG
export const ROOFING_PRODUCTS_CATALOG: RoofingProductPreset[] = [
  {
    id: "ton-olympic-04-xanh-reu",
    name: "Tôn 0.40 Xanh Rêu Olympic 1 lớp 11 sóng",
    brand: "Olympic",
    type: "1 lớp",
    thickness: "0.40mm",
    width: 1.08,
    unitPrice: 111000,
  },
  {
    id: "ton-olympic-04-do-dam",
    name: "Tôn 0.40 Đỏ Đậm Olympic 1 lớp 11 sóng",
    brand: "Olympic",
    type: "1 lớp",
    thickness: "0.40mm",
    width: 1.08,
    unitPrice: 111000,
  },
  {
    id: "ton-olympic-045-xanh-reu",
    name: "Tôn 0.45 Xanh Rêu Olympic 1 lớp 11 sóng",
    brand: "Olympic",
    type: "1 lớp",
    thickness: "0.45mm",
    width: 1.08,
    unitPrice: 122000,
  },
  {
    id: "ton-olympic-04-xop",
    name: "Tôn Xốp Cách Nhiệt Olympic 0.40mm 11 sóng",
    brand: "Olympic",
    type: "Xốp chống nóng",
    thickness: "0.40mm",
    width: 1.08,
    unitPrice: 165000,
  },
  {
    id: "ton-olympic-045-xop",
    name: "Tôn Xốp Cách Nhiệt Olympic 0.45mm 11 sóng",
    brand: "Olympic",
    type: "Xốp chống nóng",
    thickness: "0.45mm",
    width: 1.08,
    unitPrice: 178000,
  },
  {
    id: "ton-hoasen-04-xanh-duong",
    name: "Tôn 0.40 Xanh Dương Hoa Sen 1 lớp 11 sóng",
    brand: "Hoa Sen",
    type: "1 lớp",
    thickness: "0.40mm",
    width: 1.08,
    unitPrice: 108000,
  },
  {
    id: "ton-hoasen-045-xop",
    name: "Tôn Xốp Hoa Sen 0.45mm PU chống nóng",
    brand: "Hoa Sen",
    type: "Xốp chống nóng",
    thickness: "0.45mm",
    width: 1.08,
    unitPrice: 172000,
  },
  {
    id: "ton-donga-045-ghi-xam",
    name: "Tôn Đông Á 0.45mm Ghi Xám 6 sóng công nghiệp",
    brand: "Đông Á",
    type: "6 sóng CN",
    thickness: "0.45mm",
    width: 1.06,
    unitPrice: 128000,
  },
  {
    id: "ton-olympic-song-ngoi-do",
    name: "Tôn Giả Ngói Olympic Ruby Đỏ Đậm 0.45mm",
    brand: "Olympic",
    type: "Sóng ngói",
    thickness: "0.45mm",
    width: 1.05,
    unitPrice: 145000,
  },
  {
    id: "ton-vietnhat-035",
    name: "Tôn Lạnh Mạ Màu Việt Nhật 0.35mm 11 sóng",
    brand: "Việt Nhật",
    type: "1 lớp",
    thickness: "0.35mm",
    width: 1.08,
    unitPrice: 89000,
  },
];

// 2. CATALOG PHỤ KIỆN TÔN & VẬT TƯ THI CÔNG MÁI
export const ACCESSORIES_CATALOG: AccessoryPreset[] = [
  {
    id: "mang-inox-300",
    name: "Máng Inox 304 Khổ 300",
    unit: "MD",
    unitPrice: 304000,
    category: "phu_kien_ton",
    defaultQty: 4,
  },
  {
    id: "xoi-ton-300",
    name: "Xối Tôn Kẽm Mạ Màu Khổ 300",
    unit: "MD",
    unitPrice: 45000,
    category: "phu_kien_ton",
    defaultQty: 6,
  },
  {
    id: "suon-ton-300",
    name: "Sườn Tôn Dập Mạ Màu Khổ 300",
    unit: "MD",
    unitPrice: 38000,
    category: "phu_kien_ton",
    defaultQty: 3,
  },
  {
    id: "noc-ton-300",
    name: "Nóc Tôn Dập Mạ Màu Khổ 300",
    unit: "MD",
    unitPrice: 38000,
    category: "phu_kien_ton",
    defaultQty: 5,
  },
  {
    id: "keo-apollo-a500",
    name: "Keo Silicone Apollo A500 Trắng Sữa",
    unit: "LỌ",
    unitPrice: 48000,
    category: "vat_tu_phu",
    defaultQty: 5,
  },
  {
    id: "keo-apollo-a300",
    name: "Keo Apollo A300 Axit Trong Suốt",
    unit: "LỌ",
    unitPrice: 45000,
    category: "vat_tu_phu",
    defaultQty: 2,
  },
  {
    id: "vit-ton-4",
    name: "Vít Bắn Tôn Mạ Kẽm 4 Phân (Túi 200 con)",
    unit: "TÚI",
    unitPrice: 75000,
    category: "vat_tu_phu",
    defaultQty: 4,
  },
  {
    id: "vit-ton-5",
    name: "Vít Bắn Tôn Mạ Kẽm 5 Phân (Túi 200 con)",
    unit: "TÚI",
    unitPrice: 85000,
    category: "vat_tu_phu",
    defaultQty: 2,
  },
  {
    id: "vit-inox-4",
    name: "Vít Bắn Tôn Đầu Inox 4 Phân Chống Rỉ",
    unit: "TÚI",
    unitPrice: 110000,
    category: "vat_tu_phu",
    defaultQty: 1,
  },
  {
    id: "bit-dau-mang",
    name: "Bịt Đầu Máng Nước Inox Dập Sẵn",
    unit: "CÁI",
    unitPrice: 25000,
    category: "phu_kien_ton",
    defaultQty: 2,
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

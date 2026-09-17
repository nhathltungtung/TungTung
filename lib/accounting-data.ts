import * as XLSX from "xlsx";

export interface CashTransaction {
  id: string;
  voucherCode: string; // PT001, PC001
  type: "receipt" | "payment"; // receipt = Thu, payment = Chi
  date: string;
  category: string; // Lý do thu / chi (từ catalog)
  counterpart: string; // Người nộp / người nhận
  amount: number;
  paymentMethod: "cash" | "bank_transfer";
  note?: string;
}

export interface CustomerDebt {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  totalPurchased: number;
  totalPaid: number;
  remainingDebt: number;
  lastPaymentDate: string;
}

// Dữ liệu mẫu Sổ Quỹ Tiền Mặt thực tế
export const DEFAULT_TRANSACTIONS: CashTransaction[] = [
  {
    id: "tx-1",
    voucherCode: "PT001",
    type: "receipt",
    date: "2026-09-12",
    category: "Thu tiền bán tôn lợp & phụ kiện mái",
    counterpart: "Anh Việt (Khách thầu)",
    amount: 6680844,
    paymentMethod: "cash",
    note: "Thanh toán hoá đơn đơn cắt tôn 11 tấm",
  },
  {
    id: "tx-2",
    voucherCode: "PT002",
    type: "receipt",
    date: "2026-09-11",
    category: "Thu tiền công nợ khách thầu / thợ công trình",
    counterpart: "Xưởng Mái Tôn Hải Yến",
    amount: 15000000,
    paymentMethod: "bank_transfer",
    note: "Thanh toán đợt 1 công trình Nghĩa Dân",
  },
  {
    id: "tx-3",
    voucherCode: "PC001",
    type: "payment",
    date: "2026-09-11",
    category: "Chi tiền điện sản xuất xưởng cán tôn",
    counterpart: "Điện lực Hưng Yên",
    amount: 3250000,
    paymentMethod: "bank_transfer",
    note: "Tiền điện sản xuất tháng 8/2026",
  },
  {
    id: "tx-4",
    voucherCode: "PC002",
    type: "payment",
    date: "2026-09-10",
    category: "Chi cước xe cẩu / vận chuyển giao công trình",
    counterpart: "Đội xe cẩu Trương Xá",
    amount: 1200000,
    paymentMethod: "cash",
    note: "Cẩu 40 cây xà gồ và tôn dài 8m công trình Lương Bằng",
  },
  {
    id: "tx-5",
    voucherCode: "PC003",
    type: "payment",
    date: "2026-09-09",
    category: "Chi mua keo Apollo, vít tôn, vật tư kim khí",
    counterpart: "Đại Lý Keo Apollo & Kim Khí Tổng Hợp",
    amount: 4500000,
    paymentMethod: "cash",
    note: "Nhập 50 lọ keo A500 và 20 túi vít bắn tôn 4 phân",
  },
];

// Dữ liệu mẫu Sổ Nợ Thợ Thầu
export const DEFAULT_DEBTS: CustomerDebt[] = [
  {
    id: "debt-1",
    customerName: "Anh Việt (Khách thầu)",
    phone: "0988 567 890",
    address: "Xã Nghĩa Dân, Kim Động, Hưng Yên",
    totalPurchased: 45000000,
    totalPaid: 35000000,
    remainingDebt: 10000000,
    lastPaymentDate: "2026-09-10",
  },
  {
    id: "debt-2",
    customerName: "Xưởng Mái Tôn Hải Yến",
    phone: "0976 112 233",
    address: "Trương Xá, Nghĩa Dân, Hưng Yên",
    totalPurchased: 62000000,
    totalPaid: 45000000,
    remainingDebt: 17000000,
    lastPaymentDate: "2026-09-11",
  },
  {
    id: "debt-3",
    customerName: "Anh Thắng (Cơ khí Kim Động)",
    phone: "0912 345 678",
    address: "Thị Trấn Lương Bằng, Kim Động, Hưng Yên",
    totalPurchased: 28500000,
    totalPaid: 23500000,
    remainingDebt: 5000000,
    lastPaymentDate: "2026-09-05",
  },
  {
    id: "debt-4",
    customerName: "Công Trình Nhà Chú Trường",
    phone: "0904 888 999",
    address: "Thôn Trương Xá, Nghĩa Dân, Hưng Yên",
    totalPurchased: 18600000,
    totalPaid: 15000000,
    remainingDebt: 3600000,
    lastPaymentDate: "2026-09-08",
  },
];

/**
 * Xuất file Excel Sổ Quỹ Tiền Mặt (Mẫu số S1-HKD theo Thông tư 88/2021/TT-BTC)
 */
export function exportMauS1HKDExcel(transactions: CashTransaction[]) {
  const rows: (string | number)[][] = [
    ["ĐẠI LÝ TUẤN HƯƠNG", "", "", "", "", "MẪU SỐ S1-HKD"],
    ["Địa chỉ : TRƯƠNG XÁ, NGHĨA DÂN, HƯNG YÊN", "", "", "", "", "(Ban hành kèm theo TT số 88/2021/TT-BTC)"],
    [""],
    ["", "", "SỔ QUỸ TIỀN MẶT"],
    ["", "", `Tháng ${new Date().getMonth() + 1} Năm ${new Date().getFullYear()}`],
    ["", "", "Loại tiền: Việt Nam Đồng (VND)"],
    [""],
    [
      "Ngày tháng ghi sổ",
      "Ngày chứng từ",
      "Số hiệu chứng từ Thu",
      "Số hiệu chứng từ Chi",
      "Diễn giải nội dung thu chi",
      "Số tiền THU (đ)",
      "Số tiền CHI (đ)",
      "Số TỒN QUỸ (đ)",
    ],
  ];

  let currentBalance = 25000000; // Số dư đầu kỳ quỹ 25 triệu
  rows.push(["-", "-", "-", "-", "Số dư quỹ đầu kỳ", "", "", currentBalance]);

  let totalReceipt = 0;
  let totalPayment = 0;

  transactions.forEach((tx) => {
    const isThu = tx.type === "receipt";
    const thuAmount = isThu ? tx.amount : 0;
    const chiAmount = !isThu ? tx.amount : 0;
    currentBalance += thuAmount - chiAmount;
    totalReceipt += thuAmount;
    totalPayment += chiAmount;

    rows.push([
      tx.date,
      tx.date,
      isThu ? tx.voucherCode : "",
      !isThu ? tx.voucherCode : "",
      `${tx.category} - ${tx.counterpart} (${tx.note || ""})`,
      thuAmount || "",
      chiAmount || "",
      currentBalance,
    ]);
  });

  rows.push(["", "Cộng số phát sinh:", "", "", "", totalReceipt, totalPayment, currentBalance]);
  rows.push([""]);
  rows.push(["", "Người ghi sổ", "", "", "Kế toán trưởng", "", "", "Chủ hộ kinh doanh"]);
  rows.push(["", "(Ký, họ tên)", "", "", "(Ký, họ tên)", "", "", "(Ký, đóng dấu)"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 42 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "So_Quy_S1_HKD");
  XLSX.writeFile(wb, `So_Quy_Tien_Mat_Mau_S1_HKD.xlsx`);
}

/**
 * Xuất file Excel Phiếu Thu (Mẫu số 01-TT theo Thông tư 88/2021/TT-BTC)
 */
export function exportMau01TTExcel(tx: CashTransaction) {
  const rows: (string | number)[][] = [
    ["ĐẠI LÝ TUẤN HƯƠNG", "", "", "MẪU SỐ 01-TT"],
    ["Địa chỉ : TRƯƠNG XÁ, NGHĨA DÂN, HƯNG YÊN", "", "", "(Ban hành kèm theo TT số 88/2021/TT-BTC)"],
    [""],
    ["", "PHIẾU THU", "", `Số: ${tx.voucherCode}`],
    ["", `Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`],
    [""],
    ["Họ và tên người nộp tiền:", tx.counterpart],
    ["Địa chỉ:", "Huyện Kim Động, Hưng Yên"],
    ["Lý do nộp:", tx.category],
    ["Số tiền:", tx.amount, "đồng"],
    ["Viết bằng chữ:", "(Số tiền nộp tiền mặt hoặc chuyển khoản)"],
    ["Kèm theo:", "Chứng từ gốc / Hoá đơn bán hàng"],
    [""],
    ["Chủ hộ kinh doanh", "Người lập phiếu", "Người nộp tiền", "Thủ quỹ"],
    ["(Ký, họ tên)", "(Ký, họ tên)", "(Ký, họ tên)", "(Ký, họ tên)"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Phieu_Thu_01_TT");
  XLSX.writeFile(wb, `Phieu_Thu_${tx.voucherCode}_Mau_01_TT.xlsx`);
}

/**
 * Xuất file Excel Phiếu Chi (Mẫu số 02-TT theo Thông tư 88/2021/TT-BTC)
 */
export function exportMau02TTExcel(tx: CashTransaction) {
  const rows: (string | number)[][] = [
    ["ĐẠI LÝ TUẤN HƯƠNG", "", "", "MẪU SỐ 02-TT"],
    ["Địa chỉ : TRƯƠNG XÁ, NGHĨA DÂN, HƯNG YÊN", "", "", "(Ban hành kèm theo TT số 88/2021/TT-BTC)"],
    [""],
    ["", "PHIẾU CHI", "", `Số: ${tx.voucherCode}`],
    ["", `Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`],
    [""],
    ["Họ và tên người nhận tiền:", tx.counterpart],
    ["Địa chỉ:", "Hưng Yên"],
    ["Lý do chi:", tx.category],
    ["Số tiền:", tx.amount, "đồng"],
    ["Viết bằng chữ:", "(Số tiền chi quỹ tiền mặt hoặc chuyển khoản)"],
    ["Kèm theo:", "Hoá đơn / Giấy biên nhận giao hàng"],
    [""],
    ["Chủ hộ kinh doanh", "Người lập phiếu", "Người nhận tiền", "Thủ quỹ"],
    ["(Ký, họ tên)", "(Ký, họ tên)", "(Ký, họ tên)", "(Ký, họ tên)"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Phieu_Chi_02_TT");
  XLSX.writeFile(wb, `Phieu_Chi_${tx.voucherCode}_Mau_02_TT.xlsx`);
}

export interface SalesRevenueRecord {
  id: string;
  orderCode: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  itemsSummary: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "cutting" | "completed" | "cancelled" | string;
}

export const DEFAULT_SALES_REVENUE: SalesRevenueRecord[] = [
  {
    id: "sale-1",
    orderCode: "HĐ-260912-001",
    date: "2026-09-12",
    customerName: "Anh Việt (Khách thầu)",
    customerPhone: "0988 567 890",
    customerAddress: "Xã Nghĩa Dân, Kim Động, Hưng Yên",
    itemsSummary: "Tôn xốp Hoa Sen 11 sóng 0.40mm (11 tấm), Keo silicone Apollo (5 lọ)",
    totalAmount: 6680844,
    paidAmount: 6680844,
    remainingAmount: 0,
    status: "completed",
  },
  {
    id: "sale-2",
    orderCode: "HĐ-260911-002",
    date: "2026-09-11",
    customerName: "Xưởng Mái Tôn Hải Yến",
    customerPhone: "0976 112 233",
    customerAddress: "Trương Xá, Nghĩa Dân, Hưng Yên",
    itemsSummary: "Tôn sóng vuông mạ kẽm 0.35mm (18 tấm), Vít bắn tôn 4 phân (2 gói)",
    totalAmount: 18500000,
    paidAmount: 15000000,
    remainingAmount: 3500000,
    status: "completed",
  },
  {
    id: "sale-3",
    orderCode: "HĐ-260910-003",
    date: "2026-09-10",
    customerName: "Anh Thắng (Cơ khí Kim Động)",
    customerPhone: "0912 345 678",
    customerAddress: "Thị Trấn Lương Bằng, Kim Động, Hưng Yên",
    itemsSummary: "Tôn lạnh không xốp Việt Nhật 0.45mm (8 tấm), Úp nóc tôn (6 mét)",
    totalAmount: 8200000,
    paidAmount: 5000000,
    remainingAmount: 3200000,
    status: "completed",
  },
];

/**
 * Xuất file Excel Sổ Chi Tiết Doanh Thu Bán Hàng Hoá, Dịch Vụ (Mẫu số S3-HKD theo Thông tư 88/2021/TT-BTC)
 */
export function exportMauS3HKDExcel(records: SalesRevenueRecord[]) {
  const rows: (string | number)[][] = [
    ["ĐẠI LÝ TUẤN HƯƠNG", "", "", "", "", "", "MẪU SỐ S3-HKD"],
    ["Địa chỉ : TRƯƠNG XÁ, TOÀN THẮNG, KIM ĐỘNG, HƯNG YÊN", "", "", "", "", "", "(Ban hành kèm theo TT số 88/2021/TT-BTC)"],
    ["Hotline : 0373208038 – 0989734768", "", "", "", "", "", "Ngày 08/10/2021 của Bộ Tài chính"],
    [""],
    ["", "", "", "SỔ CHI TIẾT DOANH THU BÁN HÀNG HOÁ, DỊCH VỤ"],
    ["", "", "", `Tháng ${new Date().getMonth() + 1} Năm ${new Date().getFullYear()}`],
    ["", "", "", "Đơn vị tính: Việt Nam Đồng (VND)"],
    [""],
    [
      "STT",
      "Ngày tháng ghi sổ",
      "Số hiệu chứng từ",
      "Tên người mua (Khách thầu/Khách lẻ)",
      "Nội dung hàng hoá, dịch vụ",
      "Doanh thu bán hàng (đ)",
      "Đã thanh toán (đ)",
      "Còn nợ (đ)",
      "Ghi chú",
    ],
  ];

  let totalRev = 0;
  let totalPaid = 0;
  let totalDebt = 0;

  records.forEach((rec, idx) => {
    const rev = Number(rec.totalAmount) || 0;
    const paid = Number(rec.paidAmount) || 0;
    const debt = Number(rec.remainingAmount) || 0;

    totalRev += rev;
    totalPaid += paid;
    totalDebt += debt;

    const statusText =
      rec.status === "completed"
        ? "Đã hoàn thành"
        : rec.status === "cutting"
        ? "Đang cắt tôn"
        : rec.status === "cancelled"
        ? "Đã huỷ"
        : "Chờ xử lý";

    rows.push([
      idx + 1,
      rec.date,
      rec.orderCode,
      rec.customerName,
      rec.itemsSummary || "Tôn lợp và phụ kiện",
      rev,
      paid,
      debt,
      statusText,
    ]);
  });

  rows.push([
    "CỘNG",
    "",
    "",
    "",
    `Tổng cộng (${records.length} đơn bán hàng)`,
    totalRev,
    totalPaid,
    totalDebt,
    "",
  ]);

  rows.push([""]);
  rows.push([
    "",
    "Người ghi sổ",
    "",
    "",
    "Kế toán trưởng",
    "",
    "",
    "Chủ hộ kinh doanh",
  ]);
  rows.push([
    "",
    "(Ký, họ tên)",
    "",
    "",
    "(Ký, họ tên)",
    "",
    "",
    "(Ký, đóng dấu)",
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 18 },
    { wch: 28 },
    { wch: 45 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "So_Doanh_Thu_S3_HKD");
  XLSX.writeFile(wb, `So_Chi_Tiet_Doanh_Thu_Mau_S3_HKD.xlsx`);
}


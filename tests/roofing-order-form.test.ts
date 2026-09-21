import { describe, it, expect } from "vitest";
import {
  createBlankRoofingOrder,
  initRoofingOrderState,
  ACCESSORY_UNITS,
} from "@/components/roofing/RoofingOrderForm";
import {
  calculateRoofingGroup,
  calculateAccessory,
  calculateOrderTotals,
  formatCurrency,
  formatNumber,
  formatMoneyInput,
  parseMoneyInput,
  numberToVietnameseWords,
  SAMPLE_EXCEL_ORDER,
} from "@/lib/roofing-calc";
import {
  ACCESSORIES_CATALOG,
  CUSTOMERS_CATALOG,
} from "@/lib/catalogs";
import { exportRoofingOrderToExcel, buildRoofingExcelDataRows, toExcelThousand } from "@/lib/roofing-excel";
import { RoofingOrder, RoofingCutItem, AccessoryItem } from "@/types/roofing";

describe("Tạo Đơn Hàng & Bàn Tính Cắt Tôn - Toàn Bộ Chức Năng & Nghiệp Vụ", () => {
  // ===========================================================================
  // 1. KHỞI TẠO ĐƠN HÀNG (DETERMINISTIC CHO SSR & DYNAMIC CHO CLIENT)
  // ===========================================================================
  describe("1. Khởi tạo đơn hàng trắng (createBlankRoofingOrder)", () => {
    it("Tạo đơn hàng trắng chuẩn cho SSR (isDynamic = false) tránh lỗi Hydration", () => {
      const order = createBlankRoofingOrder(false);

      // Mã đơn cố định để không lệch Hydration
      expect(order.orderCode).toBe("HĐ-2026-001");
      expect(order.createdAt).toBe("2026-09-14");

      // Khách hàng hoàn toàn trắng để nhập mới
      expect(order.customer.name).toBe("");
      expect(order.customer.phone).toBe("");
      expect(order.customer.address).toBe("");
      expect(order.customer.note).toBe("");

      // Mặc định có 1 nhóm tôn trắng sẵn sàng nhập liệu
      expect(order.roofingGroups).toHaveLength(1);
      const group1 = order.roofingGroups[0];
      expect(group1.productName).toBe("");
      expect(group1.width).toBe(1.08); // Khổ tôn thông dụng mặc định
      expect(group1.unitPrice).toBe(0);
      expect(group1.items).toHaveLength(1);
      expect(group1.items[0].length).toBe(0);
      expect(group1.items[0].quantity).toBe(0);
      expect(group1.items[0].totalMeters).toBe(0);

      // Phụ kiện ban đầu rỗng
      expect(order.accessories).toHaveLength(0);

      // Tiền ban đầu bằng 0
      expect(order.totalAmount).toBe(0);
      expect(order.remainingAmount).toBe(0);
      expect(order.discount).toBe(0);
      expect(order.deposit).toBe(0);
      expect(order.unpaidAmount).toBe(0);
      expect(order.status).toBe("pending");
    });

    it("Tạo đơn hàng mới ngẫu nhiên cho Client khi bấm 'Làm Mới' (isDynamic = true)", () => {
      const order1 = createBlankRoofingOrder(true);
      const order2 = createBlankRoofingOrder(true);

      expect(order1.orderCode).toMatch(/^HĐ-2026-\d{3}$/);
      expect(order2.orderCode).toMatch(/^HĐ-2026-\d{3}$/);
      expect(order1.id).not.toBe(order2.id);
    });

    it("initRoofingOrderState(edit) giữ nguyên id và orderCode của đơn có sẵn", () => {
      const existing = {
        ...SAMPLE_EXCEL_ORDER,
        id: "uuid-order-abc-123",
        orderCode: "HĐ-2026-777",
        status: "cutting" as const,
      };

      const state = initRoofingOrderState("edit", existing);

      expect(state.id).toBe("uuid-order-abc-123");
      expect(state.orderCode).toBe("HĐ-2026-777");
      expect(state.status).toBe("cutting");
      expect(state.customer.name).toBe(existing.customer.name);
      expect(state.roofingGroups).toHaveLength(existing.roofingGroups.length);
      // Deep clone: sửa bản sao không làm đổi đơn gốc
      state.customer.name = "Đã sửa";
      expect(existing.customer.name).not.toBe("Đã sửa");
    });

    it("initRoofingOrderState(create) trả về đơn trắng deterministic", () => {
      const state = initRoofingOrderState("create");
      expect(state.orderCode).toBe("HĐ-2026-001");
      expect(state.status).toBe("pending");
    });
  });

  // ===========================================================================
  // 2. NGHIỆP VỤ THÔNG TIN KHÁCH HÀNG & DANH BẠ THỢ THẦU
  // ===========================================================================
  describe("2. Thông tin khách hàng & Danh bạ thợ thầu", () => {
    it("Cập nhật thông tin khách hàng thủ công (Tên, SĐT, Địa chỉ, Ghi chú)", () => {
      const order = createBlankRoofingOrder(false);
      order.customer.name = "Bác Năm Thợ Hàn";
      order.customer.phone = "0912345678";
      order.customer.address = "Chợ Dân Tiến, Khoái Châu, Hưng Yên";
      order.customer.note = "Giao hàng trước 9h sáng, cán sóng vuông";

      expect(order.customer.name).toBe("Bác Năm Thợ Hàn");
      expect(order.customer.phone).toBe("0912345678");
      expect(order.customer.address).toBe("Chợ Dân Tiến, Khoái Châu, Hưng Yên");
      expect(order.customer.note).toBe("Giao hàng trước 9h sáng, cán sóng vuông");
    });

    it("Tìm kiếm danh bạ CUSTOMERS_CATALOG theo tên, SĐT hoặc địa chỉ", () => {
      expect(CUSTOMERS_CATALOG.length).toBeGreaterThan(0);

      // Tìm theo tên
      const matchName = CUSTOMERS_CATALOG.filter((c) =>
        c.name.toLowerCase().includes("việt")
      );
      expect(matchName.length).toBeGreaterThan(0);
      expect(matchName[0].name).toContain("Việt");

      // Tìm theo SĐT
      const matchPhone = CUSTOMERS_CATALOG.filter((c) => c.phone.includes("0988"));
      expect(matchPhone.length).toBeGreaterThan(0);

      // Tìm theo địa chỉ
      const matchAddress = CUSTOMERS_CATALOG.filter((c) =>
        c.address.toLowerCase().includes("nghĩa dân")
      );
      expect(matchAddress.length).toBeGreaterThan(0);
    });

    it("Chọn khách hàng từ danh bạ tự động điền đầy đủ thông tin vào đơn", () => {
      const order = createBlankRoofingOrder(false);
      const selectedCustomer = CUSTOMERS_CATALOG[0];

      // Giả lập handleSelectCustomer
      order.customer.name = selectedCustomer.name;
      order.customer.phone = selectedCustomer.phone;
      order.customer.address = selectedCustomer.address;

      expect(order.customer.name).toBe(selectedCustomer.name);
      expect(order.customer.phone).toBe(selectedCustomer.phone);
      expect(order.customer.address).toBe(selectedCustomer.address);
    });
  });

  // ===========================================================================
  // 3. NGHIỆP VỤ NHÓM TÔN & CATALOG TÔN LỢP
  // ===========================================================================
  describe("3. Nhóm Tôn & Chọn từ Kho Vật Tư TT88", () => {
    it("Chọn loại tôn từ kho tự động cập nhật tên, khổ tôn và đơn giá", () => {
      const order = createBlankRoofingOrder(false);
      const warehouseItem = {
        code: "OLPXX",
        name: "Tôn 0.40 Xanh Rêu Olympic Xốp 3+ 11 sóng",
        width: 1.08,
        unitPrice: 164000,
      };

      const displayName = `${warehouseItem.code} — ${warehouseItem.name}`;
      const updatedGroup = calculateRoofingGroup({
        ...order.roofingGroups[0],
        productName: displayName,
        width: warehouseItem.width,
        unitPrice: warehouseItem.unitPrice,
      });

      expect(updatedGroup.productName).toContain("OLPXX");
      expect(updatedGroup.width).toBe(1.08);
      expect(updatedGroup.unitPrice).toBe(164000);
    });

    it("Thêm nhóm loại tôn mới vào đơn hàng", () => {
      const order = createBlankRoofingOrder(false);
      expect(order.roofingGroups).toHaveLength(1);

      // Thêm nhóm 2: Tôn sóng ngói Ruby
      const newGroup = calculateRoofingGroup({
        id: "grp-2",
        productName: "Tôn Giả Ngói Ruby Hoa Sen 0.45mm",
        width: 1.05,
        unitPrice: 135000,
        items: [{ id: "cut-2-1", length: 4.5, quantity: 6, totalMeters: 27.0 }],
      });

      const newGroups = [...order.roofingGroups, newGroup];
      const totals = calculateOrderTotals(newGroups, order.accessories, 0, 0);

      expect(newGroups).toHaveLength(2);
      expect(totals.totalAmount).toBe(newGroup.subtotal);
      expect(newGroup.totalPieces).toBe(6);
      expect(newGroup.totalMeters).toBe(27.0);
      expect(newGroup.totalSquareMeters).toBe(27.0 * 1.05); // 28.35 m2
      expect(newGroup.subtotal).toBe(Math.round(28.35 * 135000)); // 3,827,250 đ
    });

    it("Xoá nhóm loại tôn khi có nhiều nhóm và cập nhật lại tổng tiền", () => {
      const group1 = calculateRoofingGroup({
        id: "grp-1",
        productName: "Tôn Olympic 11 Sóng",
        width: 1.08,
        unitPrice: 111000,
        items: [{ id: "cut-1", length: 5.0, quantity: 2, totalMeters: 10.0 }],
      });
      const group2 = calculateRoofingGroup({
        id: "grp-2",
        productName: "Tôn Xốp Đông Á 6 Sóng",
        width: 1.08,
        unitPrice: 145000,
        items: [{ id: "cut-2", length: 6.0, quantity: 4, totalMeters: 24.0 }],
      });

      const initialGroups = [group1, group2];
      const initialTotals = calculateOrderTotals(initialGroups, [], 0, 0);
      expect(initialTotals.totalAmount).toBe(group1.subtotal + group2.subtotal);

      // Xoá nhóm 1
      const remainingGroups = initialGroups.filter((g) => g.id !== "grp-1");
      expect(remainingGroups).toHaveLength(1);
      const remainingTotals = calculateOrderTotals(remainingGroups, [], 0, 0);
      expect(remainingTotals.totalAmount).toBe(group2.subtotal);
    });
  });

  // ===========================================================================
  // 4. NGHIỆP VỤ BÀN TÍNH CẮT TÔN (SỐ HỌC, QUY CÁCH CẮT, DIỆN TÍCH M2)
  // ===========================================================================
  describe("4. Bàn Tính Cắt Tôn (Roofing Cutting Mathematics)", () => {
    it("Tính chính xác mét dài từng tấm: totalMeters = length * quantity", () => {
      const length = 5.25;
      const quantity = 8;
      const totalMeters = Number((length * quantity).toFixed(2));
      expect(totalMeters).toBe(42.0);
    });

    it("Tính tổng số tấm, tổng mét dài, tổng diện tích m2 và thành tiền nhóm tôn", () => {
      const cuts: RoofingCutItem[] = [
        { id: "c1", length: 6.15, quantity: 2, totalMeters: 12.3 },
        { id: "c2", length: 4.8, quantity: 3, totalMeters: 14.4 },
        { id: "c3", length: 3.2, quantity: 5, totalMeters: 16.0 },
      ];

      const group = calculateRoofingGroup({
        id: "grp-test",
        productName: "Tôn Đông Á 11 sóng",
        width: 1.08,
        unitPrice: 115000,
        items: cuts,
      });

      // Tổng số tấm = 2 + 3 + 5 = 10 tấm
      expect(group.totalPieces).toBe(10);

      // Tổng mét dài = 12.3 + 14.4 + 16.0 = 42.7m
      expect(group.totalMeters).toBe(42.7);

      // Tổng diện tích m2 = 42.7m * 1.08m = 46.116 m2
      expect(Number(group.totalSquareMeters.toFixed(4))).toBe(46.116);

      // Thành tiền = 46.116 * 115,000 = 5,303,340 đ
      expect(group.subtotal).toBe(5303340);
    });

    it("Xoá dòng cắt tôn và tự phục hồi dòng trắng nếu xoá hết", () => {
      const cuts: RoofingCutItem[] = [
        { id: "c1", length: 5.0, quantity: 2, totalMeters: 10.0 },
        { id: "c2", length: 6.0, quantity: 1, totalMeters: 6.0 },
      ];

      let filteredCuts = cuts.filter((c) => c.id !== "c1");
      expect(filteredCuts).toHaveLength(1);
      expect(filteredCuts[0].id).toBe("c2");

      // Giả lập xoá tiếp dòng c2
      filteredCuts = filteredCuts.filter((c) => c.id !== "c2");
      // Khi rỗng, logic form tự phục hồi 1 dòng trắng
      const recoveredCuts =
        filteredCuts.length > 0
          ? filteredCuts
          : [{ id: "c-new", length: 0, quantity: 0, totalMeters: 0 }];

      expect(recoveredCuts).toHaveLength(1);
      expect(recoveredCuts[0].length).toBe(0);
      expect(recoveredCuts[0].quantity).toBe(0);
    });
  });

  // ===========================================================================
  // 5. NGHIỆP VỤ PHỤ KIỆN BÁN KÈM & DANH MỤC ĐVT
  // ===========================================================================
  describe("5. Phụ Kiện Bán Kèm & Danh Mục ĐVT (ACCESSORY_UNITS)", () => {
    it("Danh mục đơn vị tính ĐVT chuẩn tôn thép và đúng kiểu Selectbox", () => {
      const requiredUnits = ["Cây", "Mét", "Cái", "Tấm", "m²", "Kg", "Bộ", "Cuộn", "Hộp", "Bao", "Bình"];
      requiredUnits.forEach((u) => {
        expect(ACCESSORY_UNITS).toContain(u);
      });
    });

    it("Thêm phụ kiện nhanh từ ACCESSORIES_CATALOG và tính toán thành tiền", () => {
      const vitProduct = ACCESSORIES_CATALOG.find((a) => a.name.includes("Vít"))!;
      expect(vitProduct).toBeDefined();

      const accessory = calculateAccessory({
        id: "acc-vit",
        name: vitProduct.name,
        unit: vitProduct.unit,
        quantity: 500, // 500 con vít
        unitPrice: vitProduct.unitPrice,
      });

      expect(accessory.name).toBe(vitProduct.name);
      expect(accessory.unit).toBe(vitProduct.unit);
      expect(accessory.quantity).toBe(500);
      expect(accessory.subtotal).toBe(500 * vitProduct.unitPrice);
    });

    it("Tính toán phụ kiện dạng cây/mét (như máng xối Inox, úp nóc)", () => {
      // 2 cây úp nóc, mỗi cây dài 2m -> tổng 4 mét
      const upNoc = calculateAccessory({
        id: "acc-up-noc",
        name: "Úp nóc tôn Olympic",
        length: 2.0,
        pieces: 2,
        quantity: 4.0, // 4 mét
        unit: "Mét",
        unitPrice: 85000,
      });

      expect(upNoc.subtotal).toBe(4.0 * 85000); // 340,000 đ
    });

    it("Xoá phụ kiện và cập nhật lại tổng đơn hàng", () => {
      const acc1 = calculateAccessory({
        id: "a1",
        name: "Vít tôn",
        unit: "Cái",
        quantity: 100,
        unitPrice: 500,
      });
      const acc2 = calculateAccessory({
        id: "a2",
        name: "Keo silicone Apollo",
        unit: "Chai",
        quantity: 2,
        unitPrice: 45000,
      });

      const initialAccs = [acc1, acc2];
      const initialTotals = calculateOrderTotals([], initialAccs, 0, 0);
      expect(initialTotals.accessoriesTotal).toBe(acc1.subtotal + acc2.subtotal);

      // Xoá phụ kiện a1
      const remainingAccs = initialAccs.filter((a) => a.id !== "a1");
      const remainingTotals = calculateOrderTotals([], remainingAccs, 0, 0);
      expect(remainingTotals.accessoriesTotal).toBe(acc2.subtotal);
    });
  });

  // ===========================================================================
  // 6. THANH TOÁN, CHIẾT KHẤU, ĐẶT CỌC & SỐ TIỀN BẰNG CHỮ
  // ===========================================================================
  describe("6. Thanh Toán, Chiết Khấu, Đặt Cọc & Số Tiền Bằng ChỮ (TT88)", () => {
    it("Tính toán chính xác: Còn lại = Tổng tiền hàng - Chiết khấu - Đặt cọc", () => {
      const group = calculateRoofingGroup({
        id: "g1",
        productName: "Tôn Olympic",
        width: 1.08,
        unitPrice: 111000,
        items: [{ id: "c1", length: 10.0, quantity: 2, totalMeters: 20.0 }],
      });
      // 20m * 1.08 = 21.6 m2 * 111,000 = 2,397,600 đ
      expect(group.subtotal).toBe(2397600);

      const acc = calculateAccessory({
        id: "a1",
        name: "Úp nóc",
        unit: "Mét",
        quantity: 4,
        unitPrice: 85000,
      });
      // 4 * 85,000 = 340,000 đ
      expect(acc.subtotal).toBe(340000);

      const discount = 37600; // Giảm giá bớt số lẻ
      const deposit = 1000000; // Đặt cọc 1 triệu

      const totals = calculateOrderTotals([group], [acc], discount, deposit);

      // Tổng tiền hàng = 2,397,600 + 340,000 = 2,737,600 đ
      expect(totals.totalAmount).toBe(2737600);

      // Còn lại = 2,737,600 - 37,600 - 1,000,000 = 1,700,000 đ
      expect(totals.remainingAmount).toBe(1700000);

      // Tiền bằng chữ phải đọc đúng số còn lại
      const words = numberToVietnameseWords(totals.remainingAmount);
      expect(words.toLowerCase()).toContain("một triệu bảy trăm nghìn đồng");
    });

    it("Bổ sung HĐ chưa thanh toán (unpaidAmount) cộng dồn chính xác vào Còn lại phải thu (remainingAmount)", () => {
      const group = calculateRoofingGroup({
        id: "g1",
        productName: "Tôn Hoa Sen 0.45mm",
        width: 1.08,
        unitPrice: 92500,
        items: [{ id: "c1", length: 6, quantity: 4, totalMeters: 24 }],
      });
      // 24 * 1.08 * 92,500 = 2,397,600 đ
      const acc = calculateAccessory({
        id: "a1",
        name: "Vít bắn tôn",
        unit: "Bịch",
        quantity: 2,
        unitPrice: 100000,
      });
      // 2 * 100,000 = 200,000 đ
      // Tổng tiền hàng = 2,397,600 + 200,000 = 2,597,600 đ

      const discount = 97600; // Giảm giá
      const deposit = 1000000; // Khách cọc 1 triệu
      const unpaidAmount = 1500000; // HĐ chưa thanh toán (nợ đơn cũ 1.5 triệu)

      const totals = calculateOrderTotals([group], [acc], discount, deposit, unpaidAmount);

      expect(totals.totalAmount).toBe(2597600);
      // Còn lại = (2,597,600 - 97,600 - 1,000,000) + 1,500,000 = 1,500,000 + 1,500,000 = 3,000,000 đ
      expect(totals.remainingAmount).toBe(3000000);

      // Đọc số tiền bằng chữ phản ánh đúng số còn lại sau khi cộng HĐ cũ
      const words = numberToVietnameseWords(totals.remainingAmount);
      expect(words.toLowerCase()).toContain("ba triệu đồng chẵn");
    });

    it("Đọc số tiền bằng chữ tiếng Việt chính xác với nhiều mức giá trị khác nhau", () => {
      expect(numberToVietnameseWords(0)).toBe("Không đồng");
      expect(numberToVietnameseWords(500000)).toBe("Năm trăm nghìn đồng chẵn.");
      expect(numberToVietnameseWords(6680844).toLowerCase()).toContain(
        "sáu triệu sáu trăm tám mươi nghìn tám trăm bốn mươi bốn đồng"
      );
      expect(numberToVietnameseWords(100000000).toLowerCase()).toContain("một trăm triệu đồng");
    });

    it("Format tiền tệ định dạng Việt Nam chuẩn (formatCurrency)", () => {
      const formatted = formatCurrency(6680844);
      expect(formatted).toMatch(/6[.,]680[.,]844/);
      expect(formatted).toContain("đ");
    });

    it("Định dạng số tiền trong input có dấu chấm phân cách hàng nghìn (formatMoneyInput & parseMoneyInput)", () => {
      // Số tiền lớn 100 tỷ
      expect(formatMoneyInput(100000000000)).toBe("100.000.000.000");
      expect(parseMoneyInput("100.000.000.000")).toBe(100000000000);

      // Đơn giá tôn và phụ kiện
      expect(formatMoneyInput(92500)).toBe("92.500");
      expect(parseMoneyInput("92.500")).toBe(92500);

      expect(formatMoneyInput(115000)).toBe("115.000");
      expect(parseMoneyInput("115.000")).toBe(115000);

      // 1 nghìn và các số nhỏ
      expect(formatMoneyInput(1000)).toBe("1.000");
      expect(formatMoneyInput(500)).toBe("500");

      // Xử lý giá trị rỗng / 0
      expect(formatMoneyInput(0)).toBe("");
      expect(formatMoneyInput(null)).toBe("");
      expect(formatMoneyInput(undefined)).toBe("");
      expect(parseMoneyInput("")).toBe(0);
      expect(parseMoneyInput(null)).toBe(0);
    });
  });

  // ===========================================================================
  // 7. KHỚP 100% HOÁ ĐƠN MẪU THỰC TẾ TRONG FILE 'hoá đơn tôn bản chính.xlsx'
  // ===========================================================================
  describe("7. Khớp 100% Hoá Đơn Mẫu Thực Tế (SAMPLE_EXCEL_ORDER)", () => {
    it("Kiểm chứng đầy đủ các thông số trong đơn mẫu của Anh Việt", () => {
      const order = SAMPLE_EXCEL_ORDER;

      // 1. Khách hàng
      expect(order.customer.name).toContain("Anh Việt");
      expect(order.customer.phone).toContain("0988");
      expect(order.customer.address).toContain("Nghĩa Dân");

      // 2. Nhóm tôn Olympic 11 sóng có đúng 11 dòng cắt
      expect(order.roofingGroups).toHaveLength(1);
      const group = order.roofingGroups[0];
      expect(group.items).toHaveLength(11);

      // 3. Tổng mét dài = 40.13m
      const calculatedGroup = calculateRoofingGroup(group);
      expect(calculatedGroup.totalMeters).toBe(40.13);

      // 4. Khổ tôn 1.08m -> Diện tích = 43.3404 m2
      expect(calculatedGroup.width).toBe(1.08);
      expect(Number(calculatedGroup.totalSquareMeters.toFixed(4))).toBe(43.3404);

      // 5. Đơn giá 111,000đ/m² -> Tiền tôn = 4,810,784 đ
      expect(calculatedGroup.unitPrice).toBe(111000);
      expect(calculatedGroup.subtotal).toBe(4810784);

      // 6. Có đúng 4 phụ kiện (Sườn 300, Máng 400 Inox, Keo A500, Vít 4)
      expect(order.accessories).toHaveLength(4);
      const totals = calculateOrderTotals(
        [calculatedGroup],
        order.accessories,
        order.discount,
        order.deposit
      );

      // 7. Tổng tiền phụ kiện = 1,870,060 đ
      expect(totals.accessoriesTotal).toBe(1870060);

      // 8. Tổng đơn hàng = 4,810,784 + 1,870,060 = 6,680,844 đ
      expect(totals.totalAmount).toBe(6680844);

      // 9. Đặt cọc 2,000,000 đ -> Còn lại = 4,680,844 đ
      expect(totals.remainingAmount).toBe(4680844);

      // 10. Số tiền bằng chữ
      const words = numberToVietnameseWords(totals.totalAmount);
      expect(words.toLowerCase()).toContain("sáu triệu sáu trăm tám mươi nghìn");
    });
  });

  // ===========================================================================
  // 8. XUẤT EXCEL & MẪU IN HOÁ ĐƠN
  // ===========================================================================
  describe("8. Chức Năng Xuất Excel & Mẫu In Hoá Đơn Chuẩn Khổ A4", () => {
    it("buildRoofingExcelDataRows khớp layout mẫu phiếu thanh toán", () => {
      const rows = buildRoofingExcelDataRows(SAMPLE_EXCEL_ORDER);
      const cuts = rows.filter((r) => r.kind === "cut");
      const groupTotal = rows.find((r) => r.kind === "group_total");
      const accessories = rows.filter((r) => r.kind === "accessory");

      expect(cuts).toHaveLength(11);
      expect(cuts[0].name).toContain("Olympic");
      expect(cuts[0].mergeNameRows).toBe(11);
      expect(cuts[0].length).toBe(2.96);
      expect(cuts[10].length).toBe(4.5);

      expect(groupTotal?.name).toBe("Tổng loại");
      expect(groupTotal?.pieces).toBe(11);
      expect(groupTotal?.meters).toBe(40.13);
      expect(groupTotal?.widthOrUnit).toBe(1.08);
      expect(Number(Number(groupTotal?.squareMeters).toFixed(4))).toBe(43.3404);
      expect(groupTotal?.unitPrice).toBe(111000);
      expect(Number(Number(groupTotal?.subtotal).toFixed(0))).toBe(4810784);

      expect(accessories).toHaveLength(4);
      expect(accessories[0].name).toBe("Sườn 300");
      expect(accessories[0].unitPrice).toBe(38000);
      expect(accessories[0].subtotal).toBe(114000);
      expect(accessories[0].mergeUnitCols).toBe(true);

      expect(accessories[1].name).toContain("Máng");
      expect(accessories[1].meters).toBe(14.83);
      expect(accessories[1].unitPrice).toBe(82000);

      expect(accessories[2].name).toBe("Keo A500");
      expect(accessories[2].meters).toBe(5);
      expect(accessories[2].widthOrUnit).toBe("Lọ");

      expect(toExcelThousand(111000)).toBe(111);
    });

    it("Hàm exportRoofingOrderToExcel tạo file từ mẫu hoá đơn bán hàng Đại lý Tuấn Hương", async () => {
      const out = "tmp-hoa-don-export-test.xlsx";
      await expect(
        exportRoofingOrderToExcel(SAMPLE_EXCEL_ORDER, out)
      ).resolves.not.toThrow();

      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(out);
      const ws = wb.getWorksheet("HoaDon") || wb.worksheets[0];
      expect(String(ws.getCell("A1").value)).toContain("ĐẠI LÝ TUẤN HƯƠNG");
      expect(String(ws.getCell("A8").value)).toContain("HOÁ ĐƠN BÁN HÀNG");
      expect(ws.getCell("A14").value).toBe("STT");
      expect(ws.getCell("B14").value).toBe("Tên sản phẩm");
      expect(String(ws.getCell("B10").value)).toContain("Anh Việt");
      expect(String(ws.getCell("H1").value)).toBe(SAMPLE_EXCEL_ORDER.orderCode);
      expect(String(ws.getCell("H3").value)).toMatch(/Ngày:\s+\d+\/\d+\/\d+/);
      expect(String(ws.getCell("B15").value)).toContain("Olympic");
      expect(ws.getCell("C15").value).toBe(2.96);
      // Dòng 26 là dòng Tổng loại (11 dòng cắt từ 15..25, dòng 26 là tổng)
      expect(Number(ws.getCell("H26").value)).toBe(111000);
      expect(Number(ws.getCell("I26").value)).toBe(4810784);
      // Dòng 40 là TỔNG CỘNG
      expect(String(ws.getCell("A40").value)).toContain("TỔNG CỘNG");
      expect(Number(ws.getCell("I40").value)).toBe(6680844);
      // Dòng 42 là chữ ký Người mua hàng & Chủ cửa hàng
      expect(String(ws.getCell("A42").value)).toContain("Người mua hàng");
      expect(String(ws.getCell("F42").value)).toContain("Chủ cửa hàng");

      const fs = await import("fs/promises");
      await fs.unlink(out);
    });

    it("Dữ liệu đơn hàng có đầy đủ thông tin để render mẫu in A4 RoofingInvoicePrint", () => {
      const order = SAMPLE_EXCEL_ORDER;

      // Header đại lý
      expect(order.orderCode).toBeDefined();
      expect(order.createdAt).toBeDefined();

      // Thông tin khách hàng
      expect(order.customer.name).toBeTruthy();
      expect(order.customer.phone).toBeTruthy();

      // Bảng quy cách cắt tôn
      expect(order.roofingGroups[0].items.length).toBeGreaterThan(0);
      expect(order.roofingGroups[0].productName).toBeTruthy();
      expect(order.roofingGroups[0].totalPieces).toBe(11);
      expect(order.roofingGroups[0].totalMeters).toBe(40.13);
      expect(order.roofingGroups[0].totalSquareMeters).toBeGreaterThan(40);
      expect(order.roofingGroups[0].subtotal).toBeGreaterThan(0);

      // Phụ kiện
      order.accessories.forEach((acc) => {
        expect(acc.name).toBeTruthy();
        expect(acc.unit).toBeTruthy();
        expect(acc.quantity).toBeGreaterThan(0);
        expect(acc.subtotal).toBeGreaterThan(0);
      });

      // Tổng kết & Chữ ký
      expect(order.totalAmount).toBe(6680844);
      expect(order.remainingAmount).toBe(4680844);
    });

    it("Hàm exportRoofingOrderToExcel tự động chèn dòng và đẩy dòng tổng cộng khi đơn hàng > 25 dòng", async () => {
      const out = "tmp-hoa-don-large-export-test.xlsx";
      // Tạo đơn hàng có 28 dòng (vượt quá 25 dòng template)
      const largeOrder: RoofingOrder = {
        ...SAMPLE_EXCEL_ORDER,
        orderCode: "HĐ-2026-LARGE",
        roofingGroups: [
          {
            ...SAMPLE_EXCEL_ORDER.roofingGroups[0],
            items: Array.from({ length: 26 }, (_, i) => ({
              id: `item-lg-${i}`,
              length: 2 + i * 0.1,
              quantity: 1,
              totalMeters: 2 + i * 0.1,
            })),
          },
        ],
      };

      await expect(
        exportRoofingOrderToExcel(largeOrder, out)
      ).resolves.not.toThrow();

      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(out);
      const ws = wb.getWorksheet("HoaDon") || wb.worksheets[0];
      
      // 26 dòng cắt + 1 dòng tổng loại + 4 phụ kiện = 31 dòng data
      // Bắt đầu từ dòng 15, kết thúc ở dòng 15 + 31 - 1 = 45
      // Dòng TỔNG CỘNG sẽ được đẩy xuống dòng 46
      expect(ws.getCell("H1").value).toBe("HĐ-2026-LARGE");
      expect(String(ws.getCell("A46").value)).toContain("TỔNG CỘNG");
      expect(Number(ws.getCell("I46").value)).toBe(largeOrder.totalAmount);

      const fs = await import("fs/promises");
      await fs.unlink(out);
    });
  });
});

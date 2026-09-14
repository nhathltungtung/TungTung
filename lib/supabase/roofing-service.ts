import { createClient } from "./client";
import { RoofingOrder } from "@/types/roofing";
import { SAMPLE_EXCEL_ORDER } from "@/lib/roofing-calc";
import {
  RoofingProductPreset,
  ROOFING_PRODUCTS_CATALOG,
  AccessoryPreset,
  ACCESSORIES_CATALOG,
  normalizeAccessoryUnit,
} from "@/lib/catalogs";
import {
  DbOrderRow,
  mapDbOrderToRoofingOrder,
} from "@/lib/roofing-order-mapper";

export { mapDbOrderToRoofingOrder } from "@/lib/roofing-order-mapper";

const LOCAL_STORAGE_KEY = "roofing_orders";

const ROOFING_ORDER_SELECT = `
  id,
  order_code,
  order_date,
  customer_name,
  customer_phone,
  customer_address,
  total_amount,
  discount,
  deposit,
  remaining_amount,
  status,
  note,
  roofing_order_groups (
    id,
    product_name,
    width,
    unit_price,
    total_pieces,
    total_meters,
    total_square_meters,
    subtotal,
    sort_order,
    roofing_order_cut_items (
      id,
      length,
      quantity,
      total_meters,
      sort_order
    )
  ),
  roofing_order_accessories (
    id,
    name,
    length,
    pieces,
    unit,
    quantity,
    unit_price,
    subtotal,
    sort_order
  )
`;

/**
 * Lưu đơn hàng vào Supabase (với cơ chế Fallback tự động sang LocalStorage khi offline)
 */
export async function saveRoofingOrder(order: RoofingOrder): Promise<{ success: boolean; isCloud: boolean; message: string }> {
  try {
    const supabase = createClient();

    // 1. Chuẩn bị dữ liệu đơn hàng chính (ép kiểu số an toàn, tránh NaN)
    const orderPayload = {
      order_code: order.orderCode,
      customer_name: order.customer.name?.trim() || "Khách lẻ",
      customer_phone: order.customer.phone?.trim() || null,
      customer_address: order.customer.address?.trim() || null,
      order_date: order.createdAt || new Date().toISOString().split("T")[0],
      total_amount: Number(order.totalAmount) || 0,
      discount: Number(order.discount) || 0,
      deposit: Number(order.deposit) || 0,
      remaining_amount: Number(order.remainingAmount) || 0,
      status: order.status || "pending",
      note: order.customer.note?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Upsert bảng roofing_orders theo order_code
    const { data: savedOrder, error: orderError } = await supabase
      .from("roofing_orders")
      .upsert(orderPayload, { onConflict: "order_code" })
      .select("id")
      .single();

    if (orderError || !savedOrder) {
      throw orderError || new Error("Không thể lưu đơn hàng vào CSDL");
    }

    const orderId = savedOrder.id;

    // Xoá dữ liệu cũ của đơn này để ghi đè dữ liệu mới nhất
    await supabase.from("roofing_order_groups").delete().eq("order_id", orderId);
    await supabase.from("roofing_order_accessories").delete().eq("order_id", orderId);

    // 3. Lưu từng nhóm tôn và các tấm cắt lẻ
    for (let gIdx = 0; gIdx < order.roofingGroups.length; gIdx++) {
      const grp = order.roofingGroups[gIdx];
      if (!grp.productName?.trim() && grp.items.every((it) => !it.length && !it.quantity)) {
        continue;
      }

      const { data: savedGroup, error: grpError } = await supabase
        .from("roofing_order_groups")
        .insert({
          order_id: orderId,
          product_name: grp.productName?.trim() || "Tôn Lợp",
          width: Number(grp.width) || 1.08,
          unit_price: Number(grp.unitPrice) || 0,
          total_pieces: Number(grp.totalPieces) || 0,
          total_meters: Number(grp.totalMeters) || 0,
          total_square_meters: Number(grp.totalSquareMeters) || 0,
          subtotal: Number(grp.subtotal) || 0,
          sort_order: gIdx,
        })
        .select("id")
        .single();

      if (grpError || !savedGroup) continue;

      const validCutItems = grp.items.filter((it) => Number(it.length) > 0 || Number(it.quantity) > 0);
      if (validCutItems.length > 0) {
        const cutItemsPayload = validCutItems.map((item, iIdx) => ({
          group_id: savedGroup.id,
          length: Number(item.length) || 0,
          quantity: Number(item.quantity) || 0,
          total_meters: Number(item.totalMeters) || 0,
          sort_order: iIdx,
        }));
        await supabase.from("roofing_order_cut_items").insert(cutItemsPayload);
      }
    }

    // 4. Lưu các phụ kiện (loại bỏ dòng rỗng)
    const validAccessories = order.accessories.filter((a) => a.name && a.name.trim().length > 0);
    if (validAccessories.length > 0) {
      const accessoriesPayload = validAccessories.map((acc, aIdx) => ({
        order_id: orderId,
        name: acc.name.trim(),
        length: acc.length !== undefined && !isNaN(Number(acc.length)) ? Number(acc.length) : null,
        pieces: acc.pieces !== undefined && !isNaN(Number(acc.pieces)) ? Number(acc.pieces) : null,
        unit: acc.unit || "Cây",
        quantity: Number(acc.quantity) || 1,
        unit_price: Number(acc.unitPrice) || 0,
        subtotal: Number(acc.subtotal) || 0,
        sort_order: aIdx,
      }));
      await supabase.from("roofing_order_accessories").insert(accessoriesPayload);
    }

    // Đồng bộ vào localStorage để sẵn sàng chạy offline
    saveToLocalStorage(order);

    return {
      success: true,
      isCloud: true,
      message: `Đã lưu đơn hàng ${order.orderCode} lên Supabase Cloud thành công!`,
    };
  } catch {
    // Fallback: Lưu vào LocalStorage khi Supabase chưa bật Docker hoặc mất mạng
    saveToLocalStorage(order);
    return {
      success: true,
      isCloud: false,
      message: `Đã lưu đơn hàng ${order.orderCode} vào bộ nhớ thiết bị (Offline Mode).`,
    };
  }
}

/**
 * Tải danh sách đơn hàng từ Supabase (fallback sang LocalStorage)
 */
export async function getRoofingOrders(): Promise<RoofingOrder[]> {
  try {
    const supabase = createClient();
    const fetchPromise = supabase
      .from("roofing_orders")
      .select(ROOFING_ORDER_SELECT)
      .order("created_at", { ascending: false });

    // Tăng timeout lên 8 giây để mạng chậm vẫn tải đủ
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Supabase timeout") }), 8000)
    );

    const { data: dbOrders, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error || !dbOrders || dbOrders.length === 0) {
      return getFromLocalStorage();
    }

    return (dbOrders as unknown as DbOrderRow[]).map(mapDbOrderToRoofingOrder);
  } catch {
    return getFromLocalStorage();
  }
}

/**
 * Tải 1 đơn hàng theo id (fallback LocalStorage theo id hoặc orderCode)
 */
export async function getRoofingOrderById(id: string): Promise<RoofingOrder | null> {
  try {
    const supabase = createClient();
    const fetchPromise = supabase
      .from("roofing_orders")
      .select(ROOFING_ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Supabase timeout") }), 8000)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (!error && data) {
      return mapDbOrderToRoofingOrder(data as unknown as DbOrderRow);
    }
  } catch {
    // Fallback offline bên dưới
  }

  const local = getFromLocalStorage();
  return (
    local.find((o) => o.id === id || o.orderCode === id) || null
  );
}

/**
 * Tải danh mục sản phẩm tôn từ CSDL (kho hàng inventory_items + products) và kết hợp với Catalog chuẩn
 * Hỗ trợ tự động nhận diện mã hàng kho (VD: OLPXX, OLPXD, OLPX1L...), đơn giá bán và khổ tôn
 */
export async function getRoofingProducts(): Promise<RoofingProductPreset[]> {
  try {
    const supabase = createClient();
    const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
      setTimeout(() => resolve({ error: new Error("Timeout") }), 1500)
    );

    // 1. Lấy dữ liệu tôn lợp từ bảng inventory_items (kho hàng TT88 thực tế)
    const invPromise = supabase
      .from("inventory_items")
      .select("id, code, name, category, unit, stock_qty, selling_price")
      .order("name");

    // 2. Lấy dữ liệu tôn từ bảng products (danh mục sản phẩm)
    const prodPromise = supabase
      .from("products")
      .select("id, code, name, category, unit, default_width, unit_price, stock_quantity")
      .order("name");

    const [invResult, prodResult] = await Promise.all([
      Promise.race([invPromise, timeoutPromise]),
      Promise.race([prodPromise, timeoutPromise]),
    ]);

    const itemsFromInv = "data" in invResult && invResult.data ? invResult.data : [];
    const itemsFromProd = "data" in prodResult && prodResult.data ? prodResult.data : [];

    const dbProducts: RoofingProductPreset[] = [];
    const seenCodes = new Set<string>();
    const seenNames = new Set<string>();

    // Bộ lọc tôn lợp từ kho hàng
    const isRoofingInventory = (item: any) => {
      const cat = (item.category || "").toLowerCase();
      const unit = (item.unit || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      const code = (item.code || "").toLowerCase();
      return (
        cat === "ton_lop" ||
        cat === "ton" ||
        unit === "m²" ||
        unit === "m2" ||
        name.includes("tôn") ||
        name.includes("ton") ||
        name.includes("olp") ||
        code.includes("olp") ||
        code.includes("ton")
      );
    };

    // Ưu tiên các mặt hàng thuộc category ton_lop trước
    const roofingInvItems = itemsFromInv.filter(isRoofingInventory).sort((a: any, b: any) => {
      if (a.category === "ton_lop" && b.category !== "ton_lop") return -1;
      if (a.category !== "ton_lop" && b.category === "ton_lop") return 1;
      return 0;
    });

    for (const item of roofingInvItems) {
      let code = (item.code || "").trim();
      let name = (item.name || "").trim();
      if (!code && !name) continue;

      // Xử lý trường hợp người dùng nhập nhầm cột Mã và Tên trong kho
      if (code.length > 20 && name.length <= 15 && !name.includes(" ")) {
        const tmp = code;
        code = name;
        name = tmp;
      }

      const codeKey = code ? code.toLowerCase() : "";
      const nameKey = name ? name.toLowerCase() : "";

      if ((codeKey && seenCodes.has(codeKey)) || (nameKey && seenNames.has(nameKey))) {
        continue;
      }
      if (codeKey) seenCodes.add(codeKey);
      if (nameKey) seenNames.add(nameKey);

      const scanText = `${name} ${code}`.toLowerCase();
      let brand: RoofingProductPreset["brand"] = "Khác";
      if (scanText.includes("olympic") || scanText.includes("olp")) brand = "Olympic";
      else if (scanText.includes("hoa sen") || scanText.includes("hoasen")) brand = "Hoa Sen";
      else if (scanText.includes("đông á") || scanText.includes("donga")) brand = "Đông Á";
      else if (scanText.includes("việt nhật") || scanText.includes("vietnhat")) brand = "Việt Nhật";

      let type: RoofingProductPreset["type"] = "1 lớp";
      if (scanText.includes("xốp") || scanText.includes("cách nhiệt") || scanText.includes("xop")) {
        type = "Xốp chống nóng";
      } else if (scanText.includes("ngói") || scanText.includes("ngoi")) {
        type = "Sóng ngói";
      } else if (scanText.includes("6 sóng") || scanText.includes("công nghiệp") || scanText.includes("cong nghiep")) {
        type = "6 sóng CN";
      }

      const thickMatch = scanText.match(/0[.,]\d+/);
      const thickness = thickMatch ? `${thickMatch[0].replace(",", ".")}mm` : "0.40mm";

      dbProducts.push({
        id: item.id || code,
        code: code || item.id,
        name: name,
        brand: brand as any,
        type: type as any,
        thickness: thickness,
        width: 1.08,
        unitPrice: Number(item.selling_price) || 110000,
      });
    }

    // Bổ sung từ bảng products (loại trừ phụ kiện)
    for (const p of itemsFromProd) {
      if (p.category === "phu_kien") continue;

      const code = (p.code || "").trim();
      const name = (p.name || "").trim();
      if (!name) continue;

      const codeKey = code ? code.toLowerCase() : "";
      const nameKey = name ? name.toLowerCase() : "";

      if ((codeKey && seenCodes.has(codeKey)) || (nameKey && seenNames.has(nameKey))) {
        continue;
      }
      if (codeKey) seenCodes.add(codeKey);
      if (nameKey) seenNames.add(nameKey);

      const scanText = `${name} ${code}`.toLowerCase();
      let brand: RoofingProductPreset["brand"] = "Khác";
      if (scanText.includes("olympic") || scanText.includes("olp")) brand = "Olympic";
      else if (scanText.includes("hoa sen") || scanText.includes("hoasen")) brand = "Hoa Sen";
      else if (scanText.includes("đông á") || scanText.includes("donga")) brand = "Đông Á";
      else if (scanText.includes("việt nhật") || scanText.includes("vietnhat")) brand = "Việt Nhật";

      let type: RoofingProductPreset["type"] = "1 lớp";
      if (scanText.includes("xốp") || scanText.includes("cách nhiệt") || scanText.includes("xop")) {
        type = "Xốp chống nóng";
      } else if (scanText.includes("ngói") || scanText.includes("ngoi")) {
        type = "Sóng ngói";
      } else if (scanText.includes("6 sóng") || scanText.includes("công nghiệp")) {
        type = "6 sóng CN";
      }

      const thickMatch = scanText.match(/0[.,]\d+/);
      const thickness = thickMatch ? `${thickMatch[0].replace(",", ".")}mm` : "0.40mm";

      dbProducts.push({
        id: p.id || code,
        code: code || p.id,
        name: name,
        brand: brand as any,
        type: type as any,
        thickness: thickness,
        width: Number(p.default_width) || 1.08,
        unitPrice: Number(p.unit_price) || 110000,
      });
    }

    // Bổ sung các preset từ ROOFING_PRODUCTS_CATALOG nếu chưa có
    for (const preset of ROOFING_PRODUCTS_CATALOG) {
      const codeKey = preset.code ? preset.code.toLowerCase() : "";
      const nameKey = preset.name ? preset.name.toLowerCase() : "";

      if ((codeKey && seenCodes.has(codeKey)) || (nameKey && seenNames.has(nameKey))) {
        continue;
      }
      if (codeKey) seenCodes.add(codeKey);
      if (nameKey) seenNames.add(nameKey);

      dbProducts.push(preset);
    }

    return dbProducts.length > 0 ? dbProducts : ROOFING_PRODUCTS_CATALOG;
  } catch {
    return ROOFING_PRODUCTS_CATALOG;
  }
}

/**
 * Lấy danh sách phụ kiện và vật tư bán kèm từ kho hàng (bảng public.inventory_items và public.products)
 * Đồng bộ mã hàng, tồn kho thực tế, ĐVT và đơn giá bán niêm yết
 */
export async function getWarehouseAccessories(): Promise<AccessoryPreset[]> {
  try {
    const supabase = createClient();
    const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
      setTimeout(() => resolve({ error: new Error("Timeout") }), 1500)
    );

    // 1. Lấy dữ liệu từ bảng inventory_items (kho hàng TT88)
    const invPromise = supabase
      .from("inventory_items")
      .select("id, code, name, category, unit, stock_qty, selling_price")
      .order("name");

    // 2. Lấy thêm phụ kiện từ bảng products (danh mục sản phẩm)
    const prodPromise = supabase
      .from("products")
      .select("id, code, name, category, unit, stock_quantity, unit_price")
      .eq("category", "phu_kien")
      .order("name");

    const [invResult, prodResult] = await Promise.all([
      Promise.race([invPromise, timeoutPromise]),
      Promise.race([prodPromise, timeoutPromise]),
    ]);

    const itemsFromInv = "data" in invResult && invResult.data ? invResult.data : [];
    const itemsFromProd = "data" in prodResult && prodResult.data ? prodResult.data : [];

    const dbAccessories: AccessoryPreset[] = [];
    const seenCodes = new Set<string>();
    const seenNames = new Set<string>();

    // Ưu tiên vật tư từ inventory_items
    for (const item of itemsFromInv) {
      const code = item.code?.trim();
      const name = item.name?.trim();
      if (!name) continue;

      const codeKey = code ? code.toLowerCase() : "";
      const nameKey = name.toLowerCase();

      if ((codeKey && seenCodes.has(codeKey)) || seenNames.has(nameKey)) continue;
      if (codeKey) seenCodes.add(codeKey);
      seenNames.add(nameKey);

      dbAccessories.push({
        id: item.id || code || `inv-${Date.now()}`,
        code: code || undefined,
        name: name,
        unit: normalizeAccessoryUnit(item.unit || "Cây"),
        unitPrice: Number(item.selling_price) || 0,
        category: item.category || "phu_kien",
        stockQty: item.stock_qty != null ? Number(item.stock_qty) : undefined,
        defaultQty: 1,
      });
    }

    // Bổ sung từ products nếu chưa có
    for (const prod of itemsFromProd) {
      const code = prod.code?.trim();
      const name = prod.name?.trim();
      if (!name) continue;

      const codeKey = code ? code.toLowerCase() : "";
      const nameKey = name.toLowerCase();

      if ((codeKey && seenCodes.has(codeKey)) || seenNames.has(nameKey)) continue;
      if (codeKey) seenCodes.add(codeKey);
      seenNames.add(nameKey);

      dbAccessories.push({
        id: prod.id || code || `prod-${Date.now()}`,
        code: code || undefined,
        name: name,
        unit: normalizeAccessoryUnit(prod.unit || "Cây"),
        unitPrice: Number(prod.unit_price) || 0,
        category: "phu_kien",
        stockQty: prod.stock_quantity != null ? Number(prod.stock_quantity) : undefined,
        defaultQty: 1,
      });
    }

    // Hợp nhất với ACCESSORIES_CATALOG dự phòng
    for (const preset of ACCESSORIES_CATALOG) {
      const codeKey = preset.code ? preset.code.toLowerCase() : "";
      const nameKey = preset.name.toLowerCase();
      if ((codeKey && seenCodes.has(codeKey)) || seenNames.has(nameKey)) continue;
      if (codeKey) seenCodes.add(codeKey);
      seenNames.add(nameKey);

      dbAccessories.push(preset);
    }

    return dbAccessories.length > 0 ? dbAccessories : ACCESSORIES_CATALOG;
  } catch {
    return ACCESSORIES_CATALOG;
  }
}

// Helper: Lưu LocalStorage (Export để OrderTableClient dùng được)
export function saveToLocalStorage(order: RoofingOrder) {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const filtered = stored.filter((o: RoofingOrder) => o.id !== order.id && o.orderCode !== order.orderCode);
    filtered.unshift(order);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Lỗi khi lưu localStorage:", e);
  }
}

// Helper: Lấy LocalStorage (Export để OrderTableClient dùng được)
export function getFromLocalStorage(): RoofingOrder[] {
  if (typeof window === "undefined") return [SAMPLE_EXCEL_ORDER];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Lỗi khi đọc localStorage:", e);
  }
  return [SAMPLE_EXCEL_ORDER];
}

const defaultProducts = [
  { id: "1", code: "TON-OLYMPIC-04", name: "Tôn 0,4 Xanh Rêu Olympic 1 lớp 11 sóng", default_width: 1.08, unit_price: 111000 },
  { id: "2", code: "TON-DONGA-045", name: "Tôn 0,45 Xanh Dương Đông Á 11 sóng", default_width: 1.08, unit_price: 115000 },
  { id: "3", code: "TON-HOASEN-04", name: "Tôn 0,4 Đỏ Đậm Hoa Sen 11 sóng", default_width: 1.08, unit_price: 112000 },
  { id: "4", code: "SUON-300", name: "Sườn 300", unit: "md", unit_price: 38000 },
  { id: "5", code: "MANG-400-INOX", name: "Máng 400 Inox 304", unit: "kg", unit_price: 82000 },
  { id: "6", code: "KEO-A500", name: "Keo A500", unit: "lo", unit_price: 48000 },
  { id: "7", code: "VIT-4", name: "Vít 4", unit: "tui", unit_price: 75000 },
];

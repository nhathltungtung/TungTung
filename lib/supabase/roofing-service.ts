import { createClient } from "./client";
import { RoofingOrder } from "@/types/roofing";
import {
  RoofingProductPreset,
  AccessoryPreset,
  CustomerPreset,
  normalizeAccessoryUnit,
} from "@/lib/catalogs";
import { cleanProductName } from "@/lib/roofing-calc";
import {
  DbOrderRow,
  mapDbOrderToRoofingOrder,
} from "@/lib/roofing-order-mapper";

export { mapDbOrderToRoofingOrder } from "@/lib/roofing-order-mapper";

const LOCAL_STORAGE_KEY = "roofing_orders";
const SAMPLE_ORDER_CODE = "HĐ-2026-0832";

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

function isSampleOrder(order: RoofingOrder): boolean {
  return (
    order.orderCode === SAMPLE_ORDER_CODE ||
    order.id === "sample-order-001" ||
    String(order.id || "").startsWith("sample-")
  );
}

/**
 * Lưu đơn hàng vào Supabase (fallback LocalStorage chỉ khi mất mạng — không dùng đơn mẫu)
 */
export async function saveRoofingOrder(order: RoofingOrder): Promise<{
  success: boolean;
  isCloud: boolean;
  message: string;
}> {
  try {
    const supabase = createClient();

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

    const { data: savedOrder, error: orderError } = await supabase
      .from("roofing_orders")
      .upsert(orderPayload, { onConflict: "order_code" })
      .select("id")
      .single();

    if (orderError || !savedOrder) {
      throw orderError || new Error("Không thể lưu đơn hàng vào CSDL");
    }

    const orderId = savedOrder.id;

    await supabase.from("roofing_order_groups").delete().eq("order_id", orderId);
    await supabase.from("roofing_order_accessories").delete().eq("order_id", orderId);

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

      const validCutItems = grp.items.filter(
        (it) => Number(it.length) > 0 || Number(it.quantity) > 0
      );
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

    const validAccessories = order.accessories.filter(
      (a) => a.name && a.name.trim().length > 0
    );
    if (validAccessories.length > 0) {
      const accessoriesPayload = validAccessories.map((acc, aIdx) => ({
        order_id: orderId,
        name: acc.name.trim(),
        length:
          acc.length !== undefined && !isNaN(Number(acc.length))
            ? Number(acc.length)
            : null,
        pieces:
          acc.pieces !== undefined && !isNaN(Number(acc.pieces))
            ? Number(acc.pieces)
            : null,
        unit: acc.unit || "Cây",
        quantity: Number(acc.quantity) || 1,
        unit_price: Number(acc.unitPrice) || 0,
        subtotal: Number(acc.subtotal) || 0,
        sort_order: aIdx,
      }));
      await supabase.from("roofing_order_accessories").insert(accessoriesPayload);
    }

    saveToLocalStorage(order);

    return {
      success: true,
      isCloud: true,
      message: `Đã lưu đơn hàng ${order.orderCode} lên Supabase Cloud thành công!`,
    };
  } catch {
    saveToLocalStorage(order);
    return {
      success: true,
      isCloud: false,
      message: `Đã lưu đơn hàng ${order.orderCode} vào bộ nhớ thiết bị (Offline Mode).`,
    };
  }
}

/**
 * Tải danh sách đơn hàng từ Supabase (chỉ data thật — không inject đơn mẫu)
 */
export async function getRoofingOrders(): Promise<RoofingOrder[]> {
  try {
    const supabase = createClient();
    const { data: dbOrders, error } = await supabase
      .from("roofing_orders")
      .select(ROOFING_ORDER_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getRoofingOrders:", error.message);
      return [];
    }

    return ((dbOrders || []) as unknown as DbOrderRow[]).map(mapDbOrderToRoofingOrder);
  } catch (err) {
    console.error("getRoofingOrders:", err);
    return [];
  }
}

/**
 * Tải 1 đơn hàng theo id từ Supabase
 */
export async function getRoofingOrderById(id: string): Promise<RoofingOrder | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("roofing_orders")
      .select(ROOFING_ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return mapDbOrderToRoofingOrder(data as unknown as DbOrderRow);
    }
  } catch (err) {
    console.error("getRoofingOrderById:", err);
  }
  return null;
}

/**
 * Danh bạ khách hàng thật từ bảng customers
 */
export async function getCustomersDirectory(): Promise<CustomerPreset[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, address, note")
      .order("name", { ascending: true });

    if (error || !data) return [];

    return data.map((c) => ({
      id: c.id,
      name: c.name || "",
      phone: c.phone || "",
      address: c.address || "",
      type: "Thợ thầu" as const,
    }));
  } catch {
    return [];
  }
}

/**
 * Tải loại tôn từ Kho Vật Tư TT88 (inventory_items) — không dùng catalog tĩnh.
 * Ưu tiên category ton_lop; bổ sung dòng ĐVT m² / mã OLP* bị gán nhầm category.
 */
export async function getRoofingProducts(): Promise<RoofingProductPreset[]> {
  try {
    const supabase = createClient();

    const { data: itemsFromInv, error } = await supabase
      .from("inventory_items")
      .select("id, code, name, category, unit, stock_qty, selling_price")
      .order("code", { ascending: true });

    if (error) {
      console.error("getRoofingProducts:", error.message);
      return [];
    }

    const dbProducts: RoofingProductPreset[] = [];
    const seenCodes = new Set<string>();
    const seenNames = new Set<string>();

    const normalizeUnit = (unit: string) =>
      (unit || "")
        .toLowerCase()
        .normalize("NFKC")
        .replace(/\s+/g, "")
        .replace("²", "2");

    const looksLikeSku = (value: string) =>
      /^[A-Za-z0-9][A-Za-z0-9._-]{2,19}$/.test((value || "").trim()) &&
      !/\s/.test((value || "").trim());

    const isRoofingInventory = (item: {
      category?: string | null;
      unit?: string | null;
      name?: string | null;
      code?: string | null;
    }) => {
      const cat = (item.category || "").toLowerCase();
      const unit = normalizeUnit(item.unit || "");
      const name = (item.name || "").toLowerCase();
      const code = (item.code || "").toLowerCase();

      if (cat === "ton_lop" || cat === "ton") return true;
      if (unit === "m2" || unit.includes("m2")) {
        return (
          name.includes("tôn") ||
          name.includes("ton") ||
          name.includes("olp") ||
          code.includes("olp") ||
          code.includes("ton") ||
          looksLikeSku(item.name || "")
        );
      }
      return (
        code.includes("olp") ||
        name.includes("olp") ||
        (looksLikeSku(item.name || "") &&
          (code.includes("tôn") || code.includes("ton") || code.includes("olympic")))
      );
    };

    const roofingInvItems = (itemsFromInv || [])
      .filter(isRoofingInventory)
      .sort((a, b) => {
        if (a.category === "ton_lop" && b.category !== "ton_lop") return -1;
        if (a.category !== "ton_lop" && b.category === "ton_lop") return 1;
        return String(a.code || "").localeCompare(String(b.code || ""), "vi");
      });

    for (const item of roofingInvItems) {
      let code = (item.code || "").trim();
      let name = (item.name || "").trim();
      if (!code && !name) continue;

      // Đảo mã ↔ tên khi nhập nhầm cột trong kho
      if (
        (code.length > 20 && looksLikeSku(name)) ||
        (looksLikeSku(name) && !looksLikeSku(code) && name.length < code.length)
      ) {
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
      if (
        scanText.includes("xốp") ||
        scanText.includes("cách nhiệt") ||
        scanText.includes("xop")
      ) {
        type = "Xốp chống nóng";
      } else if (scanText.includes("ngói") || scanText.includes("ngoi")) {
        type = "Sóng ngói";
      } else if (
        scanText.includes("6 sóng") ||
        scanText.includes("công nghiệp") ||
        scanText.includes("cong nghiep")
      ) {
        type = "6 sóng CN";
      }

      const thickMatch = scanText.match(/0[.,]\d+/);
      const thickness = thickMatch
        ? `${thickMatch[0].replace(",", ".")}mm`
        : "0.40mm";

      dbProducts.push({
        id: item.id || code,
        code: code || item.id,
        name: cleanProductName(name) || name,
        brand,
        type,
        thickness,
        width: 1.08,
        unitPrice: Number(item.selling_price) || 0,
      });
    }

    return dbProducts;
  } catch (err) {
    console.error("getRoofingProducts:", err);
    return [];
  }
}

/**
 * Phụ kiện / vật tư từ kho thật (loại trừ tôn lợp)
 */
export async function getWarehouseAccessories(): Promise<AccessoryPreset[]> {
  try {
    const supabase = createClient();

    const [invResult, prodResult] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("id, code, name, category, unit, stock_qty, selling_price")
        .order("name"),
      supabase
        .from("products")
        .select("id, code, name, category, unit, stock_quantity, unit_price")
        .eq("category", "phu_kien")
        .order("name"),
    ]);

    const itemsFromInv = invResult.data || [];
    const itemsFromProd = prodResult.data || [];

    const dbAccessories: AccessoryPreset[] = [];
    const seenCodes = new Set<string>();
    const seenNames = new Set<string>();

    const isAccessoryItem = (item: {
      category?: string | null;
      unit?: string | null;
      name?: string | null;
      code?: string | null;
    }) => {
      const cat = (item.category || "").toLowerCase();
      if (cat === "ton_lop" || cat === "ton") return false;
      if (cat === "phu_kien" || cat === "vat_tu_khac" || cat === "phu_kien_ton") {
        return true;
      }
      const unit = (item.unit || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      const code = (item.code || "").toLowerCase();
      if (name.includes("tôn") || code.includes("olp") || code.startsWith("ton")) {
        return false;
      }
      return (
        unit.includes("md") ||
        unit.includes("mét") ||
        unit.includes("kg") ||
        unit.includes("lọ") ||
        unit.includes("túi") ||
        unit.includes("cái") ||
        cat === "thep_hop" ||
        cat === "ong_tron" ||
        cat === "nhom"
      );
    };

    for (const item of itemsFromInv) {
      if (!isAccessoryItem(item)) continue;
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
        name: cleanProductName(name) || name,
        unit: normalizeAccessoryUnit(item.unit || "Cây"),
        unitPrice: Number(item.selling_price) || 0,
        category: item.category || "phu_kien",
        stockQty: item.stock_qty != null ? Number(item.stock_qty) : undefined,
        defaultQty: 1,
      });
    }

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
        name: cleanProductName(name) || name,
        unit: normalizeAccessoryUnit(prod.unit || "Cây"),
        unitPrice: Number(prod.unit_price) || 0,
        category: "phu_kien",
        stockQty:
          prod.stock_quantity != null ? Number(prod.stock_quantity) : undefined,
        defaultQty: 1,
      });
    }

    return dbAccessories;
  } catch (err) {
    console.error("getWarehouseAccessories:", err);
    return [];
  }
}

/** Lưu LocalStorage — loại bỏ đơn mẫu giả */
export function saveToLocalStorage(order: RoofingOrder) {
  if (typeof window === "undefined") return;
  if (isSampleOrder(order)) return;
  try {
    const stored = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"
    ) as RoofingOrder[];
    const filtered = stored.filter(
      (o) => o.orderCode !== order.orderCode && !isSampleOrder(o)
    );
    filtered.unshift(order);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/** Đọc offline orders thật (không trả đơn mẫu) */
export function getFromLocalStorage(): RoofingOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as RoofingOrder[];
    const real = parsed.filter((o) => !isSampleOrder(o));
    if (real.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(real));
    }
    return real;
  } catch {
    return [];
  }
}

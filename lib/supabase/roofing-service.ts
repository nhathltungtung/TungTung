import { createClient } from "./client";
import { RoofingOrder, RoofingGroup, AccessoryItem, RoofingOrderStatus } from "@/types/roofing";
import { SAMPLE_EXCEL_ORDER } from "@/lib/roofing-calc";
import {
  RoofingProductPreset,
  ROOFING_PRODUCTS_CATALOG,
  AccessoryPreset,
  ACCESSORIES_CATALOG,
  normalizeAccessoryUnit,
} from "@/lib/catalogs";

interface DbCutItem {
  id: string;
  length: number | string;
  quantity: number | string;
  total_meters: number | string;
  sort_order: number;
}

interface DbGroup {
  id: string;
  product_name: string;
  width: number | string;
  unit_price: number | string;
  total_pieces: number | string;
  total_meters: number | string;
  total_square_meters: number | string;
  subtotal: number | string;
  sort_order: number;
  roofing_order_cut_items?: DbCutItem[];
}

interface DbAccessory {
  id: string;
  name: string;
  length?: number | string;
  pieces?: number | string;
  unit: string;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
  sort_order: number;
}

interface DbOrderRow {
  id: string;
  order_code: string;
  order_date: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  discount?: number | string;
  deposit?: number | string;
  total_amount: number | string;
  remaining_amount: number | string;
  status: RoofingOrderStatus;
  note?: string;
  roofing_order_groups?: DbGroup[];
  roofing_order_accessories?: DbAccessory[];
}

const LOCAL_STORAGE_KEY = "roofing_orders";

/**
 * Lưu đơn hàng vào Supabase (với cơ chế Fallback tự động sang LocalStorage khi offline)
 */
export async function saveRoofingOrder(order: RoofingOrder): Promise<{ success: boolean; isCloud: boolean; message: string }> {
  try {
    const supabase = createClient();

    // 1. Kiểm tra kết nối Supabase với timeout tối đa 600ms
    const pingPromise = supabase.from("roofing_orders").select("id").limit(1);
    const timeoutPromise = new Promise<{ error: Error | null }>((resolve) =>
      setTimeout(() => resolve({ error: new Error("Supabase offline timeout") }), 600)
    );
    const { error: pingError } = await Promise.race([pingPromise, timeoutPromise]);
    if (pingError) {
      throw pingError;
    }

    // 2. Chuẩn bị dữ liệu đơn hàng chính
    const orderPayload = {
      id: order.id.startsWith("order-") || order.id.startsWith("sample-") ? undefined : order.id,
      order_code: order.orderCode,
      customer_name: order.customer.name || "Khách lẻ",
      customer_phone: order.customer.phone || null,
      customer_address: order.customer.address || null,
      order_date: order.createdAt,
      total_amount: order.totalAmount,
      discount: order.discount,
      deposit: order.deposit,
      remaining_amount: order.remainingAmount,
      status: order.status,
      note: order.customer.note || null,
    };

    // Upsert bảng roofing_orders
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
      const { data: savedGroup, error: grpError } = await supabase
        .from("roofing_order_groups")
        .insert({
          order_id: orderId,
          product_name: grp.productName,
          width: grp.width,
          unit_price: grp.unitPrice,
          total_pieces: grp.totalPieces,
          total_meters: grp.totalMeters,
          total_square_meters: grp.totalSquareMeters,
          subtotal: grp.subtotal,
          sort_order: gIdx,
        })
        .select("id")
        .single();

      if (grpError || !savedGroup) continue;

      // Lưu các dòng cắt lẻ của nhóm này
      const cutItemsPayload = grp.items.map((item, iIdx) => ({
        group_id: savedGroup.id,
        length: item.length,
        quantity: item.quantity,
        total_meters: item.totalMeters,
        sort_order: iIdx,
      }));

      if (cutItemsPayload.length > 0) {
        await supabase.from("roofing_order_cut_items").insert(cutItemsPayload);
      }
    }

    // 4. Lưu các phụ kiện
    const accessoriesPayload = order.accessories.map((acc, aIdx) => ({
      order_id: orderId,
      name: acc.name,
      length: acc.length !== undefined ? acc.length : null,
      pieces: acc.pieces !== undefined ? acc.pieces : null,
      unit: acc.unit,
      quantity: acc.quantity,
      unit_price: acc.unitPrice,
      subtotal: acc.subtotal,
      sort_order: aIdx,
    }));

    if (accessoriesPayload.length > 0) {
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
      .select(`
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
      `)
      .order("created_at", { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Supabase offline timeout") }), 600)
    );

    const { data: dbOrders, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error || !dbOrders || dbOrders.length === 0) {
      return getFromLocalStorage();
    }

    // Chuyển đổi dữ liệu DB sang cấu trúc RoofingOrder
    const parsedOrders: RoofingOrder[] = (dbOrders as unknown as DbOrderRow[]).map((row) => {
      const groups: RoofingGroup[] = (row.roofing_order_groups || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((g) => ({
          id: g.id,
          productName: g.product_name,
          width: Number(g.width),
          unitPrice: Number(g.unit_price),
          totalPieces: Number(g.total_pieces),
          totalMeters: Number(g.total_meters),
          totalSquareMeters: Number(g.total_square_meters),
          subtotal: Number(g.subtotal),
          items: (g.roofing_order_cut_items || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((c) => ({
              id: c.id,
              length: Number(c.length),
              quantity: Number(c.quantity),
              totalMeters: Number(c.total_meters),
            })),
        }));

      const accessories: AccessoryItem[] = (row.roofing_order_accessories || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((a) => ({
          id: a.id,
          name: a.name,
          length: a.length ? Number(a.length) : undefined,
          pieces: a.pieces ? Number(a.pieces) : undefined,
          unit: a.unit,
          quantity: Number(a.quantity),
          unitPrice: Number(a.unit_price),
          subtotal: Number(a.subtotal),
        }));

      return {
        id: row.id,
        orderCode: row.order_code,
        createdAt: row.order_date,
        customer: {
          name: row.customer_name,
          phone: row.customer_phone || "",
          address: row.customer_address || "",
          note: row.note || "",
        },
        roofingGroups: groups,
        accessories: accessories,
        discount: Number(row.discount) || 0,
        deposit: Number(row.deposit) || 0,
        totalAmount: Number(row.total_amount) || 0,
        remainingAmount: Number(row.remaining_amount) || 0,
        status: row.status,
      };
    });

    return parsedOrders;
  } catch {
    return getFromLocalStorage();
  }
}

/**
 * Tải danh mục sản phẩm tôn từ CSDL và kết hợp với Catalog chuẩn
 */
export async function getRoofingProducts(): Promise<RoofingProductPreset[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error || !data || data.length === 0) {
      return ROOFING_PRODUCTS_CATALOG;
    }

    const dbProducts: RoofingProductPreset[] = data.map((p) => {
      const brand = p.name.includes("Olympic")
        ? "Olympic"
        : p.name.includes("Hoa Sen")
        ? "Hoa Sen"
        : p.name.includes("Đông Á")
        ? "Đông Á"
        : p.name.includes("Việt Nhật")
        ? "Việt Nhật"
        : "Khác";

      const type = p.name.includes("Xốp")
        ? "Xốp chống nóng"
        : p.name.includes("Ngói")
        ? "Sóng ngói"
        : p.name.includes("6 sóng")
        ? "6 sóng CN"
        : "1 lớp";

      return {
        id: p.id || p.code,
        code: p.code || p.id,
        name: p.name,
        brand: brand as any,
        type: type as any,
        thickness: "0.40mm",
        width: Number(p.default_width) || 1.08,
        unitPrice: Number(p.unit_price) || 110000,
      };
    });

    // Hợp nhất sản phẩm DB và Catalog cố định, loại bỏ trùng code/name
    const codeSet = new Set(dbProducts.map((p) => p.code.toLowerCase()));
    const remainingPresets = ROOFING_PRODUCTS_CATALOG.filter(
      (p) => !codeSet.has(p.code.toLowerCase())
    );

    return [...dbProducts, ...remainingPresets];
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

// Helper: Lưu LocalStorage
function saveToLocalStorage(order: RoofingOrder) {
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

// Helper: Lấy LocalStorage
function getFromLocalStorage(): RoofingOrder[] {
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

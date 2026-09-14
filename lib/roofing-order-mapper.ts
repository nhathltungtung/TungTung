import { RoofingOrder, RoofingGroup, AccessoryItem, RoofingOrderStatus } from "@/types/roofing";

export interface DbCutItem {
  id: string;
  length: number | string;
  quantity: number | string;
  total_meters: number | string;
  sort_order: number;
}

export interface DbGroup {
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

export interface DbAccessory {
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

export interface DbOrderRow {
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

/** Chuyển 1 dòng DB (kèm nested) sang RoofingOrder */
export function mapDbOrderToRoofingOrder(row: DbOrderRow): RoofingOrder {
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
}

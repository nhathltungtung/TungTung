"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  RoofingOrder,
  RoofingCutItem,
  AccessoryItem,
} from "@/types/roofing";
import {
  calculateRoofingGroup,
  calculateAccessory,
  calculateOrderTotals,
  formatCurrency,
  formatNumber,
  numberToVietnameseWords,
  SAMPLE_EXCEL_ORDER,
} from "@/lib/roofing-calc";
import { useRouter } from "next/navigation";
import { exportRoofingOrderToExcel } from "@/lib/roofing-excel";
import {
  saveRoofingOrder,
  getRoofingProducts,
  getWarehouseAccessories,
  saveToLocalStorage,
} from "@/lib/supabase/roofing-service";
import { saveRoofingOrderAction } from "@/app/(admin)/admin/orders/actions";
import { RoofingInvoicePrint } from "./RoofingInvoicePrint";
import {
  RoofingProductPreset,
  ROOFING_PRODUCTS_CATALOG,
  AccessoryPreset,
  ACCESSORIES_CATALOG,
  CUSTOMERS_CATALOG,
  SHARED_UOM_NAMES,
  normalizeAccessoryUnit,
} from "@/lib/catalogs";
import {
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Wrench,
  CheckCircle2,
  Calculator,
  Loader2,
  ChevronDown,
  User,
  Search,
  Package,
  Boxes,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// Danh mục Đơn Vị Tính dùng chung giữa Kho Hàng TT88 và Đơn Cắt Tôn (từ bảng public.units_of_measure)
export const ACCESSORY_UNITS = SHARED_UOM_NAMES;

export function createBlankRoofingOrder(isDynamic = false): RoofingOrder {
  const randomSuffix = isDynamic ? Math.floor(100 + Math.random() * 900) : "001";
  const timestamp = isDynamic ? `${Date.now()}-${Math.random().toString(36).substring(2, 6)}` : "1";

  const blankGroup = calculateRoofingGroup({
    id: `grp-${timestamp}`,
    productName: "",
    width: 1.08,
    unitPrice: 0,
    items: [{ id: `cut-${timestamp}`, length: 0, quantity: 0, totalMeters: 0 }],
  });

  const blankOrder: RoofingOrder = {
    id: `order-${timestamp}`,
    orderCode: `HĐ-2026-${randomSuffix}`,
    createdAt: "2026-09-14",
    customer: {
      name: "",
      phone: "",
      address: "",
      note: "",
    },
    roofingGroups: [blankGroup],
    accessories: [],
    discount: 0,
    deposit: 0,
    totalAmount: 0,
    remainingAmount: 0,
    status: "pending",
  };

  const totals = calculateOrderTotals(blankOrder.roofingGroups, blankOrder.accessories, 0, 0);
  return { ...blankOrder, ...totals };
}

/** Khởi tạo state form: create = đơn trắng; edit = giữ nguyên id/orderCode của đơn có sẵn */
export function initRoofingOrderState(
  mode: "create" | "edit" = "create",
  initialOrder?: RoofingOrder
): RoofingOrder {
  if (mode === "edit" && initialOrder) {
    return {
      ...initialOrder,
      customer: { ...initialOrder.customer },
      roofingGroups: initialOrder.roofingGroups.map((g) => ({
        ...g,
        items: g.items.map((it) => ({ ...it })),
      })),
      accessories: initialOrder.accessories.map((a) => ({ ...a })),
    };
  }
  return createBlankRoofingOrder(false);
}

export type RoofingOrderFormMode = "create" | "edit";

interface RoofingOrderFormProps {
  mode?: RoofingOrderFormMode;
  initialOrder?: RoofingOrder;
}

export function RoofingOrderForm({
  mode = "create",
  initialOrder,
}: RoofingOrderFormProps = {}) {
  const router = useRouter();
  const isEdit = mode === "edit" && !!initialOrder;
  // Trạng thái đơn hàng: Khởi tạo giá trị deterministic để tránh Hydration Mismatch giữa SSR và Client
  const [order, setOrder] = useState<RoofingOrder>(() =>
    initRoofingOrderState(isEdit ? "edit" : "create", initialOrder)
  );

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sinh mã đơn ngẫu nhiên và lấy ngày thực tế của máy người dùng sau khi Hydrate thành công (chỉ khi tạo mới)
  useEffect(() => {
    if (isEdit) return;
    const today = new Date().toISOString().split("T")[0];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setOrder((prev) => ({
      ...prev,
      id: `order-${Date.now()}`,
      orderCode: `HĐ-${new Date().getFullYear()}-${randomNum}`,
      createdAt: today,
    }));
  }, [isEdit]);

  // Trạng thái hiển thị dropdown gợi ý khách hàng & tôn
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [activeProductDropdownGroupId, setActiveProductDropdownGroupId] = useState<string | null>(null);

  // Catalog tôn (khởi tạo từ preset và tự động nạp từ CSDL nếu có)
  // Catalog tôn (khởi tạo từ preset và tự động nạp từ CSDL nếu có)
  const [productCatalog, setProductCatalog] = useState<RoofingProductPreset[]>(ROOFING_PRODUCTS_CATALOG);

  // Catalog phụ kiện kho hàng (nạp động từ Supabase inventory_items & products)
  const [warehouseAccessories, setWarehouseAccessories] = useState<AccessoryPreset[]>(ACCESSORIES_CATALOG);
  const [activeAccessoryDropdownId, setActiveAccessoryDropdownId] = useState<string | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState("");
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    getRoofingProducts().then((products) => {
      if (isMounted && products && products.length > 0) {
        setProductCatalog(products);
      }
    });
    getWarehouseAccessories().then((accessories) => {
      if (isMounted && accessories && accessories.length > 0) {
        setWarehouseAccessories(accessories);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const customerBoxRef = useRef<HTMLDivElement>(null);
  const lengthInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (customerBoxRef.current && !customerBoxRef.current.contains(target)) {
        setShowCustomerDropdown(false);
      }
      if (!target.closest("[data-roofing-dropdown]")) {
        setActiveProductDropdownGroupId(null);
      }
      if (!target.closest("[data-accessory-dropdown]")) {
        setActiveAccessoryDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hỗ trợ phím tắt Ctrl + P để in
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // 1. Cập nhật thông tin khách hàng
  const updateCustomer = (field: keyof typeof order.customer, value: string) => {
    setOrder((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      },
    }));
  };

  // Chọn khách hàng từ danh bạ gợi ý
  const handleSelectCustomer = (customer: (typeof CUSTOMERS_CATALOG)[0]) => {
    updateCustomer("name", customer.name);
    updateCustomer("phone", customer.phone);
    updateCustomer("address", customer.address);
    setShowCustomerDropdown(false);
    toast.success(`Đã chọn khách hàng: ${customer.name}`);
  };

  // Lọc danh bạ khách hàng
  const filteredCustomers = CUSTOMERS_CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.phone.includes(customerSearchQuery) ||
      c.address.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // 2. Cập nhật thông số nhóm tôn (Tên, khổ, đơn giá)
  const updateGroupInfo = (
    groupId: string,
    field: "productName" | "width" | "unitPrice",
    value: string | number
  ) => {
    setOrder((prev) => {
      const newGroups = prev.roofingGroups.map((g) => {
        if (g.id !== groupId) return g;
        return calculateRoofingGroup({
          ...g,
          [field]: value,
        });
      });
      const totals = calculateOrderTotals(newGroups, prev.accessories, prev.discount, prev.deposit);
      return {
        ...prev,
        roofingGroups: newGroups,
        ...totals,
      };
    });
  };

  // Chọn loại tôn từ catalog (Cập nhật đồng thời tên, khổ, giá và tự động tính toán lại diện tích & thành tiền)
  const handleSelectRoofingProduct = (groupId: string, product: RoofingProductPreset) => {
    setOrder((prev) => {
      const newGroups = prev.roofingGroups.map((g) => {
        if (g.id !== groupId) return g;
        return calculateRoofingGroup({
          ...g,
          productName: product.name,
          width: product.width,
          unitPrice: product.unitPrice,
        });
      });
      const totals = calculateOrderTotals(newGroups, prev.accessories, prev.discount, prev.deposit);
      return {
        ...prev,
        roofingGroups: newGroups,
        ...totals,
      };
    });
    setActiveProductDropdownGroupId(null);
    toast.success(`Đã chọn tôn: ${product.name} (Khổ ${product.width}m, giá ${formatCurrency(product.unitPrice)}/m²)`);
  };

  // 3. Cập nhật dòng quy cách cắt
  const updateCutItem = (
    groupId: string,
    itemId: string,
    field: "length" | "quantity",
    value: number
  ) => {
    setOrder((prev) => {
      const newGroups = prev.roofingGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newItems = g.items.map((it) => {
          if (it.id !== itemId) return it;
          return {
            ...it,
            [field]: value,
            totalMeters:
              field === "length"
                ? Number((value * it.quantity).toFixed(2))
                : Number((it.length * value).toFixed(2)),
          };
        });
        return calculateRoofingGroup({
          ...g,
          items: newItems,
        });
      });

      const totals = calculateOrderTotals(newGroups, prev.accessories, prev.discount, prev.deposit);
      return {
        ...prev,
        roofingGroups: newGroups,
        ...totals,
      };
    });
  };

  // 4. Thêm dòng cắt mới
  const addCutItem = (groupId: string, defaultLength?: number) => {
    const newItemId = `cut-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newItem: RoofingCutItem = {
      id: newItemId,
      length: defaultLength || 0,
      quantity: 1,
      totalMeters: defaultLength || 0,
    };

    setOrder((prev) => {
      const newGroups = prev.roofingGroups.map((g) => {
        if (g.id !== groupId) return g;
        return calculateRoofingGroup({
          ...g,
          items: [...g.items, newItem],
        });
      });
      const totals = calculateOrderTotals(newGroups, prev.accessories, prev.discount, prev.deposit);
      return {
        ...prev,
        roofingGroups: newGroups,
        ...totals,
      };
    });

    setTimeout(() => {
      if (lengthInputRefs.current[newItemId]) {
        lengthInputRefs.current[newItemId]?.focus();
        lengthInputRefs.current[newItemId]?.select();
      }
    }, 50);
  };

  // 5. Xoá dòng cắt
  const removeCutItem = (groupId: string, itemId: string) => {
    setOrder((prev) => {
      const newGroups = prev.roofingGroups.map((g) => {
        if (g.id !== groupId) return g;
        const filtered = g.items.filter((it) => it.id !== itemId);
        return calculateRoofingGroup({
          ...g,
          items: filtered.length > 0 ? filtered : [{ id: `cut-${Date.now()}`, length: 0, quantity: 0, totalMeters: 0 }],
        });
      });
      const totals = calculateOrderTotals(newGroups, prev.accessories, prev.discount, prev.deposit);
      return {
        ...prev,
        roofingGroups: newGroups,
        ...totals,
      };
    });
  };

  // 6. Thêm nhóm loại tôn mới
  const addRoofingGroup = () => {
    const newGroup = calculateRoofingGroup({
      id: `grp-${Date.now()}`,
      productName: "",
      width: 1.08,
      unitPrice: 0,
      items: [{ id: `cut-${Date.now()}`, length: 0, quantity: 0, totalMeters: 0 }],
    });

    setOrder((prev) => {
      const newGroups = [...prev.roofingGroups, newGroup];
      const totals = calculateOrderTotals(newGroups, prev.accessories, prev.discount, prev.deposit);
      return {
        ...prev,
        roofingGroups: newGroups,
        ...totals,
      };
    });
    toast.success("Đã thêm nhóm tôn mới!");
  };

  // 7. Cập nhật phụ kiện
  const updateAccessory = (id: string, field: keyof AccessoryItem, value: string | number | undefined) => {
    setOrder((prev) => {
      const newAccessories = prev.accessories.map((a) => {
        if (a.id !== id) return a;
        return calculateAccessory({ ...a, [field]: value });
      });
      const totals = calculateOrderTotals(prev.roofingGroups, newAccessories, prev.discount, prev.deposit);
      return {
        ...prev,
        accessories: newAccessories,
        ...totals,
      };
    });
  };

  // 8. Thêm phụ kiện
  const addAccessory = (presetName?: string, presetUnit?: string, presetPrice?: number) => {
    const newAcc = calculateAccessory({
      id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: presetName || "",
      unit: presetUnit ? normalizeAccessoryUnit(presetUnit) : "Cây",
      quantity: 1,
      unitPrice: presetPrice || 0,
    });

    setOrder((prev) => {
      const newAccessories = [...prev.accessories, newAcc];
      const totals = calculateOrderTotals(prev.roofingGroups, newAccessories, prev.discount, prev.deposit);
      return {
        ...prev,
        accessories: newAccessories,
        ...totals,
      };
    });
  };

  // Chọn phụ kiện từ danh mục kho hàng cho dòng cụ thể
  const handleSelectWarehouseAccessory = (rowId: string, item: AccessoryPreset) => {
    const normalizedUnit = normalizeAccessoryUnit(item.unit);
    setOrder((prev) => {
      const newAccessories = prev.accessories.map((a) => {
        if (a.id !== rowId) return a;
        return calculateAccessory({
          ...a,
          name: item.name,
          unit: normalizedUnit,
          unitPrice: item.unitPrice,
        });
      });
      const totals = calculateOrderTotals(prev.roofingGroups, newAccessories, prev.discount, prev.deposit);
      return {
        ...prev,
        accessories: newAccessories,
        ...totals,
      };
    });
    setActiveAccessoryDropdownId(null);
    toast.success(`Đã chọn: ${item.name} (${formatCurrency(item.unitPrice)}/${normalizedUnit})`);
  };

  // Thêm phụ kiện từ kho hàng trực tiếp vào đơn hàng (từ modal kho hoặc quick chip)
  const handleAddAccessoryFromWarehouse = (item: AccessoryPreset) => {
    const normalizedUnit = normalizeAccessoryUnit(item.unit);
    const newAcc = calculateAccessory({
      id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      unit: normalizedUnit,
      quantity: item.defaultQty || 1,
      unitPrice: item.unitPrice,
    });

    setOrder((prev) => {
      const newAccessories = [...prev.accessories, newAcc];
      const totals = calculateOrderTotals(prev.roofingGroups, newAccessories, prev.discount, prev.deposit);
      return {
        ...prev,
        accessories: newAccessories,
        ...totals,
      };
    });
    toast.success(`Đã thêm từ kho: ${item.name}`);
  };

  // 9. Xoá phụ kiện
  const removeAccessory = (id: string) => {
    setOrder((prev) => {
      const newAccessories = prev.accessories.filter((a) => a.id !== id);
      const totals = calculateOrderTotals(prev.roofingGroups, newAccessories, prev.discount, prev.deposit);
      return {
        ...prev,
        accessories: newAccessories,
        ...totals,
      };
    });
  };

  // 10. Cập nhật chiết khấu & đặt cọc
  const updatePayment = (field: "discount" | "deposit", value: number) => {
    setOrder((prev) => {
      const totals = calculateOrderTotals(
        prev.roofingGroups,
        prev.accessories,
        field === "discount" ? value : prev.discount,
        field === "deposit" ? value : prev.deposit
      );
      return {
        ...prev,
        [field]: value,
        ...totals,
      };
    });
  };

  // Nạp dữ liệu mẫu
  const handleLoadSample = () => {
    setOrder(SAMPLE_EXCEL_ORDER);
    toast.info("Đã tải dữ liệu mẫu từ file hoá đơn tôn bản chính.xlsx (11 dòng cắt tôn + 3 phụ kiện)!");
  };

  // Làm mới đơn (Trang trắng hoàn toàn với mã mới)
  const handleReset = () => {
    setOrder(createBlankRoofingOrder(true));
    toast.success("Đã làm mới form tạo đơn (Trang trắng sạch sẽ)!");
  };

  // Xuất file Excel đúng form mẫu "hoá đơn tôn bản chính.xlsx"
  const handleExportExcel = async () => {
    try {
      await exportRoofingOrderToExcel(order, `Hoa_Don_${order.orderCode || "Ton"}.xlsx`);
      toast.success("Đã xuất file Excel đúng mẫu hoá đơn tôn bản chính!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất file Excel");
    }
  };

  // Lưu đơn hàng: Ưu tiên Server Action lưu trực tiếp vào CSDL Supabase, đồng bộ bộ nhớ thiết bị và chuyển về danh sách đơn
  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      // 1. Thử lưu qua Server Action (Server-side execution với Service Role fallback)
      const res = await saveRoofingOrderAction(order);
      if (res.success) {
        saveToLocalStorage(order);
        toast.success(
          res.message ||
            (isEdit
              ? `Đã cập nhật đơn hàng ${order.orderCode} thành công!`
              : `Đã lưu đơn hàng ${order.orderCode} thành công!`)
        );
        router.push("/admin/orders");
        router.refresh();
        return;
      }

      // 2. Fallback nếu Server Action báo lỗi
      const clientRes = await saveRoofingOrder(order);
      if (clientRes.success) {
        toast.success(clientRes.message);
        router.push("/admin/orders");
        router.refresh();
      } else {
        toast.error(res.error || "Không thể lưu đơn hàng vào CSDL.");
      }
    } catch (err: unknown) {
      console.error("Lỗi khi lưu đơn:", err);
      saveToLocalStorage(order);
      toast.warning(`Đã lưu đơn ${order.orderCode} vào bộ nhớ máy (Offline Mode).`);
      router.push("/admin/orders");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  // Kích hoạt In
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. KHU VỰC FORM NHẬP LIỆU & MODAL (TỰ ĐỘNG ẨN KHI IN ẤN PRINT:HIDDEN) */}
      {/* ========================================================================= */}
      <div className="space-y-6 pb-20 print:hidden">
        {/* Thanh công cụ hành động phía trên */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#24303f] p-4 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              {isEdit
                ? `Sửa Đơn Hàng: ${order.orderCode}`
                : "Tạo Đơn Hàng & Bàn Tính Cắt Tôn"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEdit
                ? "Chỉnh sửa quy cách cắt tôn, phụ kiện, khách hàng và thanh toán — mã đơn được giữ nguyên"
                : "Quy chuẩn theo mẫu file hoá đơn đại lý tôn, hỗ trợ gõ phím nhanh và tự động tính diện tích m²"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Nút Làm Mới / Nạp Mẫu — chỉ khi tạo mới */}
            {!isEdit && (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Xóa sạch dữ liệu để tạo đơn mới từ đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                  Làm Mới (Trang Trắng)
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
                  title="Nạp dữ liệu mẫu 11 dòng cắt tôn của Anh Việt"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Nạp Mẫu File Excel
                </button>
              </>
            )}

            {/* Nút Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Xuất Excel
            </button>

            {/* Nút Xem Trước & In Phiếu */}
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              Xem Trước & In Phiếu
            </button>

            {/* Nút Lưu / Cập nhật Đơn Hàng */}
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#3c50e0] hover:bg-[#3344bd] rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving
                ? "Đang Lưu..."
                : isEdit
                  ? "Cập Nhật Đơn Hàng"
                  : "Lưu Đơn Hàng"}
            </button>
          </div>
        </div>

        {/* 1. THÔNG TIN KHÁCH HÀNG & ĐƠN HÀNG (Grid 4 cột cân đối, nhãn thẳng hàng) */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              1. Thông Tin Khách Hàng / Thợ Thầu
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Mã:{" "}
              <strong suppressHydrationWarning className="font-mono text-slate-800 dark:text-slate-200">
                {order.orderCode}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mã đơn hàng */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Mã Đơn Hàng
              </label>
              <input
                suppressHydrationWarning
                type="text"
                value={order.orderCode}
                readOnly={isEdit}
                disabled={isEdit}
                onChange={(e) => setOrder((prev) => ({ ...prev, orderCode: e.target.value }))}
                title={isEdit ? "Mã đơn được khóa khi sửa để tránh tạo đơn trùng" : undefined}
                className="w-full h-10 px-3 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1a222c] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>

            {/* Ngày lập */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Ngày Lập Đơn
              </label>
              <input
                suppressHydrationWarning
                type="date"
                value={order.createdAt}
                onChange={(e) => setOrder((prev) => ({ ...prev, createdAt: e.target.value }))}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Tên khách hàng (Searchable Combobox: Vừa gõ vừa chọn từ danh bạ) */}
            <div className="relative" ref={customerBoxRef}>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Tên Khách Hàng <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-primary cursor-pointer hover:underline" onClick={() => setShowCustomerDropdown((v) => !v)}>
                  Danh bạ thợ ▾
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Gõ tên khách hoặc chọn danh bạ..."
                  value={order.customer.name}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCustomer("name", val);
                    setCustomerSearchQuery(val);
                    setShowCustomerDropdown(true);
                  }}
                  className="w-full h-10 px-3 pr-8 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomerDropdown((v) => !v)}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Dropdown gợi ý danh bạ thợ thầu */}
              {showCustomerDropdown && (
                <div className="absolute left-0 top-full mt-1 w-full sm:w-80 bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-40 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 sticky top-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm tên, SĐT, địa chỉ thợ..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-800 dark:text-slate-200 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      Không tìm thấy trong danh bạ. Bạn vẫn có thể gõ tên trực tiếp.
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectCustomer(c);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCustomer(c);
                        }}
                        className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {c.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between mt-0.5">
                          <span className="font-mono">{c.phone}</span>
                          <span className="truncate max-w-[140px]">{c.address}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Số Điện Thoại
              </label>
              <input
                type="text"
                placeholder="VD: 0988 123 456"
                value={order.customer.phone}
                onChange={(e) => updateCustomer("phone", e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Địa chỉ giao hàng */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Địa Chỉ Giao Hàng
              </label>
              <input
                type="text"
                placeholder="VD: Công trình tại Nghĩa Dân, Kim Động, Hưng Yên"
                value={order.customer.address}
                onChange={(e) => updateCustomer("address", e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Ghi chú đơn hàng */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Ghi Chú Đơn Hàng
              </label>
              <input
                type="text"
                placeholder="VD: Cắt gấp trước 10h sáng, cán sóng ngói màu xanh rêu..."
                value={order.customer.note || ""}
                onChange={(e) => updateCustomer("note", e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* 2. BÀN TÍNH QUY CÁCH CẮT TÔN (ROOFING DIMENSION GRID - CĂN CHỈNH THẲNG HÀNG 100%) */}
        <div className="space-y-4">
          {order.roofingGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className="bg-white dark:bg-[#24303f] rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Header nhóm tôn */}
              <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wide">
                    Nhóm Tôn #{groupIndex + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {order.roofingGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrder((prev) => {
                          const newGroups = prev.roofingGroups.filter((g) => g.id !== group.id);
                          const totals = calculateOrderTotals(newGroups, prev.accessories, prev.discount, prev.deposit);
                          return { ...prev, roofingGroups: newGroups, ...totals };
                        });
                        toast.success("Đã xoá nhóm tôn!");
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Xoá nhóm tôn này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Hàng thông số nhóm tôn: Tên loại tôn (Searchable Combobox), Khổ, Đơn giá - Căn lề chuẩn mực */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Tên loại tôn & Chủng loại */}
                <div className="sm:col-span-7 relative" data-roofing-dropdown={group.id}>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tên Loại Tôn & Chủng Loại (Gõ nhập hoặc chọn từ Catalog)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Gõ mã hoặc tên loại tôn (VD: TON-OLYMPIC-04, Đông Á, 0.45)..."
                      value={group.productName}
                      onFocus={() => setActiveProductDropdownGroupId(group.id)}
                      onChange={(e) => {
                        updateGroupInfo(group.id, "productName", e.target.value);
                        setActiveProductDropdownGroupId(group.id);
                      }}
                      className="w-full h-9 px-3 pr-8 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveProductDropdownGroupId((curr) => (curr === group.id ? null : group.id));
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dropdown Catalog Tôn */}
                  {activeProductDropdownGroupId === group.id && (
                    <div
                      data-roofing-dropdown={group.id}
                      className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
                    >
                      {(() => {
                        const term = (group.productName || "").trim().toLowerCase();
                        const filtered = productCatalog.filter((p) => {
                          if (!term) return true;
                          return (
                            (p.code && p.code.toLowerCase().includes(term)) ||
                            (p.name && p.name.toLowerCase().includes(term)) ||
                            (p.brand && p.brand.toLowerCase().includes(term)) ||
                            (p.type && p.type.toLowerCase().includes(term)) ||
                            (p.thickness && p.thickness.toLowerCase().includes(term)) ||
                            (p.id && p.id.toLowerCase().includes(term))
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-3 text-xs text-slate-400 text-center">
                              Không tìm thấy loại tôn phù hợp với &ldquo;{group.productName}&rdquo;.
                              <div className="mt-1 text-[11px] text-slate-500">
                                Bạn có thể giữ nguyên tên này để nhập tự do, hoặc thử tìm theo mã/hãng khác.
                              </div>
                            </div>
                          );
                        }

                        return filtered.map((p) => (
                          <div
                            key={p.id || p.code}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectRoofingProduct(group.id, p);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRoofingProduct(group.id, p);
                            }}
                            className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              {p.code && (
                                <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                                  {p.code}
                                </span>
                              )}
                              <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                ({p.brand})
                              </span>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-xs font-mono font-bold text-emerald-600">
                                {formatCurrency(p.unitPrice)}/m²
                              </span>
                              <span className="ml-2 text-[10px] text-slate-400">Khổ {p.width}m</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Khổ tôn (m) */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 text-center">
                    Khổ Tôn (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.08"
                    value={group.width || ""}
                    onChange={(e) => updateGroupInfo(group.id, "width", parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-2 font-mono text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Đơn giá (đ/m²) */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 text-right">
                    Đơn Giá (đ/m²)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="0"
                    value={group.unitPrice || ""}
                    onChange={(e) => updateGroupInfo(group.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 font-mono text-right text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Bảng nhập quy cách cắt tôn (Căn thẳng hàng 100% giữa header và từng ô) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 w-12 text-center">STT</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Tên Quy Cách / Chủng Loại</th>
                      <th className="py-2.5 px-3 w-36 text-right">Chiều Dài (m)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Số Tấm</th>
                      <th className="py-2.5 px-3 w-36 text-right">Mét Dài (m)</th>
                      <th className="py-2.5 px-3 w-14 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {idx === 0 ? (
                            <span className="font-bold text-[#3c50e0]">
                              {group.productName || "(Chưa nhập tên loại tôn)"}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-serif text-base pl-2">&ldquo;</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            ref={(el) => {
                              lengthInputRefs.current[item.id] = el;
                            }}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.length || ""}
                            onChange={(e) =>
                              updateCutItem(group.id, item.id, "length", parseFloat(e.target.value) || 0)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const qtyInput = (e.target as HTMLElement)
                                  .closest("tr")
                                  ?.querySelector<HTMLInputElement>('input[data-field="quantity"]');
                                qtyInput?.focus();
                                qtyInput?.select();
                              }
                            }}
                            className="w-full h-9 px-2.5 text-right font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            data-field="quantity"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              updateCutItem(group.id, item.id, "quantity", parseInt(e.target.value, 10) || 0)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (idx === group.items.length - 1) {
                                  addCutItem(group.id);
                                } else {
                                  const nextItemId = group.items[idx + 1]?.id;
                                  if (nextItemId && lengthInputRefs.current[nextItemId]) {
                                    lengthInputRefs.current[nextItemId]?.focus();
                                    lengthInputRefs.current[nextItemId]?.select();
                                  }
                                }
                              }
                            }}
                            className="w-full h-9 px-2.5 text-right font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200 font-bold">
                          {formatNumber(item.totalMeters, 2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeCutItem(group.id, item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xoá dòng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Hàng tổng kết nhóm tôn (Khớp 100% các cột) */}
                  <tfoot>
                    <tr className="bg-blue-50/80 dark:bg-blue-950/30 font-bold border-t-2 border-blue-200 dark:border-blue-900 text-slate-900 dark:text-white">
                      <td className="py-2 px-3 text-center font-mono text-blue-600">∑</td>
                      <td className="py-2 px-3 text-blue-900 dark:text-blue-300">
                        Tổng loại: {group.productName || "Tôn Lợp"}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">---</td>
                      <td className="py-2 px-3 text-right font-mono text-blue-800 dark:text-blue-400">
                        {group.totalPieces}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-blue-800 dark:text-blue-400 font-extrabold">
                        {formatNumber(group.totalMeters, 2)} m
                      </td>
                      <td className="py-2 px-3"></td>
                    </tr>
                    <tr className="bg-blue-100/60 dark:bg-blue-900/30 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <td colSpan={2} className="py-2 px-3 text-right">
                        Diện tích tính tiền (m²):
                      </td>
                      <td colSpan={2} className="py-2 px-3 text-left font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatNumber(group.totalSquareMeters, 4)} m²
                      </td>
                      <td colSpan={2} className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400 text-sm">
                        Thành tiền: {formatCurrency(group.subtotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Nút thêm dòng cắt */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => addCutItem(group.id)}
                  className="px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Thêm Chiều Dài Cắt (Phím Enter)
                </button>
                <span className="text-[11px] text-slate-400 italic">
                  * Mẹo: Nhấn Enter tại ô Chiều dài để nhảy sang Số tấm, nhấn Enter tại Số tấm để tự thêm dòng mới
                </span>
              </div>
            </div>
          ))}

          {/* Nút thêm nhóm tôn mới */}
          <button
            type="button"
            onClick={addRoofingGroup}
            className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-400 hover:text-primary rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors bg-white/50 dark:bg-slate-800/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Thêm Loại Tôn Khác Vào Đơn Hàng
          </button>
        </div>

        {/* 3. BẢNG PHỤ KIỆN BÁN KÈM (ĐVT LÀ SELECTBOX, INPUT CĂN CHỈNH THẲNG HÀNG) */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              2. Phụ Kiện Bán Kèm (Sườn, Máng Inox, Úp Nóc, Vít, Keo...)
            </h2>

            {/* Nút mở kho hàng & Catalog phụ kiện */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWarehouseModal(true)}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Mở danh sách tra cứu toàn bộ phụ kiện trong kho hàng"
              >
                <Package className="w-4 h-4" />
                📦 Chọn Từ Kho Hàng ({warehouseAccessories.length})
              </button>

              <div className="flex flex-wrap gap-1.5">
                {warehouseAccessories.slice(0, 4).map((acc) => (
                  <button
                    key={acc.id || acc.code}
                    type="button"
                    onClick={() => handleAddAccessoryFromWarehouse(acc)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1"
                    title={`Mã: ${acc.code || 'N/A'} - Tồn kho: ${acc.stockQty != null ? acc.stockQty : 'Sẵn kho'} ${acc.unit}`}
                  >
                    <span>+</span>
                    <span>{acc.name}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">({formatCurrency(acc.unitPrice)})</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => addAccessory()}
                  className="px-3 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  + Dòng Mới
                </button>
              </div>
            </div>
          </div>

          {order.accessories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              Chưa có phụ kiện nào trong đơn. Bấm nút <strong className="text-blue-600">📦 Chọn Từ Kho Hàng</strong> hoặc các nút gợi ý phía trên để thêm nhanh.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 w-12 text-center">STT</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Tên Phụ Kiện / Vật Tư (Chọn từ kho hoặc gõ)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Chiều Dài (m)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Số Cây/Tấm</th>
                    <th className="py-2.5 px-3 w-32 text-right">Số Lượng Tính</th>
                    <th className="py-2.5 px-3 w-28 text-center">ĐVT (Chọn)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Đơn Giá (đ)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Thành Tiền (đ)</th>
                    <th className="py-2.5 px-3 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.accessories.map((acc, idx) => (
                    <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="relative" data-accessory-dropdown>
                          <div className="flex items-center">
                            <input
                              type="text"
                              placeholder="Gõ mã hoặc tên phụ kiện..."
                              value={acc.name}
                              onChange={(e) => {
                                updateAccessory(acc.id, "name", e.target.value);
                                setActiveAccessoryDropdownId(acc.id);
                              }}
                              onFocus={() => setActiveAccessoryDropdownId(acc.id)}
                              className="w-full h-9 px-2.5 pr-8 rounded-lg font-semibold text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setActiveAccessoryDropdownId(
                                  activeAccessoryDropdownId === acc.id ? null : acc.id
                                )
                              }
                              className="absolute right-1.5 p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                              title="Xem danh sách phụ kiện kho"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dropdown gợi ý từ kho */}
                          {activeAccessoryDropdownId === acc.id && (
                            <div className="absolute top-full left-0 mt-1 w-80 max-h-60 overflow-y-auto bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 divide-y divide-slate-100 dark:divide-slate-800">
                              {(() => {
                                const q = (acc.name || "").toLowerCase().trim();
                                const filtered = warehouseAccessories.filter(
                                  (item) =>
                                    !q ||
                                    item.name.toLowerCase().includes(q) ||
                                    (item.code && item.code.toLowerCase().includes(q))
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <div className="p-3 text-center text-xs text-slate-400">
                                      <p>Không có phụ kiện nào khớp &ldquo;{acc.name}&rdquo; trong kho.</p>
                                      <p className="text-[10px] mt-1 text-slate-500">Bạn có thể tiếp tục gõ tên tự do.</p>
                                    </div>
                                  );
                                }

                                return filtered.map((item) => (
                                  <div
                                    key={item.id || item.code}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleSelectWarehouseAccessory(acc.id, item);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectWarehouseAccessory(acc.id, item);
                                    }}
                                    className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors flex justify-between items-center"
                                  >
                                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {item.code && (
                                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                                            {item.code}
                                          </span>
                                        )}
                                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                          {item.name}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                        <span>ĐVT: {normalizeAccessoryUnit(item.unit)}</span>
                                        {item.stockQty != null && (
                                          <span
                                            className={`font-semibold ${
                                              item.stockQty > 10
                                                ? "text-emerald-600"
                                                : item.stockQty > 0
                                                ? "text-amber-600"
                                                : "text-rose-600"
                                            }`}
                                          >
                                            Tồn: {item.stockQty} {normalizeAccessoryUnit(item.unit)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-mono font-bold text-emerald-600">
                                        {formatCurrency(item.unitPrice)}
                                      </span>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={acc.length || ""}
                          onChange={(e) =>
                            updateAccessory(acc.id, "length", parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-9 px-2 text-right font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          placeholder="0"
                          value={acc.pieces || ""}
                          onChange={(e) =>
                            updateAccessory(acc.id, "pieces", parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full h-9 px-2 text-right font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={acc.quantity || ""}
                          onChange={(e) =>
                            updateAccessory(acc.id, "quantity", parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-9 px-2 text-right font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {/* CỘT ĐVT LÀ SELECTBOX THEO QUY CHUẨN */}
                        <select
                          value={acc.unit}
                          onChange={(e) => updateAccessory(acc.id, "unit", e.target.value)}
                          className="w-full h-9 px-1.5 text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-primary"
                        >
                          {ACCESSORY_UNITS.map((u) => (
                            <option key={u} value={u} className="bg-white dark:bg-[#24303f] text-slate-900 dark:text-white">
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="1000"
                          placeholder="0"
                          value={acc.unitPrice || ""}
                          onChange={(e) =>
                            updateAccessory(acc.id, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-9 px-2 text-right font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {formatCurrency(acc.subtotal)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeAccessory(acc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Xoá phụ kiện"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. KHỐI TỔNG KẾT THANH TOÁN (CHIẾT KHẤU, ĐẶT CỌC, CÒN LẠI) */}
        <div className="bg-white dark:bg-[#24303f] p-5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Cột trái: Số tiền bằng chữ */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Số Tiền Bằng Chữ (Tự Động Tạo):
            </span>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 italic">
              &ldquo;{numberToVietnameseWords(order.remainingAmount || order.totalAmount)}&rdquo;
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Tự động hạch toán TT88 & ghi sổ quỹ tiền mặt S1-HKD khi đơn hoàn tất
            </div>
          </div>

          {/* Cột phải: Các số tiền chi tiết */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Tổng tiền hàng:</span>
              <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Chiết khấu / Giảm giá:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="10000"
                  value={order.discount || ""}
                  placeholder="0"
                  onChange={(e) => updatePayment("discount", parseFloat(e.target.value) || 0)}
                  className="w-32 px-2 py-1 text-right font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-rose-600 dark:text-rose-400 font-bold"
                />
                <span className="text-xs text-slate-400">đ</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Khách đã đặt cọc / Trả trước:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="50000"
                  value={order.deposit || ""}
                  placeholder="0"
                  onChange={(e) => updatePayment("deposit", parseFloat(e.target.value) || 0)}
                  className="w-32 px-2 py-1 text-right font-mono text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-emerald-600 dark:text-emerald-400 font-bold"
                />
                <span className="text-xs text-slate-400">đ</span>
              </div>
            </div>

            <div className="border-t-2 border-slate-300 dark:border-slate-700 pt-3 flex justify-between items-center">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                Còn lại phải thu:
              </span>
              <span className="font-mono text-xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(order.remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* MODAL XEM TRƯỚC PHIẾU BÁN HÀNG & QUY CÁCH CẮT TÔN (ẨN KHI IN) */}
        {showPrintModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              {/* Modal Header */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Xem Trước Phiếu Bán Hàng & Quy Cách Cắt Tôn ({order.orderCode})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    In Ngay (Ctrl + P)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {/* Modal Body: Mẫu in thực tế */}
              <div className="p-6 max-h-[75vh] overflow-y-auto bg-slate-200 dark:bg-slate-950">
                <div className="shadow-lg rounded bg-white">
                  <RoofingInvoicePrint order={order} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TRA CỨU & CHỌN PHỤ KIỆN TỪ KHO HÀNG */}
        {showWarehouseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      📦 Danh Sách Phụ Kiện & Vật Tư Từ Kho Hàng
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chọn nhanh phụ kiện để đưa vào đơn hàng cắt tôn (Tự động điền giá bán & ĐVT)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar tìm kiếm & lọc */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã hàng (MANG300, VIT...), tên phụ kiện..."
                    value={warehouseSearchQuery}
                    onChange={(e) => setWarehouseSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a222c] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  {warehouseSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setWarehouseSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setWarehouseCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      warehouseCategoryFilter === "all"
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarehouseCategoryFilter("phu_kien")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      warehouseCategoryFilter === "phu_kien"
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Phụ kiện tôn
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarehouseCategoryFilter("vat_tu_phu")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      warehouseCategoryFilter === "vat_tu_phu"
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Keo & Vít
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarehouseCategoryFilter("vat_tu_khac")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      warehouseCategoryFilter === "vat_tu_khac"
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    Vật tư khác
                  </button>
                </div>
              </div>

              {/* Bảng danh sách vật tư kho */}
              <div className="flex-1 overflow-y-auto p-4">
                {(() => {
                  const filtered = warehouseAccessories.filter((item) => {
                    const matchesQuery =
                      !warehouseSearchQuery ||
                      item.name.toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
                      (item.code && item.code.toLowerCase().includes(warehouseSearchQuery.toLowerCase()));

                    const matchesCategory =
                      warehouseCategoryFilter === "all" ||
                      (warehouseCategoryFilter === "phu_kien" &&
                        (item.category === "phu_kien" || item.category === "phu_kien_ton")) ||
                      (warehouseCategoryFilter === "vat_tu_phu" && item.category === "vat_tu_phu") ||
                      (warehouseCategoryFilter === "vat_tu_khac" && item.category === "vat_tu_khac");

                    return matchesQuery && matchesCategory;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Không tìm thấy phụ kiện / vật tư nào phù hợp với điều kiện tìm kiếm.
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 w-12 text-center">STT</th>
                            <th className="py-2.5 px-3 w-28">Mã Hàng</th>
                            <th className="py-2.5 px-3 min-w-[200px]">Tên Phụ Kiện / Vật Tư</th>
                            <th className="py-2.5 px-3 w-20 text-center">ĐVT</th>
                            <th className="py-2.5 px-3 w-28 text-right">Tồn Kho</th>
                            <th className="py-2.5 px-3 w-32 text-right">Giá Bán</th>
                            <th className="py-2.5 px-3 w-28 text-center">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filtered.map((item, idx) => (
                            <tr
                              key={item.id || item.code}
                              className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                                {item.code || "---"}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                {item.name}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                                  {normalizeAccessoryUnit(item.unit)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {item.stockQty != null ? (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                                      item.stockQty > 10
                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                        : item.stockQty > 0
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                                    }`}
                                  >
                                    {formatNumber(item.stockQty, 0)} {normalizeAccessoryUnit(item.unit)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Sẵn kho</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleAddAccessoryFromWarehouse(item)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1 mx-auto cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  + Thêm
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tổng cộng: <strong>{warehouseAccessories.length}</strong> mặt hàng trong danh mục kho
                </span>
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Xong & Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. VÙNG IN ẤN TRỰC TIẾP QUA TRÌNH DUYỆT (NẰM NGOÀI PRINT:HIDDEN HOÀN TOÀN) */}
      {/* ========================================================================= */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0 print:bg-white print:text-black">
        <RoofingInvoicePrint order={order} />
      </div>
    </>
  );
}

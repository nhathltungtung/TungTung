# Coding Standards & Styling Guidelines

## 1. TypeScript Standards

- **Strict Type Checking**: Do NOT use `any` or loose type casting.
- **Centralized Types**: Store shared entities and data structures in the `types/` directory:
  - `types/<entity>.ts` for specific business domains.
  - Export them in `types/index.ts`.
- **Component Props**: Define explicit TypeScript interfaces for all components:
  ```tsx
  interface UserCardProps {
    user: UserProfile;
    onEdit?: (id: string) => void;
    className?: string;
  }
  ```
- **Form State**: Leverage Zod schema inference (`z.infer<typeof formSchema>`) to maintain type parity between validation and form state.

## 2. Tailwind CSS v4 & Styling

- **TailAdmin Theme Tokens**:
  - Always design for both Light and Dark modes.
  - Cards & Panels:
    - Light: `bg-white border-gray-200 text-gray-900`
    - Dark: `dark:bg-gray-800 dark:border-gray-700/60 dark:text-white`
  - Subtle text: `text-gray-500 dark:text-gray-400`
  - Primary accents: `bg-primary text-white hover:bg-primary/90` or `bg-blue-600 hover:bg-blue-700`
- **Class Merging**: Always use `cn(...)` from `@/lib/utils` for dynamic class names:
  ```tsx
  import { cn } from "@/lib/utils";
  
  <div className={cn("rounded-xl border p-4 transition-colors", isActive && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20", className)} />
  ```
- **No Arbitrary Hardcoding**: Do not use ad-hoc inline styles `style={{ ... }}` unless calculating dynamic coordinates/dimensions that cannot be done with CSS classes.

## 3. UI Primitives & Notifications

- **Toast Feedback**:
  - Use `sonner` via `toast`:
    ```tsx
    import { toast } from "sonner";

    toast.success("Cập nhật dữ liệu thành công!");
    toast.error("Đã xảy ra lỗi khi lưu thông tin.");
    ```
- **Dialogs & Confirmations**:
  - Use `@/components/ui/Modal.tsx` for creation/editing forms.
  - Use `@/components/ui/ConfirmDialog.tsx` before destructive actions (deleting users, dropping items, reset).
  - Use `@/components/ui/Drawer.tsx` for quick side-panel inspection of records.

## 4. Code Formatting & Cleanliness

- Keep components modular: If a file exceeds 300 lines, break it into smaller sub-components (e.g. Header, Form, TableRowActions, FilterBar).
- Remove unused imports, console.log debug statements, and commented-out code before finishing tasks.

## 5. Quy Chuẩn Căn Chỉnh Cột Trong Table (Table Alignment Rules)

Khi định nghĩa cột cho TanStack Table (`columns: ColumnDef<T>[]`), bắt buộc chỉ định quy tắc căn chỉnh trong `meta: { align: "left" | "center" | "right" }`:

| Kiểu Căn Chỉnh | Loại Dữ Liệu Áp Dụng | Lý Do UX / Trực Quan | Ví Dụ |
|---|---|---|---|
| **Căn Trái (`left`)** *(Mặc định)* | Văn bản, Tên, Mô tả, Mã định danh dài | Mắt người đọc từ trái sang phải; giúp dễ đọc lướt và so sánh chuỗi ký tự dài | `name` (Tên SP), `sku` (Mã SKU), `description`, `email` |
| **Căn Giữa (`center`)** | Khối cố định, Ngắn, Huy hiệu (Badge), Ngày tháng, Thao tác | Kích thước ngắn và tương đương nhau; tạo sự đối xứng và cân bằng thị giác | `select` (Checkbox), `stt` (STT), `status` (Trạng thái), `created_at` (Ngày tạo), `actions` (Thao tác) |
| **Căn Phải (`right`)** | Số lượng, Tiền tệ, Giá cả, Phần trăm, Tổng tiền | Các hàng đơn vị, chục, trăm, nghìn... luôn thẳng hàng theo chiều dọc; giúp so sánh độ lớn giá trị ngay lập tức | `price` (Đơn giá VNĐ), `stock` (Tồn kho), `total_amount`, `discount` |

### Quy Chuẩn Ghim Cột Không Bị Hở (Sticky Pinning Precision):
- Bảng phải dùng `table-layout: fixed` (`table-fixed`) với `width: table.getTotalSize()px`.
- Các cột cố định (như `select`: 48px, `stt`: 56px) phải đặt `size = minSize = maxSize`.
- Hiệu ứng đổ bóng (`shadow`) chỉ gắn vào cột ghim cuối cùng bên trái (`isLastPinnedLeft`) hoặc đầu tiên bên phải (`isFirstPinnedRight`), không gắn vào toàn bộ cột ghim để tránh hiện tượng hở viền/đè bóng.


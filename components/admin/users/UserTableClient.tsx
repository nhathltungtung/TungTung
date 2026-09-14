"use client";

import React, { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ManagedUser, UserRole, AccountStatus } from "@/types";
import { DataTable, DataTableColumnHeader } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserFormModal, UserModalMode, roleOptions, departmentOptions, statusOptions } from "./UserFormModal";
import {
  deleteManagedUserAction,
  batchDeleteUsersAction,
  toggleUserStatusAction,
} from "@/app/(admin)/admin/users/actions";
import { toast } from "sonner";
import { formatDateVN } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Edit2,
  Building,
  Phone,
} from "lucide-react";

interface UserTableClientProps {
  initialUsers: ManagedUser[];
  kpiOverview?: React.ReactNode;
}

export function UserTableClient({ initialUsers, kpiOverview }: UserTableClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Local state quản lý danh sách users để cập nhật UI tức thì (Optimistic UI)
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [prevInitialUsers, setPrevInitialUsers] = useState(initialUsers);

  if (initialUsers !== prevInitialUsers) {
    setPrevInitialUsers(initialUsers);
    setUsers(initialUsers);
  }

  // State quản lý Unified Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<ManagedUser | null>(null);
  const [formMode, setFormMode] = useState<UserModalMode>("create");

  // State các ConfirmDialog
  const [userToToggleStatus, setUserToToggleStatus] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [batchDeleteIds, setBatchDeleteIds] = useState<string[]>([]);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);

  // Mở Popup Unified Modal
  const handleOpenCreate = () => {
    setActiveUser(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setActiveUser(user);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleOpenView = (user: ManagedUser) => {
    setActiveUser(user);
    setFormMode("view");
    setIsFormOpen(true);
  };

  // Mở hộp thoại xóa có kiểm tra an toàn
  const handleOpenDelete = (u: ManagedUser) => {
    if (u.email === "admin@tailadmin.dev") {
      toast.error("Không thể xóa tài khoản Quản trị viên chính của hệ thống!");
      return;
    }
    setUserToDelete(u);
  };

  // Xác nhận Khóa / Mở khóa tài khoản
  const handleToggleStatusConfirm = async () => {
    if (!userToToggleStatus) return;
    const targetId = userToToggleStatus.id;
    const newStatus: AccountStatus =
      userToToggleStatus.status === "Active" ? "Suspended" : "Active";

    setIsDeleting(true);
    try {
      const res = await toggleUserStatusAction(targetId, newStatus);
      if (!res.success) {
        toast.error(res.error || "Không thể thay đổi trạng thái tài khoản");
        return;
      }

      toast.success(
        newStatus === "Active"
          ? `Đã mở khóa tài khoản của ${userToToggleStatus.fullName}`
          : `Đã tạm khóa tài khoản của ${userToToggleStatus.fullName}`
      );

      // Cập nhật ngay trên UI client
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, status: newStatus } : u))
      );
      setUserToToggleStatus(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái người dùng");
    } finally {
      setIsDeleting(false);
    }
  };

  // Xác nhận Xóa 1 tài khoản
  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id;
    const targetName = userToDelete.fullName;

    setIsDeleting(true);
    try {
      const res = await deleteManagedUserAction(targetId);
      if (!res.success) {
        toast.error(res.error || "Không thể xóa tài khoản");
        return;
      }

      toast.success(`Đã xóa vĩnh viễn thành viên "${targetName}"!`);
      // Cập nhật tức thì trên UI
      setUsers((prev) => prev.filter((u) => u.id !== targetId));
      setUserToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Lỗi khi xóa người dùng");
    } finally {
      setIsDeleting(false);
    }
  };

  // Xác nhận Xóa nhiều tài khoản (Batch Delete)
  const handleBatchDeleteConfirm = async () => {
    if (!batchDeleteIds.length) return;
    setIsDeleting(true);
    try {
      const res = await batchDeleteUsersAction(batchDeleteIds);
      if (!res.success) {
        toast.error(res.error || "Không thể xóa danh sách tài khoản đã chọn");
        return;
      }

      toast.success(`Đã xóa thành công ${res.deletedCount || batchDeleteIds.length} thành viên!`);
      const deletedSet = new Set(batchDeleteIds);
      // Cập nhật tức thì trên UI
      setUsers((prev) => prev.filter((u) => !deletedSet.has(u.id)));
      setBatchDeleteIds([]);
      setIsBatchDeleteOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Lỗi khi thực hiện xóa hàng loạt");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60">
            <Shield className="w-3.5 h-3.5" /> Quản trị viên
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
            <ShieldCheck className="w-3.5 h-3.5" /> Quản lý
          </span>
        );
      case "user":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <UserIcon className="w-3.5 h-3.5" /> Thành viên
          </span>
        );
    }
  };

  const getStatusBadge = (userStatus: AccountStatus) => {
    return userStatus === "Active" ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Đang hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Đã tạm khóa
      </span>
    );
  };

  // Định nghĩa các cột cho TanStack Table
  const columns: ColumnDef<ManagedUser>[] = [
    // 1. Selection Checkbox Column (Pinned Left)
    {
      id: "select",
      size: 48,
      minSize: 48,
      maxSize: 48,
      enableResizing: false,
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            aria-label="Chọn tất cả"
            className="rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            aria-label="Chọn thành viên"
            className="rounded-md border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "center",
        filterVariant: "none",
      },
    },

    // 2. Index / STT Column (Pinned Left)
    {
      id: "stt",
      size: 56,
      minSize: 56,
      maxSize: 56,
      enableResizing: false,
      header: () => <div className="text-center font-bold text-slate-700 dark:text-slate-200">STT</div>,
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        const pageRowIndex = table.getRowModel().rows.findIndex((r) => r.id === row.id);
        const indexNumber = pageIndex * pageSize + (pageRowIndex >= 0 ? pageRowIndex : 0) + 1;
        return (
          <div className="text-center font-mono text-slate-500 dark:text-slate-400 font-medium">
            {indexNumber}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "center",
        filterVariant: "none",
      },
    },

    // 3. Full Name & Email Column
    {
      accessorKey: "fullName",
      size: 250,
      minSize: 180,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Thành Viên" />
      ),
      cell: ({ row }) => {
        const u = row.original;
        const initials =
          u.fullName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .slice(-2)
            .join("")
            .toUpperCase() || "US";

        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => handleOpenView(u)}
                className="font-semibold text-slate-900 dark:text-white truncate text-left hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer block"
              >
                {u.fullName}
              </button>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {u.email}
              </div>
            </div>
          </div>
        );
      },
      meta: {
        filterVariant: "text",
        filterPlaceholder: "Tìm tên thành viên...",
      },
    },

    // 4. Role Column
    {
      accessorKey: "role",
      size: 150,
      minSize: 130,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Vai Trò" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {getRoleBadge(row.getValue("role"))}
        </div>
      ),
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const rowVal = String(row.getValue(columnId) || "");
        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) return true;
          return filterValue.some((v) => String(v).toLowerCase() === rowVal.toLowerCase());
        }
        return rowVal.toLowerCase() === String(filterValue).toLowerCase();
      },
      meta: {
        align: "center",
        filterVariant: "select",
        filterPlaceholder: "Tất cả vai trò",
        filterOptions: roleOptions,
      },
    },

    // 5. Department Column
    {
      accessorKey: "department",
      size: 220,
      minSize: 160,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Phòng Ban" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Building className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{row.getValue("department")}</span>
        </div>
      ),
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const rowVal = String(row.getValue(columnId) || "");
        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) return true;
          return filterValue.some((v) => String(v).toLowerCase() === rowVal.toLowerCase());
        }
        return rowVal.toLowerCase() === String(filterValue).toLowerCase();
      },
      meta: {
        filterVariant: "select",
        filterPlaceholder: "Tất cả phòng ban",
        filterOptions: departmentOptions,
      },
    },

    // 6. Phone Column
    {
      accessorKey: "phone",
      size: 140,
      minSize: 110,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Số Điện Thoại" />
      ),
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string | undefined;
        return phone ? (
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{phone}</span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-xs italic">-</span>
        );
      },
      meta: {
        filterVariant: "text",
        filterPlaceholder: "Số điện thoại...",
      },
    },

    // 7. Status Column
    {
      accessorKey: "status",
      size: 150,
      minSize: 130,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Trạng Thái" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {getStatusBadge(row.getValue("status"))}
        </div>
      ),
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const rowVal = String(row.getValue(columnId) || "");
        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) return true;
          return filterValue.some((v) => String(v).toLowerCase() === rowVal.toLowerCase());
        }
        return rowVal.toLowerCase() === String(filterValue).toLowerCase();
      },
      meta: {
        align: "center",
        filterVariant: "select",
        filterPlaceholder: "Tất cả trạng thái",
        filterOptions: statusOptions,
      },
    },

    // 8. Join Date Column
    {
      accessorKey: "createdAt",
      size: 130,
      minSize: 110,
      header: ({ column, table }) => (
        <DataTableColumnHeader column={column} table={table} title="Ngày Tham Gia" />
      ),
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">
          {formatDateVN(row.getValue("createdAt"))}
        </div>
      ),
      meta: {
        align: "center",
        filterVariant: "date",
      },
    },

    // 9. Actions Column (Pinned Right)
    {
      id: "actions",
      size: 130,
      minSize: 130,
      maxSize: 130,
      enableResizing: false,
      header: () => (
        <div className="text-center font-bold text-slate-700 dark:text-slate-200">Thao Tác</div>
      ),
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* View Detail Modal */}
            <button
              type="button"
              onClick={() => handleOpenView(u)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#24303f] transition-colors cursor-pointer"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Edit Modal */}
            <button
              type="button"
              onClick={() => handleOpenEdit(u)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-[#24303f] transition-colors cursor-pointer"
              title="Chỉnh sửa thông tin"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Toggle Status Lock / Unlock */}
            <button
              type="button"
              onClick={() => setUserToToggleStatus(u)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                u.status === "Active"
                  ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              }`}
              title={u.status === "Active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
            >
              {u.status === "Active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>

            {/* Delete Account (Trực tiếp, bảo vệ an toàn) */}
            <button
              type="button"
              onClick={() => handleOpenDelete(u)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              title="Xóa tài khoản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        align: "center",
        filterVariant: "none",
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Quản Lý Người Dùng</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý tài khoản thành viên, phân quyền vai trò (RBAC), phòng ban và trạng thái hoạt động trong CSDL
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm thành viên mới</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      {kpiOverview ? <div key="kpi-overview-container">{kpiOverview}</div> : null}

      {/* Main DataTable with Column Filters Activated */}
      <DataTable
        columns={columns}
        data={users}
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên hoặc email thành viên..."
        enableColumnFilters={true}
        enableExport={true}
        exportFileName="danh_sach_thanh_vien"
        batchActions={(selectedRows, resetSelection) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const activeIds = selectedRows
                  .filter((r) => r.status === "Active")
                  .map((r) => r.id);

                if (!activeIds.length) {
                  toast.info("Tất cả các tài khoản đã chọn đều đang bị khóa.");
                  return;
                }

                try {
                  for (const id of activeIds) {
                    await toggleUserStatusAction(id, "Suspended");
                  }
                  toast.success(`Đã tạm khóa ${activeIds.length} tài khoản thành công!`);
                  const lockedSet = new Set(activeIds);
                  setUsers((prev) =>
                    prev.map((u) => (lockedSet.has(u.id) ? { ...u, status: "Suspended" } : u))
                  );
                  resetSelection();
                  startTransition(() => {
                    router.refresh();
                  });
                } catch {
                  toast.error("Lỗi khi khóa hàng loạt tài khoản");
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Khóa đã chọn ({selectedRows.length})</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const lockedIds = selectedRows
                  .filter((r) => r.status === "Suspended")
                  .map((r) => r.id);

                if (!lockedIds.length) {
                  toast.info("Tất cả các tài khoản đã chọn đều đang hoạt động.");
                  return;
                }

                try {
                  for (const id of lockedIds) {
                    await toggleUserStatusAction(id, "Active");
                  }
                  toast.success(`Đã mở khóa ${lockedIds.length} tài khoản thành công!`);
                  const activeSet = new Set(lockedIds);
                  setUsers((prev) =>
                    prev.map((u) => (activeSet.has(u.id) ? { ...u, status: "Active" } : u))
                  );
                  resetSelection();
                  startTransition(() => {
                    router.refresh();
                  });
                } catch {
                  toast.error("Lỗi khi mở khóa hàng loạt tài khoản");
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở khóa ({selectedRows.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBatchDeleteIds(selectedRows.map((r) => r.id));
                setIsBatchDeleteOpen(true);
                resetSelection();
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đã chọn</span>
            </button>
          </div>
        )}
        onRowClick={(user) => handleOpenView(user)}
      />

      {/* Unified Modal: Create, Edit, View Thành Viên (Chung 1 popup, các cột chia đều 50-50) */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={activeUser}
        mode={formMode}
        onSuccess={(updatedUser) => {
          if (updatedUser) {
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === updatedUser.id);
              if (exists) {
                return prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
              }
              return [updatedUser, ...prev];
            });
          }
          startTransition(() => {
            router.refresh();
          });
        }}
      />

      {/* Confirm Lock/Unlock Status Dialog */}
      <ConfirmDialog
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={handleToggleStatusConfirm}
        title={
          userToToggleStatus?.status === "Active"
            ? "Xác nhận khóa tài khoản?"
            : "Xác nhận mở khóa tài khoản?"
        }
        description={
          userToToggleStatus?.status === "Active"
            ? `Tài khoản ${userToToggleStatus?.fullName} sẽ bị tạm khóa và không thể truy cập vào hệ thống.`
            : `Tài khoản ${userToToggleStatus?.fullName} sẽ được kích hoạt lại trạng thái hoạt động bình thường.`
        }
        confirmText={userToToggleStatus?.status === "Active" ? "Khóa tài khoản" : "Mở khóa ngay"}
        cancelText="Hủy bỏ"
        variant={userToToggleStatus?.status === "Active" ? "danger" : "info"}
        isLoading={isDeleting}
      />

      {/* Confirm Single Delete Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUserConfirm}
        title="Xóa vĩnh viễn thành viên?"
        description={`Bạn có chắc chắn muốn xóa thành viên "${userToDelete?.fullName}" (${userToDelete?.email})? Hành động này sẽ xóa dữ liệu trên hệ thống và không thể hoàn tác.`}
        confirmText="Xóa thành viên"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Confirm Batch Delete Dialog */}
      <ConfirmDialog
        isOpen={isBatchDeleteOpen}
        onClose={() => setIsBatchDeleteOpen(false)}
        onConfirm={handleBatchDeleteConfirm}
        title={`Xóa hàng loạt ${batchDeleteIds.length} thành viên?`}
        description={`Hành động này sẽ xóa vĩnh viễn ${batchDeleteIds.length} tài khoản thành viên đã chọn. Bạn có chắc chắn muốn tiếp tục?`}
        confirmText="Xóa tất cả đã chọn"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

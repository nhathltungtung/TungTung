"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table/DataTable";
import { DataTableColumnHeader } from "@/components/ui/table/DataTableColumnHeader";
import { toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FileUploader } from "@/components/ui/FileUploader";
import { RoleGate } from "@/components/auth/RoleGate";
import { Input, PasswordInput, Select } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/form/Checkbox";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Building,
  Calendar,
} from "lucide-react";

export type UserRole = "admin" | "manager" | "user";
export type AccountStatus = "Active" | "Suspended";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  department: string;
  avatarUrl?: string;
  createdAt: string;
}

const initialUsers: ManagedUser[] = [
  {
    id: "USR-001",
    fullName: "Nguyễn Văn Admin",
    email: "admin@tailadmin.dev",
    role: "admin",
    status: "Active",
    department: "Ban Điều Hành (Executive)",
    createdAt: "2026-01-10",
  },
  {
    id: "USR-002",
    fullName: "Trần Minh Quang",
    email: "quang.tm@tailadmin.dev",
    role: "manager",
    status: "Active",
    department: "Phòng Kỹ Thuật (Engineering)",
    createdAt: "2026-02-15",
  },
  {
    id: "USR-003",
    fullName: "Lê Hoàng Yến",
    email: "yen.lh@tailadmin.dev",
    role: "manager",
    status: "Active",
    department: "Phòng Sản Phẩm (Product)",
    createdAt: "2026-03-01",
  },
  {
    id: "USR-004",
    fullName: "Phạm Hải Đăng",
    email: "dang.ph@tailadmin.dev",
    role: "user",
    status: "Active",
    department: "Phòng Thiết Kế (UI/UX)",
    createdAt: "2026-04-12",
  },
  {
    id: "USR-005",
    fullName: "Vũ Bích Hạnh",
    email: "hanh.vb@tailadmin.dev",
    role: "user",
    status: "Suspended",
    department: "Phòng Hỗ Trợ (Customer Success)",
    createdAt: "2026-05-20",
  },
  {
    id: "USR-006",
    fullName: "Đỗ Quốc Cường",
    email: "cuong.dq@tailadmin.dev",
    role: "user",
    status: "Active",
    department: "Phòng Kinh Doanh (Sales)",
    createdAt: "2026-06-18",
  },
  {
    id: "USR-007",
    fullName: "Ngô Mỹ Linh",
    email: "linh.nm@tailadmin.dev",
    role: "user",
    status: "Active",
    department: "Phòng Marketing",
    createdAt: "2026-07-02",
  },
  {
    id: "USR-008",
    fullName: "Bùi Gia Khiêm",
    email: "khiem.bg@tailadmin.dev",
    role: "manager",
    status: "Active",
    department: "Phòng Tài Chính & Kế Toán",
    createdAt: "2026-08-11",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  // New User Form State
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newDepartment, setNewDepartment] = useState("Phòng Kỹ Thuật (Engineering)");
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | undefined>(undefined);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Shield className="w-3 h-3" /> Manager
          </span>
        );
      case "user":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            User
          </span>
        );
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    return status === "Active" ? (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Đang hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Đã khóa
      </span>
    );
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    const newUser: ManagedUser = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      fullName: newFullName,
      email: newEmail,
      role: newRole,
      status: "Active",
      department: newDepartment,
      avatarUrl: uploadedAvatarUrl,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers([newUser, ...users]);
    toast.success("Thêm thành viên mới thành công!", {
      description: `Đã khởi tạo tài khoản cho ${newUser.fullName} (${newUser.email}).`,
    });

    // Reset Form
    setNewFullName("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    setUploadedAvatarUrl(undefined);
    setIsAddModalOpen(false);
  };

  const handleToggleStatusConfirm = () => {
    if (!userToToggleStatus) return;
    const newStatus: AccountStatus =
      userToToggleStatus.status === "Active" ? "Suspended" : "Active";

    setUsers((prev) =>
      prev.map((u) => (u.id === userToToggleStatus.id ? { ...u, status: newStatus } : u))
    );

    toast.success(
      newStatus === "Active"
        ? `Đã mở khóa tài khoản của ${userToToggleStatus.fullName}`
        : `Đã tạm khóa tài khoản của ${userToToggleStatus.fullName}`
    );
    setUserToToggleStatus(null);
  };

  const handleDeleteUserConfirm = () => {
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    toast.success(`Đã xóa vĩnh viễn người dùng ${userToDelete.fullName}!`);
    setUserToDelete(null);
  };

  // Columns Definition
  const columns: ColumnDef<ManagedUser>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Chọn tất cả người dùng"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          aria-label="Chọn người dùng này"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "fullName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Thành Viên" />,
      cell: ({ row }) => {
        const user = row.original;
        const initials = user.fullName
          .split(" ")
          .map((n) => n[0])
          .slice(-2)
          .join("");

        return (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#2e3a47]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
                {initials}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                {user.fullName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vai Trò (Role)" />,
      cell: ({ row }) => getRoleBadge(row.getValue("role")),
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phòng Ban" />,
      cell: ({ row }) => (
        <span className="text-slate-700 dark:text-slate-300">{row.getValue("department")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng Thái" />,
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày Tham Gia" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {row.getValue("createdAt")}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Thao Tác</span>,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedUser(u)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#24303f] transition-colors"
              title="Xem hồ sơ chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setUserToToggleStatus(u)}
              className={`p-1.5 rounded-lg transition-colors ${
                u.status === "Active"
                  ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              }`}
              title={u.status === "Active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
            >
              {u.status === "Active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>

            <RoleGate allowedRoles={["admin"]}>
              <button
                type="button"
                onClick={() => setUserToDelete(u)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                title="Xóa người dùng (Admin only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </RoleGate>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>Quản trị</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400">Người dùng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Quản Lý Thành Viên Hệ Thống
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh sách tài khoản, phân quyền vai trò (RBAC), kích hoạt / khóa tài khoản và quản lý hồ sơ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Thành Viên Mới</span>
        </button>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={users}
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên hoặc email thành viên..."
        filterColumn="role"
        filterTitle="Vai trò"
        filterOptions={[
          { label: "Admin (Quản trị viên)", value: "admin" },
          { label: "Manager (Quản lý)", value: "manager" },
          { label: "User (Nhân viên)", value: "user" },
        ]}
        exportFileName="Danh_sach_thanh_vien_TailAdmin"
        batchActions={(selected, reset) => (
          <>
            <button
              type="button"
              onClick={() => {
                const ids = new Set(selected.map((u) => u.id));
                setUsers((prev) =>
                  prev.map((u) => (ids.has(u.id) ? { ...u, status: "Suspended" } : u))
                );
                toast.success(`Đã khóa ${selected.length} tài khoản thành công!`);
                reset();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Khóa đã chọn ({selected.length})</span>
            </button>

            <RoleGate allowedRoles={["admin"]}>
              <button
                type="button"
                onClick={() => {
                  const ids = new Set(selected.map((u) => u.id));
                  setUsers((prev) => prev.filter((u) => !ids.has(u.id)));
                  toast.success(`Đã xóa ${selected.length} người dùng đã chọn!`);
                  reset();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa đã chọn</span>
              </button>
            </RoleGate>
          </>
        )}
        onRowClick={(user) => setSelectedUser(user)}
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Thành Viên Mới"
        description="Điền thông tin tài khoản và phân quyền vai trò cho thành viên mới."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và Tên"
              placeholder="VD: Nguyễn Văn Hoàng"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              required
            />
            <Input
              label="Địa chỉ Email"
              type="email"
              placeholder="hoang.nguyen@company.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              label="Mật Khẩu Khởi Tạo"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Select
              label="Vai Trò / Phân Quyền"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              options={[
                { value: "admin", label: "Admin (Toàn quyền quản trị)" },
                { value: "manager", label: "Manager (Quản lý dự án / duyệt đơn)" },
                { value: "user", label: "User (Nhân viên thông thường)" },
              ]}
            />
          </div>

          <Select
            label="Phòng Ban Phụ Trách"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            options={[
              { value: "Ban Điều Hành (Executive)", label: "Ban Điều Hành (Executive)" },
              { value: "Phòng Kỹ Thuật (Engineering)", label: "Phòng Kỹ Thuật (Engineering)" },
              { value: "Phòng Sản Phẩm (Product)", label: "Phòng Sản Phẩm (Product)" },
              { value: "Phòng Thiết Kế (UI/UX)", label: "Phòng Thiết Kế (UI/UX)" },
              { value: "Phòng Kinh Doanh (Sales)", label: "Phòng Kinh Doanh (Sales)" },
              { value: "Phòng Marketing", label: "Phòng Marketing" },
            ]}
          />

          <FileUploader
            label="Ảnh Đại Diện (Avatar)"
            onFileSelect={(_, fileUrl) => setUploadedAvatarUrl(fileUrl)}
          />

          <div className="pt-4 border-t border-slate-100 dark:border-[#2e3a47] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2e3a47] text-slate-700 dark:text-slate-200 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              Tạo Tài Khoản
            </button>
          </div>
        </form>
      </Modal>

      {/* User Detail Drawer */}
      <Drawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Hồ Sơ Thành Viên"
        description={selectedUser ? `Mã định danh: ${selectedUser.id}` : ""}
        width="md"
        footer={
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#24303f] hover:bg-slate-200 dark:hover:bg-[#2e3a47] text-xs font-semibold text-slate-800 dark:text-white transition-colors"
          >
            Đóng Bảng Trượt
          </button>
        }
      >
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#24303f] border border-slate-100 dark:border-[#2e3a47]">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                {selectedUser.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedUser.fullName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.status)}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" /> Phòng Ban:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUser.department}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Ngày Đăng Ký:
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedUser.createdAt}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Toggle Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={handleToggleStatusConfirm}
        title={
          userToToggleStatus?.status === "Active"
            ? `Tạm Khóa Tài Khoản "${userToToggleStatus?.fullName}"?`
            : `Mở Khóa Tài Khoản "${userToToggleStatus?.fullName}"?`
        }
        description={
          userToToggleStatus?.status === "Active"
            ? "Người dùng này sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa trở lại."
            : "Người dùng sẽ có thể truy cập lại bình thường theo đúng vai trò được phân quyền."
        }
        confirmText={userToToggleStatus?.status === "Active" ? "Xác Nhận Khóa" : "Xác Nhận Mở"}
        cancelText="Hủy Bỏ"
        variant={userToToggleStatus?.status === "Active" ? "warning" : "info"}
      />

      {/* Delete User Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUserConfirm}
        title={`Xác Nhận Xóa Vĩnh Viễn "${userToDelete?.fullName}"?`}
        description="Hành động này sẽ xóa toàn bộ dữ liệu hồ sơ của người dùng khỏi cơ sở dữ liệu và không thể khôi phục."
        confirmText="Xóa Người Dùng"
        cancelText="Hủy Bỏ"
        variant="danger"
      />
    </div>
  );
}

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUserSchema,
  updateUserSchema,
} from "@/app/(admin)/admin/users/schemas";
import {
  deleteManagedUserAction,
  batchDeleteUsersAction,
} from "@/app/(admin)/admin/users/actions";

// Mock Supabase Server & Admin client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("User Schemas & Server Actions Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUserSchema validation", () => {
    it("should validate valid user payload successfully", () => {
      const validPayload = {
        fullName: "Nguyễn Văn An",
        email: "an.nv@company.dev",
        password: "securePassword123",
        role: "user" as const,
        department: "Phòng Kỹ Thuật (Engineering)",
        status: "Active" as const,
        phone: "0901234567",
      };

      const result = createUserSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe("Nguyễn Văn An");
        expect(result.data.email).toBe("an.nv@company.dev");
        expect(result.data.role).toBe("user");
      }
    });

    it("should reject payload if fullName is less than 2 characters", () => {
      const invalidPayload = {
        fullName: "A",
        email: "an.nv@company.dev",
        password: "securePassword123",
        role: "user",
        department: "Phòng Kỹ Thuật (Engineering)",
      };

      const result = createUserSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Họ và tên tối thiểu 2 ký tự");
      }
    });

    it("should reject invalid email format", () => {
      const invalidPayload = {
        fullName: "Nguyễn Văn An",
        email: "not-an-email",
        password: "securePassword123",
        role: "user",
        department: "Phòng Kỹ Thuật (Engineering)",
      };

      const result = createUserSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Địa chỉ email không hợp lệ");
      }
    });

    it("should reject password less than 6 characters", () => {
      const invalidPayload = {
        fullName: "Nguyễn Văn An",
        email: "an.nv@company.dev",
        password: "123",
        role: "user",
        department: "Phòng Kỹ Thuật (Engineering)",
      };

      const result = createUserSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Mật khẩu ban đầu tối thiểu 6 ký tự");
      }
    });

    it("should reject invalid role enum", () => {
      const invalidPayload = {
        fullName: "Nguyễn Văn An",
        email: "an.nv@company.dev",
        password: "securePassword123",
        role: "super_root",
        department: "Phòng Kỹ Thuật (Engineering)",
      };

      const result = createUserSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserSchema validation", () => {
    it("should validate update payload without password", () => {
      const updatePayload = {
        fullName: "Trần Thị Bình",
        email: "binh.tt@company.dev",
        role: "manager" as const,
        department: "Phòng Sản Phẩm (Product)",
        status: "Active" as const,
      };

      const result = updateUserSchema.safeParse(updatePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("manager");
      }
    });

    it("should allow update payload when email is omitted (readOnly in edit mode)", () => {
      const updatePayload = {
        fullName: "Trần Thị Bình",
        role: "manager" as const,
        department: "Phòng Sản Phẩm (Product)",
        status: "Active" as const,
      };

      const result = updateUserSchema.safeParse(updatePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeUndefined();
      }
    });
  });

  describe("Self-Delete Prevention Logic", () => {
    it("should prevent a logged-in user from deleting their own account", async () => {
      const { createClient } = await import("@/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "admin@tailadmin.dev" },
            },
          }),
        },
        from: vi.fn(),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);

      const result = await deleteManagedUserAction("user-123");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Bạn không thể tự xóa tài khoản của chính mình!");
    });

    it("should filter out self ID when performing batch delete", async () => {
      const { createClient } = await import("@/lib/supabase/server");

      const mockDelete = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "admin@tailadmin.dev" },
            },
          }),
        },
        from: vi.fn().mockReturnValue({
          delete: mockDelete,
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);

      // Danh sách gồm user-123 (chính mình) và 2 user khác
      const result = await batchDeleteUsersAction(["user-123", "user-456", "user-789"]);
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
    });

    it("should return error if batch delete only contains self ID", async () => {
      const { createClient } = await import("@/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "admin@tailadmin.dev" },
            },
          }),
        },
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);

      const result = await batchDeleteUsersAction(["user-123"]);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Không thể xóa tài khoản của chính bạn trong danh sách chọn.");
    });
  });
});

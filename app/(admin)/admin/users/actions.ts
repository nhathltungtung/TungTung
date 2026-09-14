"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { AccountStatus } from "@/types";
import { logActivity } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth-guard";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "./schemas";

export type { CreateUserInput, UpdateUserInput };

function getAdminClientSafe() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Thêm mới tài khoản thành viên (Tạo trên Supabase Auth + Profile)
 */
export async function createManagedUserAction(payload: unknown) {
  const parsed = createUserSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { fullName, email, password, role, department, status, phone } = parsed.data;

  try {
    // RBAC Guard: Only ADMIN can create users
    await requireAdmin();

    const adminClient = getAdminClientSafe();
    const supabase = await createClient();
    const db = adminClient || supabase;

    // 1. Kiểm tra email đã tồn tại trong profiles chưa
    const { data: existingUser } = await db
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: "Email này đã được sử dụng trong hệ thống." };
    }

    let userId: string;

    // 2. Tạo tài khoản auth qua Admin Client (Service Role)
    if (adminClient) {
      const { data: authResult, error: authError } = await adminClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
          department,
          status,
          phone,
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      userId = authResult.user.id;
    } else {
      userId = crypto.randomUUID();
    }

    // 3. Upsert vào bảng public.profiles để đảm bảo dữ liệu luôn đầy đủ
    const { data: newProfile, error: profileError } = await db
      .from("profiles")
      .upsert({
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName,
        role,
        department,
        status,
        phone: phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    await logActivity({
      action: "USER_CREATED",
      level: "INFO",
      resource: `Thành viên: ${fullName} (${email.toLowerCase()})`,
      metadata: { id: userId, role, department, status },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, data: newProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo thành viên.";
    return { success: false, error: message };
  }
}

/**
 * Cập nhật thông tin thành viên (Họ tên, Vai trò, Phòng ban, Trạng thái)
 */
export async function updateManagedUserAction(id: string, payload: unknown) {
  const parsed = updateUserSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { fullName, email, role, department, status, phone } = parsed.data;

  try {
    // RBAC Guard: Only ADMIN can update user profiles & roles
    await requireAdmin();

    const adminClient = getAdminClientSafe();
    const supabase = await createClient();
    const db = adminClient || supabase;

    const updatePayload: Record<string, unknown> = {
      full_name: fullName,
      role,
      department,
      status,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    };

    if (email) {
      updatePayload.email = email.toLowerCase();
    }

    // 1. Cập nhật bảng public.profiles
    const { data: updatedProfile, error: updateError } = await db
      .from("profiles")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Đồng bộ metadata vào auth.users nếu có quyền admin
    if (adminClient) {
      try {
        await adminClient.auth.admin.updateUserById(id, {
          user_metadata: {
            full_name: fullName,
            role,
            department,
            status,
          },
        });
      } catch {
        // Bỏ qua lỗi metadata nếu user không tồn tại trong auth.users
      }
    }

    await logActivity({
      action: "USER_UPDATED",
      level: "INFO",
      resource: `Thành viên: ${fullName}`,
      metadata: { id, role, department, status },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, data: updatedProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật thành viên.";
    return { success: false, error: message };
  }
}

/**
 * Khóa (Suspended) hoặc Mở khóa (Active) tài khoản thành viên
 */
export async function toggleUserStatusAction(id: string, newStatus: AccountStatus) {
  try {
    // RBAC Guard: Only ADMIN can suspend / activate users
    await requireAdmin();

    const adminClient = getAdminClientSafe();
    const supabase = await createClient();
    const db = adminClient || supabase;

    const { error } = await db
      .from("profiles")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "USER_STATUS_TOGGLED",
      level: "WARNING",
      resource: `Đổi trạng thái thành viên ID: ${id} -> ${newStatus}`,
      metadata: { id, newStatus },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Không thể thay đổi trạng thái tài khoản.";
    return { success: false, error: message };
  }
}

/**
 * Xóa vĩnh viễn một thành viên (Bảo vệ không cho tự xóa chính mình)
 */
export async function deleteManagedUserAction(id: string) {
  try {
    // RBAC Guard: Only ADMIN can delete users
    await requireAdmin();

    const supabase = await createClient();

    // Kiểm tra người đang đăng nhập
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser && currentUser.id === id) {
      return { success: false, error: "Bạn không thể tự xóa tài khoản của chính mình!" };
    }

    const adminClient = getAdminClientSafe();
    const db = adminClient || supabase;

    // 1. Xóa từ public.profiles
    const { error: profileError } = await db
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // 2. Xóa khỏi auth.users nếu có admin client
    if (adminClient) {
      try {
        await adminClient.auth.admin.deleteUser(id);
      } catch {
        // Ignored if auth user does not exist
      }
    }

    await logActivity({
      action: "USER_DELETED",
      level: "WARNING",
      resource: `Thành viên ID: ${id}`,
      metadata: { id },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa thành viên.";
    return { success: false, error: message };
  }
}

/**
 * Xóa hàng loạt thành viên (Trừ tài khoản của chính mình)
 */
export async function batchDeleteUsersAction(ids: string[]) {
  if (!ids.length) return { success: true };

  try {
    // RBAC Guard: Only ADMIN can batch delete users
    await requireAdmin();

    const supabase = await createClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Lọc bỏ id của chính mình
    const safeIds = currentUser ? ids.filter((id) => id !== currentUser.id) : ids;

    if (!safeIds.length) {
      return { success: false, error: "Không thể xóa tài khoản của chính bạn trong danh sách chọn." };
    }

    const adminClient = getAdminClientSafe();
    const db = adminClient || supabase;

    const { error } = await db
      .from("profiles")
      .delete()
      .in("id", safeIds);

    if (error) {
      return { success: false, error: error.message };
    }

    // Xóa khỏi auth.users
    if (adminClient) {
      for (const id of safeIds) {
        try {
          await adminClient.auth.admin.deleteUser(id);
        } catch {
          // Ignored
        }
      }
    }

    await logActivity({
      action: "USER_BATCH_DELETED",
      level: "CRITICAL",
      resource: `Xóa hàng loạt ${safeIds.length} thành viên`,
      metadata: { deletedCount: safeIds.length, ids: safeIds },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true, deletedCount: safeIds.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa danh sách thành viên.";
    return { success: false, error: message };
  }
}

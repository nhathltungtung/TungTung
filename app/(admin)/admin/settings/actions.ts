"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { logActivity } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth-guard";
import { systemSettingsSchema } from "./schemas";

export async function updateSystemSettingsAction(payload: unknown) {
  const parsed = systemSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { systemName, companyName, logoUrl, supportEmail, hotline, maintenanceMode } =
    parsed.data;

  try {
    // RBAC: Only ADMIN can modify system settings
    await requireAdmin();

    const supabase = await createClient();

    // Set maintenance cookie for fast middleware access
    const cookieStore = await cookies();
    cookieStore.set("maintenance_mode", maintenanceMode ? "true" : "false", {
      path: "/",
      maxAge: 31536000,
      httpOnly: false,
      sameSite: "lax",
    });

    const { data, error } = await supabase
      .from("system_settings")
      .upsert({
        id: 1,
        system_name: systemName,
        company_name: companyName,
        logo_url: logoUrl || null,
        support_email: supportEmail,
        hotline,
        maintenance_mode: maintenanceMode,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity({
      action: "SYSTEM_SETTINGS_UPDATED",
      level: "WARNING",
      resource: "Cấu hình chung hệ thống",
      metadata: {
        system_name: systemName,
        company_name: companyName,
        maintenance_mode: maintenanceMode,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, data };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu cấu hình.";
    return { success: false, error: message };
  }
}

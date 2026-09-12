"use server";

import { createClient } from "./server";
import { redirect } from "next/navigation";
import { UserProfile } from "@/types";

export interface CurrentUserResult {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

/**
 * Lấy thông tin người dùng hiện tại kèm vai trò (Role) từ Supabase Auth và bảng profiles
 */
export async function getCurrentUser(): Promise<CurrentUserResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { isAuthenticated: false, user: null };
    }

    // Lấy thông tin profile tương ứng từ bảng public.profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at")
      .eq("id", authUser.id)
      .single();

    const userProfile: UserProfile = {
      id: authUser.id,
      fullName:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split("@")[0] ||
        "User",
      email: authUser.email || profile?.email || "",
      role: (profile?.role as "admin" | "manager" | "user") || "user",
      avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
      createdAt: profile?.created_at || authUser.created_at,
    };

    return {
      isAuthenticated: true,
      user: userProfile,
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Đăng xuất người dùng trên Server Action và chuyển hướng về trang đăng nhập
 */
export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
  }
  redirect("/auth/signin");
}

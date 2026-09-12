"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";
import { useRouter } from "next/navigation";

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        // Fallback demo account for local UI testing if cookies indicate demo mode
        setUser({
          id: "demo-admin-id",
          fullName: "Admin Master",
          email: "admin@tailadmin.dev",
          role: "admin",
          avatarUrl: undefined,
          createdAt: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, created_at")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        fullName:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "User",
        email: authUser.email || profile?.email || "",
        role: (profile?.role as "admin" | "manager" | "user") || "admin",
        avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        createdAt: profile?.created_at || authUser.created_at,
      });
    } catch (err) {
      console.error("Failed to load user profile:", err);
      // Keep demo fallback
      setUser({
        id: "demo-admin-id",
        fullName: "Admin Master",
        email: "admin@tailadmin.dev",
        role: "admin",
        avatarUrl: undefined,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    const loadProfile = async () => {
      if (isSubscribed) {
        await fetchProfile();
      }
    };
    void loadProfile();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (isSubscribed) {
        void fetchProfile();
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      // Clear demo cookie if any
      document.cookie = "demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/auth/signin");
      router.refresh();
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role || "user",
    isAdmin: user?.role === "admin",
    isManager: user?.role === "manager" || user?.role === "admin",
    refreshUser: fetchProfile,
    signOut,
  };
}

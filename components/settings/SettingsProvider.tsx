"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SystemSettings {
  systemName: string;
  companyName: string;
  logoUrl?: string | null;
  supportEmail: string;
  hotline: string;
  maintenanceMode: boolean;
}

const defaultSettings: SystemSettings = {
  systemName: "Base Next.js Admin",
  companyName: "Công Ty Công Nghệ TailAdmin",
  logoUrl: null,
  supportEmail: "hotro@tailadmin.dev",
  hotline: "1900 6868",
  maintenanceMode: false,
};

interface SettingsContextType {
  settings: SystemSettings;
  refreshSettings: () => Promise<void>;
  updateSettingsState: (partial: Partial<SystemSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
  updateSettingsState: () => {},
});

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: SystemSettings;
}) {
  const [settings, setSettings] = useState<SystemSettings>(
    initialSettings || defaultSettings
  );

  const refreshSettings = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        setSettings({
          systemName: data.system_name || defaultSettings.systemName,
          companyName: data.company_name || defaultSettings.companyName,
          logoUrl: data.logo_url || null,
          supportEmail: data.support_email || defaultSettings.supportEmail,
          hotline: data.hotline || defaultSettings.hotline,
          maintenanceMode: data.maintenance_mode ?? false,
        });
      }
    } catch {
      // Fallback to existing settings on network error
    }
  }, []);

  const updateSettingsState = useCallback((partial: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    if (!initialSettings) {
      let isMounted = true;
      const load = async () => {
        if (isMounted) {
          await refreshSettings();
        }
      };
      void load();
      return () => {
        isMounted = false;
      };
    }
  }, [initialSettings, refreshSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        refreshSettings,
        updateSettingsState,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSystemSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: defaultSettings,
      refreshSettings: async () => {},
      updateSettingsState: () => {},
    };
  }
  return context;
}

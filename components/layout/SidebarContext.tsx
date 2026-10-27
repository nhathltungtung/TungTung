"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapse: () => void;
}

const STORAGE_KEY = "tungtung_sidebar_collapsed";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore collapsed state from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // LocalStorage access restricted or unavailable
    }
  }, []);

  // Sync collapsed state to localStorage
  const handleSetIsCollapsed = (value: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const nextVal = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(STORAGE_KEY, String(nextVal));
      } catch {
        // LocalStorage access restricted
      }
      return nextVal;
    });
  };

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const toggleCollapse = () => {
    handleSetIsCollapsed((prev) => !prev);
  };

  // Close mobile sidebar on resize to desktop & add Ctrl+B shortcut
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B or Cmd+B to toggle sidebar collapse
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (window.innerWidth >= 1024) {
          toggleCollapse();
        } else {
          toggleSidebar();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleSidebar,
        isCollapsed,
        setIsCollapsed: handleSetIsCollapsed,
        toggleCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

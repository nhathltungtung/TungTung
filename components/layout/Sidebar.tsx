"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  X,
  Sparkles,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { navigationConfig } from "@/lib/navigation";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, isCollapsed, toggleCollapse } = useSidebar();
  const { t } = useTranslation();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    Dashboard: true,
  });
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const getTranslatedTitle = (title: string): string => {
    switch (title) {
      case "Dashboard":
        return t.nav.dashboard;
      case "eCommerce":
      case "E-commerce":
        return t.nav.ecommerce;
      case "Analytics":
        return t.nav.analytics;
      case "Users Management":
        return t.nav.usersManagement;
      case "Calendar":
        return t.nav.calendar;
      case "Landing Page":
        return t.nav.landingPage;
      case "Tables":
        return t.nav.tables;
      case "Authentication":
        return t.nav.authentication;
      case "Sign In":
        return t.nav.signIn;
      case "Sign Up":
        return t.nav.signUp;
      case "Settings":
        return t.nav.settings;
      default:
        return title;
    }
  };

  const getTranslatedGroupName = (name: string): string => {
    if (name === "MENU") return t.nav.menu;
    if (name === "SYSTEM & UTILITIES") return t.nav.systemAndUtilities;
    return name;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col h-screen shrink-0 bg-[#1c2434] text-[#dee4ee] transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-72 lg:w-20" : "w-72"
        )}
      >
        {/* Sidebar Header / Brand Logo */}
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center px-2 py-4 border-b border-[#2e3a47] gap-2">
            <Link
              href="/admin"
              className="flex items-center justify-center"
              title="TungTung ERP - Trang Tổng Quan"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 text-white font-black text-xl hover:scale-105 transition-transform">
                T
              </div>
            </Link>
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-[#2e3a47] transition-colors cursor-pointer"
              title="Mở rộng menu (Ctrl+B)"
              aria-label="Mở rộng menu"
            >
              <PanelLeftOpen className="w-5 h-5 text-blue-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#2e3a47]">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 text-white font-black text-xl">
                T
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  TailAdmin <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">Next.js</span>
                </span>
                <span className="text-xs text-[#8a99ad]">Modern Admin Hub</span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {/* Collapse button for Desktop */}
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-[#2e3a47] transition-colors cursor-pointer"
                title="Thu gọn menu (Ctrl+B)"
                aria-label="Thu gọn menu"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>

              {/* Close button for Mobile */}
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-[#2e3a47] transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Menus (Scrollable) */}
        <div className={cn("flex-1 overflow-y-auto py-6 space-y-6", isCollapsed ? "px-2" : "px-4")}>
          {navigationConfig.map((group) => (
            <div key={group.name}>
              {isCollapsed ? (
                <div
                  className="my-3 mx-2 border-t border-[#2e3a47]"
                  title={getTranslatedGroupName(group.name)}
                />
              ) : (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#8a99ad]">
                  {getTranslatedGroupName(group.name)}
                </h3>
              )}

              <ul className="space-y-1">
                {group.menuItems.map((item) => {
                  const Icon = item.icon;
                  const hasSubmenu = item.children && item.children.length > 0;
                  const isSubmenuOpen = !!openSubmenus[item.title];
                  const isActive =
                    pathname === item.href ||
                    item.children?.some((sub) => sub.href === pathname);

                  return (
                    <li key={item.title} className="relative">
                      {hasSubmenu ? (
                        isCollapsed ? (
                          /* Collapsed state with Flyout Submenu */
                          <div
                            className="relative group/flyout"
                            onMouseEnter={() => setHoveredSubmenu(item.title)}
                            onMouseLeave={() => setHoveredSubmenu(null)}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                toggleSubmenu(item.title);
                                setHoveredSubmenu((prev) => (prev === item.title ? null : item.title));
                              }}
                              className={cn(
                                "group flex w-full items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-colors cursor-pointer",
                                isActive
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "text-[#8a99ad] hover:bg-[#333a48]/60 hover:text-white"
                              )}
                              title={getTranslatedTitle(item.title)}
                              aria-label={getTranslatedTitle(item.title)}
                            >
                              {Icon && (
                                <Icon
                                  className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-white" : "text-[#8a99ad] group-hover:text-white"
                                  )}
                                />
                              )}
                            </button>

                            {/* Flyout Submenu on Hover / Click */}
                            {hoveredSubmenu === item.title && (
                              <div className="absolute left-full top-0 ml-2 w-52 rounded-xl bg-[#1c2434] border border-[#2e3a47] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#8a99ad] border-b border-[#2e3a47] mb-1">
                                  {getTranslatedTitle(item.title)}
                                </p>
                                <ul className="space-y-1">
                                  {item.children?.map((subItem) => {
                                    const isSubActive = pathname === subItem.href;
                                    return (
                                      <li key={subItem.title}>
                                        <Link
                                          href={subItem.href}
                                          onClick={() => setHoveredSubmenu(null)}
                                          className={cn(
                                            "block rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                                            isSubActive
                                              ? "text-blue-400 font-semibold bg-blue-500/10"
                                              : "text-[#8a99ad] hover:text-white hover:bg-[#333a48]/60"
                                          )}
                                        >
                                          {getTranslatedTitle(subItem.title)}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Expanded state with Accordion Submenu */
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleSubmenu(item.title)}
                              className={cn(
                                "group flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                                isActive
                                  ? "bg-[#333a48] text-white"
                                  : "text-[#8a99ad] hover:bg-[#333a48]/60 hover:text-white"
                              )}
                            >
                              <span className="flex items-center gap-3">
                                {Icon && (
                                  <Icon
                                    className={cn(
                                      "w-5 h-5 transition-colors",
                                      isActive ? "text-blue-400" : "text-[#8a99ad] group-hover:text-white"
                                    )}
                                  />
                                )}
                                {getTranslatedTitle(item.title)}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 transition-transform duration-200 text-[#8a99ad]",
                                  isSubmenuOpen && "rotate-180 text-white"
                                )}
                              />
                            </button>

                            {/* Submenu items */}
                            {isSubmenuOpen && (
                              <ul className="mt-1 space-y-1 pl-10 pr-2">
                                {item.children?.map((subItem) => {
                                  const isSubActive = pathname === subItem.href;
                                  return (
                                    <li key={subItem.title}>
                                      <Link
                                        href={subItem.href}
                                        className={cn(
                                          "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                          isSubActive
                                            ? "text-blue-400 font-semibold bg-blue-500/10"
                                            : "text-[#8a99ad] hover:text-white hover:bg-[#333a48]/40"
                                        )}
                                      >
                                        {getTranslatedTitle(subItem.title)}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        )
                      ) : isCollapsed ? (
                        /* Collapsed single menu item */
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                              : "text-[#8a99ad] hover:bg-[#333a48]/60 hover:text-white"
                          )}
                          title={getTranslatedTitle(item.title)}
                          aria-label={getTranslatedTitle(item.title)}
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-white" : "text-[#8a99ad] group-hover:text-white"
                              )}
                            />
                          )}
                        </Link>
                      ) : (
                        /* Expanded single menu item */
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                              : "text-[#8a99ad] hover:bg-[#333a48]/60 hover:text-white"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            {Icon && (
                              <Icon
                                className={cn(
                                  "w-5 h-5 transition-colors",
                                  isActive ? "text-white" : "text-[#8a99ad] group-hover:text-white"
                                )}
                              />
                            )}
                            {getTranslatedTitle(item.title)}
                          </span>
                          {item.badge && (
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-semibold rounded-full",
                                item.badgeColor === "primary"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                  : "bg-emerald-500/20 text-emerald-300"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        {isCollapsed ? (
          <div className="p-3 border-t border-[#2e3a47] flex flex-col items-center justify-center">
            <Link
              href="/auth/signin"
              className="p-2.5 text-[#8a99ad] hover:text-white hover:bg-[#333a48] rounded-xl transition-colors"
              title={t.header.signOut}
              aria-label={t.header.signOut}
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="p-4 border-t border-[#2e3a47]">
            <div className="p-3.5 rounded-xl bg-[#24303f] border border-[#2e3a47]/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">TailAdmin Pro</p>
                  <p className="text-[11px] text-[#8a99ad]">v1.0 Base Ready</p>
                </div>
              </div>
              <Link
                href="/auth/signin"
                className="p-1.5 text-[#8a99ad] hover:text-white hover:bg-[#333a48] rounded-lg transition-colors"
                title={t.header.signOut}
                aria-label={t.header.signOut}
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

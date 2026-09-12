"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import { useUser } from "@/hooks/useUser";

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const { user, role, signOut } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = user?.fullName || "Admin Master";
  const displayEmail = user?.email || "admin@tailadmin.dev";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AD";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white dark:bg-[#1c2434] border-b border-[#e2e8f0] dark:border-[#2e3a47] shadow-xs transition-colors">
      {/* Left side: Hamburger Toggle & Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={toggleSidebar}
          className="p-2 text-[#64748b] dark:text-[#8a99ad] hover:text-[#1e293b] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#24303f] transition-colors lg:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={t.header.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-[#24303f] border border-slate-200 dark:border-[#2e3a47] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#24303f] transition-all"
          />
        </div>
      </div>

      {/* Right side: Language, Theme Actions & User Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Language Switcher */}
        <LanguageToggle />

        {/* Dark Mode Switcher - 1 Click Instant Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-[#64748b] dark:text-[#8a99ad] hover:text-[#1e293b] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#24303f] transition-colors"
            aria-label={t.header.notifications}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#1c2434]" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2e3a47]">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{t.header.notifications}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                  3 {t.header.newCount}
                </span>
              </div>
              <div className="py-2 divide-y divide-slate-100 dark:divide-[#2e3a47] text-xs">
                <div className="py-2.5 hover:bg-slate-50 dark:hover:bg-[#24303f] px-2 rounded cursor-pointer">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{t.header.newOrderTitle}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{t.header.newOrderDesc}</p>
                </div>
                <div className="py-2.5 hover:bg-slate-50 dark:hover:bg-[#24303f] px-2 rounded cursor-pointer">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{t.header.backupCompletedTitle}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{t.header.backupCompletedDesc}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-[#2e3a47] mx-1" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#24303f] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-blue-500/20">
              {userInitials}
            </div>
            <div className="text-left hidden md:block">
              <span className="block text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                {displayName}
              </span>
              <span className="block text-xs text-[#64748b] dark:text-[#8a99ad] capitalize">
                {role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748b] dark:text-[#8a99ad] hidden md:block" />
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white dark:bg-[#1c2434] border border-slate-200 dark:border-[#2e3a47] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-[#2e3a47] mb-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Shield className="w-3 h-3" />
                  {role}
                </span>
              </div>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#24303f] transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    {t.header.myProfile}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#24303f] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    {t.header.accountSettings}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com"
                    target="_blank"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#24303f] transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    {t.header.helpSupport}
                  </Link>
                </li>
                <li className="pt-1 border-t border-slate-100 dark:border-[#2e3a47]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.header.signOut}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

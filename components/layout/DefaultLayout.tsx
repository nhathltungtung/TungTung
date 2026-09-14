"use client";

import React from "react";
import { SidebarProvider } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-[#10172a] print:h-auto print:overflow-visible print:bg-white print:block">
        {/* Sidebar */}
        <div className="print:hidden">
          <Sidebar />
        </div>

        {/* Content Area */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden print:h-auto print:overflow-visible print:static print:block">
          {/* Header */}
          <div className="print:hidden">
            <Header />
          </div>

          {/* Main Content */}
          <main className="flex-1 print:p-0 print:m-0 print:block">
            <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 2xl:p-10 print:p-0 print:m-0 print:max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

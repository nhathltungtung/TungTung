import React from "react";

export interface NavSubItem {
  readonly title: string;
  readonly href: string;
  readonly badge?: string;
}

export interface NavItem {
  readonly title: string;
  readonly href: string;
  readonly icon?: React.ComponentType<{ className?: string }>;
  readonly badge?: string;
  readonly badgeColor?: "primary" | "success" | "warning" | "danger";
  readonly children?: readonly NavSubItem[];
}

export interface MenuGroup {
  readonly name: string;
  readonly menuItems: readonly NavItem[];
}

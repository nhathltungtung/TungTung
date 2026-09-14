export * from "./navigation";
export * from "./dashboard";
export * from "./i18n";
export * from "./audit";
export * from "./system";
export * from "./roofing";

export type ThemeMode = "light" | "dark" | "system";

export type UserRole = "admin" | "manager" | "user";
export type AccountStatus = "Active" | "Suspended";

export interface UserProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: UserRole;
  readonly avatarUrl?: string;
  readonly createdAt?: string;
}

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  department: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  readonly data: T | null;
  readonly error: string | null;
  readonly status: number;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

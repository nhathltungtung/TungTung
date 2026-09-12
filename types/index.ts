export * from "./navigation";
export * from "./dashboard";
export * from "./i18n";

export type ThemeMode = "light" | "dark" | "system";

export interface UserProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly role: "admin" | "manager" | "user";
  readonly avatarUrl?: string;
  readonly createdAt?: string;
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


export type TrendDirection = "up" | "down";

export interface StatMetric {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly change: string;
  readonly trend: TrendDirection;
  readonly periodDescription: string;
  readonly iconType: "sales" | "revenue" | "users" | "growth";
}

export type OrderStatus = "Completed" | "Processing" | "Pending" | "Cancelled";

export interface RecentOrder {
  readonly id: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerAvatar?: string;
  readonly productName: string;
  readonly amount: number;
  readonly date: string;
  readonly status: OrderStatus;
}

export interface ChartDataPoint {
  readonly name: string;
  readonly total: number;
  readonly profit: number;
}

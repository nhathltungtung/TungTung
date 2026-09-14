export type LogLevel = "INFO" | "WARNING" | "CRITICAL";

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  actorEmail: string;
  action: string;
  level: LogLevel;
  ipAddress: string;
  resource: string;
  metadata: Record<string, unknown>;
  userId?: string | null;
}

export interface SystemSettings {
  id: number;
  systemName: string;
  companyName: string;
  logoUrl?: string | null;
  supportEmail: string;
  hotline: string;
  maintenanceMode: boolean;
  updatedAt?: string;
}

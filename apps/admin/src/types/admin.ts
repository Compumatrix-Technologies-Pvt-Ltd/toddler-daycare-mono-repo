export type AdminTab = "dashboard" | "settings";

export type AdminRole = "super-admin" | "admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl: string;
  status: "online" | "away" | "offline";
  permissions?: string[];
}

export interface DaycareApplication {
  id: string;
  caretakerName: string;
  daycareName: string;
  location: string;
  district: string;
  permitNumber: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
  capacity: number;
  phone: string;
  email: string;
  documentsCount: number;
}

export interface AdminMetric {
  id: string;
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
}

export interface PlatformActivity {
  id: string;
  type: "application" | "verification" | "inquiry" | "system";
  title: string;
  timestamp: string;
  user: string;
  status: "info" | "success" | "warning";
}

export interface PlatformSettings {
  siteName: string;
  contactEmail: string;
  defaultCatchmentRadiusKm: number;
  autoValidatePermits: boolean;
  emailNotificationOnInquiry: boolean;
  dailyDigestEnabled: boolean;
  allowPublicInquiries: boolean;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
}

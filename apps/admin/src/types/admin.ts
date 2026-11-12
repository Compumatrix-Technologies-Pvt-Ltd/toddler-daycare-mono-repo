export type AdminTab = "dashboard" | "daycares" | "inquiries" | "settings";

export type AdminRole = "super-admin" | "admin";

export interface AdminInquiry {
  _id: string;
  referenceId: string;
  scope: string;
  caretakerId?: string;
  caretakerIds?: string[];
  daycareNames: string[];
  daycareIds?: string[];
  childName: string;
  childBirthday?: string;
  desiredStart: string;
  estTransition?: string;
  careHours: string;
  preferences?: {
    gender?: string;
    food?: string;
    pets?: string;
  };
  parentName: string;
  phone: string;
  email: string;
  note?: string;
  consentMapVisibility?: boolean;
  status: "pending" | "reviewed" | "contacted" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  status?: "online" | "away" | "offline";
  permissions?: string[];
}

export interface WorkPermitDetails {
  permitId: string;
  registrationDate: string;
  expirationDate: string;
  issuingAuthority?: string;
  authorizedCapacity?: number;
  adminNotes?: string;
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
  workPermitUrl?: string;
  workPermitFileName?: string;
  permitId?: string;
  registrationDate?: string;
  expirationDate?: string;
  issuingAuthority?: string;
  authorizedCapacity?: number;
  adminNotes?: string;
  approvedAt?: string;
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

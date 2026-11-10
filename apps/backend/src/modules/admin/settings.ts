import mongoose, { Document, Schema } from "mongoose";

export interface IPlatformSettings extends Document {
  siteName: string;
  contactEmail: string;
  defaultCatchmentRadiusKm: number;
  autoValidatePermits: boolean;
  emailNotificationOnInquiry: boolean;
  dailyDigestEnabled: boolean;
  allowPublicInquiries: boolean;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<IPlatformSettings>(
  {
    siteName: { type: String, default: "Find Toddler Daycare" },
    contactEmail: { type: String, default: "admin@toddler-care.de" },
    defaultCatchmentRadiusKm: { type: Number, default: 3.0 },
    autoValidatePermits: { type: Boolean, default: true },
    emailNotificationOnInquiry: { type: Boolean, default: true },
    dailyDigestEnabled: { type: Boolean, default: true },
    allowPublicInquiries: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 60 },
  },
  { timestamps: true }
);

const PlatformSettingsModel = mongoose.model<IPlatformSettings>(
  "PlatformSettings",
  settingsSchema
);

export default PlatformSettingsModel;


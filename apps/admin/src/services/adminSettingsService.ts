import axios from "axios";
import { PlatformSettings } from "../types/admin";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminSettingsService = {
  // Fetch current platform settings
  async getSettings(): Promise<PlatformSettings> {
    try {
      const res = await api.get("/settings");
      if (res.data?.data) {
        return res.data.data;
      }
      return res.data;
    } catch {
      // Fallback to default settings
      return {
        siteName: "Find Toddler Daycare",
        contactEmail: "admin@toddler-care.de",
        defaultCatchmentRadiusKm: 3.0,
        autoValidatePermits: true,
        emailNotificationOnInquiry: true,
        dailyDigestEnabled: true,
        allowPublicInquiries: true,
        maintenanceMode: false,
        sessionTimeoutMinutes: 60,
      };
    }
  },

  // Save / Update platform settings (including defaultCatchmentRadiusKm)
  async updateSettings(settings: PlatformSettings): Promise<PlatformSettings> {
    const res = await api.put("/settings", settings);
    return res.data?.data || res.data;
  },
};


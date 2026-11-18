import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AdminSearchDemand {
  _id: string;
  parentName: string;
  email: string;
  phone: string;
  message?: string;
  scope?: string;
  referenceId?: string;
  searchLocation: {
    lat: number;
    log: number;
    lng?: number;
    area: string;
    address?: string;
  };
  filter: {
    child?: number;
    month?: string;
    year?: string;
    tolerance?: string;
    hours?: string;
    food?: string;
    pet?: string;
    gender?: string;
  };
  currentLocation?: {
    lat: number;
    log: number;
    lng?: number;
    area?: string;
  };
  daycareNames?: string[];
  expiresAt: string;
  isActive: boolean;
  daysRemaining: number;
  status: "active" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface AdminSearchDemandResponse {
  data: AdminSearchDemand[];
  meta: {
    total: number;
    activeCount: number;
    expiredCount: number;
    page: number;
    totalPages: number;
  };
}

export const adminSearchService = {
  /**
   * Fetch all parent search demands with optional search & status filter
   */
  async getAllSearchDemands(params?: {
    status?: "all" | "active" | "expired";
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminSearchDemandResponse> {
    const res = await api.get("/admin/search-history", { params });
    return res.data;
  },

  /**
   * Manually trigger the automated 30-day expiration cron cleanup
   */
  async triggerCronCleanup(): Promise<{ success: boolean; message: string; expiredCount: number }> {
    const res = await api.post("/admin/search-history/cleanup");
    return {
      success: true,
      message: res.data?.message || "30-Day cleanup executed",
      expiredCount: res.data?.data?.expiredCount ?? 0,
    };
  },
};

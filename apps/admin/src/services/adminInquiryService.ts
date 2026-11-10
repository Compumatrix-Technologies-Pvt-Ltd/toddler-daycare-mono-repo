import axios from "axios";
import { AdminInquiry } from "../types/admin";

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

export const adminInquiryService = {
  // Fetch all inquiries with optional search, status & caretakerId filter
  async getAllInquiries(params?: { search?: string; status?: string; caretakerId?: string }): Promise<AdminInquiry[]> {
    const res = await api.get("/inquiries", { params });
    return res.data?.data || [];
  },

  // Update inquiry status
  async updateStatus(id: string, status: string): Promise<AdminInquiry> {
    const res = await api.patch(`/inquiries/${id}/status`, { status });
    return res.data?.data;
  },

  // Get single inquiry details
  async getInquiryById(id: string): Promise<AdminInquiry> {
    const res = await api.get(`/inquiries/${id}`);
    return res.data?.data;
  },
};


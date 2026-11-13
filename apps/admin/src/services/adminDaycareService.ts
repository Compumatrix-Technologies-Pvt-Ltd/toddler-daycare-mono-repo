import axios from "axios";
import { DaycareApplication, WorkPermitDetails } from "../types/admin";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function resolveAssetUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  const clean = String(rawUrl).trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  try {
    const origin = new URL(API_BASE_URL).origin;
    return `${origin}${clean.startsWith("/") ? "" : "/"}${clean}`;
  } catch {
    return `http://localhost:5000${clean.startsWith("/") ? "" : "/"}${clean}`;
  }
}

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

// Helper to map MongoDB daycare document to DaycareApplication
export function mapMongoDaycareToApplication(raw: any): DaycareApplication {
  const loc = raw.location || {};
  const streetPart = loc.street ? `${loc.street} ${loc.houseNumber || ""}`.trim() : "";
  const cityPart = loc.postcode ? `${loc.postcode} ${loc.city || ""}`.trim() : loc.city || "";
  const fullAddress = [streetPart, cityPart].filter(Boolean).join(", ") || "Address not provided";

  const submitted = raw.createdAt
    ? new Date(raw.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Recently";

  // If permit file name exists or permit is attached
  const permitFileName = raw.workPermit?.fileName || "";
  const workPermitUrl = resolveAssetUrl(raw.workPermit?.url);
  const permitId = raw.workPermit?.permitId || raw.permitNumber || "";
  const permitName = permitId || (permitFileName ? permitFileName : "—");

  const docCount = (raw.workPermit?.url ? 1 : 0) + (Array.isArray(raw.photos) ? raw.photos.length : 0);

  const rawArea = loc.areaType;
  const isRural =
    rawArea === "rural" ||
    (!rawArea &&
      ["dorf", "village", "weiler", "land", "gut ", "hof ", "siedlung", "hamlet", "rural"].some((kw) =>
        `${fullAddress} ${loc.city || ""}`.toLowerCase().includes(kw)
      ));
  const areaType: "urban" | "rural" = isRural ? "rural" : "urban";
  const catchmentRadiusKm = Number(loc.catchmentRadiusKm) || (areaType === "rural" ? 10 : 3);

  return {
    id: raw._id?.toString() || raw.id || "",
    caretakerName: raw.caregiverName || raw.caretakerName || "Registered Caregiver",
    daycareName: raw.daycareName || "Toddler Daycare",
    location: fullAddress,
    district: loc.city || "Daycare Region",
    permitNumber: permitName,
    submittedDate: submitted,
    status: raw.status || (raw.workPermit?.url ? "pending" : "pending"),
    capacity: raw.workPermit?.authorizedCapacity || raw.operations?.maxCapacity || 5,
    phone: raw.contact?.phone || "",
    email: raw.contact?.email || "",
    documentsCount: Math.max(docCount, 1),
    workPermitUrl,
    workPermitFileName: permitFileName,
    permitId,
    registrationDate: raw.workPermit?.registrationDate || "",
    expirationDate: raw.workPermit?.expirationDate || "",
    issuingAuthority: raw.workPermit?.issuingAuthority || "",
    authorizedCapacity: raw.workPermit?.authorizedCapacity ?? raw.operations?.maxCapacity,
    adminNotes: raw.workPermit?.adminNotes || "",
    approvedAt: raw.workPermit?.approvedAt || "",
    areaType,
    catchmentRadiusKm,
  };
}

export interface AdminDashboardStats {
  totalDaycares: number;
  pendingPermits: number;
  verifiedCaretakers: number;
  demandInquiries: number;
  totalCapacity: number;
  applications: DaycareApplication[];
}

export const adminDaycareService = {
  // Fetch dashboard statistics from backend
  async getDashboardStats(): Promise<AdminDashboardStats | null> {
    try {
      const res = await api.get("/dashboard");
      const d = res.data?.data;
      if (d) {
        return {
          totalDaycares: d.totalDaycares || 0,
          pendingPermits: d.pendingPermits || 0,
          verifiedCaretakers: d.verifiedCaretakers || 0,
          demandInquiries: d.demandInquiries || 0,
          totalCapacity: d.totalCapacity || 0,
          applications: Array.isArray(d.applications) ? d.applications.map(mapMongoDaycareToApplication) : [],
        };
      }
      return null;
    } catch {
      try {
        const fallbackRes = await api.get("/stats");
        const d = fallbackRes.data?.data;
        if (d) {
          return {
            totalDaycares: d.totalDaycares || 0,
            pendingPermits: d.pendingPermits || 0,
            verifiedCaretakers: d.verifiedCaretakers || 0,
            demandInquiries: d.demandInquiries || 0,
            totalCapacity: d.totalCapacity || 0,
            applications: Array.isArray(d.applications) ? d.applications.map(mapMongoDaycareToApplication) : [],
          };
        }
      } catch {
        // Fallback failed
      }
      return null;
    }
  },

  // Fetch real daycares from MongoDB backend
  async getDaycares(): Promise<DaycareApplication[]> {
    try {
      // Try protected admin daycares endpoint first
      const res = await api.get("/daycares");
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        return list.map(mapMongoDaycareToApplication);
      }
      return [];
    } catch {
      // Fallback to public all daycares endpoint if needed
      try {
        const fallbackRes = await api.get("/caretaker/daycare/all");
        const list = fallbackRes.data?.data || fallbackRes.data || [];
        if (Array.isArray(list)) {
          return list.map(mapMongoDaycareToApplication);
        }
      } catch {
        // No daycares available
      }
      return [];
    }
  },

  // Update status in MongoDB (approved / rejected / pending) along with optional work permit details
  async updateStatus(
    id: string,
    status: "approved" | "rejected" | "pending",
    workPermitDetails?: WorkPermitDetails
  ): Promise<DaycareApplication | null> {
    const res = await api.patch(`/daycares/${id}/status`, {
      status,
      ...(workPermitDetails ? { workPermitDetails } : {}),
    });
    const updatedRaw = res.data?.data;
    return updatedRaw ? mapMongoDaycareToApplication(updatedRaw) : null;
  },
};


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface InquiryPreferences {
  gender?: string;
  food?: string;
  pets?: string;
}

export interface InquiryPayload {
  scope?: "single" | "allMap" | "favorites";
  caretakerId?: string;
  caretakerIds?: string[];
  daycareIds?: string[];
  daycareNames?: string[];
  childName: string;
  childBirthday?: string;
  desiredStart: string;
  estTransition?: string;
  careHours?: string;
  preferences?: InquiryPreferences;
  parentName: string;
  phone: string;
  email: string;
  note?: string;
  consentMapVisibility?: boolean;
}

export interface InquiryResponse {
  data: any;
  meta: {
    message: string;
    referenceId: string;
    contactedCount?: number;
  };
}

/**
 * Submit Web Daycare Inquiry (with child, schedule, preferences, parent details)
 */
export async function submitInquiry(payload: InquiryPayload): Promise<InquiryResponse> {
  const res = await fetch(`${API_BASE_URL}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (!res.ok) {
    const errorMsg = result.errors
      ? Object.values(result.errors).flat().join(" ")
      : result.message || "Failed to submit inquiry";
    throw new Error(errorMsg);
  }
  return result;
}

/**
 * Fetch Inquiries with optional search, status, caretakerId, and token authentication
 */
export async function fetchInquiries(params?: {
  search?: string;
  status?: string;
  caretakerId?: string;
  daycareId?: string;
  token?: string;
}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status && params.status !== "all") query.append("status", params.status);
  
  const targetCaretakerId = params?.caretakerId || params?.daycareId;
  if (targetCaretakerId) query.append("caretakerId", targetCaretakerId);

  const token =
    params?.token ||
    (typeof window !== "undefined" ? localStorage.getItem("caretaker_token") : null);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/inquiries?${query.toString()}`, {
    method: "GET",
    headers,
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || "Failed to fetch inquiries");
  }
  return result.data || [];
}

/**
 * Update an inquiry status (pending, reviewed, contacted, accepted, declined)
 */
export async function updateInquiryStatus(id: string, status: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/inquiries/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.message || "Failed to update inquiry status");
  }
  return result.data;
}

export const inquiryApi = {
  submitInquiry,
  fetchInquiries,
  updateInquiryStatus,
};

export default submitInquiry;

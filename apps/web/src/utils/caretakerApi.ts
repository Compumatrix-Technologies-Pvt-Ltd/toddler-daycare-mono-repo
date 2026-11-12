const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface CaretakerLoginResponse {
    success: boolean;
    code?: string;
    message: string;
    data: {
        caretaker: {
            id: string;
            email: string;
        };
        token: string;
        daycareStatus?: "pending" | "approved" | "rejected" | null;
        isProfileComplete?: boolean;
    };
}

export const caretakerApi = {
    // Caretaker Register
    async register(email: string, password: string): Promise<CaretakerLoginResponse["data"]> {
        const res = await fetch(`${API_BASE_URL}/caretaker/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Registration failed");
        }

        if (result.data?.token) {
            localStorage.setItem("caretaker_token", result.data.token);
            if (result.data.caretaker?.email) {
                localStorage.setItem("caretaker_email", result.data.caretaker.email);
            }
            if (result.data.caretaker?.id) {
                localStorage.setItem("caretaker_id", result.data.caretaker.id);
            }
        }
        return result.data;
    },

    // Caretaker Login
    async login(email: string, password: string): Promise<CaretakerLoginResponse["data"]> {
        const res = await fetch(`${API_BASE_URL}/caretaker/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            const err: any = new Error(result.message || "Login failed");
            err.code = result.code;
            err.status = res.status;
            throw err;
        }

        // Persist JWT Token & Caretaker ID
        localStorage.setItem("caretaker_token", result.data.token);
        if (result.data?.caretaker?.email) {
            localStorage.setItem("caretaker_email", result.data.caretaker.email);
        }
        if (result.data?.caretaker?.id) {
            localStorage.setItem("caretaker_id", result.data.caretaker.id);
        }
        return result.data;
    },

    // Submit / Create Daycare with Photos & Work Permit
    async createDaycare(formData: FormData): Promise<any> {
        const token = this.getToken();

        if (!token) {
            throw new Error("You must be logged in to register a daycare");
        }

        // Do not set Content-Type header when sending FormData; browser will set boundary automatically
        const res = await fetch(`${API_BASE_URL}/caretaker/daycare`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to create daycare");
        }

        return result.data;
    },

    //Get Daycare profile
    async getDaycare(): Promise<any> {
        const token = this.getToken();
        if (!token) throw new Error("You must be logged in to view your daycare");

        const res = await fetch(`${API_BASE_URL}/caretaker/daycare`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || "Failed to fetch daycare");
        return result.data;

    },

    // Updata daycare
    async updateDaycare(formData: FormData): Promise<any> {
        const token = this.getToken();
        if (!token) throw new Error("You must be logged in to update your daycare");

        const res = await fetch(`${API_BASE_URL}/caretaker/daycare`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || "Failed to update")

        return result.data;
    },

    // Get all registered daycares (public)
    async getAllDaycares(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/caretaker/daycare/all`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to fetch all daycares");
        }

        return result.data || [];
    },

    // Get platform settings (including admin-configured catchment radius)
    async getSettings(): Promise<{ defaultCatchmentRadiusKm: number;[key: string]: any }> {
        try {
            const res = await fetch(`${API_BASE_URL}/settings`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            const result = await res.json();
            if (res.ok && result.data) {
                return result.data;
            }
        } catch (err) {
            console.warn("Could not fetch platform settings from backend, using defaults:", err);
        }
        return { defaultCatchmentRadiusKm: 3.0 };
    },


    // Submit Web Daycare Inquiry (with child, schedule, preferences, parent details)
    async submitInquiry(payload: {
        scope?: "single" | "allMap" | "favorites";
        daycareIds?: string[];
        daycareNames?: string[];
        childName: string;
        childBirthday?: string;
        desiredStart: string;
        estTransition?: string;
        careHours?: string;
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
    }): Promise<{ data: any; meta: { message: string; referenceId: string } }> {
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
    },

    // Helper to get stored token
    getToken() {
        return typeof window !== "undefined" ? localStorage.getItem("caretaker_token") : null;
    },

    // Helper to get caretakerId (from storage or decoded JWT)
    getCaretakerId() {
        if (typeof window === "undefined") return null;
        const storedId = localStorage.getItem("caretaker_id");
        if (storedId) return storedId;
        const token = localStorage.getItem("caretaker_token");
        if (token) {
            try {
                const payloadBase64 = token.split(".")[1];
                if (payloadBase64) {
                    const decoded = JSON.parse(atob(payloadBase64));
                    if (decoded.caretakerId) {
                        localStorage.setItem("caretaker_id", decoded.caretakerId);
                        return decoded.caretakerId;
                    }
                }
            } catch {
                // Ignore parse error
            }
        }
        return null;
    },

    // Logout
    logout() {
        localStorage.removeItem("caretaker_token");
        localStorage.removeItem("caretaker_email");
        localStorage.removeItem("caretaker_id");
        localStorage.removeItem("toddler_caretaker_profile_v1");
    },
};

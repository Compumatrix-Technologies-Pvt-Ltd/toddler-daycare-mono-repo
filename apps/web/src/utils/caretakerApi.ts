const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface CaretakerLoginResponse {
    success: boolean;
    message: string;
    data: {
        caretaker: {
            id: string;
            email: string;
        };
        token: string;
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
            throw new Error(result.message || "Login failed");
        }

        // Persist JWT Token
        localStorage.setItem("caretaker_token", result.data.token);
        return result.data;
    },

    // Submit / Create Daycare with Photos & Work Permit
    async createDaycare(formData: FormData): Promise<any> {
        const token = localStorage.getItem("caretaker_token");

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

    // Helper to get stored token
    getToken() {
        return typeof window !== "undefined" ? localStorage.getItem("caretaker_token") : null;
    },

    // Logout
    logout() {
        localStorage.removeItem("caretaker_token");
    },
};

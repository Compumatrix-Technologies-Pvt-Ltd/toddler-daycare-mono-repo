import axios from "axios";
import { AdminUser } from "../types/admin";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach Bearer token to protected requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        admin: {
            id: string;
            name: string;
            email: string;
            role: "admin" | "superadmin";
        };
        token: string;
    };
}

export const adminAuthService = {
    // Login
    async login(email: string, password: string): Promise<AdminUser> {
        const response = await api.post<LoginResponse>("/login", {
            email,
            password,
        });

        const { admin, token } = response.data.data;

        // Persist JWT token
        localStorage.setItem("admin_token", token);

        const mappedUser: AdminUser = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role === "superadmin" ? "super-admin" : "admin",
            avatarUrl:
                admin.role === "superadmin"
                    ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            status: "online",
            permissions:
                admin.role === "superadmin"
                    ? ["*"]
                    : ["applications:read", "applications:verify"],
        };

        return mappedUser;
    },

    // Get current profile using stored token
    async getProfile(): Promise<AdminUser> {
        const response = await api.get("/profile");
        const admin = response.data.data;

        return {
            id: admin._id || admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role === "superadmin" ? "super-admin" : "admin",
            avatarUrl:
                admin.role === "superadmin"
                    ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
                    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            status: "online",
            permissions:
                admin.role === "superadmin"
                    ? ["*"]
                    : ["applications:read", "applications:verify"],
        };
    },

    // Logout
    logout() {
        localStorage.removeItem("admin_token");
    },
    Logout() {
        localStorage.removeItem("admin_token");
    },
};

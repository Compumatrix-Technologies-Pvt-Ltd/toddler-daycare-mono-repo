import type { UserRole } from "../enums/index.js";

export interface User {
  _id: string;
  email: string;
  role: UserRole | string;
  profile: { firstName: string; lastName: string; phone?: string; avatar?: string };
  isEmailVerified: boolean;
  isActive: boolean;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResult<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }
export interface ApiResponse<T> { success: boolean; data: T; message?: string; }
export interface ApiError { success: false; error: string; code: string; details?: unknown; }

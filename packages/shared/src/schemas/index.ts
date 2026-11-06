import { z } from "zod";
import { isValidPermissionKey } from "../constants/permissions.js";

export const loginSchema = z.object({ email: z.string().email().max(255), password: z.string().min(1) });
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.string().min(1).max(50),
  phone: z.string().max(30).optional(),
});
export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z][a-z0-9_-]*$/),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().refine(isValidPermissionKey, "Invalid permission key")).default([]),
});
export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().refine(isValidPermissionKey, "Invalid permission key")).optional(),
  isActive: z.boolean().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

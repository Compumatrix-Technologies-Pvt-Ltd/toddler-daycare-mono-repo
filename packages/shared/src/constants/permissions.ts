export const PERMISSIONS = {
  ADMIN_ACCESS: "admin:access",
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  UPLOADS_READ: "uploads:read",
  UPLOADS_WRITE: "uploads:write",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const PERMISSION_WILDCARD = "*" as const;
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export interface PermissionDefinition { key: Permission; label: string; description: string; module: string; sensitive?: boolean; }

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { key: PERMISSIONS.ADMIN_ACCESS, label: "Access admin", description: "Enter admin console", module: "Access", sensitive: true },
  { key: PERMISSIONS.ROLES_READ, label: "View roles", description: "View roles", module: "Roles" },
  { key: PERMISSIONS.ROLES_WRITE, label: "Manage roles", description: "Create/edit roles", module: "Roles", sensitive: true },
  { key: PERMISSIONS.USERS_READ, label: "View users", description: "View users", module: "Users" },
  { key: PERMISSIONS.USERS_WRITE, label: "Manage users", description: "Create/edit users", module: "Users", sensitive: true },
  { key: PERMISSIONS.UPLOADS_READ, label: "View uploads", description: "View uploads", module: "Uploads" },
  { key: PERMISSIONS.UPLOADS_WRITE, label: "Manage uploads", description: "Upload files", module: "Uploads" },
];

export function hasPermission(granted: readonly string[] | undefined, required: string | string[]): boolean {
  if (!granted?.length) return false;
  if (granted.includes(PERMISSION_WILDCARD)) return true;
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((p) => granted.includes(p));
}

export function isValidPermissionKey(key: string): boolean {
  if (key === PERMISSION_WILDCARD) return true;
  return (ALL_PERMISSIONS as readonly string[]).includes(key);
}

export function sanitizePermissionKeys(keys: readonly string[]): { valid: string[]; invalid: string[] } {
  const invalid: string[] = [];
  const set = new Set<string>();
  for (const k of keys) {
    if (isValidPermissionKey(k)) set.add(k);
    else invalid.push(k);
  }
  return { valid: [...set], invalid };
}

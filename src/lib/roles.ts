import type { SystemRole } from "@/generated/prisma/client";

export const permissions = [
  "organization:manage",
  "members:read",
  "members:manage",
  "audit:read",
  "people:sensitive",
  "finance:read",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions = {
  OWNER: permissions,
  ADMIN: ["organization:manage", "members:read", "members:manage", "audit:read"],
  HR: ["members:read", "people:sensitive"],
  FINANCE: ["finance:read"],
  MANAGER: ["members:read"],
  MEMBER: [],
  VIEWER: [],
} as const satisfies Record<SystemRole, readonly Permission[]>;

export function roleCan(role: SystemRole, permission: Permission) {
  return (rolePermissions[role] as readonly Permission[]).includes(permission);
}

import type { SystemRole } from "@/generated/prisma/client";

export const permissions = [
  "organization:manage",
  "members:read",
  "members:manage",
  "audit:read",
  "people:sensitive",
  "people:manage",
  "attendance:approve",
  "finance:read",
  "finance:manage",
  "crm:read",
  "crm:manage",
  "work:manage",
  "content:manage",
  "live:manage",
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions = {
  OWNER: permissions,
  ADMIN: permissions,
  HR: ["members:read", "people:sensitive", "people:manage", "attendance:approve", "finance:read", "finance:manage"],
  FINANCE: ["finance:read", "finance:manage", "crm:read", "crm:manage"],
  MANAGER: ["members:read", "attendance:approve", "work:manage", "content:manage", "live:manage", "crm:read"],
  MEMBER: [],
  VIEWER: [],
} as const satisfies Record<SystemRole, readonly Permission[]>;

export function roleCan(role: SystemRole, permission: Permission) {
  return (rolePermissions[role] as readonly Permission[]).includes(permission);
}

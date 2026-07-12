import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleCan, type Permission } from "@/lib/roles";

export class AccessDeniedError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Authentication required" : "Permission denied");
  }
}

export async function getCurrentMember() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return db.member.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      organizationId: true,
      departmentId: true,
      role: true,
      status: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function requireMember() {
  const member = await getCurrentMember();
  if (!member) throw new AccessDeniedError(401);
  if (member.status !== "ACTIVE") throw new AccessDeniedError(403);
  return member;
}

export async function requirePermission(permission: Permission) {
  const member = await requireMember();
  if (!roleCan(member.role, permission)) throw new AccessDeniedError(403);
  return member;
}

export async function requirePagePermission(permission?: Permission) {
  try {
    return permission ? await requirePermission(permission) : await requireMember();
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      redirect(error.status === 401 ? "/login" : "/?error=forbidden");
    }
    throw error;
  }
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/authorization";
import { recordAuditEvent } from "@/lib/audit";
import { db } from "@/lib/db";

const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
  role: z.enum(["ADMIN", "HR", "FINANCE", "MANAGER", "MEMBER", "VIEWER"]),
  departmentId: z.string().trim().optional().transform((value) => value || undefined),
});

export async function createMember(formData: FormData) {
  const actor = await requirePermission("members:manage");
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/settings/members?error=invalid-member");

  if (parsed.data.departmentId) {
    const department = await db.department.findFirst({
      where: { id: parsed.data.departmentId, organizationId: actor.organizationId },
      select: { id: true },
    });
    if (!department) redirect("/settings/members?error=invalid-department");
  }

  let userId: string | undefined;
  try {
    const result = await auth.api.signUpEmail({
      body: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password },
    });
    userId = result.user.id;
    await db.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          organizationId: actor.organizationId,
          userId: result.user.id,
          role: parsed.data.role,
          departmentId: parsed.data.departmentId,
        },
      });
      await recordAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "member.created",
        entityType: "Member",
        entityId: member.id,
        metadata: { role: member.role },
      });
    });
  } catch {
    if (userId) await db.user.delete({ where: { id: userId } }).catch(() => undefined);
    redirect("/settings/members?error=create-member");
  }
  redirect("/settings/members?success=member-created");
}

const departmentSchema = z.object({ name: z.string().trim().min(2).max(80) });

export async function createDepartment(formData: FormData) {
  const actor = await requirePermission("organization:manage");
  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/settings/members?error=invalid-department");

  try {
    await db.$transaction(async (tx) => {
      const department = await tx.department.create({
        data: { organizationId: actor.organizationId, name: parsed.data.name },
      });
      await recordAuditEvent(tx, {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "department.created",
        entityType: "Department",
        entityId: department.id,
      });
    });
  } catch {
    redirect("/settings/members?error=create-department");
  }
  redirect("/settings/members?success=department-created");
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { AutomationRuleType } from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/audit";
import { db } from "@/lib/db";

const setupSchema = z.object({
  organizationName: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
});

export async function initializeOwner(formData: FormData) {
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/initialize?error=invalid");

  let userId: string | undefined;
  try {
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026071202)`;
      if (await tx.organization.findUnique({ where: { slug: "default" } })) {
        throw new Error("ALREADY_INITIALIZED");
      }

      const result = await auth.api.signUpEmail({
        body: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password },
      });
      userId = result.user.id;

      const organization = await tx.organization.create({
        data: { name: parsed.data.organizationName, slug: "default" },
      });
      const member = await tx.member.create({
        data: { organizationId: organization.id, userId, role: "OWNER" },
      });
      await tx.automationRule.createMany({ data: Object.values(AutomationRuleType).map((type) => ({ organizationId: organization.id, type })) });
      await recordAuditEvent(tx, {
        organizationId: organization.id,
        actorId: member.id,
        action: "organization.initialized",
        entityType: "Organization",
        entityId: organization.id,
      });
    });
  } catch (error) {
    if (userId) await db.user.delete({ where: { id: userId } }).catch(() => undefined);
    const reason = error instanceof Error && error.message === "ALREADY_INITIALIZED" ? "complete" : "failed";
    redirect(`/initialize?error=${reason}`);
  }

  await auth.api.signInEmail({
    body: { email: parsed.data.email, password: parsed.data.password },
    headers: await headers(),
  });
  redirect("/");
}

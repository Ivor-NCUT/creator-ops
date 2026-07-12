"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCurrentMember } from "@/lib/authorization";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(12).max(128),
});

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=invalid");

  try {
    const result = await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    const member = await db.member.findUnique({
      where: { userId: result.user.id },
      select: { id: true, organizationId: true, status: true },
    });
    if (!member || member.status !== "ACTIVE") {
      await auth.api.signOut({ headers: await headers() });
      redirect("/login?error=invalid");
    }
    await db.auditEvent.create({
      data: {
        organizationId: member.organizationId,
        actorId: member.id,
        action: "auth.signed_in",
        entityType: "Member",
        entityId: member.id,
      },
    });
  } catch {
    redirect("/login?error=invalid");
  }
  redirect("/");
}

export async function signOut() {
  const actor = await getCurrentMember();
  if (actor) {
    await db.auditEvent.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "auth.signed_out",
        entityType: "Member",
        entityId: actor.id,
      },
    });
  }
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

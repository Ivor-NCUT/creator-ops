"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization";
import { db } from "@/lib/db";
import { runAutomationTick } from "@/lib/automations/service";

export async function updateAutomation(formData: FormData) {
  const actor = await requirePermission("organization:manage");
  const parsed = z.object({ id: z.string().min(1), enabled: z.enum(["true", "false"]), recipientId: z.string().optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/settings/automations?error=invalid");
  const recipientId = parsed.data.recipientId || null;
  if (recipientId && !await db.member.findFirst({ where: { id: recipientId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } })) redirect("/settings/automations?error=recipient");
  await db.automationRule.updateMany({ where: { id: parsed.data.id, organizationId: actor.organizationId }, data: { enabled: parsed.data.enabled === "true", recipientId } });
  revalidatePath("/settings/automations"); redirect("/settings/automations?success=updated");
}

export async function runAutomationsNow() {
  await requirePermission("organization:manage");
  await runAutomationTick();
  revalidatePath("/settings/automations"); redirect("/settings/automations?success=run");
}

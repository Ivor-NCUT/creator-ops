"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/authorization";
import { db } from "@/lib/db";
import { roleCan } from "@/lib/roles";
import { optionalDate, requiredDate, safeReturnPath } from "@/lib/work-content/input";
import { transitionAiRequest, transitionContent, transitionProject, transitionTask } from "@/lib/work-content/service";

const optionalId = z.string().trim().optional().transform((value) => value || undefined);
const baseWork = z.object({ title: z.string().trim().min(2).max(160), priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]) });
const managesWork = (actor: Awaited<ReturnType<typeof requireMember>>) => roleCan(actor.role, "work:manage");
const managesContent = (actor: Awaited<ReturnType<typeof requireMember>>) => roleCan(actor.role, "content:manage");

export async function createProject(formData: FormData) {
  const actor = await requireMember();
  const parsed = baseWork.extend({ description: z.string().trim().max(4000).optional(), ownerId: z.string(), dueAt: optionalDate }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/work?error=invalid-project");
  const owner = await db.member.findFirst({ where: { id: parsed.data.ownerId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } });
  if (!owner || (!managesWork(actor) && owner.id !== actor.id)) redirect("/work?error=invalid-owner");
  const project = await db.project.create({ data: { organizationId: actor.organizationId, name: parsed.data.title, description: parsed.data.description, priority: parsed.data.priority, ownerId: owner.id, dueAt: parsed.data.dueAt, members: { create: { memberId: owner.id } } } });
  revalidatePath("/work");
  redirect(`/work/projects/${project.id}`);
}

export async function createTask(formData: FormData) {
  const actor = await requireMember();
  const parsed = baseWork.extend({ projectId: z.string(), assigneeId: optionalId, dueAt: optionalDate, points: z.coerce.number().int().min(0).max(100).default(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/work?error=invalid-task");
  const project = await db.project.findFirst({ where: { id: parsed.data.projectId, organizationId: actor.organizationId, ...(managesWork(actor) ? {} : { OR: [{ ownerId: actor.id }, { members: { some: { memberId: actor.id } } }] }) }, select: { id: true } });
  const assignee = parsed.data.assigneeId ? await db.member.findFirst({ where: { id: parsed.data.assigneeId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } }) : null;
  if (!project || (parsed.data.assigneeId && !assignee)) redirect("/work?error=invalid-task-relations");
  await db.task.create({ data: { organizationId: actor.organizationId, projectId: project.id, title: parsed.data.title, priority: parsed.data.priority, assigneeId: assignee?.id, dueAt: parsed.data.dueAt, points: parsed.data.points } });
  revalidatePath("/work");
  redirect(`/work/projects/${project.id}?success=task-created`);
}

export async function createAiRequest(formData: FormData) {
  const actor = await requireMember();
  const parsed = baseWork.extend({ problem: z.string().trim().min(4).max(4000), expectedOutcome: z.string().trim().min(4).max(4000), projectId: optionalId, ownerId: optionalId, dueAt: optionalDate }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/work?error=invalid-ai-request");
  if (parsed.data.projectId && !await db.project.findFirst({ where: { id: parsed.data.projectId, organizationId: actor.organizationId, ...(managesWork(actor) ? {} : { OR: [{ ownerId: actor.id }, { members: { some: { memberId: actor.id } } }] }) }, select: { id: true } })) redirect("/work?error=invalid-ai-project");
  if (parsed.data.ownerId && !await db.member.findFirst({ where: { id: parsed.data.ownerId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } })) redirect("/work?error=invalid-ai-owner");
  await db.aiRequest.create({ data: { organizationId: actor.organizationId, title: parsed.data.title, problem: parsed.data.problem, expectedOutcome: parsed.data.expectedOutcome, priority: parsed.data.priority, requesterId: actor.id, projectId: parsed.data.projectId, ownerId: parsed.data.ownerId, dueAt: parsed.data.dueAt } });
  revalidatePath("/work");
  redirect("/work?success=ai-request-created");
}

const transitionSchema = z.object({ id: z.string(), status: z.string(), returnTo: safeReturnPath });
async function performTransition(formData: FormData, kind: "project" | "task" | "ai" | "content") {
  const actor = await requireMember();
  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/?error=invalid-transition");
  try {
    if (kind === "project") await transitionProject(actor, parsed.data.id, z.enum(["PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]).parse(parsed.data.status));
    if (kind === "task") await transitionTask(actor, parsed.data.id, z.enum(["PLANNED", "ACTIVE", "BLOCKED", "DONE", "CANCELLED"]).parse(parsed.data.status));
    if (kind === "ai") await transitionAiRequest(actor, parsed.data.id, z.enum(["SUBMITTED", "TRIAGED", "IN_PROGRESS", "VALIDATING", "DELIVERED", "REJECTED"]).parse(parsed.data.status));
    if (kind === "content") await transitionContent(actor, parsed.data.id, z.enum(["IDEA", "READY_TO_SHOOT", "ROUGH_CUT", "FINE_CUT", "REVIEW", "RETAKE", "REJECTED", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).parse(parsed.data.status));
  } catch {
    redirect(`${parsed.data.returnTo}?error=invalid-transition`);
  }
  revalidatePath(parsed.data.returnTo);
  redirect(`${parsed.data.returnTo}?success=status-updated`);
}

export async function changeProjectStatus(formData: FormData) { return performTransition(formData, "project"); }
export async function changeTaskStatus(formData: FormData) { return performTransition(formData, "task"); }
export async function changeAiStatus(formData: FormData) { return performTransition(formData, "ai"); }
export async function changeContentStatus(formData: FormData) { return performTransition(formData, "content"); }

export async function createContent(formData: FormData) {
  const actor = await requireMember();
  const parsed = z.object({ title: z.string().trim().min(2).max(160), type: z.enum(["VIDEO", "ARTICLE", "BOOK"]), ownerId: z.string(), profileId: optionalId, projectId: optionalId, priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]), plannedAt: optionalDate, dueAt: optionalDate, topic: z.string().trim().max(500).optional(), workloadPoints: z.coerce.number().int().min(0).max(100).default(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/content?error=invalid-content");
  const owner = await db.member.findFirst({ where: { id: parsed.data.ownerId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } });
  if (!owner || (!managesContent(actor) && owner.id !== actor.id)) redirect("/content?error=invalid-owner");
  if (parsed.data.profileId && !await db.contentProfile.findFirst({ where: { id: parsed.data.profileId, organizationId: actor.organizationId }, select: { id: true } })) redirect("/content?error=invalid-profile");
  if (parsed.data.projectId && !await db.project.findFirst({ where: { id: parsed.data.projectId, organizationId: actor.organizationId }, select: { id: true } })) redirect("/content?error=invalid-project");
  const content = await db.$transaction(async (tx) => {
    const item = await tx.contentItem.create({ data: { organizationId: actor.organizationId, title: parsed.data.title, type: parsed.data.type, ownerId: owner.id, profileId: parsed.data.profileId, projectId: parsed.data.projectId, priority: parsed.data.priority, plannedAt: parsed.data.plannedAt, dueAt: parsed.data.dueAt, assignments: { create: { memberId: owner.id, role: "OWNER" } }, statusHistory: { create: { toStatus: "IDEA", actorId: actor.id } } } });
    if (parsed.data.type === "VIDEO") await tx.videoDetail.create({ data: { contentId: item.id, workloadPoints: parsed.data.workloadPoints } });
    else await tx.editorialDetail.create({ data: { contentId: item.id, topic: parsed.data.topic, workloadPoints: parsed.data.workloadPoints } });
    await tx.workEvent.create({ data: { organizationId: actor.organizationId, memberId: owner.id, contentId: item.id, type: "CONTENT_CREATED", points: parsed.data.workloadPoints } });
    return item;
  });
  revalidatePath("/content");
  redirect(`/content/${content.id}`);
}

export async function createPublishingProfile(formData: FormData) {
  const actor = await requireMember();
  if (!managesContent(actor)) redirect("/content?error=forbidden");
  const parsed = z.object({ kind: z.enum(["profile", "account"]), name: z.string().trim().min(2).max(100), channel: z.string().trim().max(60).optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/content?error=invalid-reference");
  if (parsed.data.kind === "profile") await db.contentProfile.create({ data: { organizationId: actor.organizationId, name: parsed.data.name } });
  else if (parsed.data.channel) await db.publishingAccount.create({ data: { organizationId: actor.organizationId, name: parsed.data.name, channel: parsed.data.channel } });
  else redirect("/content?error=invalid-reference");
  revalidatePath("/content");
  redirect("/content?success=reference-created");
}

export async function publishContent(formData: FormData) {
  const actor = await requireMember();
  const parsed = z.object({ contentId: z.string(), accountId: z.string(), publishedAt: requiredDate, url: z.url().optional().or(z.literal("")) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/content?error=invalid-publication");
  const [content, account] = await Promise.all([db.contentItem.findFirst({ where: { id: parsed.data.contentId, organizationId: actor.organizationId, status: "PUBLISHED", ...(managesContent(actor) ? {} : { OR: [{ ownerId: actor.id }, { assignments: { some: { memberId: actor.id } } }] }) }, select: { id: true } }), db.publishingAccount.findFirst({ where: { id: parsed.data.accountId, organizationId: actor.organizationId }, select: { id: true } })]);
  if (!content || !account) redirect("/content?error=invalid-publication-relations");
  await db.$transaction(async (tx) => {
    await tx.publication.create({ data: { organizationId: actor.organizationId, contentId: content.id, accountId: account.id, publishedAt: parsed.data.publishedAt, url: parsed.data.url || null } });
    await tx.workEvent.create({ data: { organizationId: actor.organizationId, contentId: content.id, memberId: actor.id, type: "CONTENT_PUBLISHED", points: 1 } });
  });
  revalidatePath(`/content/${content.id}`);
  redirect(`/content/${content.id}?success=published`);
}

export async function captureMetrics(formData: FormData) {
  const actor = await requireMember();
  const parsed = z.object({ publicationId: z.string(), contentId: z.string(), capturedAt: requiredDate, views: z.coerce.number().int().min(0), likes: z.coerce.number().int().min(0), comments: z.coerce.number().int().min(0), shares: z.coerce.number().int().min(0) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/content/${String(formData.get("contentId") ?? "")}?error=invalid-metrics`);
  const publication = await db.publication.findFirst({ where: { id: parsed.data.publicationId, organizationId: actor.organizationId, contentId: parsed.data.contentId, ...(managesContent(actor) ? {} : { content: { OR: [{ ownerId: actor.id }, { assignments: { some: { memberId: actor.id } } }] } }) }, select: { id: true } });
  if (!publication) redirect(`/content/${parsed.data.contentId}?error=invalid-publication`);
  await db.publicationMetricSnapshot.create({ data: { publicationId: publication.id, capturedAt: parsed.data.capturedAt, views: parsed.data.views, likes: parsed.data.likes, comments: parsed.data.comments, shares: parsed.data.shares } });
  revalidatePath(`/content/${parsed.data.contentId}`);
  redirect(`/content/${parsed.data.contentId}?success=metrics-captured`);
}

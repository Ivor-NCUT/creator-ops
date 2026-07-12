import type { AiRequestStatus, ContentStatus, WorkStatus } from "@/generated/prisma/client";
import { AccessDeniedError } from "@/lib/authorization";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { roleCan } from "@/lib/roles";
import { canTransitionAi, canTransitionContent, canTransitionWork } from "./state-machines";

type Actor = Awaited<ReturnType<typeof import("@/lib/authorization").requireMember>>;

function canManage(actor: Actor, permission: "work:manage" | "content:manage") {
  return roleCan(actor.role, permission);
}

export async function transitionProject(actor: Actor, id: string, to: WorkStatus) {
  const project = await db.project.findFirst({ where: { id, organizationId: actor.organizationId }, select: { status: true, ownerId: true } });
  if (!project) throw new Error("Project not found");
  if (!canManage(actor, "work:manage") && project.ownerId !== actor.id) throw new AccessDeniedError(403);
  if (!canTransitionWork(project.status, to)) throw new Error("Invalid project transition");
  await db.$transaction(async (tx) => {
    const changed = await tx.project.updateMany({ where: { id, organizationId: actor.organizationId, status: project.status }, data: { status: to } });
    if (changed.count !== 1) throw new Error("Project changed; reload and retry");
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "project.status_changed", entityType: "Project", entityId: id, metadata: { from: project.status, to } });
  });
}

export async function transitionTask(actor: Actor, id: string, to: WorkStatus) {
  const task = await db.task.findFirst({ where: { id, organizationId: actor.organizationId }, select: { status: true, assigneeId: true } });
  if (!task) throw new Error("Task not found");
  if (!canManage(actor, "work:manage") && task.assigneeId !== actor.id) throw new AccessDeniedError(403);
  if (!canTransitionWork(task.status, to)) throw new Error("Invalid task transition");
  await db.$transaction(async (tx) => {
    const changed = await tx.task.updateMany({ where: { id, organizationId: actor.organizationId, status: task.status }, data: { status: to, completedAt: to === "DONE" ? new Date() : null } });
    if (changed.count !== 1) throw new Error("Task changed; reload and retry");
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "task.status_changed", entityType: "Task", entityId: id, metadata: { from: task.status, to } });
  });
}

export async function transitionAiRequest(actor: Actor, id: string, to: AiRequestStatus) {
  const request = await db.aiRequest.findFirst({ where: { id, organizationId: actor.organizationId }, select: { status: true, requesterId: true, ownerId: true } });
  if (!request) throw new Error("AI request not found");
  if (!canManage(actor, "work:manage") && request.requesterId !== actor.id && request.ownerId !== actor.id) throw new AccessDeniedError(403);
  if (!canTransitionAi(request.status, to)) throw new Error("Invalid AI request transition");
  await db.$transaction(async (tx) => {
    const changed = await tx.aiRequest.updateMany({ where: { id, organizationId: actor.organizationId, status: request.status }, data: { status: to } });
    if (changed.count !== 1) throw new Error("AI request changed; reload and retry");
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "ai_request.status_changed", entityType: "AiRequest", entityId: id, metadata: { from: request.status, to } });
  });
}

export async function transitionContent(actor: Actor, id: string, to: ContentStatus, note?: string) {
  const content = await db.contentItem.findFirst({
    where: { id, organizationId: actor.organizationId },
    select: { status: true, ownerId: true, assignments: { where: { memberId: actor.id }, select: { memberId: true } } },
  });
  if (!content) throw new Error("Content not found");
  if (!canManage(actor, "content:manage") && content.ownerId !== actor.id && content.assignments.length === 0) throw new AccessDeniedError(403);
  if (!canTransitionContent(content.status, to)) throw new Error("Invalid content transition");

  await db.$transaction(async (tx) => {
    const changed = await tx.contentItem.updateMany({ where: { id, organizationId: actor.organizationId, status: content.status }, data: { status: to } });
    if (changed.count !== 1) throw new Error("Content changed; reload and retry");
    const occurredAt = new Date();
    await tx.contentStatusHistory.create({ data: { contentId: id, fromStatus: content.status, toStatus: to, actorId: actor.id, note } });
    await tx.workEvent.create({ data: { organizationId: actor.organizationId, contentId: id, memberId: actor.id, type: "CONTENT_TRANSITION", points: 1, occurredAt } });
  });
}

export async function getWorkload(organizationId: string, from: Date, to: Date) {
  const [tasks, events] = await Promise.all([
    db.task.groupBy({ by: ["assigneeId"], where: { organizationId, status: "DONE", completedAt: { gte: from, lt: to }, assigneeId: { not: null } }, _sum: { points: true } }),
    db.workEvent.groupBy({ by: ["memberId"], where: { organizationId, occurredAt: { gte: from, lt: to } }, _sum: { points: true } }),
  ]);
  const points = new Map<string, number>();
  for (const row of tasks) if (row.assigneeId) points.set(row.assigneeId, row._sum.points ?? 0);
  for (const row of events) points.set(row.memberId, (points.get(row.memberId) ?? 0) + (row._sum.points ?? 0));
  const members = await db.member.findMany({ where: { organizationId, id: { in: [...points.keys()] } }, select: { id: true, user: { select: { name: true } } } });
  return members.map((member) => ({ memberId: member.id, name: member.user.name, points: points.get(member.id) ?? 0 })).sort((a, b) => b.points - a.points);
}

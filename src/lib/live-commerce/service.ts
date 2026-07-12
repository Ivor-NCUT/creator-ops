import type { FeedbackStatus, LiveSessionStatus } from "@/generated/prisma/client";
import { AccessDeniedError } from "@/lib/authorization";
import { db } from "@/lib/db";
import { roleCan } from "@/lib/roles";
import { canTransitionFeedback, canTransitionLive } from "./state-machines";

type Actor = Awaited<ReturnType<typeof import("@/lib/authorization").requireMember>>;

function canManage(actor: Actor) { return roleCan(actor.role, "live:manage"); }

export async function transitionLiveSession(actor: Actor, id: string, to: LiveSessionStatus, note?: string) {
  const session = await db.liveSession.findFirst({ where: { id, organizationId: actor.organizationId }, select: { status: true, ownerId: true, reviewSummary: true } });
  if (!session) throw new Error("Live session not found");
  if (!canManage(actor) && session.ownerId !== actor.id) throw new AccessDeniedError(403);
  if (!canTransitionLive(session.status, to)) throw new Error("Invalid live session transition");
  if (to === "REVIEWED" && !session.reviewSummary?.trim()) throw new Error("Review required");
  await db.$transaction(async (tx) => {
    const changed = await tx.liveSession.updateMany({ where: { id, organizationId: actor.organizationId, status: session.status }, data: { status: to } });
    if (changed.count !== 1) throw new Error("Live session changed; reload and retry");
    await tx.liveSessionStatusHistory.create({ data: { liveSessionId: id, fromStatus: session.status, toStatus: to, actorId: actor.id, note } });
  });
}

export async function transitionFeedback(actor: Actor, id: string, to: FeedbackStatus, note?: string, resolution?: string) {
  const feedback = await db.customerFeedback.findFirst({ where: { id, organizationId: actor.organizationId }, select: { status: true, assigneeId: true } });
  if (!feedback) throw new Error("Feedback not found");
  if (!canManage(actor) && feedback.assigneeId !== actor.id) throw new AccessDeniedError(403);
  if (!canTransitionFeedback(feedback.status, to)) throw new Error("Invalid feedback transition");
  if (to === "RESOLVED" && !resolution?.trim()) throw new Error("Resolution required");
  await db.$transaction(async (tx) => {
    const changed = await tx.customerFeedback.updateMany({
      where: { id, organizationId: actor.organizationId, status: feedback.status },
      data: { status: to, resolution: resolution?.trim() || undefined, resolvedAt: to === "RESOLVED" || to === "CLOSED" ? new Date() : null },
    });
    if (changed.count !== 1) throw new Error("Feedback changed; reload and retry");
    await tx.feedbackStatusHistory.create({ data: { feedbackId: id, fromStatus: feedback.status, toStatus: to, actorId: actor.id, note, resolution: resolution?.trim() || null } });
  });
}

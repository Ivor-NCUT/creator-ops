import type { AutomationRule } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type RuleConfig = { leadMinutes?: number; daysBefore?: number; slaHours?: number };
type Notice = { recipientId: string; title: string; body: string; href: string; eventKey: string };
const finalContent = ["FINE_CUT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;

function bounded(value: unknown, fallback: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max ? value : fallback;
}

function config(rule: AutomationRule) {
  const value = rule.config && typeof rule.config === "object" && !Array.isArray(rule.config) ? rule.config as RuleConfig : {};
  return { leadMinutes: bounded(value.leadMinutes, 60, 10080), daysBefore: bounded(value.daysBefore, 30, 365), slaHours: bounded(value.slaHours, 48, 720) };
}

async function ownerIds(organizationId: string) {
  return (await db.member.findMany({ where: { organizationId, status: "ACTIVE", role: "OWNER" }, select: { id: true } })).map(({ id }) => id);
}

async function noticesForRule(rule: AutomationRule, now: Date): Promise<Notice[]> {
  const settings = config(rule);
  if (rule.type === "LIVE_REMINDER") {
    const end = new Date(now.getTime() + settings.leadMinutes * 60_000);
    const rows = await db.liveSession.findMany({ where: { organizationId: rule.organizationId, status: { in: ["PLANNED", "CONFIRMED"] }, startsAt: { gte: now, lte: end } }, select: { id: true, title: true, startsAt: true, ownerId: true, staff: { select: { memberId: true } } } });
    return rows.flatMap((row) => [...new Set([rule.recipientId, row.ownerId, ...row.staff.map(({ memberId }) => memberId)].filter(Boolean) as string[])].map((recipientId) => ({ recipientId, title: "直播即将开始", body: `${row.title} 将于 ${row.startsAt.toISOString()} 开始`, href: `/live/${row.id}`, eventKey: `live:${row.id}:${row.startsAt.toISOString()}` })));
  }
  if (rule.type === "CONTRACT_EXPIRY") {
    const end = new Date(now.getTime() + settings.daysBefore * 86_400_000);
    const rows = await db.contract.findMany({ where: { organizationId: rule.organizationId, status: "ACTIVE", endsOn: { gte: now, lte: end } }, select: { id: true, title: true, endsOn: true, ownerId: true } });
    return rows.map((row) => ({ recipientId: rule.recipientId ?? row.ownerId, title: "合同即将到期", body: `${row.title} 将于 ${row.endsOn?.toISOString().slice(0, 10)} 到期`, href: "/business/contracts", eventKey: `contract:${row.id}:${row.endsOn?.toISOString()}` }));
  }
  if (rule.type === "NEGATIVE_FEEDBACK") {
    const rows = await db.customerFeedback.findMany({ where: { organizationId: rule.organizationId, isNegative: true, status: { notIn: ["RESOLVED", "CLOSED"] } }, select: { id: true, title: true, assigneeId: true, createdAt: true } });
    const fallback = rule.recipientId ? [rule.recipientId] : await ownerIds(rule.organizationId);
    return rows.flatMap((row) => (row.assigneeId ? [row.assigneeId] : fallback).map((recipientId) => ({ recipientId, title: "负面评价待处理", body: row.title, href: "/live/feedback", eventKey: `feedback:${row.id}:${row.createdAt.toISOString()}` })));
  }
  if (rule.type === "VIDEO_SLA") {
    const cutoff = new Date(now.getTime() - settings.slaHours * 3_600_000);
    const rows = await db.contentItem.findMany({ where: { organizationId: rule.organizationId, type: "VIDEO", status: { notIn: [...finalContent] }, video: { slaStartedAt: { lte: cutoff } } }, select: { id: true, title: true, ownerId: true, video: { select: { slaStartedAt: true } } } });
    return rows.map((row) => ({ recipientId: rule.recipientId ?? row.ownerId, title: "视频制作超过 SLA", body: row.title, href: `/content/${row.id}`, eventKey: `video-sla:${row.id}:${row.video?.slaStartedAt?.toISOString()}` }));
  }
  const recipients = rule.recipientId ? [rule.recipientId] : await ownerIds(rule.organizationId);
  const [projects, payments] = await Promise.all([
    db.project.findMany({ where: { organizationId: rule.organizationId, dueAt: { lt: now }, status: { notIn: ["DONE", "CANCELLED"] } }, select: { id: true, name: true, dueAt: true } }),
    db.paymentItem.findMany({ where: { organizationId: rule.organizationId, dueOn: { lt: now }, status: { in: ["OPEN", "PARTIAL"] } }, select: { id: true, title: true, direction: true, dueOn: true } }),
  ]);
  return recipients.flatMap((recipientId) => [
    ...projects.map((row) => ({ recipientId, title: "项目已逾期", body: row.name, href: `/work/projects/${row.id}`, eventKey: `project-overdue:${row.id}:${row.dueAt?.toISOString()}` })),
    ...payments.map((row) => ({ recipientId, title: row.direction === "RECEIVABLE" ? "应收款已逾期" : "应付款已逾期", body: row.title, href: "/business/payments", eventKey: `payment-overdue:${row.id}:${row.dueOn?.toISOString()}` })),
  ]);
}

export function tickKey(ruleId: string, now: Date) {
  return `${ruleId}:${now.toISOString().slice(0, 13)}`;
}

async function runRule(rule: AutomationRule, now: Date) {
  const idempotencyKey = tickKey(rule.id, now);
  const previous = await db.automationRun.findUnique({ where: { organizationId_idempotencyKey: { organizationId: rule.organizationId, idempotencyKey } } });
  if (previous?.status === "SUCCEEDED" || previous?.status === "RUNNING") return previous;
  const run = previous
    ? await db.automationRun.update({ where: { id: previous.id }, data: { status: "RUNNING", error: null, finishedAt: null, attempt: { increment: 1 } } })
    : await db.automationRun.create({ data: { organizationId: rule.organizationId, ruleId: rule.id, idempotencyKey } });
  try {
    const notices = await noticesForRule(rule, now);
    let created = 0;
    for (const notice of notices) {
      const dedupeKey = `${rule.organizationId}:${rule.type}:${notice.eventKey}:${notice.recipientId}`;
      const result = await db.notification.createMany({ data: [{ organizationId: rule.organizationId, recipientId: notice.recipientId, title: notice.title, body: notice.body, href: notice.href, dedupeKey }], skipDuplicates: true });
      created += result.count;
    }
    return await db.automationRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", notifications: created, finishedAt: new Date() } });
  } catch (error) {
    return db.automationRun.update({ where: { id: run.id }, data: { status: "FAILED", error: error instanceof Error ? error.message.slice(0, 2000) : "Unknown automation error", finishedAt: new Date() } });
  }
}

export async function runAutomationTick(now = new Date()) {
  const rules = await db.automationRule.findMany({ where: { enabled: true }, orderBy: [{ organizationId: "asc" }, { type: "asc" }] });
  const settled = await Promise.allSettled(rules.map((rule) => runRule(rule, now)));
  return settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
}

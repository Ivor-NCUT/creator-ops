import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { DashboardDomain } from "./access";
import { balance, safeRate } from "./calculations";

type Actor = { organizationId: string; departmentId: string | null; role: string };
type Range = { from: Date; to: Date };
const zero = () => new Prisma.Decimal(0);
const departmentFilter = (actor: Actor) => actor.role === "MANAGER" ? { departmentId: actor.departmentId ?? "__none__" } : {};

export async function getDashboard(actor: Actor, range: Range, domains: DashboardDomain[]) {
  const owner = departmentFilter(actor);
  const asOf = new Date(Math.min(Date.now(), range.to.getTime()));
  const result: Record<string, unknown> = {};
  if (domains.includes("content")) {
    const [items, publications] = await Promise.all([
      db.contentItem.findMany({ where: { organizationId: actor.organizationId, createdAt: { gte: range.from, lt: range.to }, owner: owner }, select: { id: true, title: true, type: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
      db.publication.findMany({ where: { organizationId: actor.organizationId, publishedAt: { gte: range.from, lt: range.to }, content: { owner } }, select: { id: true, contentId: true, metricSnapshots: { where: { capturedAt: { lt: range.to } }, orderBy: { capturedAt: "desc" }, take: 1, select: { views: true, likes: true, comments: true, shares: true } } } }),
    ]);
    result.content = { created: items.length, published: publications.length, views: publications.reduce((sum, row) => sum + (row.metricSnapshots[0]?.views ?? 0), 0), records: items };
  }
  if (domains.includes("live")) {
    const sessions = await db.liveSession.findMany({ where: { organizationId: actor.organizationId, startsAt: { gte: range.from, lt: range.to }, owner }, select: { id: true, title: true, startsAt: true, status: true, viewers: true, productPerformance: { select: { gmv: true, refundAmount: true, orders: true } } }, orderBy: { startsAt: "desc" } });
    const totals = sessions.flatMap((session) => session.productPerformance).reduce((sum, row) => ({ gmv: sum.gmv.add(row.gmv), refunds: sum.refunds.add(row.refundAmount), orders: sum.orders + row.orders }), { gmv: zero(), refunds: zero(), orders: 0 });
    result.live = { sessions: sessions.length, viewers: sessions.reduce((sum, row) => sum + row.viewers, 0), ...totals, refundRate: safeRate(totals.refunds, totals.gmv), records: sessions };
  }
  if (domains.includes("projects")) {
    const projects = await db.project.findMany({ where: { organizationId: actor.organizationId, createdAt: { gte: range.from, lt: range.to }, owner }, select: { id: true, name: true, status: true, dueAt: true, owner: { select: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } });
    result.projects = { total: projects.length, done: projects.filter((row) => row.status === "DONE").length, overdue: projects.filter((row) => row.dueAt && row.dueAt < asOf && !["DONE", "CANCELLED"].includes(row.status)).length, records: projects };
  }
  if (domains.includes("people")) {
    const [headcount, payroll, exceptions] = await Promise.all([
      db.employeeProfile.count({ where: { organizationId: actor.organizationId, hiredAt: { lt: range.to }, OR: [{ endedAt: null }, { endedAt: { gte: range.to } }] } }),
      db.payrollMonth.findMany({ where: { organizationId: actor.organizationId, year: { gte: range.from.getUTCFullYear(), lte: range.to.getUTCFullYear() } }, select: { id: true, year: true, month: true, netPay: true, employee: { select: { member: { select: { user: { select: { name: true } } } } } } }, orderBy: [{ year: "desc" }, { month: "desc" }] }),
      db.attendanceException.count({ where: { organizationId: actor.organizationId, status: "PENDING", createdAt: { gte: range.from, lt: range.to } } }),
    ]);
    const payrollInRange = payroll.filter((row) => { const month = new Date(Date.UTC(row.year, row.month - 1, 1)); return month >= range.from && month < range.to; });
    result.people = { headcount, pendingExceptions: exceptions, payroll: payrollInRange.reduce((sum, row) => sum.add(row.netPay), zero()), records: payrollInRange };
  }
  if (domains.includes("cash")) {
    const items = await db.paymentItem.findMany({ where: { organizationId: actor.organizationId, createdAt: { lt: range.to } }, select: { id: true, title: true, direction: true, status: true, amount: true, paidAmount: true, dueOn: true, party: { select: { name: true } }, payments: { where: { paidOn: { lt: range.to } }, select: { amount: true } } }, orderBy: { dueOn: "asc" } });
    const outstanding = (direction: "RECEIVABLE" | "PAYABLE") => items.filter((row) => row.direction === direction).reduce((sum, row) => sum.add(balance(row.amount, row.payments.map(({ amount }) => amount))), zero());
    result.cash = { receivable: outstanding("RECEIVABLE"), payable: outstanding("PAYABLE"), overdue: items.filter((row) => row.dueOn && row.dueOn < asOf && balance(row.amount, row.payments.map(({ amount }) => amount)).gt(0)).length, records: items };
  }
  return result;
}

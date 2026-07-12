import type { ApprovalStatus } from "@/generated/prisma/client";
import { AccessDeniedError } from "@/lib/authorization";
import { recordAuditEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { canApproveAttendance, type PeopleActor } from "./access";
import { summarizeAttendance } from "./calculations";

type Actor = PeopleActor & { id: string; organizationId: string };

export async function decideAttendance(actor: Actor, id: string, to: Extract<ApprovalStatus, "APPROVED" | "REJECTED">, note?: string) {
  const exception = await db.attendanceException.findFirst({ where: { id, organizationId: actor.organizationId }, select: { status: true, employee: { select: { member: { select: { departmentId: true } } } } } });
  if (!exception) throw new Error("Attendance exception not found");
  if (!canApproveAttendance(actor, exception.employee.member.departmentId)) throw new AccessDeniedError(403);
  if (exception.status !== "PENDING") throw new Error("Attendance exception already decided");
  await db.$transaction(async (tx) => {
    const changed = await tx.attendanceException.updateMany({ where: { id, organizationId: actor.organizationId, status: "PENDING" }, data: { status: to, approvedById: actor.id, decidedAt: new Date() } });
    if (changed.count !== 1) throw new Error("Attendance exception changed; reload and retry");
    await tx.attendanceApprovalHistory.create({ data: { exceptionId: id, fromStatus: "PENDING", toStatus: to, actorId: actor.id, note: note || null } });
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "attendance.decide", entityType: "AttendanceException", entityId: id, metadata: { to } });
  });
}

export async function rebuildMonthlyAttendance(actor: Actor, employeeId: string, year: number, month: number) {
  const employee = await db.employeeProfile.findFirst({ where: { id: employeeId, organizationId: actor.organizationId }, select: { id: true, member: { select: { departmentId: true } } } });
  if (!employee) throw new Error("Employee not found");
  if (!canApproveAttendance(actor, employee.member.departmentId)) throw new AccessDeniedError(403);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const approved = await db.attendanceException.findMany({ where: { organizationId: actor.organizationId, employeeId, status: "APPROVED", occurredOn: { gte: start, lt: end } }, select: { kind: true, minutes: true, days: true } });
  const summary = summarizeAttendance(approved);
  await db.$transaction(async (tx) => {
    const row = await tx.monthlyAttendance.upsert({ where: { employeeId_year_month: { employeeId, year, month } }, create: { organizationId: actor.organizationId, employeeId, year, month, ...summary }, update: summary });
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "attendance.summarize", entityType: "MonthlyAttendance", entityId: row.id, metadata: { year, month } });
  });
}

export async function decideMajorError(actor: Actor, id: string, to: "CONFIRMED" | "DISMISSED") {
  if (!["OWNER", "ADMIN", "HR"].includes(actor.role)) throw new AccessDeniedError(403);
  await db.$transaction(async (tx) => {
    const changed = await tx.majorError.updateMany({ where: { id, organizationId: actor.organizationId, status: "REPORTED" }, data: { status: to, reviewedById: actor.id, reviewedAt: new Date() } });
    if (changed.count !== 1) throw new Error("Major error changed; reload and retry");
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "major-error.decide", entityType: "MajorError", entityId: id, metadata: { to } });
  });
}

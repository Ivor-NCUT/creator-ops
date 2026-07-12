"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/authorization";
import { recordAuditEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { canManageFinance, canManagePeople } from "@/lib/people-finance/access";
import { calculateNetPay } from "@/lib/people-finance/calculations";
import { attendanceDecisionInput, attendanceInput, employeeInput, majorErrorInput, payrollInput } from "@/lib/people-finance/input";
import { decideAttendance, decideMajorError, rebuildMonthlyAttendance } from "@/lib/people-finance/service";

const optional = (value?: string) => value || null;

export async function createEmployee(formData: FormData) {
  const actor = await requireMember();
  if (!canManagePeople(actor)) redirect("/people?error=forbidden");
  const parsed = employeeInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/people?error=invalid-employee");
  const member = await db.member.findFirst({ where: { id: parsed.data.memberId, organizationId: actor.organizationId }, select: { id: true } });
  if (!member) redirect("/people?error=invalid-member");
  const { memberId, employeeNo, jobTitle, employmentStatus, hiredAt, legalName, idType, idNumber, phone, personalEmail, address, emergencyContact, emergencyPhone, baseSalary, currency } = parsed.data;
  await db.$transaction(async (tx) => {
    const employee = await tx.employeeProfile.create({ data: { organizationId: actor.organizationId, memberId, employeeNo, jobTitle: optional(jobTitle), employmentStatus, hiredAt, identity: { create: { legalName, idType: optional(idType), idNumber: optional(idNumber), phone: optional(phone), personalEmail: optional(personalEmail), address: optional(address), emergencyContact: optional(emergencyContact), emergencyPhone: optional(emergencyPhone) } }, compensation: { create: { baseSalary, currency } } } });
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "employee.create", entityType: "EmployeeProfile", entityId: employee.id });
  });
  revalidatePath("/people"); redirect("/people?success=employee-created");
}

export async function submitAttendanceException(formData: FormData) {
  const actor = await requireMember();
  const parsed = attendanceInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/people/attendance?error=invalid-attendance");
  const employee = await db.employeeProfile.findFirst({ where: { id: parsed.data.employeeId, organizationId: actor.organizationId }, select: { id: true, memberId: true } });
  if (!employee || (employee.memberId !== actor.id && !canManagePeople(actor))) redirect("/people/attendance?error=forbidden");
  await db.$transaction(async (tx) => {
    const row = await tx.attendanceException.create({ data: { organizationId: actor.organizationId, employeeId: employee.id, occurredOn: parsed.data.occurredOn, kind: parsed.data.kind, minutes: parsed.data.minutes, days: optional(parsed.data.days), reason: parsed.data.reason, submittedById: actor.id, history: { create: { toStatus: "PENDING", actorId: actor.id } } } });
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "attendance.submit", entityType: "AttendanceException", entityId: row.id });
  });
  revalidatePath("/people/attendance"); redirect("/people/attendance?success=attendance-submitted");
}

export async function decideAttendanceException(formData: FormData) {
  const actor = await requireMember(); const parsed = attendanceDecisionInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/people/attendance?error=invalid-decision");
  try { await decideAttendance(actor, parsed.data.id, parsed.data.to, parsed.data.note); } catch { redirect("/people/attendance?error=decision-failed"); }
  revalidatePath("/people/attendance"); redirect("/people/attendance?success=attendance-decided");
}

export async function summarizeAttendanceMonth(formData: FormData) {
  const actor = await requireMember(); const employeeId = String(formData.get("employeeId") ?? ""); const year = Number(formData.get("year")); const month = Number(formData.get("month"));
  if (!employeeId || !Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) redirect("/people/attendance?error=invalid-month");
  try { await rebuildMonthlyAttendance(actor, employeeId, year, month); } catch { redirect("/people/attendance?error=summary-failed"); }
  revalidatePath("/people/attendance"); redirect("/people/attendance?success=summary-rebuilt");
}

export async function savePayrollMonth(formData: FormData) {
  const actor = await requireMember(); if (!canManageFinance(actor)) redirect("/people/payroll?error=forbidden");
  const parsed = payrollInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) redirect("/people/payroll?error=invalid-payroll");
  const employee = await db.employeeProfile.findFirst({ where: { id: parsed.data.employeeId, organizationId: actor.organizationId }, select: { id: true } }); if (!employee) redirect("/people/payroll?error=invalid-employee");
  const { employeeId, year, month, ...parts } = parsed.data; const netPay = calculateNetPay(parts); if (netPay.isNegative()) redirect("/people/payroll?error=negative-net");
  await db.$transaction(async (tx) => {
    const row = await tx.payrollMonth.upsert({ where: { employeeId_year_month: { employeeId, year, month } }, create: { organizationId: actor.organizationId, employeeId, year, month, ...parts, note: optional(parts.note), netPay }, update: { ...parts, note: optional(parts.note), netPay } });
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "payroll.save", entityType: "PayrollMonth", entityId: row.id, metadata: { year, month } });
  });
  revalidatePath("/people/payroll"); redirect("/people/payroll?success=payroll-saved");
}

export async function createMajorError(formData: FormData) {
  const actor = await requireMember(); if (!canManagePeople(actor)) redirect("/people/payroll?error=forbidden");
  const parsed = majorErrorInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) redirect("/people/payroll?error=invalid-error");
  const employee = await db.employeeProfile.findFirst({ where: { id: parsed.data.employeeId, organizationId: actor.organizationId }, select: { id: true } }); if (!employee) redirect("/people/payroll?error=invalid-employee");
  await db.$transaction(async (tx) => { const row = await tx.majorError.create({ data: { organizationId: actor.organizationId, ...parsed.data, detail: optional(parsed.data.detail), reportedById: actor.id } }); await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "major-error.create", entityType: "MajorError", entityId: row.id }); });
  revalidatePath("/people/payroll"); redirect("/people/payroll?success=error-created");
}

export async function reviewMajorError(formData: FormData) {
  const actor = await requireMember(); const id = String(formData.get("id") ?? ""); const to = String(formData.get("to") ?? "");
  if (!id || (to !== "CONFIRMED" && to !== "DISMISSED")) redirect("/people/payroll?error=invalid-error-status");
  try { await decideMajorError(actor, id, to); } catch { redirect("/people/payroll?error=error-review-failed"); }
  revalidatePath("/people/payroll"); redirect("/people/payroll?success=error-reviewed");
}

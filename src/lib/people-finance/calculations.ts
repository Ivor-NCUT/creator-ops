import { Prisma } from "@/generated/prisma/client";

type Money = string | number | Prisma.Decimal;
export type PayrollParts = { baseSalary: Money; performance: Money; commission: Money; allowance: Money; penalties: Money };

export function calculateNetPay(parts: PayrollParts) {
  return new Prisma.Decimal(parts.baseSalary).add(parts.performance).add(parts.commission).add(parts.allowance).sub(parts.penalties);
}

export function remainingBalance(amount: Money, paidAmount: Money) {
  return Prisma.Decimal.max(new Prisma.Decimal(0), new Prisma.Decimal(amount).sub(paidAmount));
}

export function paymentStatus(amount: Money, paidAmount: Money) {
  const paid = new Prisma.Decimal(paidAmount);
  if (paid.isZero()) return "OPEN" as const;
  return paid.gte(amount) ? "PAID" as const : "PARTIAL" as const;
}

export function payrollPenaltyWhere(organizationId: string, employeeId: string, year: number, month: number) {
  return {
    organizationId,
    employeeId,
    status: "CONFIRMED" as const,
    includeInPayroll: true,
    occurredOn: { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) },
  };
}

export type AttendanceSource = { kind: "LATE" | "EARLY_LEAVE" | "ABSENCE" | "LEAVE" | "MISSING_PUNCH" | "OVERTIME" | "OTHER"; minutes: number | null; days: Prisma.Decimal | null };

export function summarizeAttendance(items: AttendanceSource[]) {
  return items.reduce((summary, item) => {
    summary.approvedExceptions += 1;
    if (item.kind === "LATE") summary.lateMinutes += item.minutes ?? 0;
    if (item.kind === "ABSENCE") summary.absenceDays = summary.absenceDays.add(item.days ?? 0);
    if (item.kind === "LEAVE") summary.leaveDays = summary.leaveDays.add(item.days ?? 0);
    if (item.kind === "OVERTIME") summary.overtimeMinutes += item.minutes ?? 0;
    return summary;
  }, { approvedExceptions: 0, lateMinutes: 0, absenceDays: new Prisma.Decimal(0), leaveDays: new Prisma.Decimal(0), overtimeMinutes: 0 });
}

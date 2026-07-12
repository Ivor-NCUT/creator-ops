import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@/generated/prisma/client";
import { calculateNetPay, paymentStatus, payrollPenaltyWhere, remainingBalance, summarizeAttendance } from "./calculations";

test("payroll uses exact decimal source components", () => {
  assert.equal(calculateNetPay({ baseSalary: "8000.10", performance: "1200.20", commission: "300.30", allowance: "99.99", penalties: "45.55" }).toFixed(2), "9555.04");
});

test("payment balance and status are reproducible", () => {
  assert.equal(remainingBalance("1000.10", "300.03").toFixed(2), "700.07");
  assert.equal(paymentStatus("1000.10", "0"), "OPEN");
  assert.equal(paymentStatus("1000.10", "300.03"), "PARTIAL");
  assert.equal(paymentStatus("1000.10", "1000.10"), "PAID");
});

test("monthly attendance aggregates approved exception source rows without payroll deductions", () => {
  const result = summarizeAttendance([
    { kind: "LATE", minutes: 12, days: null },
    { kind: "ABSENCE", minutes: null, days: new Prisma.Decimal("0.50") },
    { kind: "LEAVE", minutes: null, days: new Prisma.Decimal("1.00") },
    { kind: "OVERTIME", minutes: 90, days: null },
  ]);
  assert.deepEqual({ ...result, absenceDays: result.absenceDays.toFixed(2), leaveDays: result.leaveDays.toFixed(2) }, { approvedExceptions: 4, lateMinutes: 12, absenceDays: "0.50", leaveDays: "1.00", overtimeMinutes: 90 });
});

test("payroll penalties select only confirmed, included errors in the requested UTC month", () => {
  const where = payrollPenaltyWhere("org-fictional", "employee-fictional", 2026, 7);
  assert.deepEqual({ organizationId: where.organizationId, employeeId: where.employeeId, status: where.status, includeInPayroll: where.includeInPayroll }, { organizationId: "org-fictional", employeeId: "employee-fictional", status: "CONFIRMED", includeInPayroll: true });
  assert.equal(where.occurredOn.gte.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(where.occurredOn.lt.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.notEqual(where.status, "DISMISSED");
  assert.notEqual(where.includeInPayroll, false);
  assert.equal(new Date("2026-06-30T23:59:59.999Z") < where.occurredOn.gte, true);
  assert.equal(new Date("2026-08-01T00:00:00.000Z") >= where.occurredOn.lt, true);
});

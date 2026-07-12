import assert from "node:assert/strict";
import test from "node:test";
import { payrollInput } from "./input";

const valid = { employeeId: "employee-fictional", year: "2026", month: "7", currency: "CNY", baseSalary: "8000.00", performance: "0.00", commission: "0.00", allowance: "0.00", penalties: "0.00", note: "" };

test("payroll month accepts calendar months and rejects boundary overflow", () => {
  assert.equal(payrollInput.safeParse(valid).success, true);
  assert.equal(payrollInput.safeParse({ ...valid, month: "0" }).success, false);
  assert.equal(payrollInput.safeParse({ ...valid, month: "13" }).success, false);
  assert.equal(payrollInput.safeParse({ ...valid, year: "1999" }).success, false);
});

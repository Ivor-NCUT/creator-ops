import assert from "node:assert/strict";
import test from "node:test";
import { canApproveAttendance, canReadCompensation, canReadIdentity, employeeSensitiveInclude } from "./access";

test("identity and salary response fields have different role gates", () => {
  const finance = { role: "FINANCE", departmentId: null } as const;
  assert.equal(canReadIdentity(finance), false);
  assert.equal(canReadCompensation(finance), true);
  assert.equal(canReadIdentity({ role: "HR", departmentId: null }), true);
  assert.equal(canReadCompensation({ role: "MANAGER", departmentId: "editorial" }), false);
  assert.deepEqual(employeeSensitiveInclude(finance), { identity: false, compensation: true });
  assert.deepEqual(employeeSensitiveInclude({ role: "HR", departmentId: null }), { identity: true, compensation: true });
});

test("manager approval is restricted to their department", () => {
  const manager = { role: "MANAGER", departmentId: "fictional-editorial" } as const;
  assert.equal(canApproveAttendance(manager, "fictional-editorial"), true);
  assert.equal(canApproveAttendance(manager, "fictional-studio"), false);
  assert.equal(canApproveAttendance({ role: "HR", departmentId: null }, "fictional-studio"), true);
});

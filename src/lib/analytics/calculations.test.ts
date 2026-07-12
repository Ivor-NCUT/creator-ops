import assert from "node:assert/strict";
import test from "node:test";
import { balance, cashItemWhere, safeRate } from "./calculations";

test("dashboard money aggregation stays exact and never goes below zero", () => {
  assert.equal(balance("9007199254740993.25", ["0.10", "0.15"]).toFixed(2), "9007199254740993.00");
  assert.equal(balance("10.00", ["12.00"]).toFixed(2), "0.00");
});

test("cash dashboard excludes cancelled payment items at the database boundary", () => {
  assert.deepEqual(cashItemWhere("organization-a", new Date("2026-08-01T00:00:00Z")), { organizationId: "organization-a", status: { not: "CANCELLED" }, createdAt: { lt: new Date("2026-08-01T00:00:00Z") } });
});

test("dashboard rates protect a zero denominator", () => {
  assert.equal(safeRate("3.00", "0").toFixed(2), "0.00");
  assert.equal(safeRate("3.00", "12.00").toFixed(2), "0.25");
});

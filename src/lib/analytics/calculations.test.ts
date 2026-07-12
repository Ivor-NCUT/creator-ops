import assert from "node:assert/strict";
import test from "node:test";
import { balance, safeRate } from "./calculations";

test("dashboard money aggregation stays exact and never goes below zero", () => {
  assert.equal(balance("9007199254740993.25", ["0.10", "0.15"]).toFixed(2), "9007199254740993.00");
  assert.equal(balance("10.00", ["12.00"]).toFixed(2), "0.00");
});

test("dashboard rates protect a zero denominator", () => {
  assert.equal(safeRate("3.00", "0").toFixed(2), "0.00");
  assert.equal(safeRate("3.00", "12.00").toFixed(2), "0.25");
});

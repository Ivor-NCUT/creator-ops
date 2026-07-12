import assert from "node:assert/strict";
import test from "node:test";
import { parseDateRange, zonedMidnight } from "./date-range";

test("date range uses organization timezone and an exclusive end", () => {
  assert.equal(zonedMidnight("2026-07-12", "Asia/Shanghai").toISOString(), "2026-07-11T16:00:00.000Z");
  const range = parseDateRange({ from: "2026-07-01", to: "2026-07-12" }, "Asia/Shanghai");
  assert.equal(range.to.toISOString(), "2026-07-12T16:00:00.000Z");
});

test("date range rejects reversed and malformed input", () => {
  assert.throws(() => parseDateRange({ from: "2026-07-13", to: "2026-07-12" }, "UTC"));
  assert.throws(() => parseDateRange({ from: "July 1", to: "2026-07-12" }, "UTC"));
  assert.throws(() => parseDateRange({ from: "2026-02-31", to: "2026-07-12" }, "UTC"));
});

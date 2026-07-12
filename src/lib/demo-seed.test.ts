import assert from "node:assert/strict";
import test from "node:test";
import { demoDate, getDemoSeedConfig } from "./demo-seed";

test("production demo seed requires an explicit opt-in", () => {
  assert.throws(() => getDemoSeedConfig({ NODE_ENV: "production" }, new Date("2026-07-12T00:00:00Z")), /ALLOW_DEMO_SEED=true/);
  assert.equal(getDemoSeedConfig({ NODE_ENV: "production", ALLOW_DEMO_SEED: "true" }, new Date("2026-07-12T00:00:00Z")).referenceDate, "2026-07-12");
});

test("reference date is validated and creates deterministic Shanghai dates", () => {
  assert.throws(() => getDemoSeedConfig({ DEMO_REFERENCE_DATE: "2026-02-30" }), /有效的 ISO 日期/);
  assert.throws(() => getDemoSeedConfig({ DEMO_REFERENCE_DATE: "12\/07\/2026" }), /有效的 ISO 日期/);
  assert.equal(demoDate("2026-07-12", 1, 19).toISOString(), "2026-07-13T11:00:00.000Z");
});

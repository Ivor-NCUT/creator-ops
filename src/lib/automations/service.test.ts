import assert from "node:assert/strict";
import test from "node:test";
import { tickKey } from "./service";

test("automation tick idempotency is stable within an UTC hour", () => {
  assert.equal(tickKey("rule-a", new Date("2026-07-12T04:01:00Z")), tickKey("rule-a", new Date("2026-07-12T04:59:59Z")));
  assert.notEqual(tickKey("rule-a", new Date("2026-07-12T04:59:59Z")), tickKey("rule-a", new Date("2026-07-12T05:00:00Z")));
  assert.notEqual(tickKey("rule-a", new Date("2026-07-12T04:00:00Z")), tickKey("rule-b", new Date("2026-07-12T04:00:00Z")));
});

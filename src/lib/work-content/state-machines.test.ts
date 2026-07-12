import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionAi, canTransitionContent, canTransitionWork, nextContentStatuses } from "./state-machines";

test("content lifecycle accepts the canonical path and rejects shortcuts", () => {
  assert.equal(canTransitionContent("IDEA", "READY_TO_SHOOT"), true);
  assert.equal(canTransitionContent("REVIEW", "SCHEDULED"), true);
  assert.equal(canTransitionContent("IDEA", "PUBLISHED"), false);
  assert.deepEqual(nextContentStatuses("ARCHIVED"), []);
});

test("work and AI requests use controlled transitions", () => {
  assert.equal(canTransitionWork("PLANNED", "DONE"), false);
  assert.equal(canTransitionWork("ACTIVE", "DONE"), true);
  assert.equal(canTransitionAi("SUBMITTED", "DELIVERED"), false);
  assert.equal(canTransitionAi("VALIDATING", "DELIVERED"), true);
});

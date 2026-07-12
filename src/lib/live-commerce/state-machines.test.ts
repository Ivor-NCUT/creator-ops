import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionFeedback, canTransitionLive } from "./state-machines";

test("live session follows plan-to-review lifecycle", () => {
  assert.equal(canTransitionLive("PLANNED", "CONFIRMED"), true);
  assert.equal(canTransitionLive("CONFIRMED", "LIVE"), true);
  assert.equal(canTransitionLive("LIVE", "COMPLETED"), true);
  assert.equal(canTransitionLive("COMPLETED", "REVIEWED"), true);
  assert.equal(canTransitionLive("PLANNED", "REVIEWED"), false);
  assert.equal(canTransitionLive("REVIEWED", "LIVE"), false);
});

test("resolved feedback can close or reopen, closed feedback is final", () => {
  assert.equal(canTransitionFeedback("OPEN", "IN_PROGRESS"), true);
  assert.equal(canTransitionFeedback("IN_PROGRESS", "RESOLVED"), true);
  assert.equal(canTransitionFeedback("RESOLVED", "IN_PROGRESS"), true);
  assert.equal(canTransitionFeedback("RESOLVED", "CLOSED"), true);
  assert.equal(canTransitionFeedback("CLOSED", "IN_PROGRESS"), false);
});

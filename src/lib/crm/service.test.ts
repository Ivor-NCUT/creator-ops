import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionContract } from "./state-machines";

test("contract state machine allows only deliberate forward transitions", () => {
  assert.equal(canTransitionContract("DRAFT", "ACTIVE"), true);
  assert.equal(canTransitionContract("ACTIVE", "COMPLETED"), true);
  assert.equal(canTransitionContract("COMPLETED", "ACTIVE"), false);
  assert.equal(canTransitionContract("CANCELLED", "ACTIVE"), false);
});

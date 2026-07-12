import assert from "node:assert/strict";
import test from "node:test";
import { isAutomationAuthorized } from "./internal-auth";

const secret = "test-automation-secret-at-least-32-characters";

test("internal automation auth requires an exact Bearer header", () => {
  assert.equal(isAutomationAuthorized(null, secret), false);
  assert.equal(isAutomationAuthorized(secret, secret), false);
  assert.equal(isAutomationAuthorized("Bearer wrong", secret), false);
  assert.equal(isAutomationAuthorized(`Bearer ${secret}`, secret), true);
});

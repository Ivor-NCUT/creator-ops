import assert from "node:assert/strict";
import test from "node:test";
import { dashboardDomains } from "./access";

test("dashboard roles expose only their business domain", () => {
  assert.deepEqual(dashboardDomains("MANAGER"), ["content", "live", "projects"]);
  assert.deepEqual(dashboardDomains("HR"), ["people"]);
  assert.deepEqual(dashboardDomains("FINANCE"), ["cash"]);
  assert.deepEqual(dashboardDomains("MEMBER"), []);
  assert.equal(dashboardDomains("OWNER").length, 5);
});

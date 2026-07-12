import assert from "node:assert/strict";
import test from "node:test";
import { roleCan } from "@/lib/roles";

test("owner and admin can manage members", () => {
  assert.equal(roleCan("OWNER", "members:manage"), true);
  assert.equal(roleCan("ADMIN", "members:manage"), true);
});

test("non-administrative roles cannot manage members", () => {
  for (const role of ["HR", "FINANCE", "MANAGER", "MEMBER", "VIEWER"] as const) {
    assert.equal(roleCan(role, "members:manage"), false);
  }
});

test("sensitive permissions remain separated", () => {
  assert.equal(roleCan("HR", "people:sensitive"), true);
  assert.equal(roleCan("HR", "finance:read"), true);
  assert.equal(roleCan("FINANCE", "finance:read"), true);
  assert.equal(roleCan("FINANCE", "people:sensitive"), false);
});

test("finance and manager boundaries stay server enforceable", () => {
  assert.equal(roleCan("FINANCE", "crm:manage"), true);
  assert.equal(roleCan("MANAGER", "crm:read"), true);
  assert.equal(roleCan("MANAGER", "crm:manage"), false);
  assert.equal(roleCan("MEMBER", "finance:read"), false);
});

test("live commerce management is limited to operational managers", () => {
  for (const role of ["OWNER", "ADMIN", "MANAGER"] as const) assert.equal(roleCan(role, "live:manage"), true);
  for (const role of ["HR", "FINANCE", "MEMBER", "VIEWER"] as const) assert.equal(roleCan(role, "live:manage"), false);
});

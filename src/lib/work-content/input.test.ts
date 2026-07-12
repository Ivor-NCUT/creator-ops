import assert from "node:assert/strict";
import test from "node:test";
import { optionalDate, requiredDate, safeReturnPath } from "./input";

test("date inputs reject Invalid Date values", () => {
  assert.equal(optionalDate.safeParse("").success, true);
  assert.equal(optionalDate.safeParse("not-a-date").success, false);
  assert.equal(requiredDate.safeParse("").success, false);
  assert.equal(requiredDate.safeParse("2026-07-12T14:00").success, true);
});

test("transition return paths only allow known internal module routes", () => {
  for (const path of ["/work", "/content", "/work/projects/project_1", "/content/content-1"]) assert.equal(safeReturnPath.safeParse(path).success, true);
  for (const path of ["//evil.example", "https://evil.example", "/settings/members", "/work/unknown", "/content/id?next=//evil.example"]) assert.equal(safeReturnPath.safeParse(path).success, false);
});

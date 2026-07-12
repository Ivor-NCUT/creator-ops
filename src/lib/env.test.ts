import assert from "node:assert/strict";
import test from "node:test";
import { getServerEnv } from "./env";

test("server environment validates required URLs", () => {
  const before = { ...process.env };
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/app";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET = "test-secret-with-at-least-32-characters";

  const env = getServerEnv();
  assert.equal(env.DATABASE_URL, "postgresql://user:pass@localhost:5432/app");
  assert.equal(env.BETTER_AUTH_URL, "http://localhost:3000");
  process.env = before;
});

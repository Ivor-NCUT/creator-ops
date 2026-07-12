import assert from "node:assert/strict";
import test from "node:test";
import { getServerEnv } from "./env";

test("server environment validates required URLs", () => {
  const before = { ...process.env };
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/app";

  assert.equal(
    getServerEnv().DATABASE_URL,
    "postgresql://user:pass@localhost:5432/app",
  );
  process.env = before;
});

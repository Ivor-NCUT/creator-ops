import { timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { runAutomationTick } from "@/lib/automations/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = Buffer.from(getServerEnv().AUTOMATION_SECRET);
  const supplied = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const runs = await runAutomationTick();
  return Response.json({ runs: runs.map(({ id, status, notifications, attempt }) => ({ id, status, notifications, attempt })) });
}

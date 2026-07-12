import { getServerEnv } from "@/lib/env";
import { runAutomationTick } from "@/lib/automations/service";
import { isAutomationAuthorized } from "@/lib/automations/internal-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAutomationAuthorized(request.headers.get("authorization"), getServerEnv().AUTOMATION_SECRET)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const runs = await runAutomationTick();
  return Response.json({ runs: runs.map(({ id, status, notifications, attempt }) => ({ id, status, notifications, attempt })) });
}

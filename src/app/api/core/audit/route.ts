import { AccessDeniedError, requirePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const actor = await requirePermission("audit:read");
    const events = await db.auditEvent.findMany({
      where: { organizationId: actor.organizationId },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ events });
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}

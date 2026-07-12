import { AccessDeniedError, requirePermission } from "@/lib/authorization";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const actor = await requirePermission("members:read");
    const members = await db.member.findMany({
      where: { organizationId: actor.organizationId },
      select: {
        id: true,
        role: true,
        status: true,
        department: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ members });
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}

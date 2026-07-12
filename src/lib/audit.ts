import type { Prisma } from "@/generated/prisma/client";

type AuditInput = {
  organizationId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

export function recordAuditEvent(tx: Prisma.TransactionClient, input: AuditInput) {
  return tx.auditEvent.create({ data: input });
}

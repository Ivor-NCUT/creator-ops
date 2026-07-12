import type { ContractStatus } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { recordAuditEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { paymentStatus } from "@/lib/people-finance/calculations";
import { canTransitionContract } from "./state-machines";

type Actor = { id: string; organizationId: string };
export async function transitionContract(actor: Actor, id: string, to: ContractStatus, note?: string) {
  const contract = await db.contract.findFirst({ where: { id, organizationId: actor.organizationId }, select: { status: true } });
  if (!contract) throw new Error("Contract not found");
  if (!canTransitionContract(contract.status, to)) throw new Error("Invalid contract transition");
  await db.$transaction(async (tx) => {
    const changed = await tx.contract.updateMany({ where: { id, organizationId: actor.organizationId, status: contract.status }, data: { status: to } });
    if (changed.count !== 1) throw new Error("Contract changed; reload and retry");
    await tx.contractStatusHistory.create({ data: { contractId: id, fromStatus: contract.status, toStatus: to, actorId: actor.id, note: note || null } });
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "contract.transition", entityType: "Contract", entityId: id, metadata: { from: contract.status, to } });
  });
}

export async function recordPayment(actor: Actor, paymentItemId: string, amount: string, paidOn: Date, reference?: string) {
  const increment = new Prisma.Decimal(amount);
  await db.$transaction(async (tx) => {
    const item = await tx.paymentItem.findFirst({ where: { id: paymentItemId, organizationId: actor.organizationId }, select: { amount: true, paidAmount: true, status: true } });
    if (!item || item.status === "CANCELLED" || item.status === "PAID") throw new Error("Payment item is not open");
    const nextPaid = item.paidAmount.add(increment);
    if (nextPaid.gt(item.amount)) throw new Error("Payment exceeds remaining balance");
    const nextStatus = paymentStatus(item.amount, nextPaid);
    const changed = await tx.paymentItem.updateMany({ where: { id: paymentItemId, organizationId: actor.organizationId, paidAmount: item.paidAmount, status: item.status }, data: { paidAmount: nextPaid, status: nextStatus } });
    if (changed.count !== 1) throw new Error("Payment item changed; reload and retry");
    const payment = await tx.paymentRecord.create({ data: { paymentItemId, amount: increment, paidOn, reference: reference || null, actorId: actor.id } });
    await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "payment.record", entityType: "PaymentRecord", entityId: payment.id, metadata: { paymentItemId, amount } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

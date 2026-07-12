"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/authorization";
import { recordAuditEvent } from "@/lib/audit";
import { contractInput, contractTransitionInput, partyInput, paymentItemInput, paymentRecordInput } from "@/lib/crm/input";
import { recordPayment, transitionContract } from "@/lib/crm/service";
import { db } from "@/lib/db";
import { roleCan } from "@/lib/roles";

const optional = (value?: string) => value || null;
const canManage = (role: Parameters<typeof roleCan>[0]) => roleCan(role, "crm:manage");

export async function createExternalParty(formData: FormData) {
  const actor = await requireMember(); if (!canManage(actor.role)) redirect("/business?error=forbidden");
  const raw = Object.fromEntries(formData); const parsed = partyInput.safeParse({ ...raw, types: formData.getAll("types") }); if (!parsed.success) redirect("/business?error=invalid-party");
  await db.$transaction(async (tx) => { const row = await tx.externalParty.create({ data: { organizationId: actor.organizationId, ...parsed.data, contactName: optional(parsed.data.contactName), contactPhone: optional(parsed.data.contactPhone), contactEmail: optional(parsed.data.contactEmail), taxNumber: optional(parsed.data.taxNumber), notes: optional(parsed.data.notes) } }); await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "party.create", entityType: "ExternalParty", entityId: row.id }); });
  revalidatePath("/business"); redirect("/business?success=party-created");
}

export async function createContract(formData: FormData) {
  const actor = await requireMember(); if (!canManage(actor.role)) redirect("/business/contracts?error=forbidden");
  const parsed = contractInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) redirect("/business/contracts?error=invalid-contract");
  const [party, owner] = await Promise.all([db.externalParty.findFirst({ where: { id: parsed.data.partyId, organizationId: actor.organizationId }, select: { id: true } }), db.member.findFirst({ where: { id: parsed.data.ownerId, organizationId: actor.organizationId }, select: { id: true } })]); if (!party || !owner) redirect("/business/contracts?error=invalid-relations");
  await db.$transaction(async (tx) => { const row = await tx.contract.create({ data: { organizationId: actor.organizationId, ...parsed.data, statusHistory: { create: { toStatus: "DRAFT", actorId: actor.id } } } }); await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "contract.create", entityType: "Contract", entityId: row.id }); });
  revalidatePath("/business/contracts"); redirect("/business/contracts?success=contract-created");
}

export async function changeContractStatus(formData: FormData) {
  const actor = await requireMember(); if (!canManage(actor.role)) redirect("/business/contracts?error=forbidden"); const parsed = contractTransitionInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) redirect("/business/contracts?error=invalid-status");
  try { await transitionContract(actor, parsed.data.id, parsed.data.to, parsed.data.note); } catch { redirect("/business/contracts?error=transition-failed"); }
  revalidatePath("/business/contracts"); redirect("/business/contracts?success=status-changed");
}

export async function createPaymentItem(formData: FormData) {
  const actor = await requireMember(); if (!canManage(actor.role)) redirect("/business/payments?error=forbidden"); const parsed = paymentItemInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) redirect("/business/payments?error=invalid-item");
  const [party, contract] = await Promise.all([db.externalParty.findFirst({ where: { id: parsed.data.partyId, organizationId: actor.organizationId }, select: { id: true } }), parsed.data.contractId ? db.contract.findFirst({ where: { id: parsed.data.contractId, organizationId: actor.organizationId, partyId: parsed.data.partyId }, select: { id: true } }) : null]); if (!party || (parsed.data.contractId && !contract)) redirect("/business/payments?error=invalid-relations");
  await db.$transaction(async (tx) => { const row = await tx.paymentItem.create({ data: { organizationId: actor.organizationId, ...parsed.data, contractId: optional(parsed.data.contractId) } }); await recordAuditEvent(tx, { organizationId: actor.organizationId, actorId: actor.id, action: "payment-item.create", entityType: "PaymentItem", entityId: row.id }); });
  revalidatePath("/business/payments"); redirect("/business/payments?success=item-created");
}

export async function addPaymentRecord(formData: FormData) {
  const actor = await requireMember(); if (!canManage(actor.role)) redirect("/business/payments?error=forbidden"); const parsed = paymentRecordInput.safeParse(Object.fromEntries(formData)); if (!parsed.success) redirect("/business/payments?error=invalid-payment");
  try { await recordPayment(actor, parsed.data.paymentItemId, parsed.data.amount, parsed.data.paidOn, parsed.data.reference); } catch { redirect("/business/payments?error=payment-failed"); }
  revalidatePath("/business/payments"); redirect("/business/payments?success=payment-recorded");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FeedbackStatus, LiveSessionStatus } from "@/generated/prisma/client";
import { requireMember } from "@/lib/authorization";
import { db } from "@/lib/db";
import { feedbackInput, liveSessionInput, performanceInput, productInput, sessionReviewInput, supplierInput } from "@/lib/live-commerce/input";
import { transitionFeedback, transitionLiveSession } from "@/lib/live-commerce/service";
import { roleCan } from "@/lib/roles";

const optional = <T extends string>(value: T | "" | undefined) => value || null;
const manage = (role: Parameters<typeof roleCan>[0]) => roleCan(role, "live:manage");

export async function createLiveSession(formData: FormData) {
  const actor = await requireMember();
  if (!manage(actor.role)) redirect("/live?error=forbidden");
  const parsed = liveSessionInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/live?error=invalid-session");
  const { ownerId, staffMemberId, staffRole, previewContentId } = parsed.data;
  const [owner, staff, preview] = await Promise.all([
    db.member.findFirst({ where: { id: ownerId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } }),
    staffMemberId ? db.member.findFirst({ where: { id: staffMemberId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } }) : null,
    previewContentId ? db.contentItem.findFirst({ where: { id: previewContentId, organizationId: actor.organizationId, type: "VIDEO" }, select: { id: true } }) : null,
  ]);
  if (!owner || (staffMemberId && !staff) || (previewContentId && !preview) || (staffMemberId && !staffRole)) redirect("/live?error=invalid-relations");
  const session = await db.liveSession.create({ data: {
    organizationId: actor.organizationId, title: parsed.data.title, channel: parsed.data.channel, ownerId: owner.id,
    startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt,
    staff: staff && staffRole ? { create: { memberId: staff.id, role: staffRole } } : undefined,
    previews: preview ? { create: { contentId: preview.id } } : undefined,
    statusHistory: { create: { toStatus: "PLANNED", actorId: actor.id } },
  } });
  redirect(`/live/${session.id}?success=session-created`);
}

export async function createSupplier(formData: FormData) {
  const actor = await requireMember();
  if (!manage(actor.role)) redirect("/live/products?error=forbidden");
  const parsed = supplierInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/live/products?error=invalid-supplier");
  await db.commerceSupplier.create({ data: { organizationId: actor.organizationId, name: parsed.data.name, contactName: optional(parsed.data.contactName), contactPhone: optional(parsed.data.contactPhone), notes: optional(parsed.data.notes) } });
  revalidatePath("/live/products");
  redirect("/live/products?success=supplier-created");
}

export async function createProduct(formData: FormData) {
  const actor = await requireMember();
  if (!manage(actor.role)) redirect("/live/products?error=forbidden");
  const parsed = productInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/live/products?error=invalid-product");
  if (parsed.data.supplierId && !await db.commerceSupplier.findFirst({ where: { id: parsed.data.supplierId, organizationId: actor.organizationId }, select: { id: true } })) redirect("/live/products?error=invalid-supplier");
  await db.commerceProduct.create({ data: { organizationId: actor.organizationId, name: parsed.data.name, sku: optional(parsed.data.sku), supplierId: optional(parsed.data.supplierId), currency: parsed.data.currency, listPrice: optional(parsed.data.listPrice) } });
  revalidatePath("/live/products");
  redirect("/live/products?success=product-created");
}

export async function saveProductPerformance(formData: FormData) {
  const actor = await requireMember();
  if (!manage(actor.role)) redirect("/live/products?error=forbidden");
  const parsed = performanceInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/live/${String(formData.get("liveSessionId") ?? "")}?error=invalid-performance`);
  const [session, product] = await Promise.all([
    db.liveSession.findFirst({ where: { id: parsed.data.liveSessionId, organizationId: actor.organizationId }, select: { id: true } }),
    db.commerceProduct.findFirst({ where: { id: parsed.data.productId, organizationId: actor.organizationId, active: true }, select: { id: true } }),
  ]);
  if (!session || !product) redirect("/live?error=invalid-relations");
  const data = { organizationId: actor.organizationId, impressions: parsed.data.impressions, clicks: parsed.data.clicks, orders: parsed.data.orders, buyers: parsed.data.buyers, gmv: parsed.data.gmv, refundAmount: parsed.data.refundAmount, inventory: parsed.data.inventory, commission: parsed.data.commission };
  await db.liveProductPerformance.upsert({ where: { liveSessionId_productId: { liveSessionId: session.id, productId: product.id } }, create: { ...data, liveSessionId: session.id, productId: product.id }, update: data });
  revalidatePath(`/live/${session.id}`);
  redirect(`/live/${session.id}?success=performance-saved`);
}

export async function createFeedback(formData: FormData) {
  const actor = await requireMember();
  const parsed = feedbackInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/live/feedback?error=invalid-feedback");
  const { liveSessionId, productId, assigneeId } = parsed.data;
  const [session, product, assignee] = await Promise.all([
    liveSessionId ? db.liveSession.findFirst({ where: { id: liveSessionId, organizationId: actor.organizationId }, select: { id: true } }) : null,
    productId ? db.commerceProduct.findFirst({ where: { id: productId, organizationId: actor.organizationId }, select: { id: true } }) : null,
    assigneeId ? db.member.findFirst({ where: { id: assigneeId, organizationId: actor.organizationId, status: "ACTIVE" }, select: { id: true } }) : null,
  ]);
  if ((liveSessionId && !session) || (productId && !product) || (assigneeId && !assignee)) redirect("/live/feedback?error=invalid-relations");
  if (!manage(actor.role) && assigneeId !== actor.id) redirect("/live/feedback?error=forbidden");
  await db.customerFeedback.create({ data: {
    organizationId: actor.organizationId, liveSessionId: optional(liveSessionId), productId: optional(productId), assigneeId: optional(assigneeId),
    kind: parsed.data.kind, category: parsed.data.category, title: parsed.data.title, detail: optional(parsed.data.detail), source: optional(parsed.data.source), isNegative: parsed.data.isNegative,
    statusHistory: { create: { toStatus: "OPEN", actorId: actor.id } },
  } });
  revalidatePath("/live/feedback");
  redirect("/live/feedback?success=feedback-created");
}

export async function changeLiveStatus(formData: FormData) {
  const actor = await requireMember();
  const parsed = z.object({ id: z.string().min(1), to: z.enum(["PLANNED", "CONFIRMED", "LIVE", "COMPLETED", "REVIEWED", "CANCELLED"]), note: z.string().trim().max(500).optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/live?error=invalid-status");
  try { await transitionLiveSession(actor, parsed.data.id, parsed.data.to as LiveSessionStatus, parsed.data.note); } catch { redirect(`/live/${parsed.data.id}?error=invalid-transition`); }
  revalidatePath(`/live/${parsed.data.id}`);
  redirect(`/live/${parsed.data.id}?success=status-changed`);
}

export async function saveSessionReview(formData: FormData) {
  const actor = await requireMember();
  const id = String(formData.get("id") ?? "");
  const parsed = sessionReviewInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/live/${id}?error=invalid-review`);
  const session = await db.liveSession.findFirst({ where: { id, organizationId: actor.organizationId, ...(manage(actor.role) ? {} : { ownerId: actor.id }) }, select: { id: true, status: true } });
  if (!session || session.status !== "COMPLETED") redirect(`/live/${id}?error=invalid-review-state`);
  await db.liveSession.update({ where: { id }, data: parsed.data });
  revalidatePath(`/live/${id}`);
  redirect(`/live/${id}?success=review-saved`);
}

export async function changeFeedbackStatus(formData: FormData) {
  const actor = await requireMember();
  const parsed = z.object({ id: z.string().min(1), to: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"]), note: z.string().trim().max(500).optional(), resolution: z.string().trim().max(2000).optional() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/live/feedback?error=invalid-status");
  try { await transitionFeedback(actor, parsed.data.id, parsed.data.to as FeedbackStatus, parsed.data.note, parsed.data.resolution); } catch { redirect("/live/feedback?error=invalid-transition"); }
  revalidatePath("/live/feedback");
  redirect("/live/feedback?success=status-changed");
}

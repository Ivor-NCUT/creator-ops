import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

const optionalId = z.string().trim().min(1).optional().or(z.literal(""));
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const nonNegativeInt = z.coerce.number().int().min(0);
const money = z.string().trim().regex(/^\d{1,16}(\.\d{1,2})?$/);
const optionalDate = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.date().optional());

export const liveSessionInput = z.object({
  title: z.string().trim().min(2).max(160),
  channel: z.string().trim().min(1).max(60),
  ownerId: z.string().trim().min(1),
  startsAt: z.coerce.date(),
  endsAt: optionalDate,
  staffMemberId: optionalId,
  staffRole: z.enum(["HOST", "CO_HOST", "OPERATOR", "MODERATOR", "SUPPORT"]).optional(),
  previewContentId: optionalId,
}).refine(({ startsAt, endsAt }) => !endsAt || endsAt > startsAt, { path: ["endsAt"], message: "结束时间必须晚于开始时间" });

export const productInput = z.object({
  name: z.string().trim().min(2).max(160),
  sku: optionalText(80),
  supplierId: optionalId,
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  listPrice: money.optional().or(z.literal("")),
});

export const supplierInput = z.object({
  name: z.string().trim().min(2).max(160),
  contactName: optionalText(80),
  contactPhone: optionalText(40),
  notes: optionalText(500),
});

export const performanceInput = z.object({
  liveSessionId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  impressions: nonNegativeInt,
  clicks: nonNegativeInt,
  orders: nonNegativeInt,
  buyers: nonNegativeInt,
  gmv: money,
  refundAmount: money,
  inventory: nonNegativeInt,
  commission: money,
}).refine(({ clicks, impressions }) => clicks <= impressions, { path: ["clicks"], message: "点击不能超过曝光" })
  .refine(({ orders, clicks }) => orders <= clicks, { path: ["orders"], message: "订单不能超过点击" })
  .refine(({ buyers, orders }) => buyers <= orders, { path: ["buyers"], message: "买家不能超过订单" })
  .refine(({ refundAmount, gmv }) => new Prisma.Decimal(refundAmount).lte(gmv), { path: ["refundAmount"], message: "退款金额不能超过 GMV" })
  .refine(({ commission, gmv }) => new Prisma.Decimal(commission).lte(gmv), { path: ["commission"], message: "佣金不能超过 GMV" });

export const feedbackInput = z.object({
  liveSessionId: optionalId,
  productId: optionalId,
  kind: z.enum(["REVIEW", "COMPLAINT"]),
  category: z.enum(["PRODUCT_QUALITY", "SHIPPING", "SERVICE", "REFUND", "CONTENT", "OTHER"]),
  title: z.string().trim().min(2).max(160),
  detail: optionalText(2000),
  source: optionalText(100),
  assigneeId: optionalId,
  isNegative: z.union([z.literal("on"), z.literal("true")]).optional().transform(Boolean),
});

export const sessionReviewInput = z.object({
  viewers: nonNegativeInt,
  peakViewers: nonNegativeInt,
  newFollowers: nonNegativeInt,
  actualStartsAt: optionalDate,
  actualEndsAt: optionalDate,
  reviewSummary: z.string().trim().min(2).max(5000),
}).refine(({ viewers, peakViewers }) => peakViewers <= viewers, { path: ["peakViewers"], message: "峰值在线不能超过累计观看" })
  .refine(({ actualStartsAt, actualEndsAt }) => !actualStartsAt || !actualEndsAt || actualEndsAt > actualStartsAt, { path: ["actualEndsAt"], message: "结束时间必须晚于开始时间" });

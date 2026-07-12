import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalId = z.string().trim().min(1).optional().or(z.literal(""));
const optionalDate = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.date().optional());
const money = z.string().trim().regex(/^\d{1,16}(\.\d{1,2})?$/);

export const partyInput = z.object({ name: z.string().trim().min(2).max(160), types: z.array(z.enum(["CUSTOMER", "SUPPLIER", "SERVICE_PROVIDER", "CONSULTANT"])).min(1), contactName: optionalText(80), contactPhone: optionalText(40), contactEmail: z.email().optional().or(z.literal("")), taxNumber: optionalText(80), notes: optionalText(500) });
export const contractInput = z.object({ partyId: z.string().min(1), ownerId: z.string().min(1), number: z.string().trim().min(1).max(80), title: z.string().trim().min(2).max(160), startsOn: optionalDate, endsOn: optionalDate, currency: z.string().trim().length(3).transform((v) => v.toUpperCase()), amount: money }).refine(({ startsOn, endsOn }) => !startsOn || !endsOn || endsOn >= startsOn, { path: ["endsOn"] });
const positiveMoney = money.refine((value) => new Prisma.Decimal(value).gt(0));
export const paymentItemInput = z.object({ partyId: z.string().min(1), contractId: optionalId, direction: z.enum(["RECEIVABLE", "PAYABLE"]), title: z.string().trim().min(2).max(160), currency: z.string().trim().length(3).transform((v) => v.toUpperCase()), amount: positiveMoney, dueOn: optionalDate });
export const paymentRecordInput = z.object({ paymentItemId: z.string().min(1), amount: positiveMoney, paidOn: z.coerce.date(), reference: optionalText(100) });
export const contractTransitionInput = z.object({ id: z.string().min(1), to: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "TERMINATED", "CANCELLED"]), note: optionalText(500) });

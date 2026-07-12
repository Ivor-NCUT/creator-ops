import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalDate = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.date().optional());
const money = z.string().trim().regex(/^\d{1,16}(\.\d{1,2})?$/);
const optionalMoney = money.optional().or(z.literal(""));
export const payrollMonthInput = z.object({ employeeId: z.string().min(1), year: z.coerce.number().int().min(2000).max(2200), month: z.coerce.number().int().min(1).max(12) });

export const employeeInput = z.object({ memberId: z.string().min(1), employeeNo: z.string().trim().min(1).max(40), jobTitle: optionalText(100), employmentStatus: z.enum(["ACTIVE", "PROBATION", "LEAVE", "TERMINATED"]), hiredAt: optionalDate, legalName: z.string().trim().min(1).max(100), idType: optionalText(30), idNumber: optionalText(80), phone: optionalText(40), personalEmail: z.email().optional().or(z.literal("")), address: optionalText(300), emergencyContact: optionalText(100), emergencyPhone: optionalText(40), baseSalary: money, currency: z.string().trim().length(3).transform((v) => v.toUpperCase()) });
export const attendanceInput = z.object({ employeeId: z.string().min(1), occurredOn: z.coerce.date(), kind: z.enum(["LATE", "EARLY_LEAVE", "ABSENCE", "LEAVE", "MISSING_PUNCH", "OVERTIME", "OTHER"]), minutes: z.coerce.number().int().min(0).optional(), days: optionalMoney, reason: z.string().trim().min(2).max(1000) });
export const attendanceDecisionInput = z.object({ id: z.string().min(1), to: z.enum(["APPROVED", "REJECTED"]), note: optionalText(500) });
export const payrollInput = payrollMonthInput.extend({ currency: z.string().trim().length(3).transform((v) => v.toUpperCase()), baseSalary: money, performance: money, commission: money, allowance: money, note: optionalText(500) });
export const majorErrorInput = z.object({ employeeId: z.string().min(1), occurredOn: z.coerce.date(), title: z.string().trim().min(2).max(160), detail: optionalText(2000), penaltyAmount: money, includeInPayroll: z.union([z.literal("on"), z.literal("true")]).optional().transform(Boolean) });

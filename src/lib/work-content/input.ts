import { z } from "zod";

export const optionalDate = z.string().trim().optional().transform((value, context) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    context.addIssue({ code: "custom", message: "Invalid date" });
    return z.NEVER;
  }
  return date;
});

export const requiredDate = z.string().trim().min(1).transform((value, context) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    context.addIssue({ code: "custom", message: "Invalid date" });
    return z.NEVER;
  }
  return date;
});

export const safeReturnPath = z.string().refine(
  (value) => value === "/work" || value === "/content" || /^\/work\/projects\/[A-Za-z0-9_-]+$/.test(value) || /^\/content\/[A-Za-z0-9_-]+$/.test(value),
  "Invalid return path",
);

import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function isAutomationAuthorized(authorization: string | null, secret: string) {
  const supplied = authorization?.match(/^Bearer ([^\s]+)$/)?.[1] ?? "";
  return timingSafeEqual(digest(supplied), digest(secret));
}

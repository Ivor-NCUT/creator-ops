import { Prisma } from "@/generated/prisma/client";

type Money = Prisma.Decimal | string | number;

export function safeRate(numerator: Money, denominator: Money) {
  const total = new Prisma.Decimal(denominator);
  return total.isZero() ? new Prisma.Decimal(0) : new Prisma.Decimal(numerator).div(total);
}

export function balance(amount: Money, payments: Money[]) {
  return Prisma.Decimal.max(0, new Prisma.Decimal(amount).sub(payments.reduce<Prisma.Decimal>((sum, payment) => sum.add(payment), new Prisma.Decimal(0))));
}

export function cashItemWhere(organizationId: string, to: Date) {
  return { organizationId, status: { not: "CANCELLED" as const }, createdAt: { lt: to } };
}

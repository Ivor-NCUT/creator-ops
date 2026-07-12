import { Prisma } from "@/generated/prisma/client";

export type PerformanceSource = {
  impressions: number;
  clicks: number;
  orders: number;
  gmv: Prisma.Decimal | string;
  refundAmount: Prisma.Decimal | string;
};

const percent = (numerator: Prisma.Decimal, denominator: Prisma.Decimal) => denominator.isZero() ? new Prisma.Decimal(0) : numerator.div(denominator).mul(100).toDecimalPlaces(2);

export function derivePerformance(source: PerformanceSource) {
  return {
    clickThroughRate: percent(new Prisma.Decimal(source.clicks), new Prisma.Decimal(source.impressions)),
    orderConversionRate: percent(new Prisma.Decimal(source.orders), new Prisma.Decimal(source.clicks)),
    refundRate: percent(new Prisma.Decimal(source.refundAmount), new Prisma.Decimal(source.gmv)),
  };
}

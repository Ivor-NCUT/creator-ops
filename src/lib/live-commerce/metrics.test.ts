import assert from "node:assert/strict";
import test from "node:test";
import { derivePerformance } from "./metrics";

test("derives click, order and refund rates with decimal arithmetic", () => {
  const rates = derivePerformance({ impressions: 250, clicks: 50, orders: 10, gmv: "999.99", refundAmount: "100.00" });
  assert.equal(rates.clickThroughRate.toFixed(2), "20.00");
  assert.equal(rates.orderConversionRate.toFixed(2), "20.00");
  assert.equal(rates.refundRate.toFixed(2), "10.00");
});

test("returns zero for rates with a zero denominator", () => {
  const rates = derivePerformance({ impressions: 0, clicks: 0, orders: 0, gmv: "0.00", refundAmount: "0.00" });
  assert.equal(rates.clickThroughRate.toFixed(2), "0.00");
  assert.equal(rates.orderConversionRate.toFixed(2), "0.00");
  assert.equal(rates.refundRate.toFixed(2), "0.00");
});

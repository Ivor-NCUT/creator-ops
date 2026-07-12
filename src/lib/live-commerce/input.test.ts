import assert from "node:assert/strict";
import test from "node:test";
import { performanceInput, productInput } from "./input";

test("accepts exact two-decimal money and preserves it as text", () => {
  const parsed = productInput.parse({ name: "虚构礼盒", sku: "SKU-DEMO", supplierId: "", currency: "cny", listPrice: "199.90" });
  assert.equal(parsed.listPrice, "199.90");
  assert.equal(parsed.currency, "CNY");
});

test("rejects invalid funnels and amounts", () => {
  const parsed = performanceInput.safeParse({ liveSessionId: "live-1", productId: "product-1", impressions: "10", clicks: "11", orders: "2", buyers: "1", gmv: "100.00", refundAmount: "101.00", inventory: "2", commission: "0.001" });
  assert.equal(parsed.success, false);
});

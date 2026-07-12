import assert from "node:assert/strict";
import test from "node:test";
import { paymentRecordInput } from "./input";

const payment = { paymentItemId: "payment-fictional", paidOn: "2026-07-12", reference: "" };

test("payment validation stays exact beyond JavaScript safe integers", () => {
  assert.equal(paymentRecordInput.safeParse({ ...payment, amount: "9007199254740993.00" }).success, true);
  assert.equal(paymentRecordInput.safeParse({ ...payment, amount: "0.00" }).success, false);
});

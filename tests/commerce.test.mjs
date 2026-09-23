import test from "node:test";
import assert from "node:assert/strict";
import { settleOrder, quantityFor } from "../lib/commerce.ts";
const catalog = [
  { id: "model", name: "Model", status: "NOW", demoPrice: 480 },
  { id: "free", name: "Free", status: "NOW", demoPrice: 0 },
  { id: "future", name: "Future", status: "FUTURE", demoPrice: 50 },
];
const base = {
  credits: 10000,
  cartProductIds: ["model"],
  cartQuantities: {},
  libraryProductIds: [],
  transactions: [],
  orders: [],
};
test("settlement debits exact quantity, snapshots receipt and does not mutate input", () => {
  const state = { ...base, cartQuantities: { model: 3 } };
  const result = settleOrder(state, catalog, "MM-test", "2026-09-23T00:00:00Z");
  assert.equal(result.ok, true);
  assert.equal(result.total, 1440);
  assert.equal(result.state.credits, 8560);
  assert.equal(result.order.items[0].quantity, 3);
  assert.equal(result.state.transactions[0].creditsSpent, 1440);
  assert.deepEqual(result.state.libraryProductIds, ["model"]);
  assert.deepEqual(result.state.cartProductIds, []);
  assert.deepEqual(result.state.cartQuantities, {});
  assert.equal(state.credits, 10000);
});
test("replaying an already settled state never charges twice", () => {
  const first = settleOrder(base, catalog, "one", "now");
  const second = settleOrder(first.state, catalog, "two", "now");
  assert.equal(second.ok, false);
  assert.equal(second.reason, "empty");
  assert.equal(first.state.credits, 9520);
  assert.equal(first.state.orders.length, 1);
});
test("insufficient funds leave the bag and balance intact", () => {
  const state = { ...base, credits: 479 };
  assert.equal(settleOrder(state, catalog, "one", "now").reason, "balance");
  assert.equal(state.credits, 479);
  assert.deepEqual(state.cartProductIds, ["model"]);
});
test("zero-price items can be collected with an empty wallet", () => {
  const result = settleOrder(
    { ...base, credits: 0, cartProductIds: ["free"] },
    catalog,
    "one",
    "now",
  );
  assert.equal(result.ok, true);
  assert.equal(result.total, 0);
  assert.equal(result.state.credits, 0);
});
test("unknown and future items cannot be charged, duplicate ids only count once", () => {
  assert.equal(
    settleOrder(
      { ...base, cartProductIds: ["future", "missing"] },
      catalog,
      "one",
      "now",
    ).ok,
    false,
  );
  const result = settleOrder(
    { ...base, cartProductIds: ["model", "model", "missing"] },
    catalog,
    "one",
    "now",
  );
  assert.equal(result.total, 480);
});
test("legacy and invalid quantities are bounded safely", () => {
  for (const value of [undefined, -1, 0, 1.5, Infinity, NaN, "3"])
    assert.equal(quantityFor({ model: value }, "model"), 1);
  assert.equal(quantityFor({ model: 120 }, "model"), 99);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  addAtomic,
  compareAtomic,
  formatAtomicMoney,
  multiplyAtomic,
  parseAmountToAtomic as parse,
  subtractAtomic,
} from "../lib/money.ts";
import { settleOrder, quantityFor } from "../lib/commerce.ts";

const usd = {
  initialCreditAtomic: "1000000000000000000",
  currencyCode: "USD",
  currencyLabel: "USD",
  currencyKind: "ISO",
  displayPrecision: 2,
  displayPattern: "{amount} {currency}",
};

function product(id, priceAtomic, status = "NOW") {
  return { id, name: id, status, priceAtomic, origin: { kind: "CURATED", label: "fixture" } };
}

function stateWith(cartProductIds, extras = {}) {
  return {
    schemaVersion: 2,
    wallet: { initialized: true, balanceAtomic: parse("1000000000000") },
    economy: usd,
    cartQuantities: {},
    orders: [],
    topUps: [],
    walletAdjustments: [],
    cartProductIds,
    favoriteProductIds: [],
    watchedConceptIds: [],
    libraryProductIds: [],
    createdConcepts: [],
    transactions: [],
    backings: [],
    conceptBackingTotals: {},
    feedSources: [],
    feedSubscriptions: [],
    feedItems: [],
    feedRefreshStates: {},
    proxySettings: { enabledAdapterIds: ["direct"] },
    translationSettings: { enabled: true, provider: "mymemory", showMachineTranslations: false },
    languagePreference: "auto",
    migrationWarnings: [],
    ...extras,
  };
}

test("parses and formats exactly one trillion units without floating-point loss", () => {
  const atomic = parse("1000000000000");
  assert.equal(atomic, "1000000000000000000");
  assert.equal(formatAtomicMoney(atomic, usd, { locale: "en-US" }), "1,000,000,000,000.00 USD");
  assert.equal(formatAtomicMoney(addAtomic(atomic, "1"), usd, { locale: "en-US" }), "1,000,000,000,000.00 USD");
});

test("supports exact large arithmetic and custom display patterns", () => {
  const left = parse("999999999999.123456");
  const right = parse("0.876544");
  assert.equal(addAtomic(left, right), "1000000000000000000");
  assert.equal(subtractAtomic(right, left), "0");
  assert.equal(multiplyAtomic(parse("0.000001"), 99), "99");
  assert.equal(compareAtomic(left, right), 1);
  assert.equal(formatAtomicMoney("1500000", { ...usd, currencyCode: "JPY", currencyLabel: "JPY", displayPrecision: 0, displayPattern: "{currency} {amount}" }, { locale: "ja-JP" }), "JPY 2");
});

test("rejects unsafe or over-precise monetary input", () => {
  for (const value of ["-1", "1.0000001", "1e3", "NaN", "1,000"]) assert.throws(() => parse(value));
});

test("settles with exact atomic amounts, snapshots provenance, and does not mutate input", () => {
  const catalog = [product("model", parse("480")), product("free", "0"), product("future", parse("50"), "FUTURE")];
  const state = stateWith(["model"], { cartQuantities: { model: 3 } });
  const result = settleOrder(state, catalog, "FITI-test", "2026-11-07T00:00:00Z");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.totalAtomic, "1440000000");
  assert.equal(result.state.wallet.balanceAtomic, "999999998560000000");
  assert.equal(result.order.items[0].quantity, 3);
  assert.equal(result.order.items[0].originKind, "CURATED");
  assert.equal(result.state.transactions[0].amountAtomic, "1440000000");
  assert.deepEqual(result.state.libraryProductIds, ["model"]);
  assert.deepEqual(result.state.cartProductIds, []);
  assert.deepEqual(result.state.cartQuantities, {});
  assert.equal(state.wallet.balanceAtomic, "1000000000000000000");
});

test("replaying a settled bag never charges twice and duplicate order ids are rejected", () => {
  const catalog = [product("model", parse("480"))];
  const first = settleOrder(stateWith(["model"]), catalog, "same-order", "now");
  assert.equal(first.ok, true);
  const replay = settleOrder(first.state, catalog, "same-order", "now");
  assert.equal(replay.ok, false);
  assert.equal(replay.reason, "duplicate");
  const second = settleOrder(first.state, catalog, "another-order", "now");
  assert.equal(second.ok, false);
  assert.equal(second.reason, "empty");
  assert.equal(first.state.orders.length, 1);
});

test("insufficient funds leave the bag and wallet intact", () => {
  const state = stateWith(["model"], { wallet: { initialized: true, balanceAtomic: parse("479") } });
  const result = settleOrder(state, [product("model", parse("480"))], "one", "now");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "balance");
  assert.equal(state.wallet.balanceAtomic, parse("479"));
  assert.deepEqual(state.cartProductIds, ["model"]);
});

test("zero-price items can be acquired with a zero wallet", () => {
  const state = stateWith(["free"], { wallet: { initialized: true, balanceAtomic: "0" } });
  const result = settleOrder(state, [product("free", "0")], "free-order", "now");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.state.wallet.balanceAtomic, "0");
});

test("unknown, future, and duplicate cart ids cannot be charged", () => {
  const catalog = [product("model", parse("480")), product("future", parse("50"), "FUTURE")];
  assert.equal(settleOrder(stateWith(["future", "missing"]), catalog, "one", "now").ok, false);
  const result = settleOrder(stateWith(["model", "model", "missing"]), catalog, "two", "now");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.totalAtomic, parse("480"));
});

test("quantity handling is bounded and deterministic", () => {
  for (const value of [undefined, -1, 0, 1.5, Infinity, NaN, "3"]) assert.equal(quantityFor({ model: value }, "model"), 1);
  assert.equal(quantityFor({ model: 120 }, "model"), 99);
});

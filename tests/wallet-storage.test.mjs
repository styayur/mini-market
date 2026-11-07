import test from "node:test";
import assert from "node:assert/strict";
import { createInitialMarketplaceState, exportMarketplaceData, importMarketplaceData, resetWalletToInitial } from "../lib/storage.ts";
import { WalletService } from "../lib/services/wallet-service.ts";
import { parseAmountToAtomic } from "../lib/money.ts";

test("changing initial credit affects settings but never silently replaces an existing wallet", () => {
  const state = createInitialMarketplaceState();
  state.orders = [{ id: "kept", createdAt: "2026-01-01T00:00:00Z", totalAtomic: "100", balanceAfterAtomic: "999999999999999900", currencyCode: "USD", currencyLabel: "USD", displayPrecision: 2, items: [] }];
  const service = new WalletService();
  const result = service.saveEconomySettings(state, { ...state.economy, initialCreditAtomic: parseAmountToAtomic("500") });
  assert.equal(result.ok, true);
  assert.equal(result.state.wallet.balanceAtomic, state.wallet.balanceAtomic);
  assert.equal(result.state.economy.initialCreditAtomic, parseAmountToAtomic("500"));
  assert.equal(result.state.orders[0].id, "kept");
});

test("explicit wallet reset preserves history and records an adjustment", () => {
  const state = createInitialMarketplaceState();
  state.wallet.balanceAtomic = parseAmountToAtomic("25");
  state.economy.initialCreditAtomic = parseAmountToAtomic("1000");
  const reset = resetWalletToInitial(state, "2026-11-07T06:00:00Z");
  assert.equal(reset.wallet.balanceAtomic, parseAmountToAtomic("1000"));
  assert.equal(reset.walletAdjustments.length, 1);
  assert.equal(reset.transactions[0].kind, "ADJUSTMENT");
  assert.equal(reset.economy.initialCreditAtomic, parseAmountToAtomic("1000"));
});

test("economy validation rejects invalid ISO codes, precision, and display patterns", () => {
  const state = createInitialMarketplaceState();
  const service = new WalletService();
  assert.equal(service.saveEconomySettings(state, { ...state.economy, currencyCode: "NOPE" }).ok, false);
  assert.equal(service.saveEconomySettings(state, { ...state.economy, displayPrecision: 7 }).ok, false);
  assert.equal(service.saveEconomySettings(state, { ...state.economy, displayPattern: "{amount}" }).ok, false);
  assert.equal(service.saveEconomySettings(state, { ...state.economy, currencyKind: "CUSTOM", currencyCode: "FITI", currencyLabel: "Fiticoin" }).ok, true);
});

test("export/import remains JSON-safe and preserves exact string amounts", () => {
  const state = createInitialMarketplaceState();
  const bundle = exportMarketplaceData(state);
  const serialized = JSON.stringify(bundle);
  assert.doesNotThrow(() => JSON.parse(serialized));
  const restored = importMarketplaceData(serialized);
  assert.equal(restored.state.wallet.balanceAtomic, "1000000000000000000");
  assert.equal(restored.state.economy.initialCreditAtomic, "1000000000000000000");
});

import type { PersistedMarketplaceState } from "@/types/marketplace";
import type { AtomicAmount, EconomySettings } from "@/types/economy";
import { addAtomic, compareAtomic, isValidIsoCurrency, parseAmountToAtomic, subtractAtomic } from "../money.ts";

export interface WalletMutationResult {
  ok: boolean;
  state: PersistedMarketplaceState;
  message?: string;
}

export function validateEconomySettings(settings: EconomySettings): string | undefined {
  if (settings.currencyKind === "ISO" && !isValidIsoCurrency(settings.currencyCode)) return "Use a valid three-letter ISO 4217 currency code.";
  if (settings.currencyKind === "CUSTOM" && !/^[A-Za-z0-9._-]{2,12}$/.test(settings.currencyCode)) return "Custom currency codes need 2–12 letters, digits, dots, underscores, or hyphens.";
  if (!settings.currencyLabel.trim()) return "Add a display label for the currency.";
  if (!Number.isInteger(settings.displayPrecision) || settings.displayPrecision < 0 || settings.displayPrecision > 6) return "Display precision must be between 0 and 6.";
  if (!settings.displayPattern.includes("{amount}") || !settings.displayPattern.includes("{currency}")) return "The display pattern must contain {amount} and {currency}.";
  try {
    parseAmountToAtomic(settings.initialCreditAtomic);
  } catch {
    return "The initial credit must be a non-negative decimal amount.";
  }
  return undefined;
}

export class WalletService {
  topUp(state: PersistedMarketplaceState, amountAtomic: AtomicAmount, createdAt: string): WalletMutationResult {
    if (compareAtomic(amountAtomic, "0") <= 0) return { ok: false, state, message: "Choose an amount above zero." };
    const id = `topup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      ok: true,
      state: {
        ...state,
        wallet: { ...state.wallet, initialized: true, balanceAtomic: addAtomic(state.wallet.balanceAtomic, amountAtomic) },
        topUps: [{ id, amountAtomic, createdAt }, ...state.topUps],
        transactions: [{
          id: `${id}-tx`,
          userId: "demo-user",
          productId: "wallet-top-up",
          quantity: 1,
          amountAtomic,
          createdAt,
          status: "COMPLETED",
          kind: "TOP_UP",
        }, ...state.transactions],
      },
    };
  }

  backConcept(state: PersistedMarketplaceState, conceptId: string, amountAtomic: AtomicAmount, createdAt: string): WalletMutationResult {
    if (!conceptId || compareAtomic(amountAtomic, "0") <= 0) return { ok: false, state, message: "Choose a backing amount above zero." };
    if (compareAtomic(amountAtomic, state.wallet.balanceAtomic) > 0) return { ok: false, state, message: "The balance is too low for this backing." };
    const id = `backing-${Date.now()}-${conceptId}`;
    const previousTotal = state.conceptBackingTotals[conceptId] ?? "0";
    return {
      ok: true,
      state: {
        ...state,
        wallet: { ...state.wallet, balanceAtomic: subtractAtomic(state.wallet.balanceAtomic, amountAtomic) },
        backings: [{
          id,
          conceptId,
          userId: "demo-user",
          amountAtomic,
          createdAt,
        }, ...state.backings],
        conceptBackingTotals: { ...state.conceptBackingTotals, [conceptId]: addAtomic(previousTotal, amountAtomic) },
        transactions: [{
          id: `${id}-tx`,
          userId: "demo-user",
          productId: conceptId,
          quantity: 1,
          amountAtomic,
          createdAt,
          status: "COMPLETED",
          kind: "BACKING",
        }, ...state.transactions],
      },
    };
  }

  saveEconomySettings(state: PersistedMarketplaceState, settings: EconomySettings): WalletMutationResult {
    const error = validateEconomySettings(settings);
    if (error) return { ok: false, state, message: error };
    return {
      ok: true,
      state: { ...state, economy: settings },
    };
  }
}

export const walletService = new WalletService();

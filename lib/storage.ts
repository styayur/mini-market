import type { PersistedMarketplaceState } from "@/types/marketplace";

export const MARKETPLACE_STORAGE_KEY = "mini-market-demo-v1";

export const initialMarketplaceState: PersistedMarketplaceState = {
  credits: 10_000,
  cartQuantities: {},
  orders: [],
  topUps: [],
  cartProductIds: [],
  favoriteProductIds: [],
  watchedConceptIds: [],
  libraryProductIds: [],
  createdConcepts: [],
  transactions: [],
  backings: [],
  conceptBackingTotals: {},
};

export function readMarketplaceState(): PersistedMarketplaceState {
  if (typeof window === "undefined") return initialMarketplaceState;

  try {
    const raw = window.localStorage.getItem(MARKETPLACE_STORAGE_KEY);
    if (!raw) return initialMarketplaceState;
    const parsed = JSON.parse(raw) as Partial<PersistedMarketplaceState>;

    return {
      ...initialMarketplaceState,
      ...parsed,
      credits:
        Number.isSafeInteger(parsed.credits) && parsed.credits! >= 0
          ? parsed.credits!
          : 10_000,
      cartQuantities:
        parsed.cartQuantities && typeof parsed.cartQuantities === "object"
          ? parsed.cartQuantities
          : {},
      orders: Array.isArray(parsed.orders)
        ? parsed.orders.filter(
            (order) =>
              order &&
              Array.isArray(order.items) &&
              Number.isFinite(order.total),
          )
        : [],
      topUps: Array.isArray(parsed.topUps)
        ? parsed.topUps.filter((item) => item && Number.isFinite(item.amount))
        : [],
      cartProductIds: Array.isArray(parsed.cartProductIds)
        ? parsed.cartProductIds
        : [],
      favoriteProductIds: Array.isArray(parsed.favoriteProductIds)
        ? parsed.favoriteProductIds
        : [],
      watchedConceptIds: Array.isArray(parsed.watchedConceptIds)
        ? parsed.watchedConceptIds
        : [],
      libraryProductIds: Array.isArray(parsed.libraryProductIds)
        ? parsed.libraryProductIds
        : [],
      createdConcepts: Array.isArray(parsed.createdConcepts)
        ? parsed.createdConcepts
        : [],
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
        : [],
      backings: Array.isArray(parsed.backings) ? parsed.backings : [],
      conceptBackingTotals:
        parsed.conceptBackingTotals &&
        typeof parsed.conceptBackingTotals === "object"
          ? parsed.conceptBackingTotals
          : {},
    };
  } catch {
    return initialMarketplaceState;
  }
}

export function writeMarketplaceState(state: PersistedMarketplaceState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function clearMarketplaceState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MARKETPLACE_STORAGE_KEY);
  } catch {
    /* In-memory reset still works. */
  }
}

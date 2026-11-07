import type {
  MarketOrder,
  PersistedMarketplaceState,
  Product,
  Transaction,
} from "@/types/marketplace";
import { addAtomic, compareAtomic, multiplyAtomic, subtractAtomic } from "./money.ts";

export const MAX_QUANTITY = 99;

export function quantityFor(quantities: Record<string, number>, id: string) {
  const value = quantities[id];
  return Number.isSafeInteger(value) && value > 0
    ? Math.min(value, MAX_QUANTITY)
    : 1;
}

/** Pure, synchronous settlement: the caller commits this state once. */
export function settleOrder(
  state: PersistedMarketplaceState,
  catalog: Product[],
  id: string,
  createdAt: string,
) {
  if (state.orders.some((order) => order.id === id)) {
    return { ok: false as const, totalAtomic: "0", reason: "duplicate" as const };
  }
  const items = [...new Set(state.cartProductIds)].flatMap((productId) => {
    const product = catalog.find(
      (candidate) => candidate.id === productId && candidate.status === "NOW",
    );
    return product
      ? [{
          productId,
          name: product.name,
          quantity: quantityFor(state.cartQuantities, productId),
          unitPriceAtomic: product.priceAtomic,
          originKind: product.origin.kind,
        }]
      : [];
  });
  const totalAtomic = items.reduce((sum, item) => addAtomic(sum, multiplyAtomic(item.unitPriceAtomic, item.quantity)), "0");
  if (!items.length)
    return { ok: false as const, totalAtomic: "0", reason: "empty" as const };
  if (compareAtomic(totalAtomic, state.wallet.balanceAtomic) > 0)
    return { ok: false as const, totalAtomic, reason: "balance" as const };

  const balanceAfterAtomic = subtractAtomic(state.wallet.balanceAtomic, totalAtomic);
  const order: MarketOrder = {
    id,
    createdAt,
    totalAtomic,
    balanceAfterAtomic,
    currencyCode: state.economy.currencyCode,
    currencyLabel: state.economy.currencyLabel,
    displayPrecision: state.economy.displayPrecision,
    displayPattern: state.economy.displayPattern,
    items,
  };
  const transactions: Transaction[] = items.map((item, index) => ({
    id: `${id}-${index}`,
    userId: "demo-user",
    productId: item.productId,
    quantity: item.quantity,
    amountAtomic: multiplyAtomic(item.unitPriceAtomic, item.quantity),
    createdAt,
    status: "COMPLETED",
    kind: "PURCHASE",
  }));
  return {
    ok: true as const,
    totalAtomic,
    order,
    state: {
      ...state,
      wallet: { ...state.wallet, initialized: true, balanceAtomic: balanceAfterAtomic },
      cartProductIds: [],
      cartQuantities: {},
      libraryProductIds: [
        ...new Set([
          ...state.libraryProductIds,
          ...items.map((item) => item.productId),
        ]),
      ],
      transactions: [...transactions, ...state.transactions],
      orders: [order, ...state.orders],
    },
  };
}

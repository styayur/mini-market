import type {
  MarketOrder,
  PersistedMarketplaceState,
  Product,
  Transaction,
} from "@/types/marketplace";

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
  const items = [...new Set(state.cartProductIds)].flatMap((productId) => {
    const product = catalog.find(
      (p) => p.id === productId && p.status === "NOW",
    );
    return product
      ? [
          {
            productId,
            name: product.name,
            quantity: quantityFor(state.cartQuantities, productId),
            unitPrice: product.demoPrice,
          },
        ]
      : [];
  });
  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  if (!items.length)
    return { ok: false as const, total: 0, reason: "empty" as const };
  if (!Number.isSafeInteger(state.credits) || total > state.credits)
    return { ok: false as const, total, reason: "balance" as const };
  const order: MarketOrder = {
    id,
    createdAt,
    total,
    balanceAfter: state.credits - total,
    items,
  };
  const transactions: Transaction[] = items.map((item, index) => ({
    id: `${id}-${index}`,
    userId: "demo-user",
    productId: item.productId,
    quantity: item.quantity,
    creditsSpent: item.unitPrice * item.quantity,
    createdAt,
    status: "COMPLETED",
  }));
  return {
    ok: true as const,
    total,
    order,
    state: {
      ...state,
      credits: order.balanceAfter,
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

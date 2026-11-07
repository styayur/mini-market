import type { PersistedMarketplaceState, Product } from "@/types/marketplace";
import { settleOrder } from "../commerce.ts";

export class OrderService {
  settle(state: PersistedMarketplaceState, catalog: Product[], orderId: string, createdAt: string) {
    return settleOrder(state, catalog, orderId, createdAt);
  }
}

export const orderService = new OrderService();

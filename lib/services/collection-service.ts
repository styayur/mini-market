import type { PersistedMarketplaceState } from "@/types/marketplace";

function unique(values: string[]) {
  return [...new Set(values)];
}

export class CollectionService {
  addToCart(state: PersistedMarketplaceState, productId: string): PersistedMarketplaceState {
    return { ...state, cartProductIds: unique([...state.cartProductIds, productId]) };
  }

  addBundle(state: PersistedMarketplaceState, productIds: string[]): PersistedMarketplaceState {
    return { ...state, cartProductIds: unique([...state.cartProductIds, ...productIds]) };
  }

  removeFromCart(state: PersistedMarketplaceState, productId: string): PersistedMarketplaceState {
    const cartQuantities = { ...state.cartQuantities };
    delete cartQuantities[productId];
    return { ...state, cartProductIds: state.cartProductIds.filter((id) => id !== productId), cartQuantities };
  }

  removeFromLibrary(state: PersistedMarketplaceState, productId: string): PersistedMarketplaceState {
    return { ...state, libraryProductIds: state.libraryProductIds.filter((id) => id !== productId) };
  }

  toggleFavorite(state: PersistedMarketplaceState, productId: string): PersistedMarketplaceState {
    const exists = state.favoriteProductIds.includes(productId);
    return {
      ...state,
      favoriteProductIds: exists ? state.favoriteProductIds.filter((id) => id !== productId) : [...state.favoriteProductIds, productId],
    };
  }

  toggleWatch(state: PersistedMarketplaceState, conceptId: string): PersistedMarketplaceState {
    const exists = state.watchedConceptIds.includes(conceptId);
    return {
      ...state,
      watchedConceptIds: exists ? state.watchedConceptIds.filter((id) => id !== conceptId) : [...state.watchedConceptIds, conceptId],
    };
  }
}

export const collectionService = new CollectionService();

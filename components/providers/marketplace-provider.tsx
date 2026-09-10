"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { concepts as seedConcepts, conceptMap } from "@/data/concepts";
import { productMap, products } from "@/data/products";
import { clearMarketplaceState, initialMarketplaceState, readMarketplaceState, writeMarketplaceState } from "@/lib/storage";
import type { Concept, PersistedMarketplaceState, Product, Transaction } from "@/types/marketplace";

type Toast = { id: string; kind: "success" | "info"; message: string };
type PurchaseResult = { ok: boolean; total: number; message: string };

interface MarketplaceContextValue {
  hydrated: boolean;
  credits: number;
  cartProductIds: string[];
  favoriteProductIds: string[];
  watchedConceptIds: string[];
  libraryProductIds: string[];
  createdConcepts: Concept[];
  transactions: Transaction[];
  allConcepts: Concept[];
  products: Product[];
  toasts: Toast[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  removeFromLibrary: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  toggleWatch: (conceptId: string) => void;
  backConcept: (conceptId: string, amount: number) => boolean;
  purchase: () => PurchaseResult;
  publishConcept: (concept: Concept) => void;
  getBackingTotal: (conceptId: string) => number;
  getConcept: (id: string) => Concept | undefined;
  resetDemo: () => void;
  dismissToast: (id: string) => void;
  notify: (message: string, kind?: Toast["kind"]) => void;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

function pushUnique(list: string[], value: string) {
  return list.includes(value) ? list : [...list, value];
}

function removeValue(list: string[], value: string) {
  return list.filter((item) => item !== value);
}

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedMarketplaceState>(initialMarketplaceState);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(readMarketplaceState());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) writeMarketplaceState(state);
  }, [hydrated, state]);

  const notify = (message: string, kind: Toast["kind"] = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  };

  const allConcepts = useMemo(() => [...state.createdConcepts, ...seedConcepts], [state.createdConcepts]);

  const addToCart = (productId: string) => {
    setState((current) => ({ ...current, cartProductIds: pushUnique(current.cartProductIds, productId) }));
    notify("Added to cart.");
  };

  const removeFromCart = (productId: string) => {
    setState((current) => ({ ...current, cartProductIds: removeValue(current.cartProductIds, productId) }));
    notify("Removed from cart.", "info");
  };

  const removeFromLibrary = (productId: string) => {
    setState((current) => ({ ...current, libraryProductIds: removeValue(current.libraryProductIds, productId) }));
    notify("Removed from library.", "info");
  };

  const toggleFavorite = (productId: string) => {
    const isFavorite = state.favoriteProductIds.includes(productId);
    setState((current) => ({
      ...current,
      favoriteProductIds: isFavorite ? removeValue(current.favoriteProductIds, productId) : pushUnique(current.favoriteProductIds, productId),
    }));
    notify(isFavorite ? "Removed from favorites." : "Added to favorites.", isFavorite ? "info" : "success");
  };

  const toggleWatch = (conceptId: string) => {
    const isWatched = state.watchedConceptIds.includes(conceptId);
    setState((current) => ({
      ...current,
      watchedConceptIds: isWatched ? removeValue(current.watchedConceptIds, conceptId) : pushUnique(current.watchedConceptIds, conceptId),
    }));
    notify(isWatched ? "Stopped watching." : "Watching concept.", isWatched ? "info" : "success");
  };

  const backConcept = (conceptId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0 || amount > state.credits) return false;
    const backing = {
      id: `backing-${Date.now()}-${conceptId}`,
      conceptId,
      userId: "demo-user",
      credits: amount,
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({
      ...current,
      credits: current.credits - amount,
      backings: [...current.backings, backing],
      conceptBackingTotals: {
        ...current.conceptBackingTotals,
        [conceptId]: (current.conceptBackingTotals[conceptId] ?? 0) + amount,
      },
    }));
    notify(`Backed this idea with ${amount} credits.`);
    return true;
  };

  const purchase = (): PurchaseResult => {
    const cartProducts = state.cartProductIds.map((id) => productMap.get(id)).filter((product): product is Product => Boolean(product));
    const total = cartProducts.reduce((sum, product) => sum + product.demoPrice, 0);
    if (!cartProducts.length) return { ok: false, total: 0, message: "Your cart is empty." };
    if (total > state.credits) return { ok: false, total, message: "Not enough demo credits." };

    const transactions: Transaction[] = cartProducts.map((product, index) => ({
      id: `transaction-${Date.now()}-${index}`,
      userId: "demo-user",
      productId: product.id,
      quantity: 1,
      creditsSpent: product.demoPrice,
      createdAt: new Date().toISOString(),
      status: "COMPLETED",
    }));

    setState((current) => ({
      ...current,
      credits: current.credits - total,
      libraryProductIds: Array.from(new Set([...current.libraryProductIds, ...cartProducts.map((product) => product.id)])),
      transactions: [...transactions, ...current.transactions],
      cartProductIds: [],
    }));
    notify("Purchase complete. Your library was updated.");
    return { ok: true, total, message: "Purchase complete." };
  };

  const publishConcept = (concept: Concept) => {
    setState((current) => ({ ...current, createdConcepts: [concept, ...current.createdConcepts.filter((item) => item.id !== concept.id && item.slug !== concept.slug)] }));
    notify("Concept published. It is now visible in FUTURE.");
  };

  const getBackingTotal = (conceptId: string) => {
    const base = conceptMap.get(conceptId)?.backingCredits ?? 0;
    return base + (state.conceptBackingTotals[conceptId] ?? 0);
  };

  const getConcept = (id: string) => allConcepts.find((concept) => concept.id === id || concept.slug === id);

  const resetDemo = () => {
    clearMarketplaceState();
    setState(initialMarketplaceState);
    notify("Demo data reset.", "info");
  };

  const dismissToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <MarketplaceContext.Provider value={{
      hydrated, credits: state.credits, cartProductIds: state.cartProductIds,
      favoriteProductIds: state.favoriteProductIds, watchedConceptIds: state.watchedConceptIds,
      libraryProductIds: state.libraryProductIds, createdConcepts: state.createdConcepts,
      transactions: state.transactions, allConcepts, products, toasts,
      addToCart, removeFromCart, removeFromLibrary, toggleFavorite, toggleWatch, backConcept, purchase,
      publishConcept, getBackingTotal, getConcept, resetDemo, dismissToast, notify,
    }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id} role="status">
            {toast.kind === "success" ? <CheckCircle2 size={17} /> : <Info size={17} />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification"><X size={15} /></button>
          </div>
        ))}
      </div>
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error("useMarketplace must be used within MarketplaceProvider");
  return context;
}






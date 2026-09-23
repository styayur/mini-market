"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { concepts as seedConcepts, conceptMap } from "@/data/concepts";
import { productMap, products } from "@/data/products";
import {
  clearMarketplaceState,
  initialMarketplaceState,
  readMarketplaceState,
  writeMarketplaceState,
} from "@/lib/storage";
import type {
  Concept,
  ConceptBacking,
  MarketOrder,
  WalletTopUp,
  PersistedMarketplaceState,
  Product,
  Transaction,
} from "@/types/marketplace";
import { settleOrder } from "@/lib/commerce";
import { useLanguage } from "@/components/providers/language-provider";

type Toast = { id: string; kind: "success" | "info"; message: string };
type PurchaseResult = {
  ok: boolean;
  total: number;
  message: string;
  order?: MarketOrder;
};

interface MarketplaceContextValue {
  hydrated: boolean;
  credits: number;
  cartQuantities: Record<string, number>;
  orders: MarketOrder[];
  topUps: WalletTopUp[];
  backings: ConceptBacking[];
  setQuantity: (productId: string, quantity: number) => void;
  addBundle: (productIds: string[]) => void;
  topUp: (amount: number) => void;
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

export function MarketplaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, renderState] = useState<PersistedMarketplaceState>(
    initialMarketplaceState,
  );
  const stateRef = useRef(state);
  const { language } = useLanguage();
  const copy = (en: string, zh: string) => (language === "zh" ? zh : en);
  // Commit synchronously so rapid clicks cannot spend the same balance twice.
  const setState = (
    update:
      | PersistedMarketplaceState
      | ((current: PersistedMarketplaceState) => PersistedMarketplaceState),
  ) => {
    const next =
      typeof update === "function" ? update(stateRef.current) : update;
    stateRef.current = next;
    renderState(next);
  };
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
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      3200,
    );
  };

  const allConcepts = useMemo(
    () => [...state.createdConcepts, ...seedConcepts],
    [state.createdConcepts],
  );

  const addToCart = (productId: string) => {
    if (!hydrated || !productMap.has(productId)) return;
    setState((current) => ({
      ...current,
      cartProductIds: pushUnique(current.cartProductIds, productId),
    }));
    notify(
      copy(
        "Added to your bag. Ready when you are.",
        "已放入购物袋，喜欢的能力先收下。",
      ),
    );
  };

  const addBundle = (productIds: string[]) => {
    if (!hydrated) return;
    setState((current) => ({
      ...current,
      cartProductIds: [
        ...new Set([
          ...current.cartProductIds,
          ...productIds.filter((id) => productMap.has(id)),
        ]),
      ],
    }));
    notify(copy("Collection added to your bag.", "整套能力已加入购物袋。"));
  };
  const setQuantity = (productId: string, quantity: number) => {
    if (
      !hydrated ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    )
      return;
    setState((current) => ({
      ...current,
      cartQuantities: { ...current.cartQuantities, [productId]: quantity },
    }));
  };
  const topUp = (amount: number) => {
    if (!hydrated || ![1000, 5000, 10000].includes(amount)) return;
    setState((current) => ({
      ...current,
      credits: current.credits + amount,
      topUps: [
        {
          id: crypto.randomUUID(),
          amount,
          createdAt: new Date().toISOString(),
        },
        ...current.topUps,
      ],
    }));
    notify(
      copy(
        `${amount.toLocaleString()} demo Tokens added to your wallet.`,
        `${amount.toLocaleString()} 体验 Token 已到账。`,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setState((current) => ({
      ...current,
      cartProductIds: removeValue(current.cartProductIds, productId),
      cartQuantities: { ...current.cartQuantities, [productId]: 1 },
    }));
    notify(copy("Removed from bag.", "已从购物袋移除。"), "info");
  };

  const removeFromLibrary = (productId: string) => {
    setState((current) => ({
      ...current,
      libraryProductIds: removeValue(current.libraryProductIds, productId),
    }));
    notify("Removed from library.", "info");
  };

  const toggleFavorite = (productId: string) => {
    const isFavorite = state.favoriteProductIds.includes(productId);
    setState((current) => ({
      ...current,
      favoriteProductIds: isFavorite
        ? removeValue(current.favoriteProductIds, productId)
        : pushUnique(current.favoriteProductIds, productId),
    }));
    notify(
      isFavorite ? "Removed from favorites." : "Added to favorites.",
      isFavorite ? "info" : "success",
    );
  };

  const toggleWatch = (conceptId: string) => {
    const isWatched = state.watchedConceptIds.includes(conceptId);
    setState((current) => ({
      ...current,
      watchedConceptIds: isWatched
        ? removeValue(current.watchedConceptIds, conceptId)
        : pushUnique(current.watchedConceptIds, conceptId),
    }));
    notify(
      isWatched ? "Stopped watching." : "Watching concept.",
      isWatched ? "info" : "success",
    );
  };

  const backConcept = (conceptId: string, amount: number) => {
    if (
      !hydrated ||
      !allConcepts.some((item) => item.id === conceptId) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > stateRef.current.credits
    )
      return false;
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
    notify(
      copy(
        `Backed this idea with ${amount} demo Tokens.`,
        `已用 ${amount} 枚体验 Token 支持这个概念。`,
      ),
    );
    return true;
  };

  const purchase = (): PurchaseResult => {
    if (!hydrated)
      return {
        ok: false,
        total: 0,
        message: copy("Loading wallet…", "正在载入钱包…"),
      };
    const result = settleOrder(
      stateRef.current,
      products,
      `MM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      new Date().toISOString(),
    );
    if (!result.ok)
      return {
        ok: false,
        total: result.total,
        message:
          result.reason === "empty"
            ? copy("Your bag is empty.", "购物袋为空。")
            : copy(
                "Add demo Tokens to continue.",
                "体验 Token 不足，请先补充余额。",
              ),
      };
    setState(result.state);
    notify(
      copy(
        "Order complete. Make something extraordinary.",
        "订单完成，新的能力已收入囊中。",
      ),
    );
    return {
      ok: true,
      total: result.total,
      order: result.order,
      message: "Order complete.",
    };
  };

  const publishConcept = (concept: Concept) => {
    setState((current) => ({
      ...current,
      createdConcepts: [
        concept,
        ...current.createdConcepts.filter(
          (item) => item.id !== concept.id && item.slug !== concept.slug,
        ),
      ],
    }));
    notify("Concept published. It is now visible in FUTURE.");
  };

  const getBackingTotal = (conceptId: string) => {
    const base = conceptMap.get(conceptId)?.backingCredits ?? 0;
    return base + (state.conceptBackingTotals[conceptId] ?? 0);
  };

  const getConcept = (id: string) =>
    allConcepts.find((concept) => concept.id === id || concept.slug === id);

  const resetDemo = () => {
    clearMarketplaceState();
    setState(initialMarketplaceState);
    notify("Demo data reset.", "info");
  };

  const dismissToast = (id: string) =>
    setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <MarketplaceContext.Provider
      value={{
        hydrated,
        credits: state.credits,
        cartProductIds: state.cartProductIds,
        cartQuantities: state.cartQuantities,
        orders: state.orders,
        topUps: state.topUps,
        backings: state.backings,
        setQuantity,
        addBundle,
        topUp,
        favoriteProductIds: state.favoriteProductIds,
        watchedConceptIds: state.watchedConceptIds,
        libraryProductIds: state.libraryProductIds,
        createdConcepts: state.createdConcepts,
        transactions: state.transactions,
        allConcepts,
        products,
        toasts,
        addToCart,
        removeFromCart,
        removeFromLibrary,
        toggleFavorite,
        toggleWatch,
        backConcept,
        purchase,
        publishConcept,
        getBackingTotal,
        getConcept,
        resetDemo,
        dismissToast,
        notify,
      }}
    >
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id} role="status">
            {toast.kind === "success" ? (
              <CheckCircle2 size={17} />
            ) : (
              <Info size={17} />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context)
    throw new Error("useMarketplace must be used within MarketplaceProvider");
  return context;
}

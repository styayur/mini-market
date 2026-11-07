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
import { concepts as seedConcepts } from "@/data/concepts";
import { products as curatedProducts } from "@/data/products";
import {
  createInitialMarketplaceState,
  clearMarketplaceState,
  exportMarketplaceData,
  importMarketplaceData,
  readMarketplaceState,
  resetWalletToInitial,
  writeMarketplaceState,
} from "@/lib/storage";
import { addAtomic, parseAmountToAtomic } from "@/lib/money";
import { collectionService } from "@/lib/services/collection-service";
import { orderService } from "@/lib/services/order-service";
import { walletService } from "@/lib/services/wallet-service";
import { catalogService } from "@/lib/catalog-service";
import { FeedService, type AddFeedInput } from "@/lib/feed/feed-service";
import { translationService } from "@/lib/translation/translation-service";
import type {
  Concept,
  ConceptBacking,
  MarketOrder,
  WalletAdjustment,
  WalletTopUp,
  PersistedMarketplaceState,
  Product,
  Transaction,
  TranslationSettings,
  LanguagePreference,
} from "@/types/marketplace";
import type { FeedItem, FeedRefreshState, FeedSource, FeedSubscription, ProxySettings } from "@/types/feed";
import type { AtomicAmount, EconomySettings } from "@/types/economy";
import { useLanguage } from "@/components/providers/language-provider";

type Toast = { id: string; kind: "success" | "info" | "error"; message: string };
type PurchaseResult = {
  ok: boolean;
  totalAtomic: AtomicAmount;
  message: string;
  order?: MarketOrder;
};
type ActionResult = { ok: boolean; message: string };
type FeedActionResult = ActionResult & { refreshState?: FeedRefreshState };

interface MarketplaceContextValue {
  hydrated: boolean;
  migrationWarnings: string[];
  balanceAtomic: AtomicAmount;
  economy: EconomySettings;
  cartQuantities: Record<string, number>;
  orders: MarketOrder[];
  topUps: WalletTopUp[];
  walletAdjustments: WalletAdjustment[];
  backings: ConceptBacking[];
  favoriteProductIds: string[];
  watchedConceptIds: string[];
  libraryProductIds: string[];
  createdConcepts: Concept[];
  transactions: Transaction[];
  products: Product[];
  curatedProducts: Product[];
  allConcepts: Concept[];
  feedSources: FeedSource[];
  feedSubscriptions: FeedSubscription[];
  feedItems: FeedItem[];
  feedRefreshStates: Record<string, FeedRefreshState>;
  proxySettings: ProxySettings;
  translationSettings: TranslationSettings;
  languagePreference: LanguagePreference;
  toasts: Toast[];
  setQuantity: (productId: string, quantity: number) => void;
  addBundle: (productIds: string[]) => void;
  topUp: (amount: string) => ActionResult;
  cartProductIds: string[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  removeFromLibrary: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  toggleWatch: (conceptId: string) => void;
  backConcept: (conceptId: string, amount: string) => ActionResult;
  purchase: () => PurchaseResult;
  publishConcept: (concept: Concept) => void;
  getBackingTotal: (conceptId: string) => AtomicAmount;
  getConcept: (id: string) => Concept | undefined;
  resetDemo: () => void;
  dismissToast: (id: string) => void;
  notify: (message: string, kind?: Toast["kind"]) => void;
  updateEconomy: (settings: EconomySettings) => ActionResult;
  resetWallet: () => ActionResult;
  exportData: () => string;
  importData: (raw: string) => ActionResult;
  addFeed: (input: AddFeedInput) => Promise<FeedActionResult>;
  refreshFeed: (subscriptionId: string, force?: boolean) => Promise<FeedActionResult>;
  updateFeedSubscription: (subscriptionId: string, patch: Partial<Pick<FeedSubscription, "title" | "enabled" | "category" | "priceAtomic" | "refreshIntervalMinutes">>) => ActionResult;
  removeFeed: (subscriptionId: string) => void;
  clearFeedCache: (feedUrl: string) => Promise<void>;
  clearAllFeedCache: () => Promise<void>;
  saveProxySettings: (settings: ProxySettings) => void;
  saveTranslationSettings: (settings: TranslationSettings) => void;
  saveLanguagePreference: (preference: LanguagePreference) => void;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);
const feedService = new FeedService();

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [state, renderState] = useState<PersistedMarketplaceState>(createInitialMarketplaceState);
  const stateRef = useRef(state);
  const { language, preference, setPreference } = useLanguage();
  const copy = (en: string, zh: string) => (language === "zh" ? zh : en);
  const setState = (
    update: PersistedMarketplaceState | ((current: PersistedMarketplaceState) => PersistedMarketplaceState),
  ) => {
    const next = typeof update === "function" ? update(stateRef.current) : update;
    stateRef.current = next;
    renderState(next);
  };
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const settlementLockRef = useRef(false);
  const refreshingFeedsRef = useRef(new Set<string>());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readMarketplaceState();
      setState(stored.state);
      if (stored.state.languagePreference !== "auto" && preference === "auto") setPreference(stored.state.languagePreference);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
    // Hydration intentionally reads persisted data once after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) writeMarketplaceState(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || state.languagePreference === preference) return;
    setState((current) => ({ ...current, languagePreference: preference }));
  }, [hydrated, preference, state.languagePreference]);

  const notify = (message: string, kind: Toast["kind"] = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3600);
  };

  const retainedFeedProductIds = useMemo(
    () => [...new Set([...state.libraryProductIds, ...state.favoriteProductIds, ...state.cartProductIds])],
    [state.libraryProductIds, state.favoriteProductIds, state.cartProductIds],
  );
  const products = useMemo(
    () => catalogService.list(curatedProducts, state.feedSubscriptions, state.feedItems, retainedFeedProductIds),
    [state.feedSubscriptions, state.feedItems, retainedFeedProductIds],
  );
  const allConcepts = useMemo(() => [...state.createdConcepts, ...seedConcepts], [state.createdConcepts]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const addToCart = (productId: string) => {
    if (!hydrated || !productMap.has(productId)) return;
    setState((current) => collectionService.addToCart(current, productId));
    notify(copy("Added to your bag. Ready when you are.", "已放入购物袋，喜欢的内容先收下。"));
  };

  const addBundle = (productIds: string[]) => {
    if (!hydrated) return;
    setState((current) => collectionService.addBundle(current, productIds.filter((id) => productMap.has(id))));
    notify(copy("Collection added to your bag.", "整套内容已加入购物袋。"));
  };

  const setQuantity = (productId: string, quantity: number) => {
    if (!hydrated || !productMap.has(productId)) return;
    const next = Number.isSafeInteger(quantity) ? Math.max(1, Math.min(99, quantity)) : 1;
    setState((current) => ({ ...current, cartQuantities: { ...current.cartQuantities, [productId]: next } }));
  };

  const removeFromCart = (productId: string) => setState((current) => collectionService.removeFromCart(current, productId));
  const removeFromLibrary = (productId: string) => setState((current) => collectionService.removeFromLibrary(current, productId));
  const toggleFavorite = (productId: string) => setState((current) => collectionService.toggleFavorite(current, productId));
  const toggleWatch = (conceptId: string) => setState((current) => collectionService.toggleWatch(current, conceptId));

  const topUp = (amount: string): ActionResult => {
    if (!hydrated) return { ok: false, message: copy("Wallet is still loading.", "钱包仍在载入。") };
    try {
      const result = walletService.topUp(stateRef.current, parseAmountToAtomic(amount), new Date().toISOString());
      if (!result.ok) return { ok: false, message: result.message ?? copy("Could not top up the wallet.", "无法补充钱包。") };
      setState(result.state);
      notify(copy("Demo balance added.", "体验余额已补充。"));
      return { ok: true, message: copy("Demo balance added.", "体验余额已补充。") };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : copy("Enter a valid amount.", "请输入有效金额。") };
    }
  };

  const backConcept = (conceptId: string, amount: string): ActionResult => {
    if (!hydrated || !allConcepts.some((item) => item.id === conceptId)) return { ok: false, message: copy("Concept not found.", "未找到概念。") };
    try {
      const result = walletService.backConcept(stateRef.current, conceptId, parseAmountToAtomic(amount), new Date().toISOString());
      if (!result.ok) return { ok: false, message: result.message ?? copy("Could not back this concept.", "无法支持此概念。") };
      setState(result.state);
      notify(copy("Backing recorded. This is simulated support, not an investment.", "支持已记录，这只是模拟支持，不构成投资。"));
      return { ok: true, message: copy("Backing recorded.", "支持已记录。") };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : copy("Enter a valid amount.", "请输入有效金额。") };
    }
  };

  const purchase = (): PurchaseResult => {
    if (!hydrated) return { ok: false, totalAtomic: "0", message: copy("Loading wallet…", "正在载入钱包…") };
    if (settlementLockRef.current) return { ok: false, totalAtomic: "0", message: copy("This purchase is already being settled.", "这笔购买正在结算。") };
    settlementLockRef.current = true;
    try {
      const result = orderService.settle(stateRef.current, products, `FITI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, new Date().toISOString());
      if (!result.ok) {
        const message = result.reason === "empty"
          ? copy("Your bag is empty.", "购物袋为空。")
          : result.reason === "balance"
            ? copy("The virtual balance is too low. Add demo credit to continue.", "虚拟余额不足，请先补充体验额度。")
            : copy("This order could not be settled again.", "此订单无法重复结算。");
        return { ok: false, totalAtomic: result.totalAtomic, message };
      }
      setState(result.state);
      notify(copy("Purchase complete. Gold coin celebration unlocked.", "购买完成，金币庆祝动画已触发。"));
      return { ok: true, totalAtomic: result.totalAtomic, order: result.order, message: copy("Purchase complete.", "购买完成。") };
    } finally {
      settlementLockRef.current = false;
    }
  };

  const publishConcept = (concept: Concept) => {
    const normalized: Concept = {
      ...concept,
      origin: { kind: "USER", creatorId: "demo-user" },
      isUserCreated: true,
    };
    setState((current) => ({
      ...current,
      createdConcepts: [normalized, ...current.createdConcepts.filter((item) => item.id !== concept.id && item.slug !== concept.slug)],
    }));
    notify(copy("Concept published. It is now visible in FUTURE.", "概念已发布，现在可在未来市场中看到。"));
  };

  const getBackingTotal = (conceptId: string) => {
    const base = seedConcepts.find((concept) => concept.id === conceptId)?.backingAtomic ?? "0";
    return addAtomic(base, state.conceptBackingTotals[conceptId] ?? "0");
  };

  const getConcept = (id: string) => allConcepts.find((concept) => concept.id === id || concept.slug === id);

  const updateEconomy = (settings: EconomySettings): ActionResult => {
    const result = walletService.saveEconomySettings(stateRef.current, settings);
    if (!result.ok) return { ok: false, message: result.message ?? copy("Could not save economy settings.", "无法保存经济设置。") };
    setState(result.state);
    notify(copy("Economy display settings saved. No balance was converted.", "经济显示设置已保存，余额未发生兑换。"));
    return { ok: true, message: copy("Economy settings saved.", "经济设置已保存。") };
  };

  const resetWallet = (): ActionResult => {
    setState((current) => resetWalletToInitial(current, new Date().toISOString()));
    notify(copy("Wallet reset to the configured initial credit. History was preserved.", "钱包已重置为配置的初始额度，历史记录已保留。"));
    return { ok: true, message: copy("Wallet reset.", "钱包已重置。") };
  };

  const exportData = () => JSON.stringify(exportMarketplaceData(stateRef.current), null, 2);

  const importData = (raw: string): ActionResult => {
    const result = importMarketplaceData(raw);
    const fatal = result.warnings.some((warning) => warning.includes("not valid JSON") || warning.includes("Could not parse"));
    if (fatal) return { ok: false, message: copy("That file could not be imported.", "无法导入该文件。") };
    setState(result.state);
    notify(
      result.warnings.length
        ? copy("Marketplace data imported with migration notes.", "市场数据已导入，并包含迁移提示。")
        : copy("Marketplace data imported.", "市场数据已导入。"),
      result.warnings.length ? "info" : "success",
    );
    return { ok: true, message: copy("Marketplace data imported.", "市场数据已导入。") };
  };

  const addFeed = async (input: AddFeedInput): Promise<FeedActionResult> => {
    try {
      const result = await feedService.addSubscription(stateRef.current, input);
      setState(result.state);
      if (result.error) {
        notify(result.error.message, "error");
        return { ok: false, message: result.error.message, refreshState: result.status };
      }
      notify(copy("Feed added and validated.", "订阅源已添加并通过验证。"));
      return { ok: true, message: copy("Feed added.", "订阅源已添加。"), refreshState: result.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : copy("The feed could not be added.", "无法添加订阅源。");
      notify(message, "error");
      return { ok: false, message };
    }
  };

  const refreshFeed = async (subscriptionId: string, force = true): Promise<FeedActionResult> => {
    if (refreshingFeedsRef.current.has(subscriptionId)) return { ok: false, message: copy("This feed is already refreshing.", "该订阅源正在刷新。") };
    refreshingFeedsRef.current.add(subscriptionId);
    try {
      const result = await feedService.refresh(stateRef.current, subscriptionId, { force });
      setState(result.state);
      if (result.error) {
        notify(result.error.message, "error");
        return { ok: false, message: result.error.message, refreshState: result.status };
      }
      notify(
        result.status.usedCache
          ? copy("Live refresh failed; cached feed content was recovered.", "实时刷新失败，已恢复缓存内容。")
          : copy(`Feed refreshed: ${result.status.importedCount} new, ${result.status.updatedCount} updated.`, `订阅源已刷新：新增 ${result.status.importedCount} 条，更新 ${result.status.updatedCount} 条。`),
        result.status.usedCache ? "info" : "success",
      );
      return { ok: true, message: copy("Feed refreshed.", "订阅源已刷新。"), refreshState: result.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : copy("The feed could not be refreshed.", "无法刷新订阅源。");
      notify(message, "error");
      return { ok: false, message };
    } finally {
      refreshingFeedsRef.current.delete(subscriptionId);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const runDueFeeds = async () => {
      if (document.visibilityState !== "visible" || cancelled) return;
      const due = stateRef.current.feedSubscriptions
        .filter((subscription) => feedService.isDue(subscription, stateRef.current.feedRefreshStates[subscription.id]))
        .slice(0, 2);
      for (const subscription of due) {
        if (cancelled) return;
        if (refreshingFeedsRef.current.has(subscription.id)) continue;
        refreshingFeedsRef.current.add(subscription.id);
        try {
          const result = await feedService.refresh(stateRef.current, subscription.id, { force: false });
          stateRef.current = result.state;
          renderState(result.state);
        } finally {
          refreshingFeedsRef.current.delete(subscription.id);
        }
      }
    };
    const initial = window.setTimeout(runDueFeeds, 2_500);
    const interval = window.setInterval(runDueFeeds, 60_000);
    document.addEventListener("visibilitychange", runDueFeeds);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", runDueFeeds);
    };
  }, [hydrated]);

  const updateFeedSubscription: MarketplaceContextValue["updateFeedSubscription"] = (subscriptionId, patch) => {
    if (!stateRef.current.feedSubscriptions.some((subscription) => subscription.id === subscriptionId)) return { ok: false, message: copy("Feed not found.", "未找到订阅源。") };
    setState((current) => ({
      ...current,
      feedSubscriptions: current.feedSubscriptions.map((subscription) => subscription.id === subscriptionId
        ? { ...subscription, ...patch, updatedAt: new Date().toISOString() }
        : subscription),
      feedRefreshStates: patch.enabled === false
        ? {
            ...current.feedRefreshStates,
            [subscriptionId]: current.feedRefreshStates[subscriptionId]
              ? { ...current.feedRefreshStates[subscriptionId], status: "IDLE", nextAttemptAt: undefined }
              : current.feedRefreshStates[subscriptionId],
          }
        : current.feedRefreshStates,
    }));
    return { ok: true, message: copy("Subscription updated.", "订阅已更新。") };
  };

  const removeFeed = (subscriptionId: string) => {
    setState((current) => {
      const nextRefreshStates = { ...current.feedRefreshStates };
      delete nextRefreshStates[subscriptionId];
      return {
        ...current,
        feedSubscriptions: current.feedSubscriptions.filter((subscription) => subscription.id !== subscriptionId),
        feedRefreshStates: nextRefreshStates,
      };
    });
    notify(copy("Subscription removed. Collected items were preserved.", "订阅已移除，收藏内容已保留。"));
  };

  const clearFeedCache = async (feedUrl: string) => {
    await feedService.clearFeedCache(feedUrl);
    notify(copy("The cached response was cleared.", "缓存响应已清除。"), "info");
  };

  const clearAllFeedCache = async () => {
    await feedService.clearAllFeedCache();
    notify(copy("All feed response caches were cleared.", "所有订阅源缓存已清除。"), "info");
  };

  const saveProxySettings = (settings: ProxySettings) => {
    setState((current) => ({ ...current, proxySettings: settings }));
    notify(copy("Proxy settings saved.", "代理设置已保存。"));
  };

  const saveTranslationSettings = (settings: TranslationSettings) => {
    setState((current) => ({ ...current, translationSettings: settings }));
    notify(copy("Translation settings saved.", "翻译设置已保存。"));
  };

  const saveLanguagePreference = (next: LanguagePreference) => {
    setState((current) => ({ ...current, languagePreference: next }));
  };

  const resetDemo = () => {
    clearMarketplaceState();
    setState(createInitialMarketplaceState());
    void clearAllFeedCache();
    void translationService.clearCache();
    notify(copy("All local marketplace data was reset.", "所有本地市场数据已重置。"), "info");
  };

  const dismissToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const value: MarketplaceContextValue = {
    hydrated,
    migrationWarnings: state.migrationWarnings,
    balanceAtomic: state.wallet.balanceAtomic,
    economy: state.economy,
    cartProductIds: state.cartProductIds,
    cartQuantities: state.cartQuantities,
    orders: state.orders,
    topUps: state.topUps,
    walletAdjustments: state.walletAdjustments,
    backings: state.backings,
    setQuantity,
    addBundle,
    topUp,
    favoriteProductIds: state.favoriteProductIds,
    watchedConceptIds: state.watchedConceptIds,
    libraryProductIds: state.libraryProductIds,
    createdConcepts: state.createdConcepts,
    transactions: state.transactions,
    products,
    curatedProducts,
    allConcepts,
    feedSources: state.feedSources,
    feedSubscriptions: state.feedSubscriptions,
    feedItems: state.feedItems,
    feedRefreshStates: state.feedRefreshStates,
    proxySettings: state.proxySettings,
    translationSettings: state.translationSettings,
    languagePreference: state.languagePreference,
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
    updateEconomy,
    resetWallet,
    exportData,
    importData,
    addFeed,
    refreshFeed,
    updateFeedSubscription,
    removeFeed,
    clearFeedCache,
    clearAllFeedCache,
    saveProxySettings,
    saveTranslationSettings,
    saveLanguagePreference,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className="toast" data-kind={toast.kind} key={toast.id} role="status">
            {toast.kind === "success" ? <CheckCircle2 size={17} /> : <Info size={17} />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label={copy("Dismiss notification", "关闭通知")}>
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
  if (!context) throw new Error("useMarketplace must be used within MarketplaceProvider");
  return context;
}

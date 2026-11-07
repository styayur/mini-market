import type {
  Concept,
  ExportBundle,
  MarketOrder,
  PersistedMarketplaceState,
  Transaction,
  WalletTopUp,
} from "@/types/marketplace";
import type { AtomicAmount } from "@/types/economy";
import {
  DEFAULT_INITIAL_CREDIT_ATOMIC,
  addAtomic,
  isValidAtomicAmount,
  isValidIsoCurrency,
  parseAmountToAtomic,
  subtractAtomic,
} from "./money.ts";

export const MARKETPLACE_SCHEMA_VERSION = 2 as const;
export const MARKETPLACE_STORAGE_KEY = "fitimart-marketplace-v2";
export const LEGACY_MARKETPLACE_STORAGE_KEY = "mini-market-demo-v1";
export const MIGRATION_BACKUP_PREFIX = "fitimart-migration-backup-";
export const DEFAULT_CURRENCY_CODE = "USD";
export const DEFAULT_CURRENCY_PATTERN = "{amount} {currency}";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))]
    : [];
}

function amountFrom(value: unknown, fallback = "0"): AtomicAmount {
  if (isValidAtomicAmount(value)) return value;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    try {
      return parseAmountToAtomic(value);
    } catch {
      return fallback;
    }
  }
  if (typeof value === "string") {
    try {
      return parseAmountToAtomic(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function createInitialMarketplaceState(): PersistedMarketplaceState {
  return {
    schemaVersion: MARKETPLACE_SCHEMA_VERSION,
    wallet: {
      initialized: true,
      balanceAtomic: DEFAULT_INITIAL_CREDIT_ATOMIC,
    },
    economy: {
      initialCreditAtomic: DEFAULT_INITIAL_CREDIT_ATOMIC,
      currencyCode: DEFAULT_CURRENCY_CODE,
      currencyLabel: DEFAULT_CURRENCY_CODE,
      currencyKind: "ISO",
      displayPrecision: 2,
      displayPattern: DEFAULT_CURRENCY_PATTERN,
    },
    cartQuantities: {},
    orders: [],
    topUps: [],
    walletAdjustments: [],
    cartProductIds: [],
    favoriteProductIds: [],
    watchedConceptIds: [],
    libraryProductIds: [],
    createdConcepts: [],
    transactions: [],
    backings: [],
    conceptBackingTotals: {},
    feedSources: [],
    feedSubscriptions: [],
    feedItems: [],
    feedRefreshStates: {},
    proxySettings: {
      enabledAdapterIds: ["direct", "cors-dev"],
    },
    translationSettings: {
      enabled: true,
      provider: "mymemory",
      showMachineTranslations: false,
    },
    languagePreference: "auto",
    migrationWarnings: [],
  };
}

export const initialMarketplaceState = createInitialMarketplaceState();

function normalizeOrder(value: unknown, warning: (message: string) => void): MarketOrder | null {
  if (!value || typeof value !== "object") return null;
  const order = value as Record<string, unknown>;
  if (typeof order.id !== "string" || !Array.isArray(order.items)) {
    warning("Skipped an order with a missing id or item list.");
    return null;
  }
  const items = order.items.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    if (typeof item.productId !== "string" || typeof item.name !== "string") return [];
    return [{
      productId: item.productId,
      name: item.name,
      quantity: Number.isSafeInteger(item.quantity) && Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      unitPriceAtomic: amountFrom(item.unitPriceAtomic ?? item.unitPrice),
      originKind: (item.originKind === "RSS" || item.originKind === "USER" ? item.originKind : "CURATED") as "RSS" | "CURATED" | "USER",
    }];
  });
  if (!items.length) return null;
  const totalAtomic = items.reduce(
    (total, item) => addAtomic(total, (BigInt(item.unitPriceAtomic) * BigInt(item.quantity)).toString()),
    "0",
  );
  return {
    id: order.id,
    createdAt: typeof order.createdAt === "string" ? order.createdAt : new Date(0).toISOString(),
    totalAtomic,
    balanceAfterAtomic: amountFrom(order.balanceAfterAtomic ?? order.balanceAfter),
    currencyCode: typeof order.currencyCode === "string" ? order.currencyCode : DEFAULT_CURRENCY_CODE,
    currencyLabel: typeof order.currencyLabel === "string" ? order.currencyLabel : DEFAULT_CURRENCY_CODE,
    displayPrecision: typeof order.displayPrecision === "number" ? Math.max(0, Math.min(6, Math.trunc(order.displayPrecision))) : 2,
    displayPattern: typeof order.displayPattern === "string" && order.displayPattern.includes("{amount}") && order.displayPattern.includes("{currency}") ? order.displayPattern : DEFAULT_CURRENCY_PATTERN,
    items,
  };
}

function normalizeTransaction(value: unknown): Transaction | null {
  if (!value || typeof value !== "object") return null;
  const transaction = value as Record<string, unknown>;
  if (typeof transaction.id !== "string" || typeof transaction.productId !== "string") return null;
  const kind = transaction.kind;
  return {
    id: transaction.id,
    userId: typeof transaction.userId === "string" ? transaction.userId : "demo-user",
    productId: transaction.productId,
    quantity: Number.isSafeInteger(transaction.quantity) && Number(transaction.quantity) > 0 ? Number(transaction.quantity) : 1,
    amountAtomic: amountFrom(transaction.amountAtomic ?? transaction.creditsSpent),
    createdAt: typeof transaction.createdAt === "string" ? transaction.createdAt : new Date(0).toISOString(),
    status: transaction.status === "PENDING" ? "PENDING" : "COMPLETED",
    kind: kind === "BACKING" || kind === "TOP_UP" || kind === "ADJUSTMENT" ? kind : "PURCHASE",
  };
}

function normalizeConcept(value: unknown, warning: (message: string) => void): Concept | null {
  if (!value || typeof value !== "object") return null;
  const concept = value as Record<string, unknown>;
  if (typeof concept.id !== "string" || typeof concept.slug !== "string" || typeof concept.name !== "string") {
    warning("Skipped a local concept without a stable id, slug, or name.");
    return null;
  }
  return {
    ...(concept as unknown as Concept),
    priceAtomic: amountFrom(concept.priceAtomic ?? concept.demoPrice),
    backingAtomic: amountFrom(concept.backingAtomic ?? concept.backingCredits),
    origin: concept.origin && typeof concept.origin === "object"
      ? (concept.origin as Concept["origin"])
      : { kind: "USER", creatorId: "demo-user" },
    isUserCreated: true,
  };
}

function normalizeFeedState(source: Record<string, unknown>, warnings: string[]) {
  const feedSources = Array.isArray(source.feedSources)
    ? source.feedSources.filter((entry): entry is PersistedMarketplaceState["feedSources"][number] =>
        Boolean(entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).id === "string" && typeof (entry as Record<string, unknown>).feedUrl === "string"))
    : [];
  const feedSubscriptions = Array.isArray(source.feedSubscriptions)
    ? source.feedSubscriptions.filter((entry): entry is PersistedMarketplaceState["feedSubscriptions"][number] =>
        Boolean(entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).id === "string" && typeof (entry as Record<string, unknown>).feedUrl === "string"))
    : [];
  const feedItems = Array.isArray(source.feedItems)
    ? source.feedItems.filter((entry): entry is PersistedMarketplaceState["feedItems"][number] =>
        Boolean(entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).id === "string" && typeof (entry as Record<string, unknown>).title === "string"))
    : [];
  if (source.feedSources !== undefined && !Array.isArray(source.feedSources)) warnings.push("Ignored malformed feed source data.");
  if (source.feedSubscriptions !== undefined && !Array.isArray(source.feedSubscriptions)) warnings.push("Ignored malformed feed subscription data.");
  if (source.feedItems !== undefined && !Array.isArray(source.feedItems)) warnings.push("Ignored malformed feed item data.");
  return { feedSources, feedSubscriptions, feedItems };
}

export interface NormalizedStateResult {
  state: PersistedMarketplaceState;
  warnings: string[];
  migrated: boolean;
}

/** Normalize either a v2 export or the legacy v1 Mini Market object. Never throws on partial user data. */
export function normalizeMarketplaceState(input: unknown): NormalizedStateResult {
  const initial = createInitialMarketplaceState();
  const warnings: string[] = [];
  if (!input || typeof input !== "object") {
    warnings.push("The stored marketplace value was not an object; a safe initial state was created.");
    return { state: { ...initial, migrationWarnings: warnings }, warnings, migrated: false };
  }
  const raw = input as Record<string, unknown>;
  const nestedWallet = raw.wallet && typeof raw.wallet === "object" ? raw.wallet as Record<string, unknown> : null;
  const nestedEconomy = raw.economy && typeof raw.economy === "object" ? raw.economy as Record<string, unknown> : null;
  const legacyCredits = raw.credits ?? nestedWallet?.balanceAtomic;
  const balanceAtomic = amountFrom(legacyCredits, initial.wallet.balanceAtomic);
  const initialCreditAtomic = amountFrom(
    nestedEconomy?.initialCreditAtomic ?? raw.initialCreditAtomic,
    initial.economy.initialCreditAtomic,
  );
  const orders = Array.isArray(raw.orders)
    ? raw.orders.map((entry) => normalizeOrder(entry, (message) => warnings.push(message))).filter((entry): entry is MarketOrder => Boolean(entry))
    : [];
  const topUps: WalletTopUp[] = Array.isArray(raw.topUps)
    ? raw.topUps.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const topUp = entry as Record<string, unknown>;
        if (typeof topUp.id !== "string") return [];
        return [{
          id: topUp.id,
          amountAtomic: amountFrom(topUp.amountAtomic ?? topUp.amount),
          createdAt: typeof topUp.createdAt === "string" ? topUp.createdAt : new Date(0).toISOString(),
        }];
      })
    : [];
  const transactions = Array.isArray(raw.transactions)
    ? raw.transactions.map(normalizeTransaction).filter((entry): entry is Transaction => Boolean(entry))
    : [];
  const createdConcepts = Array.isArray(raw.createdConcepts)
    ? raw.createdConcepts.map((entry) => normalizeConcept(entry, (message) => warnings.push(message))).filter((entry): entry is Concept => Boolean(entry))
    : [];
  const backings = Array.isArray(raw.backings)
    ? raw.backings.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const backing = entry as Record<string, unknown>;
        if (typeof backing.id !== "string" || typeof backing.conceptId !== "string") return [];
        return [{
          id: backing.id,
          conceptId: backing.conceptId,
          userId: typeof backing.userId === "string" ? backing.userId : "demo-user",
          amountAtomic: amountFrom(backing.amountAtomic ?? backing.credits),
          createdAt: typeof backing.createdAt === "string" ? backing.createdAt : new Date(0).toISOString(),
        }];
      })
    : [];
  const conceptBackingTotals: Record<string, AtomicAmount> = {};
  if (raw.conceptBackingTotals && typeof raw.conceptBackingTotals === "object") {
    for (const [key, value] of Object.entries(raw.conceptBackingTotals as Record<string, unknown>)) {
      conceptBackingTotals[key] = amountFrom(value);
    }
  }
  const feedData = normalizeFeedState(raw, warnings);
  const proxySettings = raw.proxySettings && typeof raw.proxySettings === "object"
    ? raw.proxySettings as PersistedMarketplaceState["proxySettings"]
    : initial.proxySettings;
  const translationSettings = raw.translationSettings && typeof raw.translationSettings === "object"
    ? { ...initial.translationSettings, ...(raw.translationSettings as object) } as PersistedMarketplaceState["translationSettings"]
    : initial.translationSettings;
  const languagePreference = raw.languagePreference === "en" || raw.languagePreference === "zh" || raw.languagePreference === "auto"
    ? raw.languagePreference
    : initial.languagePreference;
  const requestedCurrencyKind = nestedEconomy?.currencyKind === "CUSTOM" ? "CUSTOM" : "ISO";
  const requestedCurrencyCode = typeof nestedEconomy?.currencyCode === "string" ? nestedEconomy.currencyCode.trim() : initial.economy.currencyCode;
  const validCurrencyCode = requestedCurrencyKind === "ISO"
    ? requestedCurrencyCode.toUpperCase()
    : requestedCurrencyCode;
  const safeCurrencyCode = requestedCurrencyKind === "ISO" && !isValidIsoCurrency(validCurrencyCode)
    ? initial.economy.currencyCode
    : validCurrencyCode || initial.economy.currencyCode;
  const requestedPrecision = typeof nestedEconomy?.displayPrecision === "number" && Number.isInteger(nestedEconomy.displayPrecision)
    ? nestedEconomy.displayPrecision
    : initial.economy.displayPrecision;
  const requestedPattern = typeof nestedEconomy?.displayPattern === "string" ? nestedEconomy.displayPattern : initial.economy.displayPattern;
  const economy = {
    ...initial.economy,
    initialCreditAtomic,
    currencyKind: requestedCurrencyKind,
    currencyCode: safeCurrencyCode,
    currencyLabel: typeof nestedEconomy?.currencyLabel === "string" && nestedEconomy.currencyLabel.trim() ? nestedEconomy.currencyLabel.trim() : safeCurrencyCode,
    displayPrecision: Math.max(0, Math.min(6, requestedPrecision)),
    displayPattern: requestedPattern.includes("{amount}") && requestedPattern.includes("{currency}") ? requestedPattern : initial.economy.displayPattern,
  } as PersistedMarketplaceState["economy"];
  const state: PersistedMarketplaceState = {
    ...initial,
    wallet: { initialized: true, balanceAtomic },
    economy,
    cartQuantities: raw.cartQuantities && typeof raw.cartQuantities === "object" ? raw.cartQuantities as Record<string, number> : {},
    orders,
    topUps,
    walletAdjustments: Array.isArray(raw.walletAdjustments) ? raw.walletAdjustments as PersistedMarketplaceState["walletAdjustments"] : [],
    cartProductIds: asStringArray(raw.cartProductIds),
    favoriteProductIds: asStringArray(raw.favoriteProductIds),
    watchedConceptIds: asStringArray(raw.watchedConceptIds),
    libraryProductIds: asStringArray(raw.libraryProductIds),
    createdConcepts,
    transactions,
    backings,
    conceptBackingTotals,
    ...feedData,
    feedRefreshStates: raw.feedRefreshStates && typeof raw.feedRefreshStates === "object"
      ? raw.feedRefreshStates as PersistedMarketplaceState["feedRefreshStates"]
      : {},
    proxySettings,
    translationSettings,
    languagePreference,
    migrationWarnings: warnings,
  };
  return {
    state,
    warnings,
    migrated: raw.schemaVersion !== MARKETPLACE_SCHEMA_VERSION,
  };
}

function backupRawValue(raw: string, key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${MIGRATION_BACKUP_PREFIX}${key}-${Date.now()}`, raw);
  } catch {
    // A migration can still proceed when localStorage is full or unavailable.
  }
}

export interface ReadStateResult {
  state: PersistedMarketplaceState;
  migrated: boolean;
  warnings: string[];
}

export function readMarketplaceState(): ReadStateResult {
  if (typeof window === "undefined") {
    return { state: createInitialMarketplaceState(), migrated: false, warnings: [] };
  }
  for (const key of [MARKETPLACE_STORAGE_KEY, LEGACY_MARKETPLACE_STORAGE_KEY]) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return { state: createInitialMarketplaceState(), migrated: false, warnings: ["Browser storage is unavailable; this session is temporary."] };
    }
    if (!raw) continue;
    try {
      const normalized = normalizeMarketplaceState(JSON.parse(raw) as unknown);
      if (normalized.migrated || key === LEGACY_MARKETPLACE_STORAGE_KEY) {
        backupRawValue(raw, key);
        writeMarketplaceState(normalized.state);
      }
      return normalized;
    } catch {
      backupRawValue(raw, key);
      return {
        state: { ...createInitialMarketplaceState(), migrationWarnings: [`Could not parse ${key}; the original string was backed up before starting a safe state.`] },
        migrated: true,
        warnings: [`Could not parse ${key}; the original string was backed up before starting a safe state.`],
      };
    }
  }
  return { state: createInitialMarketplaceState(), migrated: false, warnings: [] };
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
    // The legacy key is intentionally retained as a migration source until the user explicitly resets all data.
  } catch {
    // In-memory reset still works.
  }
}

export function exportMarketplaceData(state: PersistedMarketplaceState): ExportBundle {
  return {
    format: "fitimart-marketplace-export",
    schemaVersion: MARKETPLACE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
}

export function importMarketplaceData(raw: string): NormalizedStateResult {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const candidate = parsed && typeof parsed === "object" && "state" in parsed
      ? (parsed as Record<string, unknown>).state
      : parsed;
    return normalizeMarketplaceState(candidate);
  } catch {
    return {
      state: { ...createInitialMarketplaceState(), migrationWarnings: ["The selected file is not valid JSON."] },
      warnings: ["The selected file is not valid JSON."],
      migrated: false,
    };
  }
}

export function resetWalletToInitial(state: PersistedMarketplaceState, createdAt: string): PersistedMarketplaceState {
  const next = state.economy.initialCreditAtomic;
  if (next === state.wallet.balanceAtomic) return state;
  return {
    ...state,
    wallet: { initialized: true, balanceAtomic: next },
    walletAdjustments: [{
      id: `adjustment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      previousAtomic: state.wallet.balanceAtomic,
      nextAtomic: next,
      reason: "INITIAL_CREDIT_RESET",
      createdAt,
    }, ...state.walletAdjustments],
    transactions: [{
      id: `adjustment-tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: "demo-user",
      productId: "wallet-adjustment",
      quantity: 1,
      amountAtomic: next >= state.wallet.balanceAtomic
        ? subtractAtomic(next, state.wallet.balanceAtomic)
        : subtractAtomic(state.wallet.balanceAtomic, next),
      createdAt,
      status: "COMPLETED",
      kind: "ADJUSTMENT",
    }, ...state.transactions],
  };
}

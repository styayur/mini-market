import type { AtomicAmount, EconomySettings, WalletState } from "@/types/economy";
import type {
  FeedItem,
  FeedRefreshState,
  FeedSource,
  FeedSubscription,
  ProxySettings,
} from "@/types/feed";

export type ProductStatus = "NOW" | "FUTURE";

export type ProductType =
  | "API"
  | "TOKEN"
  | "EXTENSION"
  | "PLUGIN"
  | "MCP"
  | "MODEL"
  | "AGENT"
  | "DATASET"
  | "PROTOCOL"
  | "TOOL"
  | "ARTICLE"
  | "PUBLICATION"
  | "RESEARCH"
  | "PROJECT"
  | "IDEA"
  | "VIRTUAL_GOOD";

export type Availability =
  | "AVAILABLE"
  | "LIMITED"
  | "BETA"
  | "UNVERIFIED"
  | "CONCEPT"
  | "EXTERNAL";

export type SortOption =
  | "trending"
  | "newest"
  | "most-collected"
  | "most-backed"
  | "alphabetical"
  | "price-low"
  | "price-high";

export type ProductOrigin =
  | {
      kind: "CURATED";
      label: string;
    }
  | {
      kind: "RSS";
      feedUrl: string;
      feedTitle: string;
      itemId: string;
      originalUrl?: string;
      publishedAt?: string;
      fetchedAt: string;
      author?: string;
      sourceLanguage?: string;
      contentType: string;
    }
  | {
      kind: "USER";
      creatorId: string;
    };

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  provider: string;
  tagline: string;
  description: string;
  icon: string;
  tags: string[];
  capabilities: string[];
  version?: string;
  endpoint?: string;
  documentationUrl?: string;
  pricing?: {
    model: "FREE" | "SUBSCRIPTION" | "USAGE" | "ONE_TIME" | "UNKNOWN";
    amount?: string;
    unit?: string;
    currency?: string;
  };
  /** Exact simulated price in six-decimal atomic units. */
  priceAtomic: AtomicAmount;
  availability: Availability;
  verified: boolean;
  popularity: number;
  watchers: number;
  supporters: number;
  relatedProductIds: string[];
  relatedConceptIds: string[];
  createdAt: string;
  authModel?: string;
  sdks?: string[];
  dependencies?: string[];
  origin: ProductOrigin;
}

export interface Concept extends Product {
  status: "FUTURE";
  problem: string;
  proposedCapabilities: string[];
  targetUsers: string[];
  useCases: string[];
  hypotheticalInterface?: {
    method: string;
    path: string;
    description: string;
  }[];
  businessModel?: string;
  dependencies?: string[];
  limitations?: string[];
  creator: {
    id: string;
    name: string;
  };
  backingAtomic: AtomicAmount;
  ambition?: "SMALL" | "FOCUSED" | "AMBITIOUS" | "INFRASTRUCTURE";
  tone?: "PRACTICAL" | "WILD" | "CONSUMER";
  isUserCreated?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  balanceAtomic: AtomicAmount;
  libraryProductIds: string[];
  favoriteProductIds: string[];
  watchedConceptIds: string[];
  createdConceptIds: string[];
  backedConceptIds: string[];
}

export interface Transaction {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  amountAtomic: AtomicAmount;
  createdAt: string;
  status: "COMPLETED" | "PENDING";
  kind: "PURCHASE" | "BACKING" | "TOP_UP" | "ADJUSTMENT";
}

export interface MarketOrder {
  id: string;
  createdAt: string;
  totalAtomic: AtomicAmount;
  balanceAfterAtomic: AtomicAmount;
  currencyCode: string;
  currencyLabel: string;
  displayPrecision: number;
  displayPattern: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPriceAtomic: AtomicAmount;
    originKind: ProductOrigin["kind"];
  }[];
}

export interface WalletTopUp {
  id: string;
  amountAtomic: AtomicAmount;
  createdAt: string;
}

export interface WalletAdjustment {
  id: string;
  previousAtomic: AtomicAmount;
  nextAtomic: AtomicAmount;
  reason: "INITIAL_CREDIT_RESET";
  createdAt: string;
}

export interface ConceptBacking {
  id: string;
  conceptId: string;
  userId: string;
  amountAtomic: AtomicAmount;
  createdAt: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  icon: string;
}

export type SupportedLanguage = "en" | "zh";
export type LanguagePreference = "auto" | SupportedLanguage;
export type TranslationProviderId = "none" | "mymemory";

export interface TranslationSettings {
  enabled: boolean;
  provider: TranslationProviderId;
  showMachineTranslations: boolean;
}

export interface TranslationCacheRecord {
  id: string;
  provider: TranslationProviderId;
  sourceLanguage: string;
  targetLanguage: string;
  sourceTextHash: string;
  translatedText: string;
  createdAt: string;
}

/** Version 2 is the first Fitimart schema. Legacy Mini Market data is migrated, never discarded. */
export interface PersistedMarketplaceState {
  schemaVersion: 2;
  wallet: WalletState;
  economy: EconomySettings;
  cartQuantities: Record<string, number>;
  orders: MarketOrder[];
  topUps: WalletTopUp[];
  walletAdjustments: WalletAdjustment[];
  cartProductIds: string[];
  favoriteProductIds: string[];
  watchedConceptIds: string[];
  libraryProductIds: string[];
  createdConcepts: Concept[];
  transactions: Transaction[];
  backings: ConceptBacking[];
  conceptBackingTotals: Record<string, AtomicAmount>;
  feedSources: FeedSource[];
  feedSubscriptions: FeedSubscription[];
  feedItems: FeedItem[];
  feedRefreshStates: Record<string, FeedRefreshState>;
  proxySettings: ProxySettings;
  translationSettings: TranslationSettings;
  languagePreference: LanguagePreference;
  migrationWarnings: string[];
}

export interface ExportBundle {
  format: "fitimart-marketplace-export";
  schemaVersion: 2;
  exportedAt: string;
  state: PersistedMarketplaceState;
}

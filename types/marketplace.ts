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
  | "TOOL";

export type Availability =
  | "AVAILABLE"
  | "LIMITED"
  | "BETA"
  | "UNVERIFIED"
  | "CONCEPT";

export type SortOption =
  | "trending"
  | "newest"
  | "most-collected"
  | "most-backed"
  | "alphabetical";

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
    amount?: number;
    unit?: string;
    currency?: string;
  };
  demoPrice: number;
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
  backingCredits: number;
  ambition?: "SMALL" | "FOCUSED" | "AMBITIOUS" | "INFRASTRUCTURE";
  tone?: "PRACTICAL" | "WILD" | "CONSUMER";
  isUserCreated?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  credits: number;
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
  creditsSpent: number;
  createdAt: string;
  status: "COMPLETED" | "PENDING";
}

export interface ConceptBacking {
  id: string;
  conceptId: string;
  userId: string;
  credits: number;
  createdAt: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  icon: string;
}

export interface PersistedMarketplaceState {
  credits: number;
  cartProductIds: string[];
  favoriteProductIds: string[];
  watchedConceptIds: string[];
  libraryProductIds: string[];
  createdConcepts: Concept[];
  transactions: Transaction[];
  backings: ConceptBacking[];
  conceptBackingTotals: Record<string, number>;
}

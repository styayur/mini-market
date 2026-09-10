import type { Product } from "@/types/marketplace";

export function StatusBadge({ product }: { product: Product }) {
  if (product.status === "FUTURE") return <span className="badge badge-future">◇ FUTURE</span>;
  return <span className="badge badge-live">● {product.availability === "BETA" ? "BETA" : "LIVE"}</span>;
}

export function TypeBadge({ type }: { type: string }) {
  return <span className="badge">{type}</span>;
}

export function VerifiedBadge({ verified, availability }: { verified: boolean; availability: string }) {
  if (!verified) return <span className="badge badge-future">SPECULATIVE</span>;
  if (availability === "BETA") return <span className="badge badge-warning">VERIFIED · BETA</span>;
  if (availability === "LIMITED") return <span className="badge badge-warning">VERIFIED · LIMITED</span>;
  return <span className="badge badge-live">VERIFIED</span>;
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchExperience } from "@/components/marketplace/search-experience";
import { ProductCardSkeleton } from "@/components/ui/loading-state";
export const metadata: Metadata = { title: "Search", description: "Search real capabilities and speculative concepts." };
export default function SearchPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Global search</div><h1 className="page-title">Search</h1><p className="lead" style={{ maxWidth: 680, marginTop: 20, marginBottom: 44 }}>Search across products, providers, capabilities, and future concepts.</p><Suspense fallback={<div className="grid-products">{[1,2,3,4].map((item) => <ProductCardSkeleton key={item} />)}</div>}><SearchExperience /></Suspense></div>; }

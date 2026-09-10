import { Suspense } from "react";
import type { Metadata } from "next";
import { ConceptLab } from "@/components/concept/concept-lab";
import { ProductCardSkeleton } from "@/components/ui/loading-state";

export const metadata: Metadata = { title: "Concept Lab", description: "Describe a capability you wish existed and shape it into a market concept." };

export default function NewConceptPage() {
  return <div className="container page-section">
    <div className="eyebrow" style={{ marginBottom: 18, color: "var(--future-accent)" }}>Concept Lab</div>
    <h1 className="page-title">Imagine Something<br />That Should Exist</h1>
    <p className="lead" style={{ maxWidth: 760, marginTop: 22, marginBottom: 52 }}>Describe a capability you wish existed. Turn the idea into a market concept, edit it, preview it, and publish it to your local FUTURE market.</p>
    <Suspense fallback={<div className="grid-products">{[1,2,3].map((item) => <ProductCardSkeleton key={item} />)}</div>}><ConceptLab /></Suspense>
  </div>;
}

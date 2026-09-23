import { Suspense } from "react";
import { LocalConcept } from "@/components/concept/local-concept";
export default function LocalConceptPage() {
  return (
    <Suspense
      fallback={<div className="container page-section">Loading concept…</div>}
    >
      <LocalConcept />
    </Suspense>
  );
}

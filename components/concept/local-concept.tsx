"use client";
import { useSearchParams } from "next/navigation";
import { ConceptDetail } from "@/components/concept/concept-detail";
export function LocalConcept() {
  const params = useSearchParams();
  return <ConceptDetail slug={params.get("slug") ?? ""} />;
}

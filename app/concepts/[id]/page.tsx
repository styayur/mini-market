import type { Metadata } from "next";
import { ConceptDetail } from "@/components/concept/concept-detail";
import { conceptSlugMap, concepts } from "@/data/concepts";

type PageProps = { params: Promise<{ id: string }> };
export function generateStaticParams() { return concepts.map((concept) => ({ id: concept.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const concept = conceptSlugMap.get(id);
  return concept ? { title: concept.name, description: `Speculative concept: ${concept.tagline}` } : { title: "Concept" };
}
export default async function ConceptPage({ params }: PageProps) { const { id } = await params; return <ConceptDetail slug={id} />; }

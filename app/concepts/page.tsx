import type { Metadata } from "next";
import { ConceptIndex } from "@/components/concept/concept-index";
export const metadata: Metadata = { title: "Concepts", description: "Ideas imagined in Mini Market." };
export default function ConceptsPage() { return <div className="container page-section"><div className="eyebrow" style={{ marginBottom: 18 }}>Collective imagination</div><h1 className="page-title">Concepts</h1><p className="lead" style={{ maxWidth: 700, marginTop: 22, marginBottom: 58 }}>Every future product starts as an idea. Some begin as protocols, some as impossible requests, and some as a missing button.</p><ConceptIndex /></div>; }

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ConceptCard } from "@/components/concept/concept-card";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeader } from "@/components/ui/section-header";
import { categories, getCategory } from "@/data/categories";
import { concepts } from "@/data/concepts";
import { products } from "@/data/products";

type PageProps = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return categories.map((category) => ({ slug: category.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const { slug } = await params; const category = getCategory(slug); return category ? { title: category.name, description: category.description } : { title: "Category" }; }
export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const matchedProducts = products.filter((item) => item.tags.some((tag) => category.tags.includes(tag)));
  const matchedConcepts = concepts.filter((item) => item.tags.some((tag) => category.tags.includes(tag)));
  const providers = Array.from(new Set(matchedProducts.map((item) => item.provider)));
  return <div className="container page-section">
    <Link className="eyebrow" href="/marketplace#categories">← All capabilities</Link>
    <div style={{ display: "flex", gap: 22, alignItems: "center", marginTop: 22 }}><div className="category-tile" style={{ width: 74, minHeight: 74, border: "1px solid var(--border)", borderRadius: 18 }}><span className="symbol">{category.icon}</span></div><div><h1 className="page-title">{category.name}</h1></div></div>
    <p className="lead" style={{ maxWidth: 700, marginTop: 20 }}>{category.description}</p>
    {matchedProducts.length === 0 && matchedConcepts.length === 0 ? <div className="empty-state" style={{ marginTop: 48 }}><div><h2>No capabilities indexed yet.</h2><p>Explore the wider marketplace or imagine the first concept in this category.</p><Link className="button button-future" href="/concepts/new">Imagine something</Link></div></div> : <>
      {matchedProducts.length > 0 && <section style={{ marginTop: 64 }}><SectionHeader eyebrow="Available now" title="Real capabilities" href={`/marketplace?tag=${category.slug}`} /><div className="grid-products">{matchedProducts.map((product, index) => <ProductCard key={product.id} product={product} featured={index === 0 && matchedProducts.length > 3} />)}</div></section>}
      {matchedConcepts.length > 0 && <section className="section-border page-section" style={{ marginTop: 64 }}><SectionHeader eyebrow="Future concepts" title="What could come next?" href="/future" /><div className="grid-products">{matchedConcepts.slice(0, 8).map((concept, index) => <ConceptCard key={concept.id} concept={concept} compact={index > 2} />)}</div></section>}
      {providers.length > 0 && <section className="page-section"><div className="eyebrow" style={{ marginBottom: 16 }}>Providers</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{providers.map((provider) => <span className="chip" key={provider}>{provider}</span>)}</div></section>}
    </>}
  </div>;
}

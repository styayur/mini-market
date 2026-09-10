import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { ConceptCard } from "@/components/concept/concept-card";
import { ProductActions } from "@/components/product/product-actions";
import { VerifiedBadge } from "@/components/product/product-badges";
import { ProductIcon } from "@/components/product/product-icon";
import { ProductCard } from "@/components/product/product-card";
import { concepts } from "@/data/concepts";
import { productMap, productSlugMap, products } from "@/data/products";
import { formatCompactNumber, formatCredits } from "@/lib/format";
import { recommendConcepts, recommendProducts } from "@/lib/recommendations";

type PageProps = { params: Promise<{ id: string }> };

function getProduct(id: string) { return productSlugMap.get(id) ?? productMap.get(id); }

export async function generateStaticParams() { return products.map((product) => ({ id: product.slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  return product ? { title: product.name, description: product.tagline } : { title: "Product not found" };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product || product.status !== "NOW") notFound();
  const relatedProducts = recommendProducts(product, products);
  const relatedConcepts = recommendConcepts(product, concepts);
  const price = product.pricing?.model === "FREE" ? "Free / plan limits apply" : product.pricing?.model === "SUBSCRIPTION" ? "See provider pricing" : product.pricing?.model === "USAGE" ? "Usage-based · see provider" : "Pricing unavailable";

  return (
    <div className="container">
      <div className="eyebrow" style={{ paddingTop: 32 }}><Link href="/marketplace">Marketplace</Link> / {product.type} / {product.name}</div>
      <section className="detail-hero">
        <ProductIcon name={product.icon} large size={34} />
        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><VerifiedBadge verified={product.verified} availability={product.availability} /><span className="badge">{product.type}</span><span className="badge">{product.provider}</span></div>
          <h1 className="page-title" style={{ marginTop: 22 }}>{product.name}</h1>
          <p className="lead" style={{ maxWidth: 760, marginTop: 20 }}>{product.tagline}</p>
          <ProductActions product={product} />
        </div>
      </section>

      <nav className="detail-tabs" aria-label="Product sections">
        <a className="detail-tab" data-active="true" href="#overview">Overview</a>
        <a className="detail-tab" href="#capabilities">Capabilities</a>
        <a className="detail-tab" href="#api">API</a>
        <a className="detail-tab" href="#pricing">Pricing</a>
      </nav>

      <div className="detail-layout">
        <div>
          <section className="copy-block" id="overview"><h2>Description</h2><p>{product.description}</p></section>
          <section className="copy-block" id="capabilities" style={{ marginTop: 54 }}><h2>Capabilities</h2><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{product.capabilities.map((capability) => <span className="chip" key={capability}>{capability}</span>)}</div></section>
          <section className="copy-block" id="api" style={{ marginTop: 54 }}>
            <h2>API surface</h2>
            <div className="card" style={{ overflow: "hidden" }}>
              <div className="code-line"><span className="code-method">BASE</span><code>{product.endpoint ?? "Provider-defined interface"}</code></div>
              <div className="code-line"><span className="code-method">AUTH</span><span>{product.authModel}</span></div>
              <div className="code-line"><span className="code-method">SDK</span><span>{product.sdks?.join(" · ")}</span></div>
            </div>
            <p style={{ marginTop: 16, fontSize: 12 }}>Never paste real API secrets into this demo. Use the official provider documentation for current authentication and safety guidance.</p>
          </section>
          <section className="copy-block" id="pricing" style={{ marginTop: 54 }}><h2>Pricing</h2><p>{price}. Purchases in Mini Market are simulated with demo credits and are not official provider pricing.</p></section>
        </div>
        <aside className="meta-panel">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Technical record</div>
          <dl>
            <div className="meta-row"><dt>Provider</dt><dd>{product.provider}</dd></div><div className="meta-row"><dt>Version</dt><dd>{product.version ?? "Current"}</dd></div>
            <div className="meta-row"><dt>Availability</dt><dd>{product.availability}</dd></div><div className="meta-row"><dt>Popularity</dt><dd>{formatCompactNumber(product.popularity * 100)}</dd></div>
            <div className="meta-row"><dt>Demo price</dt><dd>{formatCredits(product.demoPrice)} cr</dd></div>
          </dl>
          {product.documentationUrl && <a className="button button-sm" style={{ width: "100%", marginTop: 16 }} href={product.documentationUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Official documentation</a>}
          <div style={{ display: "flex", gap: 7, marginTop: 14, color: "var(--muted)", fontSize: 10, lineHeight: 1.5 }}><ShieldCheck size={14} /> Descriptions are intentionally conservative and may change at the provider.</div>
        </aside>
      </div>

      <section className="section-border page-section" style={{ marginTop: 76 }}><div className="eyebrow" style={{ marginBottom: 14 }}>Related software</div><h2 className="section-title" style={{ marginBottom: 28 }}>Build with something adjacent.</h2><div className="grid-three">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
      <section className="page-section"><div className="eyebrow" style={{ marginBottom: 14 }}>What this could become</div><h2 className="section-title" style={{ marginBottom: 28 }}>What comes next?</h2><div className="grid-three">{relatedConcepts.map((item) => <ConceptCard key={item.id} concept={item} compact />)}</div></section>
      <Link className="button button-sm" href="/marketplace"><ArrowLeft size={13} /> Back to marketplace</Link>
    </div>
  );
}

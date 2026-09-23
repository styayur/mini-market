"use client";

import Link from "next/link";
import { ArrowLeft, Check, Lightbulb, ShieldAlert } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { ConceptActions } from "@/components/concept/concept-actions";
import { ConceptCard } from "@/components/concept/concept-card";
import { ProductIcon } from "@/components/product/product-icon";
import { ProductCard } from "@/components/product/product-card";
import { products } from "@/data/products";
import { formatCompactNumber, formatCredits } from "@/lib/format";

export function ConceptDetail({ slug }: { slug: string }) {
  const { allConcepts, hydrated } = useMarketplace();
  const concept = allConcepts.find(
    (item) => item.slug === slug || item.id === slug,
  );
  if (!hydrated)
    return (
      <div className="container page-section">
        <div className="skeleton" style={{ width: 160, height: 24 }} />
        <div
          className="skeleton"
          style={{ width: "70%", height: 80, marginTop: 25 }}
        />
        <div
          className="skeleton"
          style={{ width: "45%", height: 30, marginTop: 18 }}
        />
      </div>
    );
  if (!concept)
    return (
      <div className="container page-section">
        <div className="empty-state">
          <div>
            <div className="eyebrow">Not found</div>
            <h2>This concept does not exist.</h2>
            <p>
              It may have been removed from this browser, or the link is
              incomplete.
            </p>
            <Link className="button button-future" href="/future">
              Explore FUTURE
            </Link>
          </div>
        </div>
      </div>
    );
  const relatedProducts = products
    .filter((product) => concept.relatedProductIds.includes(product.id))
    .slice(0, 3);
  const relatedConcepts = allConcepts
    .filter((item) => concept.relatedConceptIds.includes(item.id))
    .slice(0, 3);
  return (
    <div className="container">
      <div className="eyebrow" style={{ paddingTop: 32 }}>
        <Link href="/future">Future Market</Link> / {concept.type} /{" "}
        {concept.name}
      </div>
      <section className="detail-hero">
        <ProductIcon name={concept.icon} future large size={34} />
        <div>
          <div className="eyebrow" style={{ color: "var(--future-accent)" }}>
            ◇ FUTURE CONCEPT
          </div>
          <h1 className="page-title" style={{ marginTop: 18 }}>
            {concept.name}
          </h1>
          <p className="lead" style={{ maxWidth: 800, marginTop: 20 }}>
            {concept.description}
          </p>
          <ConceptActions concept={concept} />
        </div>
      </section>
      <div className="speculative-note" style={{ marginBottom: 52 }}>
        <strong>SPECULATIVE · NOT IMPLEMENTED</strong>
        <p>
          This capability does not currently represent a verified production
          service. The interface, business model, and behavior shown below are a
          proposal.
        </p>
      </div>
      <div className="detail-layout">
        <div>
          <section className="copy-block">
            <h2>Why it might matter</h2>
            <p>{concept.problem}</p>
          </section>
          <section className="copy-block" style={{ marginTop: 54 }}>
            <h2>Proposed capabilities</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {concept.proposedCapabilities.map((capability) => (
                <span className="chip" key={capability}>
                  {capability}
                </span>
              ))}
            </div>
          </section>
          <section className="copy-block" style={{ marginTop: 54 }}>
            <h2>Example use cases</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {concept.useCases.map((useCase) => (
                <div
                  key={useCase}
                  style={{ display: "flex", gap: 10, alignItems: "start" }}
                >
                  <Check
                    size={15}
                    style={{ marginTop: 5, color: "var(--future-accent)" }}
                  />
                  <p style={{ margin: 0 }}>{useCase}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="copy-block" style={{ marginTop: 54 }}>
            <h2>Hypothetical interface</h2>
            <div className="card" style={{ overflow: "hidden" }}>
              {concept.hypotheticalInterface?.map((item) => (
                <div className="code-line" key={`${item.method}-${item.path}`}>
                  <span className="code-method">{item.method}</span>
                  <span>
                    <code>{item.path}</code>
                    <span
                      className="muted"
                      style={{ display: "block", marginTop: 4, fontSize: 10 }}
                    >
                      {item.description}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="copy-block" style={{ marginTop: 54 }}>
            <h2>Limitations</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {concept.limitations?.map((limitation) => (
                <div
                  key={limitation}
                  style={{ display: "flex", gap: 10, alignItems: "start" }}
                >
                  <ShieldAlert
                    size={15}
                    style={{ marginTop: 5, color: "var(--warning)" }}
                  />
                  <p style={{ margin: 0 }}>{limitation}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="meta-panel">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Concept record
          </div>
          <dl>
            <div className="meta-row">
              <dt>Type</dt>
              <dd>{concept.type}</dd>
            </div>
            <div className="meta-row">
              <dt>Creator</dt>
              <dd>{concept.creator.name}</dd>
            </div>
            <div className="meta-row">
              <dt>Created</dt>
              <dd>{concept.createdAt}</dd>
            </div>
            <div className="meta-row">
              <dt>Watchers</dt>
              <dd>{formatCompactNumber(concept.watchers)}</dd>
            </div>
            <div className="meta-row">
              <dt>Supporters</dt>
              <dd>{formatCredits(concept.supporters)}</dd>
            </div>
            <div className="meta-row">
              <dt>Status</dt>
              <dd>NOT IMPLEMENTED</dd>
            </div>
          </dl>
          <div style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              <Lightbulb size={12} /> Business model
            </div>
            <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
              {concept.businessModel}
            </p>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Dependencies
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {concept.dependencies?.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {relatedProducts.length > 0 && (
        <section
          className="section-border page-section"
          style={{ marginTop: 76 }}
        >
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Related real technology
          </div>
          <h2 className="section-title" style={{ marginBottom: 28 }}>
            What exists today
          </h2>
          <div className="grid-three">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
      {relatedConcepts.length > 0 && (
        <section className="page-section">
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            Related possibilities
          </div>
          <h2 className="section-title" style={{ marginBottom: 28 }}>
            Ideas in the same graph
          </h2>
          <div className="grid-three">
            {relatedConcepts.map((item) => (
              <ConceptCard key={item.id} concept={item} compact />
            ))}
          </div>
        </section>
      )}
      <Link className="button button-sm" href="/future">
        <ArrowLeft size={13} /> Back to FUTURE
      </Link>
    </div>
  );
}

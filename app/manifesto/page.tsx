import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Manifesto", description: "Software is becoming a marketplace of capabilities." };
export default function ManifestoPage() {
  return <article className="container" style={{ maxWidth: 1080 }}>
    <header className="page-section"><div className="eyebrow" style={{ marginBottom: 20 }}>Manifesto · 001</div><h1 className="page-title text-balance">Software is becoming a marketplace of capabilities.</h1><p className="lead" style={{ maxWidth: 740, marginTop: 28 }}>Not files. Not pages. Not products in the shape of last decade&apos;s software. Capabilities: models that reason, tools that act, memory that persists, identity that travels, permissions that are explicit.</p></header>
    <div className="divider" />
    <section className="page-section" style={{ maxWidth: 780 }}><h2 className="section-title">APIs are becoming commodities.</h2><p className="lead" style={{ marginTop: 24 }}>Discovery, comparison, evaluation, permissions, and composition become the scarce parts. A marketplace for capabilities is therefore also a map of what software can do—and what it still cannot.</p></section>
    <section className="page-section" style={{ maxWidth: 780 }}><h2 className="section-title">Tools are becoming composable.</h2><p className="lead" style={{ marginTop: 24 }}>The next useful product may be a protocol, a memory boundary, a trust layer, or a tiny semantic permission. Products stop being destinations and start behaving like grammar.</p></section>
    <section className="page-section" style={{ maxWidth: 780 }}><h2 className="section-title">Agents are becoming customers.</h2><p className="lead" style={{ marginTop: 24 }}>When software buys from software, interfaces must explain capability, price, permission, provenance, and consequence. That changes what a product page is.</p></section>
    <section className="page-section" style={{ maxWidth: 780 }}><h2 className="section-title">Speculation becomes a design medium.</h2><p className="lead" style={{ marginTop: 24 }}>A concept can be examined before it becomes a company. The Future Market makes that boundary explicit: real software here, technically coherent possibilities there, never pretending one is the other.</p></section>
    <section className="editorial-block" style={{ marginBottom: 60 }}><h2>The market for what exists is useful. The market for what should exist is generative.</h2><Link className="editorial-link" href="/concepts/new">Imagine something →</Link></section>
  </article>;
}

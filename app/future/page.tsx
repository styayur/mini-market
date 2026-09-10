import type { Metadata } from "next";
import { FutureMarket } from "@/components/marketplace/future-market";

export const metadata: Metadata = { title: "Future Market", description: "Speculative technical concepts that do not exist yet." };

export default function FuturePage() {
  return <div className="container page-section">
    <div className="eyebrow" style={{ marginBottom: 18 }}>Speculative marketplace</div>
    <h1 className="page-title">FUTURE MARKET</h1>
    <p className="lead" style={{ maxWidth: 740, marginTop: 22 }}>Products that do not exist yet. Some of the best software ideas begin as impossible shopping lists.</p>
    <div className="speculative-note" style={{ marginTop: 28, marginBottom: 54, maxWidth: 780 }}><strong>IMPORTANT LABEL</strong><p>Every item here is a concept, not a verified product. Pricing, ownership, implementation, and availability are hypothetical. No real payments or financial instruments are involved.</p></div>
    <FutureMarket />
  </div>;
}

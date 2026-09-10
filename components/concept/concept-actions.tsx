"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Share2, Sparkles, X } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { WatchButton } from "@/components/concept/watch-button";
import { formatCredits } from "@/lib/format";
import type { Concept } from "@/types/marketplace";

export function ConceptActions({ concept }: { concept: Concept }) {
  const { backConcept, credits, getBackingTotal, hydrated, notify } = useMarketplace();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("50");
  const [error, setError] = useState("");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: concept.name, text: concept.description, url });
      else {
        await navigator.clipboard.writeText(url);
        notify("Concept link copied.");
      }
    } catch {
      // The user may dismiss the native share sheet.
    }
  };

  const submitBacking = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("Enter a positive credit amount.");
    if (value > credits) return setError("That exceeds your demo credit balance.");
    if (backConcept(concept.id, value)) {
      setOpen(false);
      setError("");
    }
  };

  return (
    <>
      <div className="detail-actions">
        <Link className="button button-future button-lg" href={`/concepts/new?seed=${encodeURIComponent(concept.name)}`}><Sparkles size={15} /> Imagine</Link>
        <WatchButton conceptId={concept.id} />
        <button className="button button-lg" type="button" onClick={() => setOpen(true)}>Back this idea</button>
        <button className="button button-lg" type="button" onClick={share}><Share2 size={14} /> Share</button>
      </div>
      <div className="muted mono" style={{ marginTop: 14, fontSize: 10 }}>{hydrated ? formatCredits(getBackingTotal(concept.id)) : concept.backingCredits} credits backed · simulated only</div>
      {open && (
        <div className="command-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div className="card modal-panel" role="dialog" aria-modal="true" aria-labelledby="backing-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="card-topline"><span className="eyebrow">Back concept</span><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={17} /></button></div>
            <h2 id="backing-title" style={{ marginTop: 20, fontSize: 28, letterSpacing: "-.04em" }}>Put your credits behind an idea worth building.</h2>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.6, fontSize: 13 }}>This is a simulated expression of interest. Credits have no real-world value and do not represent equity or ownership.</p>
            <form onSubmit={submitBacking} style={{ marginTop: 24 }}>
              <label className="form-field"><span>How many credits?</span><input className="form-input" type="number" min="1" max={credits} value={amount} onChange={(event) => setAmount(event.target.value)} /><span className="form-hint">Your balance: {formatCredits(credits)} credits</span></label>
              {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
              <button className="button button-future" type="submit" style={{ width: "100%" }}><Check size={15} /> Back this idea</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}



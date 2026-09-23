"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { ProductIcon } from "@/components/product/product-icon";
import { generateConcept } from "@/lib/concept-generator";
import type { Concept, ProductType } from "@/types/marketplace";

const steps = [
  "Basics",
  "Problem",
  "Capabilities",
  "Audience",
  "Business",
  "Preview",
];
const types: ProductType[] = [
  "API",
  "TOKEN",
  "EXTENSION",
  "PLUGIN",
  "MCP",
  "MODEL",
  "AGENT",
  "DATASET",
  "PROTOCOL",
  "TOOL",
];

export function ConceptLab() {
  const searchParams = useSearchParams();
  const { publishConcept } = useMarketplace();
  const seed = searchParams.get("seed") ?? "";
  const [idea, setIdea] = useState(
    seed
      ? `I wish there were a capability for ${seed.toLowerCase()}`
      : "An API for transferring context between agents",
  );
  const [concept, setConcept] = useState<Concept | null>(null);
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);

  const generate = () => {
    setConcept(generateConcept(idea));
    setStep(1);
    setPublished(false);
  };

  const update = <K extends keyof Concept>(key: K, value: Concept[K]) => {
    setConcept((current) =>
      current
        ? {
            ...current,
            [key]: value,
            tagline: key === "description" ? String(value) : current.tagline,
          }
        : current,
    );
  };

  const updateList = (
    key:
      | "proposedCapabilities"
      | "targetUsers"
      | "useCases"
      | "limitations"
      | "dependencies",
    value: string,
  ) => {
    const items = value
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    setConcept((current) =>
      current
        ? {
            ...current,
            [key]: items,
            capabilities:
              key === "proposedCapabilities" ? items : current.capabilities,
          }
        : current,
    );
  };

  const preview = useMemo(
    () => concept ?? generateConcept(idea),
    [concept, idea],
  );

  const publish = () => {
    if (!concept) return;
    publishConcept({
      ...concept,
      creator: { id: "demo-user", name: "You" },
      isUserCreated: true,
    });
    setPublished(true);
    setStep(5);
  };

  return (
    <div className="lab-layout">
      <nav className="step-list" aria-label="Concept editor steps">
        {steps.map((label, index) => (
          <button
            className="step-button"
            data-active={step === index}
            type="button"
            key={label}
            onClick={() => concept && setStep(index)}
            disabled={!concept && index > 0}
          >
            {String(index + 1).padStart(2, "0")} {label}
          </button>
        ))}
      </nav>

      <section className="card lab-panel">
        {!concept ? (
          <>
            <div className="eyebrow" style={{ color: "var(--future-accent)" }}>
              <WandSparkles size={13} /> Unmet need
            </div>
            <h2 className="section-title" style={{ marginTop: 16 }}>
              What should exist?
            </h2>
            <p className="lead" style={{ marginTop: 14, fontSize: 14 }}>
              Describe the capability in your own words. The demo generator will
              turn it into a structured concept without calling an external AI
              service.
            </p>
            <label className="form-field" style={{ marginTop: 28 }}>
              <span>Your idea</span>
              <textarea
                className="form-textarea idea-box"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="I wish there were an API that..."
              />
            </label>
            <button
              className="button button-future button-lg"
              type="button"
              onClick={generate}
              disabled={!idea.trim()}
            >
              <Sparkles size={15} /> Generate concept
            </button>
          </>
        ) : (
          <>
            <div className="card-topline">
              <div>
                <div
                  className="eyebrow"
                  style={{ color: "var(--future-accent)" }}
                >
                  Step {step + 1} of {steps.length}
                </div>
                <h2
                  className="section-title"
                  style={{ marginTop: 12, fontSize: 36 }}
                >
                  {steps[step]}
                </h2>
              </div>
              <button
                className="button button-sm"
                type="button"
                onClick={() => {
                  setConcept(
                    generateConcept(idea, {
                      name: concept.name,
                      type: concept.type,
                    }),
                  );
                  setPublished(false);
                }}
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>

            {step === 0 && (
              <div style={{ marginTop: 28 }}>
                <label className="form-field">
                  <span>Name</span>
                  <input
                    className="form-input"
                    value={concept.name}
                    onChange={(event) => update("name", event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>Type</span>
                  <select
                    className="form-select"
                    value={concept.type}
                    onChange={(event) =>
                      update("type", event.target.value as ProductType)
                    }
                  >
                    {types.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Short description</span>
                  <textarea
                    className="form-textarea"
                    value={concept.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div style={{ marginTop: 28 }}>
                <label className="form-field">
                  <span>What problem does it solve?</span>
                  <textarea
                    className="form-textarea"
                    value={concept.problem}
                    onChange={(event) => update("problem", event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>Why doesn&apos;t normal software solve it?</span>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe the missing interoperability, incentive, or technical layer."
                    value={concept.problem}
                    onChange={(event) => update("problem", event.target.value)}
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div style={{ marginTop: 28 }}>
                <label className="form-field">
                  <span>Proposed capabilities</span>
                  <textarea
                    className="form-textarea"
                    value={concept.proposedCapabilities.join(", ")}
                    onChange={(event) =>
                      updateList("proposedCapabilities", event.target.value)
                    }
                  />
                  <span className="form-hint">
                    Separate capabilities with commas or new lines.
                  </span>
                </label>
                <label className="form-field">
                  <span>Dependencies</span>
                  <textarea
                    className="form-textarea"
                    value={concept.dependencies?.join(", ")}
                    onChange={(event) =>
                      updateList("dependencies", event.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {step === 3 && (
              <div style={{ marginTop: 28 }}>
                <label className="form-field">
                  <span>Who is it for?</span>
                  <textarea
                    className="form-textarea"
                    value={concept.targetUsers.join(", ")}
                    onChange={(event) =>
                      updateList("targetUsers", event.target.value)
                    }
                  />
                </label>
                <label className="form-field">
                  <span>Example use cases</span>
                  <textarea
                    className="form-textarea"
                    value={concept.useCases.join(", ")}
                    onChange={(event) =>
                      updateList("useCases", event.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {step === 4 && (
              <div style={{ marginTop: 28 }}>
                <label className="form-field">
                  <span>Business model</span>
                  <textarea
                    className="form-textarea"
                    value={concept.businessModel}
                    onChange={(event) =>
                      update("businessModel", event.target.value)
                    }
                  />
                </label>
                <label className="form-field">
                  <span>Limitations and risks</span>
                  <textarea
                    className="form-textarea"
                    value={concept.limitations?.join(", ")}
                    onChange={(event) =>
                      updateList("limitations", event.target.value)
                    }
                  />
                </label>
              </div>
            )}

            {step === 5 && (
              <div style={{ marginTop: 28 }}>
                <div className="speculative-note">
                  <strong>READY TO PUBLISH</strong>
                  <p>
                    Publishing stores this concept in your browser and makes it
                    visible to your local FUTURE market. It does not publish to
                    a public server or create a real product.
                  </p>
                </div>
                {published ? (
                  <div style={{ marginTop: 24 }}>
                    <div className="badge badge-live">
                      <Check size={11} /> CONCEPT PUBLISHED
                    </div>
                    <p className="lead" style={{ marginTop: 14 }}>
                      Your concept is now visible in FUTURE.
                    </p>
                    <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                      <Link
                        className="button button-future"
                        href={`/concepts/view/?slug=${encodeURIComponent(concept.slug)}`}
                      >
                        View concept
                      </Link>
                      <Link className="button" href="/future">
                        Open FUTURE market
                      </Link>
                    </div>
                  </div>
                ) : (
                  <button
                    className="button button-future button-lg"
                    type="button"
                    onClick={publish}
                    style={{ marginTop: 24 }}
                  >
                    <Sparkles size={15} /> Publish concept
                  </button>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 34,
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                className="button button-sm"
                type="button"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
              >
                <ArrowLeft size={13} /> Previous
              </button>
              {step < steps.length - 1 && (
                <button
                  className="button button-sm"
                  type="button"
                  onClick={() =>
                    setStep((value) => Math.min(steps.length - 1, value + 1))
                  }
                >
                  Next <ArrowRight size={13} />
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <aside className="lab-preview">
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Live preview
        </div>
        <article
          className="card product-card product-card-future"
          style={{ minHeight: 390 }}
        >
          <div className="card-topline">
            <span className="badge badge-future">◇ FUTURE</span>
            <span className="badge">PREVIEW</span>
          </div>
          <div style={{ marginTop: 20 }}>
            <ProductIcon name={preview.icon} future size={24} />
          </div>
          <h3>{preview.name}</h3>
          <div className="product-meta">CONCEPT · {preview.type}</div>
          <p className="product-copy">{preview.description}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {preview.proposedCapabilities.slice(0, 3).map((item) => (
              <span className="chip" key={item}>
                {item}
              </span>
            ))}
          </div>
          <div className="card-footer">
            <span className="product-meta">Not implemented</span>
            <span className="card-action">
              Imagine <ArrowRight size={13} />
            </span>
          </div>
        </article>
      </aside>
    </div>
  );
}

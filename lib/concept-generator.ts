import type { Concept, ProductType } from "@/types/marketplace";
import { slugify } from "@/lib/format";

type GeneratorOverrides = Partial<Pick<Concept, "name" | "type" | "description" | "problem" | "proposedCapabilities" | "targetUsers" | "useCases" | "businessModel" | "limitations" | "dependencies">>;

const keywordRules: Array<{ test: RegExp; name: string; type: ProductType; capabilities: string[]; tags: string[] }> = [
  { test: /context.*(transfer|agent)|agent.*context/i, name: "Agent Context Transfer API", type: "API", capabilities: ["context serialization", "identity verification", "permission control", "expiration policies", "audit trails"], tags: ["context", "agents", "protocols"] },
  { test: /memory|remember|recall/i, name: "Portable Agent Memory API", type: "API", capabilities: ["memory storage", "cross-agent retrieval", "permission control", "retention rules"], tags: ["memory", "agents", "context"] },
  { test: /permission|authorize|consent/i, name: "Universal Permission Protocol", type: "PROTOCOL", capabilities: ["scoped requests", "human approval", "policy evaluation", "revocation"], tags: ["permissions", "identity", "security"] },
  { test: /identity|trust|reputation/i, name: "Agent Trust Identity Layer", type: "PROTOCOL", capabilities: ["verifiable identity", "scoped credentials", "trust records", "revocation"], tags: ["identity", "trust", "agents"] },
  { test: /payment|wallet|budget|money/i, name: "Machine Payment Budget API", type: "API", capabilities: ["budget policy", "approval thresholds", "transaction receipts", "shutdown rules"], tags: ["payments", "agents", "security"] },
  { test: /browser|web/i, name: "Intent-Aware Browser Layer", type: "EXTENSION", capabilities: ["semantic page map", "declared actions", "permission prompts", "audit receipts"], tags: ["browser", "agents", "automation"] },
  { test: /mcp|tool/i, name: "Universal MCP Tool Passport", type: "PROTOCOL", capabilities: ["capability discovery", "permission grants", "server identity", "revocation"], tags: ["mcp", "tools", "protocols"] },
  { test: /search|retrieval/i, name: "Machine Intent Search API", type: "API", capabilities: ["intent parsing", "source ranking", "result provenance", "permission filters"], tags: ["search", "retrieval", "agents"] },
  { test: /schedule|queue|task/i, name: "Durable Agent Scheduling API", type: "API", capabilities: ["durable tasks", "approval pauses", "dependency rules", "retry policies"], tags: ["scheduling", "agents", "automation"] },
];

function hashIdea(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").slice(0, 4);
}

function titleFromIdea(idea: string) {
  const words = idea.replace(/^(i wish there were|build|create|an?|the)\s+/i, "").split(/\s+/).slice(0, 6);
  const title = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return title || "Untitled Capability";
}

export function generateConcept(idea: string, overrides: GeneratorOverrides = {}): Concept {
  const matched = keywordRules.find((rule) => rule.test.test(idea));
  const name = overrides.name || matched?.name || titleFromIdea(idea);
  const type = overrides.type || matched?.type || "API";
  const capabilities = overrides.proposedCapabilities || matched?.capabilities || ["structured interface", "policy controls", "auditability", "portable configuration"];
  const tags = matched?.tags || [type.toLowerCase(), "agents", "interoperability"];
  const slug = `${slugify(name)}-${hashIdea(`${idea}:${name}`)}`;

  return {
    id: slug, slug, name, type, status: "FUTURE", provider: "Imagined by You",
    tagline: overrides.description || `A proposed ${type.toLowerCase()} for ${idea.replace(/^i wish there were\s*/i, "").trim()}.`,
    description: overrides.description || `A proposed capability that turns the following unmet need into a concrete software interface: ${idea.trim()}.`,
    icon: type === "TOKEN" ? "diamond" : type === "PROTOCOL" ? "arrows" : "spark",
    tags, capabilities, version: "Draft 0.1", endpoint: `concept://${slug}`,
    pricing: { model: "UNKNOWN", unit: "not implemented" }, demoPrice: 0,
    availability: "CONCEPT", verified: false, popularity: 42, watchers: 0, supporters: 0,
    relatedProductIds: [], relatedConceptIds: [], createdAt: new Date().toISOString().slice(0, 10),
    authModel: "Proposed consent and policy model", sdks: ["Hypothetical SDK"],
    problem: overrides.problem || `Current tools do not provide a reliable, interoperable way to address this need: ${idea.trim()}.`,
    proposedCapabilities: capabilities,
    targetUsers: overrides.targetUsers || ["agent developers", "platform teams", "tool builders"],
    useCases: overrides.useCases || ["Integrate the capability into a new agent workflow.", "Expose the capability through a shared protocol."],
    hypotheticalInterface: [{ method: "POST", path: `/v1/${slug}/request`, description: "Proposed entry point for requesting the capability." }],
    businessModel: overrides.businessModel || "Usage-based managed service with a public specification.",
    dependencies: overrides.dependencies || ["identity and policy", "stable schemas", "audit storage"],
    limitations: overrides.limitations || ["The interface needs cross-vendor adoption.", "Trust and data-retention rules require careful design."],
    creator: { id: "demo-user", name: "You" }, backingCredits: 0,
    isUserCreated: true, tone: "PRACTICAL", ambition: "FOCUSED",
  };
}

export function updateConceptFromIdea(concept: Concept, idea: string, overrides: GeneratorOverrides = {}) {
  return generateConcept(idea, {
    name: concept.name,
    type: concept.type,
    description: concept.description,
    problem: concept.problem,
    proposedCapabilities: concept.proposedCapabilities,
    targetUsers: concept.targetUsers,
    useCases: concept.useCases,
    businessModel: concept.businessModel,
    limitations: concept.limitations,
    dependencies: concept.dependencies,
    ...overrides,
  });
}



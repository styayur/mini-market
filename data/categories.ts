import type { Category } from "@/types/marketplace";

export const categories: Category[] = [
  { slug: "memory", name: "Memory", description: "Store, retrieve, and transport context across models and agents.", tags: ["memory", "context", "retrieval"], icon: "◈" },
  { slug: "agents", name: "Agents", description: "Identity, permissions, scheduling, negotiation, and autonomous execution.", tags: ["agents", "automation", "orchestration"], icon: "✦" },
  { slug: "vision", name: "Vision", description: "Perception, image understanding, visual editing, and spatial reasoning.", tags: ["vision", "images", "multimodal"], icon: "◉" },
  { slug: "voice", name: "Voice", description: "Speech, listening, synthesis, and real-time conversational interfaces.", tags: ["voice", "audio", "speech"], icon: "≈" },
  { slug: "search", name: "Search", description: "Discovery systems for people, software, data, and machine intent.", tags: ["search", "discovery", "retrieval"], icon: "⌕" },
  { slug: "browser", name: "Browser", description: "Agent-native browsing, automation, and intent-aware web surfaces.", tags: ["browser", "web", "automation"], icon: "⊞" },
  { slug: "payments", name: "Payments", description: "Programmable transactions, budgets, billing, and machine commerce.", tags: ["payments", "finance", "commerce"], icon: "◇" },
  { slug: "identity", name: "Identity", description: "Trust, consent, authentication, reputation, and portable credentials.", tags: ["identity", "trust", "security"], icon: "⬡" },
  { slug: "data", name: "Data", description: "Datasets, storage, versioning, and machine-readable knowledge systems.", tags: ["data", "datasets", "storage"], icon: "▦" },
  { slug: "automation", name: "Automation", description: "Reliable workflows, actions, scheduling, and autonomous operations.", tags: ["automation", "workflows", "agents"], icon: "⇄" },
  { slug: "code", name: "Code", description: "Development environments, review, deployment, and software creation.", tags: ["code", "developer-tools", "deployment"], icon: "</>" },
  { slug: "collaboration", name: "Collaboration", description: "Shared knowledge, messaging, documents, and human-agent teamwork.", tags: ["collaboration", "notifications", "workflows"], icon: "◎" },
  { slug: "protocols", name: "Protocols", description: "Interoperable standards for capabilities, context, identity, and trust.", tags: ["protocols", "mcp", "interoperability"], icon: "↔" },
  { slug: "developer-tools", name: "Developer Tools", description: "Build, test, inspect, and operate modern software systems.", tags: ["developer-tools", "testing", "operations"], icon: "⌘" },
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

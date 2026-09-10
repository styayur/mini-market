import {
  Aperture, ArrowLeftRight, Bot, Boxes, Braces, BrainCircuit, Cloud, Code2,
  Container, CreditCard, Database, Diamond, GitBranch, Grid2X2, Layers3,
  MessageSquare, Network, Orbit, PenTool, Puzzle, Radar, Send, Shield,
  Sparkles, Triangle, WandSparkles, Wrench,
} from "lucide-react";
import type { ProductType } from "@/types/marketplace";

const icons = {
  spark: Sparkles, aperture: Aperture, orbit: Orbit, branch: GitBranch, card: CreditCard,
  blocks: Boxes, message: MessageSquare, shield: Shield, send: Send, layers: Layers3,
  container: Container, wand: WandSparkles, code: Code2, pen: PenTool, connector: Network,
  stack: Cloud, radar: Radar, database: Database, triangle: Triangle, nodes: BrainCircuit,
  braces: Braces, diamond: Diamond, grid: Grid2X2, puzzle: Puzzle, brain: BrainCircuit,
  bot: Bot, arrows: ArrowLeftRight, wrench: Wrench,
} as const;

export function ProductIcon({ name, size = 23, large = false, future = false }: { name: string; size?: number; large?: boolean; future?: boolean }) {
  const Icon = icons[name as keyof typeof icons] ?? Braces;
  return (
    <div className={`product-icon ${large ? "product-icon-large" : ""} ${future ? "product-icon-future" : ""}`} aria-hidden="true">
      <Icon size={size} strokeWidth={1.65} />
    </div>
  );
}

export function IconForType({ type }: { type: ProductType }) {
  const name = type === "API" ? "braces" : type === "TOKEN" ? "diamond" : type === "EXTENSION" ? "grid" : type === "PLUGIN" ? "puzzle" : type === "MCP" ? "connector" : type === "MODEL" ? "brain" : type === "AGENT" ? "bot" : type === "DATASET" ? "database" : type === "PROTOCOL" ? "arrows" : "wrench";
  return <ProductIcon name={name} />;
}

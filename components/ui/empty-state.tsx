import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, href, action }: { icon: LucideIcon; title: string; description: string; href: string; action: string }) {
  return (
    <div className="empty-state">
      <div>
        <div className="product-icon" style={{ margin: "0 auto 4px" }}><Icon size={22} /></div>
        <h2>{title}</h2>
        <p>{description}</p>
        <Link className="button button-primary" href={href}>{action} <ArrowRight size={14} /></Link>
      </div>
    </div>
  );
}

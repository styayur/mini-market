import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({ eyebrow, title, description, href, linkLabel = "View all" }: { eyebrow?: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>}
        <h2 className="section-title text-balance">{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && <Link className="button button-sm" href={href}>{linkLabel} <ArrowRight size={14} /></Link>}
    </div>
  );
}

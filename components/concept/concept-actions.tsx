"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Check, CheckCircle2, Share2, Sparkles, X } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { WatchButton } from "@/components/concept/watch-button";
import { formatMoney } from "@/lib/format";
import { parseAmountToAtomic } from "@/lib/money";
import type { Concept } from "@/types/marketplace";

export function ConceptActions({ concept }: { concept: Concept }) {
  const { backConcept, balanceAtomic, economy, getBackingTotal, hydrated, notify } = useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState("200");
  const [error, setError] = useState("");
  const [backedAtomic, setBackedAtomic] = useState("0");
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: concept.name, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        notify(c("Concept link copied.", "概念链接已复制。"));
      }
    } catch {
      // Dismissing a native share sheet is not an error.
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    let amountAtomic: string;
    try {
      amountAtomic = parseAmountToAtomic(amount);
    } catch {
      setError(c("Choose a valid positive amount.", "请输入有效的正数金额。"));
      return;
    }
    const result = backConcept(concept.id, amount);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setBackedAtomic(amountAtomic);
    setError("");
    dialog.current?.close();
  };
  return (
    <>
      <div className="detail-actions">
        <button className="button button-future button-lg" disabled={!hydrated} onClick={() => dialog.current?.showModal()}><Sparkles size={15} /> {c("Back this future", "为这个未来投一票")}</button>
        <WatchButton conceptId={concept.id} />
        <Link className="button button-lg" href={`/concepts/new?seed=${encodeURIComponent(concept.name)}`}>{c("Remix this idea", "延伸这个想法")}</Link>
        <button className="button button-lg" onClick={share}><Share2 size={14} /> {c("Share", "分享")}</button>
      </div>
      <p className="detail-demo-note">
        {formatMoney(hydrated ? getBackingTotal(concept.id) : concept.backingAtomic, economy, language)} · {c("Illustrative backing + your local support", "示例支持量 + 你的本地支持")}
      </p>
      {backedAtomic !== "0" && (
        <div className="backing-success" role="status">
          <CheckCircle2 size={19} />
          <span>{c(`Your ${formatMoney(backedAtomic, economy, language)} is behind this idea. This is simulated interest, not an investment.`, `已用 ${formatMoney(backedAtomic, economy, language)} 支持这个想法，这只是模拟兴趣，不构成投资。`)}</span>
        </div>
      )}
      <dialog className="backing-dialog" ref={dialog} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
        <div className="card-topline">
          <span className="section-overline">{c("A vote for tomorrow", "为明天投一票")}</span>
          <button className="icon-button" onClick={() => dialog.current?.close()} aria-label={c("Close", "关闭")}><X size={19} /></button>
        </div>
        <h2>{concept.name}</h2>
        <p>{c("Put a little possibility behind this idea. Simulated support expresses interest only; it grants no equity, delivery promise, or real financial right.", "用一点额度为这个想法增加一点可能。模拟支持仅代表兴趣，不包含股权、交付承诺或真实金融权益。")}</p>
        <form onSubmit={submit}>
          <div className="topup-options">
            {[50, 200, 500].map((value) => (
              <button type="button" key={value} aria-pressed={amount === String(value)} onClick={() => setAmount(String(value))}>
                {formatMoney(parseAmountToAtomic(value), economy, language, false)}<small>{economy.currencyLabel}</small>
              </button>
            ))}
          </div>
          <label className="form-field">
            <span>{c("Your contribution", "你的支持数量")}</span>
            <input className="form-input" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            <span className="form-hint">{c("Available", "可用余额")}: {formatMoney(balanceAtomic, economy, language)}</span>
          </label>
          {error && <p className="commerce-error" role="alert">{error} <Link href="/dashboard">{c("Open wallet", "打开钱包")}</Link></p>}
          <button className="button button-future" type="submit"><Check size={15} /> {c("Confirm simulated support", "确认模拟支持")}</button>
        </form>
      </dialog>
    </>
  );
}

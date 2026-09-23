"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Check, CheckCircle2, Share2, Sparkles, X } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { WatchButton } from "@/components/concept/watch-button";
import { formatCredits } from "@/lib/format";
import type { Concept } from "@/types/marketplace";

export function ConceptActions({ concept }: { concept: Concept }) {
  const { backConcept, credits, getBackingTotal, hydrated, notify } =
    useMarketplace();
  const { language } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState("200");
  const [error, setError] = useState("");
  const [backed, setBacked] = useState(0);
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: concept.name,
          url: window.location.href,
        });
      else {
        await navigator.clipboard.writeText(window.location.href);
        notify(c("Concept link copied.", "概念链接已复制。"));
      }
    } catch {
      /* Dismissing a native share sheet is not an error. */
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value <= 0)
      return setError(
        c(
          "Choose a whole number of Tokens, at least 1.",
          "请输入至少 1 枚的整数 Token。",
        ),
      );
    if (!backConcept(concept.id, value))
      return setError(
        c(
          "Not enough demo Tokens. Top up your wallet to continue.",
          "体验 Token 不足，请前往钱包补充。",
        ),
      );
    setBacked(value);
    setError("");
    dialog.current?.close();
  };
  return (
    <>
      <div className="detail-actions">
        <button
          className="button button-future button-lg"
          disabled={!hydrated}
          onClick={() => dialog.current?.showModal()}
        >
          <Sparkles size={15} />
          {c("Back this future", "为这个未来投一票")}
        </button>
        <WatchButton conceptId={concept.id} />
        <Link
          className="button button-lg"
          href={`/concepts/new?seed=${encodeURIComponent(concept.name)}`}
        >
          {c("Remix this idea", "延伸这个想法")}
        </Link>
        <button className="button button-lg" onClick={share}>
          <Share2 size={14} />
          {c("Share", "分享")}
        </button>
      </div>
      <p className="detail-demo-note">
        ◈{" "}
        {formatCredits(
          hydrated ? getBackingTotal(concept.id) : concept.backingCredits,
        )}{" "}
        Token ·{" "}
        {c(
          "Illustrative backing + your local support",
          "示例支持量 + 你的本地支持",
        )}
      </p>
      {backed > 0 && (
        <div className="backing-success" role="status">
          <CheckCircle2 size={19} />
          <span>
            {c(
              `Your ${backed} Tokens are behind this idea. A little closer to tomorrow.`,
              `已用 ${backed} 枚 Token 支持这个想法，离你期待的明天又近了一点。`,
            )}
          </span>
        </div>
      )}
      <dialog
        className="backing-dialog"
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="card-topline">
          <span className="section-overline">
            {c("A vote for tomorrow", "为明天投一票")}
          </span>
          <button
            className="icon-button"
            onClick={() => dialog.current?.close()}
            aria-label={c("Close", "关闭")}
          >
            <X size={19} />
          </button>
        </div>
        <h2>{concept.name}</h2>
        <p>
          {c(
            "Put a little possibility behind this idea. Your demo support is an expression of interest, without equity, a delivery promise or real payment.",
            "用一点 Token，为这个想法增加一点可能。体验支持仅代表兴趣，不含股权、交付承诺或真实付款。",
          )}
        </p>
        <form onSubmit={submit}>
          <div className="topup-options">
            {[50, 200, 500].map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={amount === String(v)}
                onClick={() => setAmount(String(v))}
              >
                {v}
                <small>Token</small>
              </button>
            ))}
          </div>
          <label className="form-field">
            <span>{c("Your contribution", "你的支持数量")}</span>
            <input
              className="form-input"
              type="number"
              min="1"
              step="1"
              max={credits}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <span className="form-hint">
              {c("Available", "可用余额")}: {formatCredits(credits)} Token
            </span>
          </label>
          {error && (
            <p className="commerce-error" role="alert">
              {error}{" "}
              <Link href="/dashboard">{c("Open wallet", "打开钱包")}</Link>
            </p>
          )}
          <button className="button button-future" type="submit">
            <Check size={15} />
            {c("Confirm support", "确认支持")}
          </button>
        </form>
      </dialog>
    </>
  );
}

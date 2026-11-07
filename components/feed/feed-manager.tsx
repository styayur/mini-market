"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Database,
  ExternalLink,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Rss,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { TranslatableText } from "@/components/feed/translatable-text";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { parseAmountToAtomic } from "@/lib/money";
import type { FeedContentType, FeedFailure, FeedRefreshState, FeedSubscription, ProxyAdapterId } from "@/types/feed";
import type { MessageKey } from "@/lib/i18n";

const CATEGORIES: FeedContentType[] = ["ARTICLE", "IDEA", "PRODUCT", "RESEARCH", "PROJECT", "OTHER"];

function failureText(failure: FeedFailure | undefined, t: (key: MessageKey, variables?: Record<string, string | number>) => string) {
  if (!failure) return "";
  const key = `feeds.errors.${failure.code}` as MessageKey;
  const localized = t(key);
  return localized === key ? failure.message : localized;
}

function statusLabel(status: FeedRefreshState | undefined) {
  if (!status) return "IDLE";
  return status.status;
}

function SubscriptionCard({ subscription }: { subscription: FeedSubscription }) {
  const {
    feedSources,
    feedItems,
    feedRefreshStates,
    refreshFeed,
    updateFeedSubscription,
    removeFeed,
    clearFeedCache,
    products,
    economy,
  } = useMarketplace();
  const { language, t } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const source = feedSources.find((entry) => entry.id === subscription.sourceId);
  const refreshState = feedRefreshStates[subscription.id];
  const items = feedItems.filter((item) => item.subscriptionId === subscription.id).sort((a, b) => (b.publishedAt ?? b.fetchedAt).localeCompare(a.publishedAt ?? a.fetchedAt));
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subscription.title);
  const [category, setCategory] = useState(subscription.category);
  const [price, setPrice] = useState(formatMoney(subscription.priceAtomic, economy, language, false));
  const [interval, setIntervalMinutes] = useState(String(subscription.refreshIntervalMinutes));
  const [message, setMessage] = useState("");
  const refresh = async () => {
    setRefreshing(true);
    const result = await refreshFeed(subscription.id, true);
    setMessage(result.ok ? c("Feed refreshed.", "订阅源已刷新。") : failureText(result.refreshState?.lastFailure, t) || result.message);
    setRefreshing(false);
  };
  const saveEdit = () => {
    try {
      const priceAtomic = parseAmountToAtomic(price);
      const result = updateFeedSubscription(subscription.id, {
        title: title.trim() || subscription.title,
        category,
        priceAtomic,
        refreshIntervalMinutes: Math.max(15, Math.min(10080, Number(interval) || 60)),
      });
      setMessage(result.message);
      if (result.ok) setEditing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : c("Enter a valid price.", "请输入有效价格。"));
    }
  };
  return (
    <article className="feed-subscription-card card">
      <div className="feed-subscription-head">
        <div className="feed-source-icon"><Rss size={20} /></div>
        <div className="feed-subscription-title">
          <div className="feed-title-row">
            <h3>{subscription.title}</h3>
            <span className="badge" data-status={refreshState?.status ?? "IDLE"}>{statusLabel(refreshState)}</span>
            {!subscription.enabled && <span className="badge">{c("Disabled", "已停用")}</span>}
          </div>
          <a href={subscription.feedUrl} target="_blank" rel="noreferrer">{subscription.feedUrl} <ExternalLink size={11} /></a>
          <p>
            {source?.format ?? "UNKNOWN"} · {source?.language ?? c("language unknown", "语言未知")} · {t("feeds.itemsCount", { count: items.length })} · {c("every", "每")} {subscription.refreshIntervalMinutes} {t("feeds.minutes")}
          </p>
        </div>
        <div className="feed-subscription-actions">
          <button className="button button-sm" type="button" disabled={refreshing || !subscription.enabled} onClick={refresh}>
            <RefreshCw size={13} className={refreshing ? "spin" : undefined} /> {refreshing ? t("feeds.refreshing") : t("feeds.refresh")}
          </button>
          <button className="icon-button" type="button" aria-label={subscription.enabled ? t("feeds.disable") : t("feeds.enable")} onClick={() => updateFeedSubscription(subscription.id, { enabled: !subscription.enabled })}>
            {subscription.enabled ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button className="icon-button" type="button" aria-label={t("feeds.remove")} onClick={() => { if (window.confirm(t("feeds.removeConfirm"))) removeFeed(subscription.id); }}><Trash2 size={15} /></button>
        </div>
      </div>
      <div className="feed-status-line">
        <span>{t("feeds.lastFetched")}: <strong>{refreshState?.lastSuccessAt ? formatDateTime(refreshState.lastSuccessAt, language) : t("feeds.never")}</strong></span>
        {refreshState?.usedCache && <span className="badge badge-warning">{t("feeds.fromCache")}</span>}
        <span>{t("feeds.imported")}: {refreshState?.importedCount ?? 0} · {t("feeds.updated")}: {refreshState?.updatedCount ?? 0} · {t("feeds.unchanged")}: {refreshState?.unchangedCount ?? 0}</span>
      </div>
      {refreshState?.lastFailure && (
        <div className="feed-error-banner" role="status">
          <AlertTriangle size={15} />
          <span><strong>{refreshState.lastFailure.code}</strong> · {failureText(refreshState.lastFailure, t)}</span>
          {refreshState.nextAttemptAt && <small>{c("Next automatic retry", "下次自动重试")}: {formatDateTime(refreshState.nextAttemptAt, language)}</small>}
        </div>
      )}
      <div className="feed-card-controls">
        <button className="text-button" type="button" onClick={() => setEditing((value) => !value)} aria-expanded={editing}><ChevronDown size={14} /> {c("Edit subscription", "编辑订阅")}</button>
        <button className="text-button" type="button" onClick={async () => { await clearFeedCache(subscription.feedUrl); setMessage(t("feeds.cacheCleared")); }}><Database size={14} /> {t("feeds.clearCache")}</button>
      </div>
      {editing && (
        <div className="feed-edit-grid">
          <label className="form-field"><span>{t("feeds.displayTitle")}</span><input className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="form-field"><span>{t("feeds.category")}</span><select className="form-select" value={category} onChange={(event) => setCategory(event.target.value as FeedContentType)}>{CATEGORIES.map((value) => <option value={value} key={value}>{t(`feeds.categories.${value}` as MessageKey)}</option>)}</select></label>
          <label className="form-field"><span>{t("feeds.price")}</span><input className="form-input" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
          <label className="form-field"><span>{t("feeds.refreshInterval")}</span><input className="form-input" type="number" min={15} max={10080} step={1} value={interval} onChange={(event) => setIntervalMinutes(event.target.value)} /></label>
          <button className="button button-primary" type="button" onClick={saveEdit}>{c("Save changes", "保存修改")}</button>
        </div>
      )}
      {message && <p className="form-hint" role="status">{message}</p>}
      <div className="feed-latest-head"><h4>{t("feeds.latestItems")}</h4><span>{source?.title ?? subscription.title}</span></div>
      {items.length ? (
        <div className="feed-item-list">
          {items.slice(0, 6).map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            return (
              <div className="feed-item-row" key={item.id}>
                <div>
                  {product ? <Link href={`/marketplace/view?slug=${encodeURIComponent(product.slug)}`}>{item.title}</Link> : <strong>{item.title}</strong>}
                  <TranslatableText text={item.description} sourceLanguage={item.sourceLanguage} as="span" className="feed-item-description" />
                  <small>{item.author ? `${t("feeds.author")}: ${item.author} · ` : ""}{item.publishedAt ? formatDate(item.publishedAt, language) : formatDate(item.fetchedAt, language)}</small>
                </div>
                <div className="feed-item-meta">
                  <span>{product ? formatMoney(product.priceAtomic, economy, language) : "—"}</span>
                  {item.originalUrl && <a href={item.originalUrl} target="_blank" rel="noreferrer" aria-label={t("feeds.viewOriginal")}><ExternalLink size={13} /></a>}
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="muted">{t("feeds.noItems")}</p>}
    </article>
  );
}

export function FeedManager() {
  const {
    hydrated,
    feedSubscriptions,
    proxySettings,
    saveProxySettings,
    addFeed,
    clearAllFeedCache,
    migrationWarnings,
  } = useMarketplace();
  const { language, t } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FeedContentType>("ARTICLE");
  const [price, setPrice] = useState("25");
  const [interval, setIntervalMinutes] = useState("60");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [proxyIds, setProxyIds] = useState<ProxyAdapterId[]>(proxySettings.enabledAdapterIds);
  const [customEnabled, setCustomEnabled] = useState(proxySettings.customAdapter?.enabled ?? false);
  const [customLabel, setCustomLabel] = useState(proxySettings.customAdapter?.label ?? "");
  const [customTemplate, setCustomTemplate] = useState(proxySettings.customAdapter?.template ?? "");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    let priceAtomic: string;
    try {
      priceAtomic = parseAmountToAtomic(price);
    } catch {
      setMessage(c("Enter a valid simulated price.", "请输入有效的模拟价格。"));
      return;
    }
    setAdding(true);
    setMessage("");
    const result = await addFeed({ feedUrl: url, title: title.trim(), category, priceAtomic, refreshIntervalMinutes: Number(interval) || 60 });
    setMessage(result.ok ? t("feeds.addSuccess") : failureText(result.refreshState?.lastFailure, t) || result.message);
    setAdding(false);
    if (result.ok) {
      setUrl("");
      setTitle("");
    }
  };

  const saveProxy = () => {
    if (customEnabled && (!customTemplate.includes("{url}") || !customTemplate.startsWith("https://"))) {
      setMessage(c("The custom proxy must be an HTTPS URL template containing {url}.", "自定义代理必须是包含 {url} 的 HTTPS URL 模板。"));
      return;
    }
    saveProxySettings({
      enabledAdapterIds: ["direct", ...proxyIds.filter((id) => id === "cors-dev" || id === "cors-tools" || id === "custom")],
      customAdapter: customEnabled ? { enabled: true, label: customLabel || "Custom proxy", template: customTemplate } : { enabled: false, label: customLabel, template: customTemplate },
    });
    setMessage(t("feeds.proxySaved"));
  };

  if (!hydrated) return <div className="skeleton" style={{ height: 620 }} />;

  return (
    <div className="feed-manager">
      <section className="feed-intro-grid">
        <div>
          <span className="section-overline">{t("feeds.eyebrow")}</span>
          <h1 className="page-title">{t("feeds.title")}</h1>
          <p className="lead">{t("feeds.description")}</p>
          <p className="feed-policy-note"><ShieldAlert size={15} /> {t("feeds.refreshPolicy")}</p>
        </div>
        <form className="card feed-add-card" onSubmit={submit}>
          <h2>{t("feeds.addTitle")}</h2>
          <label className="form-field"><span>{t("feeds.url")}</span><input className="form-input" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder={t("feeds.urlPlaceholder")} /></label>
          <label className="form-field"><span>{t("feeds.displayTitle")}</span><input className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("feeds.titlePlaceholder")} /></label>
          <div className="feed-form-row">
            <label className="form-field"><span>{t("feeds.category")}</span><select className="form-select" value={category} onChange={(event) => setCategory(event.target.value as FeedContentType)}>{CATEGORIES.map((value) => <option value={value} key={value}>{t(`feeds.categories.${value}` as MessageKey)}</option>)}</select></label>
            <label className="form-field"><span>{t("feeds.price")}</span><input className="form-input" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /><span className="form-hint">{t("feeds.priceHint")}</span></label>
          </div>
          <label className="form-field"><span>{t("feeds.refreshInterval")}</span><input className="form-input" type="number" min={15} max={10080} value={interval} onChange={(event) => setIntervalMinutes(event.target.value)} /><span className="form-hint">{t("feeds.minutes")}</span></label>
          {message && <p className="settings-message" role="status">{message}</p>}
          <button className="button button-primary" type="submit" disabled={adding}><Plus size={15} /> {adding ? t("feeds.adding") : t("feeds.add")}</button>
        </form>
      </section>

      <section className="card proxy-settings-card">
        <div className="card-topline"><div><span className="section-overline">{t("feeds.proxyTitle")}</span><h2>{c("Direct first, then replaceable public fallbacks.", "优先直接抓取，随后使用可替换的公共回退。")}</h2></div><Rss size={22} /></div>
        <p>{t("feeds.proxyPrivacy")}</p>
        <div className="proxy-choice-list">
          <label className="proxy-choice"><input type="checkbox" checked readOnly /><span><strong>{t("feeds.proxyDirect")}</strong><small>{c("Always attempted first. Target URLs never include credentials.", "始终首先尝试。目标 URL 不包含凭据。")}</small></span></label>
          <label className="proxy-choice"><input type="checkbox" checked={proxyIds.includes("cors-dev")} onChange={(event) => setProxyIds((current) => event.target.checked ? [...current, "cors-dev"] : current.filter((id) => id !== "cors-dev"))} /><span><strong>{t("feeds.proxyCorsDev")}</strong><small>https://proxy.cors.dev/</small></span></label>
          <label className="proxy-choice"><input type="checkbox" checked={proxyIds.includes("cors-tools")} onChange={(event) => setProxyIds((current) => event.target.checked ? [...current, "cors-tools"] : current.filter((id) => id !== "cors-tools"))} /><span><strong>{t("feeds.proxyCorsTools")}</strong><small>https://cors.tools/ — {c("records every request and response; opt in only for public content", "记录所有请求与响应；仅对公开内容显式启用")}</small></span></label>
          <label className="proxy-choice"><input type="checkbox" checked={customEnabled} onChange={(event) => setCustomEnabled(event.target.checked)} /><span><strong>{t("feeds.customProxy")}</strong><small>{c("Unverified user configuration", "用户自行配置，未经验证")}</small></span></label>
        </div>
        {customEnabled && <div className="feed-form-row"><label className="form-field"><span>{c("Proxy label", "代理标签")}</span><input className="form-input" value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} /></label><label className="form-field"><span>{c("HTTPS template", "HTTPS 模板")}</span><input className="form-input" value={customTemplate} onChange={(event) => setCustomTemplate(event.target.value)} placeholder={t("feeds.customProxyPlaceholder")} /></label></div>}
        <div className="settings-actions"><button className="button button-primary" type="button" onClick={saveProxy}>{t("feeds.saveProxy")}</button><button className="button" type="button" onClick={() => void clearAllFeedCache()}><Database size={14} /> {c("Clear all feed caches", "清除全部订阅缓存")}</button></div>
      </section>

      {migrationWarnings.length > 0 && <div className="migration-warning"><AlertTriangle size={16} /><div><strong>{t("settings.migrationWarnings")}</strong><ul>{migrationWarnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div></div>}

      <section className="feed-subscriptions-section">
        <div className="shop-section-heading"><div><span className="section-overline">{c("Subscriptions", "订阅")}</span><h2>{t("feeds.manageTitle")}</h2></div><span className="badge">{feedSubscriptions.length}</span></div>
        {feedSubscriptions.length ? (
          <div className="feed-subscription-list">{feedSubscriptions.map((subscription) => <SubscriptionCard subscription={subscription} key={subscription.id} />)}</div>
        ) : (
          <div className="empty-state"><div><Rss size={34} /><h2>{t("feeds.noSubscriptions")}</h2><p>{t("feeds.noSubscriptionsHint")}</p></div></div>
        )}
      </section>
    </div>
  );
}

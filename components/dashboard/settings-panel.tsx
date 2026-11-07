"use client";

import { useRef, useState } from "react";
import { Database, Download, Gauge, Languages, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { useMarketplace } from "@/components/providers/marketplace-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { formatMoney } from "@/lib/format";
import { atomicToDecimalString, parseAmountToAtomic } from "@/lib/money";
import { translationService } from "@/lib/translation/translation-service";
import type { CurrencyKind, EconomySettings } from "@/types/economy";

function majorAmountForInput(atomic: string) {
  return atomicToDecimalString(atomic).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

export function SettingsPanel() {
  const {
    balanceAtomic,
    economy,
    updateEconomy,
    resetWallet,
    exportData,
    importData,
    cartProductIds,
    favoriteProductIds,
    libraryProductIds,
    createdConcepts,
    watchedConceptIds,
    migrationWarnings,
    translationSettings,
    saveTranslationSettings,
    resetDemo,
    hydrated,
  } = useMarketplace();
  const { language, t, setPreference, preference } = useLanguage();
  const c = (en: string, zh: string) => (language === "zh" ? zh : en);
  const [initialCredit, setInitialCredit] = useState(majorAmountForInput(economy.initialCreditAtomic));
  const [currencyKind, setCurrencyKind] = useState<CurrencyKind>(economy.currencyKind);
  const [currencyCode, setCurrencyCode] = useState(economy.currencyCode);
  const [currencyLabel, setCurrencyLabel] = useState(economy.currencyLabel);
  const [displayPrecision, setDisplayPrecision] = useState(economy.displayPrecision);
  const [displayPattern, setDisplayPattern] = useState(economy.displayPattern);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");
  const importRef = useRef<HTMLInputElement>(null);


  const showMessage = (text: string, kind: "success" | "error" = "success") => {
    setMessage(text);
    setMessageKind(kind);
  };

  const saveEconomy = () => {
    try {
      const settings: EconomySettings = {
        initialCreditAtomic: parseAmountToAtomic(initialCredit),
        currencyKind,
        currencyCode: currencyKind === "ISO" ? currencyCode.trim().toUpperCase() : currencyCode.trim(),
        currencyLabel: currencyLabel.trim() || currencyCode.trim(),
        displayPrecision,
        displayPattern: displayPattern.trim(),
      };
      const result = updateEconomy(settings);
      showMessage(result.message, result.ok ? "success" : "error");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : c("Enter a valid initial credit.", "请输入有效的初始额度。"), "error");
    }
  };

  const downloadExport = () => {
    const blob = new Blob([exportData()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitimart-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const raw = await file.text();
    const result = importData(raw);
    showMessage(result.message, result.ok ? "success" : "error");
    if (importRef.current) importRef.current.value = "";
  };

  return (
    <div className="settings-grid">
      <section className="card settings-card">
        <div className="eyebrow">{c("Marketplace profile", "市场档案")}</div>
        <h2>{c("A local, simulated account.", "一个本地模拟账户。")}</h2>
        <p className="lead">{hydrated ? formatMoney(balanceAtomic, economy, language) : "—"}</p>
        <dl>
          <div className="meta-row"><dt>{c("Library", "收藏库")}</dt><dd>{libraryProductIds.length}</dd></div>
          <div className="meta-row"><dt>{c("Cart", "购物袋")}</dt><dd>{cartProductIds.length}</dd></div>
          <div className="meta-row"><dt>{c("Favorites", "心愿单")}</dt><dd>{favoriteProductIds.length}</dd></div>
          <div className="meta-row"><dt>{c("Concepts", "概念")}</dt><dd>{createdConcepts.length}</dd></div>
          <div className="meta-row"><dt>{c("Watched", "关注")}</dt><dd>{watchedConceptIds.length}</dd></div>
        </dl>
      </section>

      <section className="card settings-card">
        <div className="eyebrow"><Gauge size={13} /> {t("settings.economyTitle")}</div>
        <h2>{c("Configure the simulation.", "配置这套模拟经济。")}</h2>
        <p>{t("settings.economyDescription")}</p>
        <div className="settings-fields">
          <label className="form-field"><span>{t("settings.initialCredit")}</span><input className="form-input" inputMode="decimal" value={initialCredit} onChange={(event) => setInitialCredit(event.target.value)} /><span className="form-hint">{t("settings.initialCreditHint")}</span></label>
          <label className="form-field"><span>{t("settings.currencyKind")}</span><select className="form-select" value={currencyKind} onChange={(event) => { const value = event.target.value as CurrencyKind; setCurrencyKind(value); if (value === "ISO" && currencyCode.length !== 3) setCurrencyCode("USD"); }}><option value="ISO">{t("settings.isoCurrency")}</option><option value="CUSTOM">{t("settings.customCurrency")}</option></select></label>
          <div className="settings-field-row">
            <label className="form-field"><span>{t("settings.currencyCode")}</span><input className="form-input" value={currencyCode} maxLength={12} onChange={(event) => setCurrencyCode(event.target.value)} /></label>
            <label className="form-field"><span>{t("settings.currencyLabel")}</span><input className="form-input" value={currencyLabel} maxLength={24} onChange={(event) => setCurrencyLabel(event.target.value)} /></label>
          </div>
          <div className="settings-field-row">
            <label className="form-field"><span>{t("settings.displayPrecision")}</span><input className="form-input" type="number" min={0} max={6} step={1} value={displayPrecision} onChange={(event) => setDisplayPrecision(Number(event.target.value))} /></label>
            <label className="form-field"><span>{t("settings.displayPattern")}</span><input className="form-input" value={displayPattern} onChange={(event) => setDisplayPattern(event.target.value)} /><span className="form-hint">{t("settings.displayPatternHint")}</span></label>
          </div>
        </div>
        {message && <p className={`settings-message settings-message-${messageKind}`} role="status">{message}</p>}
        <div className="settings-actions">
          <button className="button button-primary" type="button" onClick={saveEconomy}>{t("settings.saveEconomy")}</button>
          <button className="button" type="button" onClick={() => { if (window.confirm(t("settings.resetWalletHint"))) { const result = resetWallet(); showMessage(result.message); } }}><RotateCcw size={14} /> {t("settings.resetWallet")}</button>
        </div>
        <p className="form-hint">{t("settings.resetWalletHint")}</p>
      </section>

      <section className="card settings-card">
        <div className="eyebrow"><Languages size={13} /> {c("Localization and translation", "本地化与翻译")}</div>
        <h2>{c("Interface language is separate from content translation.", "界面语言与内容翻译相互独立。")}</h2>
        <div className="settings-fields">
          <label className="form-field"><span>{c("Interface language", "界面语言")}</span><select className="form-select" value={preference} onChange={(event) => setPreference(event.target.value as "auto" | "en" | "zh")}><option value="auto">{t("settings.languageAuto")}</option><option value="en">English</option><option value="zh">简体中文</option></select></label>
          <label className="checkbox-row"><input type="checkbox" checked={translationSettings.enabled} onChange={(event) => saveTranslationSettings({ ...translationSettings, enabled: event.target.checked })} /><span>{t("settings.translationEnabled")}</span></label>
          <label className="form-field"><span>{t("settings.translationProvider")}</span><select className="form-select" value={translationSettings.provider} onChange={(event) => saveTranslationSettings({ ...translationSettings, provider: event.target.value as "mymemory" | "none" })}><option value="none">{c("Disabled", "已停用")}</option><option value="mymemory">MyMemory (free)</option></select></label>
        </div>
        <p className="form-hint">{t("settings.translationNotice")}</p>
        <button className="button" type="button" onClick={async () => { await translationService.clearCache(); showMessage(c("Translation cache cleared.", "翻译缓存已清除。")); }}>{t("settings.clearTranslationCache")}</button>
      </section>

      <section className="card settings-card">
        <div className="eyebrow"><Database size={13} /> {c("Data and safety", "数据与安全")}</div>
        <h2>{c("Your data stays in this browser.", "你的数据保存在此浏览器中。")}</h2>
        <div className="settings-note"><ShieldCheck size={18} /><p>{c("Fitimart never asks for API keys, stores financial credentials, or processes real payments. Feed caches and translations use browser storage.", "Fitimart 不会索取 API 密钥、存储金融凭据或处理真实付款。订阅缓存与翻译使用浏览器存储。")}</p></div>
        <div className="settings-actions">
          <button className="button" type="button" onClick={downloadExport}><Download size={14} /> {t("settings.exportData")}</button>
          <button className="button" type="button" onClick={() => importRef.current?.click()}><Upload size={14} /> {t("settings.importData")}</button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importFile(event.target.files?.[0])} />
          <button className="button" type="button" onClick={() => { if (window.confirm(c("Reset all local marketplace data? Export a backup first if needed.", "重置所有本地市场数据？如有需要请先导出备份。"))) resetDemo(); }}><RotateCcw size={14} /> {c("Reset all local data", "重置所有本地数据")}</button>
        </div>
        {migrationWarnings.length > 0 && <div className="migration-warning"><strong>{t("settings.migrationWarnings")}</strong><ul>{migrationWarnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div>}
      </section>
    </div>
  );
}

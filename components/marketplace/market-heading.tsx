"use client";
import { useLanguage } from "@/components/providers/language-provider";
export function MarketHeading() {
  const { language } = useLanguage();
  return (
    <div className="commerce-heading">
      <span className="section-overline">
        {language === "zh"
          ? "给好点子，配齐好能力"
          : "Equip your next good idea"}
      </span>
      <h1>
        {language === "zh"
          ? "你的下一项能力，在这里。"
          : "Your next capability is here."}
      </h1>
      <p>
        {language === "zh"
          ? "选购模型、API 与开发工具的体验通行证，或探索未来概念。所有标价均为体验 Token。"
          : "Collect demo passes for models, APIs and developer tools, or explore future concepts. All prices are in demo Tokens."}
      </p>
    </div>
  );
}

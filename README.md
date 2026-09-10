# Mini Market

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)

**English** · [简体中文](#简体中文)

A polished, static, bilingual marketplace prototype for discovering AI capabilities that exist today and imagining capabilities that do not exist yet.

> Buy what exists. Imagine what comes next.

[Live site](https://styayur.github.io/mini-market/) · [Repository](https://github.com/styayur/mini-market)

## Product concept

Mini Market has two clearly labeled states:

- **NOW** — real, verified products with conservative descriptions and official documentation links.
- **FUTURE** — speculative technical concepts marked as unimplemented and never represented as live services.

## Features

- Editorial homepage and CSS/SVG capability map
- Trending NOW products, new arrivals, and editor choices
- FUTURE market with trending, recent, backed, watched, ambitious, and unusual concepts
- 14 capability categories
- Global search across products, providers, tags, capabilities, and concepts
- Marketplace filters with URL state
- Command palette with `Ctrl/Cmd + K` and `/`
- Simulated cart, 10,000 demo credits, checkout, library, favorites, watchlist, and concept sponsorship
- Concept Lab with deterministic generation, editing, live preview, and local publishing
- English and Simplified Chinese UI with a persisted language toggle
- Responsive layouts verified at 390px without horizontal overflow

## Tech stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, lucide-react, static export, GitHub Pages.

## Local development

```bash
git clone https://github.com/styayur/mini-market.git
cd mini-market
npm install
npm run dev
```

Open <http://localhost:3000>.

Quality checks:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

GitHub Pages local build on PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/mini-market"
npm run build
```

## Routes

`/`, `/marketplace`, `/marketplace/[slug]`, `/future`, `/concepts`, `/concepts/new`, `/concepts/[slug]`, `/dashboard`, `/library`, `/cart`, `/checkout`, `/search`, `/categories/[slug]`, `/favorites`, `/settings`, and `/manifesto`.

## Architecture

```text
app/                    Next.js routes and metadata
components/             Layout, product, concept, marketplace, dashboard, and providers
data/                   Seed products, concepts, categories, and providers
lib/                    Search, storage, recommendations, formatting, i18n
types/                  TypeScript marketplace models
public/                 Static assets and .nojekyll
.github/workflows/      GitHub Pages deployment
```

The MVP has no backend. Cart, favorites, watchlist, library, credits, created concepts, transactions, and backings are stored in `localStorage` through `lib/storage.ts` and `components/providers/marketplace-provider.tsx`.

## Demo safety

No real payment processing, financial credentials, API-key collection, asset ownership, trading, or fabricated certifications. FUTURE concepts are proposals only. NOW products link only to known official documentation.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` checks TypeScript and ESLint, builds the static export with the repository base path, uploads `out/`, and deploys to GitHub Pages.

Expected URL: <https://styayur.github.io/mini-market/>

If needed, set `Settings → Pages → Build and deployment → Source` to **GitHub Actions**.

## License

Licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE).

---

# 简体中文

一个支持中英双语、可静态部署的 AI 能力市场原型，用于发现今天已经存在的软件能力，并想象尚未出现的未来能力。

> 购买已经存在的。想象即将到来的。

[在线网站](https://styayur.github.io/mini-market/) · [GitHub 仓库](https://github.com/styayur/mini-market)

## 产品理念

Mini Market 将软件能力清晰划分为两种状态：

- **NOW（现实）**：真实、已验证的产品，采用保守描述并链接到官方文档。
- **FUTURE（未来）**：推测性技术概念，明确标记为尚未实现，绝不伪装成现有服务。

## 主要功能

- 编辑型首页与 CSS/SVG 能力关系图
- 流行的 NOW 产品、最新收录与编辑精选
- FUTURE 市场：趋势、最近想象、最多支持、最多关注、技术野心与小众概念
- 14 个能力分类
- 跨产品、提供商、标签、能力与概念的全局搜索
- 支持 URL 状态的分类筛选
- 使用 `Ctrl/Cmd + K` 或 `/` 打开命令面板
- 模拟购物车、10,000 演示积分、结算、能力库、收藏、关注与概念赞助
- 概念实验室：确定性生成、分步编辑、实时预览与本地发布
- 英文与简体中文界面，语言偏好持久化
- 已验证 390px 移动端宽度无横向溢出

## 技术栈

Next.js 16、React 19、TypeScript、Tailwind CSS 4、lucide-react、静态导出、GitHub Pages。

## 本地运行

```bash
git clone https://github.com/styayur/mini-market.git
cd mini-market
npm install
npm run dev
```

访问 <http://localhost:3000>。

质量检查：

```bash
npx tsc --noEmit
npm run lint
npm run build
```

PowerShell 下使用 GitHub Pages 子路径构建：

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/mini-market"
npm run build
```

## 页面路由

`/`、`/marketplace`、`/marketplace/[slug]`、`/future`、`/concepts`、`/concepts/new`、`/concepts/[slug]`、`/dashboard`、`/library`、`/cart`、`/checkout`、`/search`、`/categories/[slug]`、`/favorites`、`/settings`、`/manifesto`。

## 项目架构

```text
app/                    Next.js 路由与元数据
components/             布局、产品、概念、市场、控制台与 Provider
data/                   产品、概念、分类与提供商种子数据
lib/                    搜索、存储、推荐、格式化与国际化
types/                  TypeScript 市场模型
public/                 静态资源与 .nojekyll
.github/workflows/      GitHub Pages 自动部署
```

当前 MVP 没有后端。购物车、收藏、关注、能力库、积分、已创建概念、交易与支持记录通过 `lib/storage.ts` 和 `components/providers/marketplace-provider.tsx` 保存在浏览器 `localStorage`。

## 演示安全原则

不处理真实支付，不收集金融凭证或 API 密钥，不代表真实资产所有权或交易，不虚构认证。FUTURE 概念仅代表提案，NOW 产品只链接到已知官方文档。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 会检查 TypeScript 与 ESLint，使用仓库名称作为子路径构建静态网站，上传 `out/` 并部署到 GitHub Pages。

预期地址：<https://styayur.github.io/mini-market/>

如有需要，在 `Settings → Pages → Build and deployment → Source` 中选择 **GitHub Actions**。

## 许可证

本项目使用 **GNU General Public License v3.0**，完整文本见 [LICENSE](LICENSE)。

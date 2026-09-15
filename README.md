# Kinolin Translator

AI Translation Agent（BYOK）：仅保留 Agent 路径，无 Google / 传统机器翻译。

## 技术栈

Next.js · TypeScript · Tailwind · next-intl · Zustand · TanStack Query · OpenNext / Cloudflare

## 开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)（按浏览器语言跳转；内置中/英，或已生成的界面语言包；其余回退 `/en-US`）。

先到 **配置 AI** 填写 Provider / Model / API Key，再使用翻译官。

## 部署（Cloudflare Workers + OpenNext）

`npm run build` 会走 OpenNext（内部以 standalone 模式执行 `next build`，再生成 `.open-next`），因此 Cloudflare Workers Builds 默认：

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

可以直接用。本地一键部署：

```bash
npm run deploy
```

仅 Next 构建（不做 Worker）：`npm run build:next`。

## 品牌资源

Logo 源文件：`D:\Desktop\dev\logo` → 已复制到 `public/brand/`

## Phase 1 范围

- AI Translation Agent（BYOK 浏览器直连）
- Provider Adapter：OpenAI / Claude / Gemini / DeepSeek / Compatible
- 配置检查弹窗与结果区
- 中英固定语言包（next-intl）

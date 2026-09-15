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

`npm run build` 会先跑 `next build`，再编译 OpenNext Worker（`.open-next`），因此 Cloudflare Workers Builds 默认的：

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

可以直接用。本地一键部署：

```bash
npm run deploy
```

若只想构建 Next（不做 Worker 打包）：`npm run build:next`。

推荐（更快、少歧义）也可在控制台显式写成：

| 设置 | 值 |
|------|------|
| Build command | `npx @opennextjs/cloudflare build` |
| Deploy command | `npx @opennextjs/cloudflare deploy` |

## 品牌资源

Logo 源文件：`D:\Desktop\dev\logo` → 已复制到 `public/brand/`

## Phase 1 范围

- AI Translation Agent（BYOK 浏览器直连）
- Provider Adapter：OpenAI / Claude / Gemini / DeepSeek / Compatible
- 配置检查弹窗与结果区
- 中英固定语言包（next-intl）

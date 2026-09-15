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

本地一键部署：

```bash
npm run deploy
```

若使用 **Workers Builds**（连 Git 自动部署），在 Cloudflare 控制台把构建设置改成：

| 设置 | 值 |
|------|------|
| Build command | `npx @opennextjs/cloudflare build` |
| Deploy command | `npx @opennextjs/cloudflare deploy` |

不要用 `npm run build` + `npx wrangler deploy`：前者只产出 Next.js 构建，不会生成 `.open-next`，部署会报 `Could not find compiled Open Next config`。

## 品牌资源

Logo 源文件：`D:\Desktop\dev\logo` → 已复制到 `public/brand/`

## Phase 1 范围

- AI Translation Agent（BYOK 浏览器直连）
- Provider Adapter：OpenAI / Claude / Gemini / DeepSeek / Compatible
- 配置检查弹窗与结果区
- 中英固定语言包（next-intl）

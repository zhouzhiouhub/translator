# Kinolin Translator

AI Translation Agent（BYOK）：仅保留 Agent 路径，无 Google / 传统机器翻译。

## 技术栈

Next.js · TypeScript · Tailwind · next-intl · Zustand · TanStack Query · OpenNext / Cloudflare

## 开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)（会跳转到 `/zh-CN`）。

先到 **配置 AI** 填写 Provider / Model / API Key，再使用翻译官。

## 品牌资源

Logo 源文件：`D:\Desktop\dev\logo` → 已复制到 `public/brand/`

## Phase 1 范围

- AI Translation Agent（BYOK 浏览器直连）
- Provider Adapter：OpenAI / Claude / Gemini / DeepSeek / Compatible
- 配置检查弹窗与结果区
- 中英固定语言包（next-intl）

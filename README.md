# Kinolin Translator

AI Translation Agent：Google 基础翻译 + BYOK AI，逐步演进为 Website Localization Agent。

## 技术栈

Next.js · TypeScript · Tailwind · next-intl · Zustand · TanStack Query · OpenNext / Cloudflare

## 开发

```bash
cp .env.example .env.local
# 填写 GOOGLE_TRANSLATE_API_KEY（可选，缺省时 Google 接口返回 503）

npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)（会跳转到 `/zh-CN`）。

## 品牌资源

Logo 源文件目录：`D:\Desktop\dev\logo`  
已复制到本仓库：`public/brand/`

| 文件 | 用途 |
|------|------|
| `symbol.svg` | 侧栏 / favicon |
| `logo.svg` | 浅色横版 wordmark |
| `logo-dark.svg` | 深色背景版 |
| `logo-mono.svg` | 单色版 |

## Phase 1 范围

- 文本翻译（Google 服务端代理 + AI BYOK）
- 配置 AI（Provider / Model / Key / Compatible Base）
- 中英固定语言包（next-intl）
- 配置检查弹窗与结果区

详见设计稿与 `技术设计.md`。

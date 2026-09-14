export const locales = ["zh-CN", "en-US"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "zh-CN";

export const localeLabels: Record<AppLocale, string> = {
  "zh-CN": "中文",
  "en-US": "English",
};

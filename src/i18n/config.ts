/** Built-in message packs under messages/*.json */
export const fixedLocales = ["zh-CN", "en-US"] as const;

/** Generated packs (BYOK) — routable; SSR falls back to zh-CN until client cache loads */
export const dynamicLocales = [
  "ja",
  "ko",
  "ru",
  "de",
  "fr",
  "es",
  "pt",
] as const;

/** All URL locales accepted by middleware / [locale] segment */
export const locales = [...fixedLocales, ...dynamicLocales] as const;

export type FixedLocale = (typeof fixedLocales)[number];
export type DynamicLocale = (typeof dynamicLocales)[number];
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "zh-CN";

export const localeLabels: Record<AppLocale, string> = {
  "zh-CN": "中文",
  "en-US": "English",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português",
};

export function isFixedLocale(locale: string): locale is FixedLocale {
  return (fixedLocales as readonly string[]).includes(locale);
}

export function isAppLocale(locale: string): locale is AppLocale {
  return (locales as readonly string[]).includes(locale);
}

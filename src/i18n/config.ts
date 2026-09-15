import { APP_LANGUAGES } from "./languages";

/** Built-in message packs under messages/*.json */
export const fixedLocales = ["zh-CN", "en-US"] as const;

const catalogCodes = APP_LANGUAGES.map((l) => l.code);

/** All URL locales: built-in + full language catalog */
export const locales = Array.from(
  new Set<string>([...fixedLocales, ...catalogCodes]),
) as [string, ...string[]];

export type FixedLocale = (typeof fixedLocales)[number];
export type AppLocale = (typeof locales)[number];

/** Fallback when the browser language has no built-in UI pack. */
export const defaultLocale: AppLocale = "en-US";

export const localeLabels: Record<string, string> = Object.fromEntries([
  ...APP_LANGUAGES.map((l) => [l.code, l.nameZh] as const),
  ["zh-CN", "简体中文"],
  ["en-US", "English"],
]);

export function isFixedLocale(locale: string): locale is FixedLocale {
  return (fixedLocales as readonly string[]).includes(locale);
}

export function isAppLocale(locale: string): locale is AppLocale {
  return locales.includes(locale);
}

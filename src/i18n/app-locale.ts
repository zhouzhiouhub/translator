/** Lightweight locale helpers for client bundles. */
export const fixedLocales = ["zh-CN", "en-US"] as const;

export type FixedLocale = (typeof fixedLocales)[number];
export type AppLocale = string;

/** Fallback when the browser language has no built-in UI pack. */
export const defaultLocale: AppLocale = "en-US";

const localePattern = /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i;

export function isFixedLocale(locale: string): locale is FixedLocale {
  return (fixedLocales as readonly string[]).includes(locale);
}

export function isAppLocale(locale: string): locale is AppLocale {
  return isFixedLocale(locale) || localePattern.test(locale);
}

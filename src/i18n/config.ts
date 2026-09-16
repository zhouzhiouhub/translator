import {
  defaultLocale,
  fixedLocales,
  isFixedLocale,
  type AppLocale,
  type FixedLocale,
} from "./app-locale";
import { APP_LANGUAGES } from "./languages";

export { defaultLocale, fixedLocales, isFixedLocale };
export type { AppLocale, FixedLocale };

const catalogCodes = APP_LANGUAGES.map((l) => l.code);

/** All URL locales: built-in + full language catalog */
export const locales = Array.from(
  new Set<string>([...fixedLocales, ...catalogCodes]),
) as [string, ...string[]];

export const localeLabels: Record<string, string> = Object.fromEntries([
  ...APP_LANGUAGES.map((l) => [l.code, l.nameZh] as const),
  ["zh-CN", "简体中文"],
  ["en-US", "English"],
]);

export function isAppLocale(locale: string): locale is AppLocale {
  return locales.includes(locale);
}

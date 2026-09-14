import {
  fixedLocales,
  isFixedLocale,
  localeLabels,
  type AppLocale,
  type FixedLocale,
} from "./config";
import { APP_LANGUAGES, getLanguage } from "./languages";

/** Built-in packs shipped as JSON under messages/. */
export const FIXED_UI_LOCALES = fixedLocales;
export type FixedUiLocale = FixedLocale;

export type UiLocale = AppLocale;

export const UI_LOCALE_LABELS: Record<string, string> = localeLabels;

/** All languages that can receive a generated UI pack (excludes built-in). */
export const DYNAMIC_UI_LOCALES = APP_LANGUAGES.map((l) => l.code).filter(
  (code) => !isFixedLocale(code),
);

export type DynamicUiLocale = (typeof DYNAMIC_UI_LOCALES)[number];

export const ALL_UI_LOCALES: UiLocale[] = [
  ...FIXED_UI_LOCALES,
  ...DYNAMIC_UI_LOCALES,
];

export function isFixedUiLocale(locale: string): locale is FixedUiLocale {
  return isFixedLocale(locale);
}

export function isDynamicUiLocale(locale: string): locale is DynamicUiLocale {
  return DYNAMIC_UI_LOCALES.includes(locale);
}

export function isUiLocale(locale: string): locale is UiLocale {
  return isFixedUiLocale(locale) || isDynamicUiLocale(locale) || Boolean(getLanguage(locale));
}

/** Map translator target language codes to UI locale ids. */
export function mapTargetLangToUiLocale(targetLanguage: string): UiLocale | null {
  const aliases: Record<string, UiLocale> = {
    zh: "zh-CN",
    "zh-CN": "zh-CN",
    en: "en-US",
    "en-US": "en-US",
  };
  if (aliases[targetLanguage]) return aliases[targetLanguage];
  if (isUiLocale(targetLanguage)) return targetLanguage;
  return null;
}

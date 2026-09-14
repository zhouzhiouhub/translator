"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  languagesForSelect,
  localizedLanguageName,
  type AppLanguage,
} from "@/i18n/languages";
import { isFixedUiLocale } from "@/i18n/ui-locales";

/** Language options labeled in the current UI locale. */
export function useLocalizedLanguageOptions(options?: {
  /** Exclude built-in zh-CN / en-US (for pack generation). */
  excludeBuiltin?: boolean;
}) {
  const locale = useLocale();

  return useMemo(() => {
    let list: AppLanguage[] = languagesForSelect(locale);
    if (options?.excludeBuiltin) {
      list = list.filter((l) => !isFixedUiLocale(l.code));
    }
    return list.map((l) => ({
      value: l.code,
      label: localizedLanguageName(l.code, locale),
    }));
  }, [locale, options?.excludeBuiltin]);
}

export function useLocalizedLanguageName(code: string): string {
  const locale = useLocale();
  return useMemo(
    () => localizedLanguageName(code, locale),
    [code, locale],
  );
}

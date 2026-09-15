"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  languagesForSelect,
  localizedLanguageName,
  stableLanguageName,
  type AppLanguage,
} from "@/i18n/languages";
import { isFixedUiLocale } from "@/i18n/ui-locales";

function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Switch to localized labels only after the browser has hydrated.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return mounted;
}

/** Language options labeled in the current UI locale (SSR-safe). */
export function useLocalizedLanguageOptions(options?: {
  /** Exclude built-in zh-CN / en-US (for pack generation). */
  excludeBuiltin?: boolean;
}) {
  const locale = useLocale();
  const mounted = useHasMounted();
  const excludeBuiltin = options?.excludeBuiltin ?? false;

  return useMemo(() => {
    const nameOf = mounted ? localizedLanguageName : stableLanguageName;
    let list: AppLanguage[] = languagesForSelect(locale, mounted);
    if (excludeBuiltin) {
      list = list.filter((l) => !isFixedUiLocale(l.code));
    }
    return list.map((l) => ({
      value: l.code,
      label: nameOf(l.code, locale),
    }));
  }, [locale, mounted, excludeBuiltin]);
}

export function useLocalizedLanguageName(code: string): string {
  const locale = useLocale();
  const mounted = useHasMounted();
  return useMemo(
    () =>
      (mounted ? localizedLanguageName : stableLanguageName)(code, locale),
    [code, locale, mounted],
  );
}

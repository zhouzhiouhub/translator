"use client";

import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  useTranslations,
} from "next-intl";
import { useEffect, useMemo, type ReactNode } from "react";
import { useUiLocaleStore } from "@/stores/ui-locale";
import { isFixedUiLocale } from "@/i18n/ui-locales";

function GeneratingBanner() {
  const t = useTranslations("settings");
  const status = useUiLocaleStore((s) => s.status);
  if (status !== "generating") return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-sm text-primary backdrop-blur"
    >
      {t("generatingBanner")}
    </div>
  );
}

function DocumentLangSync({ children }: { children: ReactNode }) {
  const routeLocale = useLocale();
  const preferred = useUiLocaleStore((s) => s.preferredUiLocale);
  const dynamicMessages = useUiLocaleStore((s) => s.dynamicMessages);

  useEffect(() => {
    const lang =
      !isFixedUiLocale(preferred) && dynamicMessages
        ? preferred
        : routeLocale;
    document.documentElement.lang = lang;
  }, [preferred, dynamicMessages, routeLocale]);

  return <>{children}</>;
}

/**
 * Dynamic packs override messages only — keep the route locale so
 * `/${locale}/...` links stay on built-in zh-CN / en-US paths.
 */
export function UiLocaleProvider({ children }: { children: ReactNode }) {
  const routeLocale = useLocale();
  const routeMessages = useMessages();
  const preferred = useUiLocaleStore((s) => s.preferredUiLocale);
  const setPreferredUiLocale = useUiLocaleStore((s) => s.setPreferredUiLocale);
  const dynamicMessages = useUiLocaleStore((s) => s.dynamicMessages);
  const hydrateDynamicPack = useUiLocaleStore((s) => s.hydrateDynamicPack);

  useEffect(() => {
    // URL is source of truth for built-in locales.
    if (
      isFixedUiLocale(routeLocale) &&
      isFixedUiLocale(preferred) &&
      preferred !== routeLocale
    ) {
      setPreferredUiLocale(routeLocale);
    }
  }, [routeLocale, preferred, setPreferredUiLocale]);

  useEffect(() => {
    void hydrateDynamicPack();
  }, [hydrateDynamicPack, preferred]);

  const overrideMessages = useMemo(() => {
    if (isFixedUiLocale(preferred) || !dynamicMessages) return null;
    return dynamicMessages as typeof routeMessages;
  }, [preferred, dynamicMessages, routeMessages]);

  const inner = (
    <DocumentLangSync>
      <GeneratingBanner />
      {children}
    </DocumentLangSync>
  );

  if (!overrideMessages) return inner;

  return (
    <NextIntlClientProvider locale={routeLocale} messages={overrideMessages}>
      {inner}
    </NextIntlClientProvider>
  );
}

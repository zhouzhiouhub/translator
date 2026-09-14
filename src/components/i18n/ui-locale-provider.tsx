"use client";

import {
  NextIntlClientProvider,
  useMessages,
  useTranslations,
} from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useUiLocaleStore } from "@/stores/ui-locale";
import { isFixedUiLocale } from "@/i18n/ui-locales";
import { useRouteLocale } from "@/i18n/use-route-locale";

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

function DocumentLangSync({
  lang,
  children,
}: {
  lang: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <>{children}</>;
}

/**
 * Dynamic packs override messages client-side.
 * Provider remounts via `key` so consumers always pick up new catalogs.
 * Navigation must use `useRouteLocale()` (URL), not `useLocale()`.
 */
export function UiLocaleProvider({ children }: { children: ReactNode }) {
  const routeLocale = useRouteLocale();
  const routeMessages = useMessages();
  const preferred = useUiLocaleStore((s) => s.preferredUiLocale);
  const setPreferredUiLocale = useUiLocaleStore((s) => s.setPreferredUiLocale);
  const dynamicMessages = useUiLocaleStore((s) => s.dynamicMessages);
  const hydrateDynamicPack = useUiLocaleStore((s) => s.hydrateDynamicPack);
  const [persistReady, setPersistReady] = useState(() =>
    useUiLocaleStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useUiLocaleStore.persist.onFinishHydration(() => {
      setPersistReady(true);
    });
    if (useUiLocaleStore.persist.hasHydrated()) {
      setPersistReady(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    // URL is source of truth for built-in locales.
    if (
      isFixedUiLocale(routeLocale) &&
      isFixedUiLocale(preferred) &&
      preferred !== routeLocale
    ) {
      setPreferredUiLocale(routeLocale);
    }
  }, [persistReady, routeLocale, preferred, setPreferredUiLocale]);

  useEffect(() => {
    if (!persistReady) return;
    void hydrateDynamicPack();
  }, [persistReady, hydrateDynamicPack, preferred]);

  const activeDynamic =
    !isFixedUiLocale(preferred) && dynamicMessages
      ? dynamicMessages
      : null;

  const providerLocale = activeDynamic ? preferred : routeLocale;
  const providerMessages = useMemo(
    () => (activeDynamic ?? routeMessages) as typeof routeMessages,
    [activeDynamic, routeMessages],
  );

  return (
    <NextIntlClientProvider
      key={`ui-${providerLocale}-${activeDynamic ? "dyn" : "route"}`}
      locale={providerLocale}
      messages={providerMessages}
    >
      <DocumentLangSync lang={providerLocale}>
        <GeneratingBanner />
        {children}
      </DocumentLangSync>
    </NextIntlClientProvider>
  );
}

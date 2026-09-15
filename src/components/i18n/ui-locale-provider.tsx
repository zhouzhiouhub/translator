"use client";

import {
  NextIntlClientProvider,
  useMessages,
  useTranslations,
} from "next-intl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUiLocaleStore } from "@/stores/ui-locale";
import { isFixedUiLocale, isUiLocale } from "@/i18n/ui-locales";
import { useRouteLocale } from "@/i18n/use-route-locale";
import {
  browserLanguagesHeader,
  getExplicitUiLocaleCookie,
  resolveBrowserUiLocale,
  syncReadyUiLocalesCookie,
} from "@/i18n/resolve-ui-locale";

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

function usePersistReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const api = (
      useUiLocaleStore as typeof useUiLocaleStore & {
        persist?: {
          hasHydrated: () => boolean;
          onFinishHydration: (cb: () => void) => () => void;
        };
      }
    ).persist;

    if (!api) {
      setReady(true);
      return;
    }

    if (api.hasHydrated()) {
      setReady(true);
      return;
    }

    return api.onFinishHydration(() => setReady(true));
  }, []);

  return ready;
}

function swapLocalePath(pathname: string, current: string, next: string) {
  const rest = pathname.replace(new RegExp(`^/${current}`), "") || "";
  return `/${next}${rest}`;
}

/**
 * After generated packs load from localStorage, sync the ready-locales cookie
 * and redirect when the browser language matches a pack and the user has not
 * explicitly chosen another UI locale.
 */
function BrowserLocaleSync() {
  const routeLocale = useRouteLocale();
  const pathname = usePathname();
  const router = useRouter();
  const readyLocales = useUiLocaleStore((s) => s.readyLocales);
  const refreshReadyLocales = useUiLocaleStore((s) => s.refreshReadyLocales);
  const persistReady = usePersistReady();
  const redirectedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!persistReady) return;
    void refreshReadyLocales();
  }, [persistReady, refreshReadyLocales]);

  useEffect(() => {
    if (!persistReady) return;
    syncReadyUiLocalesCookie(readyLocales);

    if (getExplicitUiLocaleCookie()) return;

    const best = resolveBrowserUiLocale(
      browserLanguagesHeader(),
      readyLocales,
    );
    if (!isUiLocale(best) || best === routeLocale) return;

    const key = `${routeLocale}->${best}`;
    if (redirectedFor.current === key) return;
    redirectedFor.current = key;
    router.replace(swapLocalePath(pathname, routeLocale, best));
  }, [persistReady, readyLocales, routeLocale, pathname, router]);

  return null;
}

/**
 * Dynamic packs override messages client-side when the URL locale is generated.
 * URL is the source of truth for which locale is active.
 */
export function UiLocaleProvider({ children }: { children: ReactNode }) {
  const routeLocale = useRouteLocale();
  const routeMessages = useMessages();
  const preferred = useUiLocaleStore((s) => s.preferredUiLocale);
  const setPreferredUiLocale = useUiLocaleStore((s) => s.setPreferredUiLocale);
  const dynamicMessages = useUiLocaleStore((s) => s.dynamicMessages);
  const hydrateDynamicPack = useUiLocaleStore((s) => s.hydrateDynamicPack);
  const persistReady = usePersistReady();

  useEffect(() => {
    if (!persistReady) return;
    if (isUiLocale(routeLocale) && preferred !== routeLocale) {
      setPreferredUiLocale(routeLocale);
    }
  }, [persistReady, routeLocale, preferred, setPreferredUiLocale]);

  useEffect(() => {
    if (!persistReady) return;
    void hydrateDynamicPack();
  }, [persistReady, hydrateDynamicPack, preferred, routeLocale]);

  const activeDynamic =
    !isFixedUiLocale(routeLocale) && dynamicMessages
      ? dynamicMessages
      : null;

  const providerLocale = routeLocale;
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
        <BrowserLocaleSync />
        <GeneratingBanner />
        {children}
      </DocumentLangSync>
    </NextIntlClientProvider>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteLocale } from "@/i18n/use-route-locale";
import type { UiLocale } from "@/i18n/ui-locales";
import { setExplicitUiLocaleCookie } from "@/i18n/resolve-ui-locale";
import { useUiLocaleStore } from "@/stores/ui-locale";

function swapLocalePath(pathname: string, current: string, next: string) {
  const rest = pathname.replace(new RegExp(`^/${current}`), "") || "";
  return `/${next}${rest}`;
}

function stableUiLocaleLabel(code: string, uiLocale: string) {
  if (code === "zh-CN") {
    return uiLocale.toLowerCase().startsWith("zh")
      ? "简体中文"
      : "Simplified Chinese";
  }
  if (code === "en-US") return "English";
  return code;
}

function localizedUiLocaleLabel(code: string, uiLocale: string) {
  if (code === "zh-CN" || code === "en-US") {
    return stableUiLocaleLabel(code, uiLocale);
  }
  try {
    const names = new Intl.DisplayNames([uiLocale, "en"], {
      type: "language",
    });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

export function UiLocaleSwitcher() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const routeLocale = useRouteLocale();
  const pathname = usePathname();
  const router = useRouter();
  const preferred = useUiLocaleStore((s) => s.preferredUiLocale);
  const readyLocales = useUiLocaleStore((s) => s.readyLocales);
  const applyLocale = useUiLocaleStore((s) => s.applyLocale);
  const refreshReadyLocales = useUiLocaleStore((s) => s.refreshReadyLocales);

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active: UiLocale = readyLocales.includes(routeLocale)
    ? routeLocale
    : preferred;

  function labelFor(code: string) {
    return mounted
      ? localizedUiLocaleLabel(code, locale)
      : stableUiLocaleLabel(code, locale);
  }

  useEffect(() => {
    // This client-only flag prevents localized labels from changing during hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    void refreshReadyLocales();
  }, [refreshReadyLocales]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function onSelect(nextLocale: UiLocale) {
    setOpen(false);
    try {
      await applyLocale(nextLocale);
      setExplicitUiLocaleCookie(nextLocale);
      router.push(swapLocalePath(pathname, routeLocale, nextLocale));
      setToast(t("applySuccess"));
      window.setTimeout(() => setToast(null), 2200);
    } catch (err) {
      if (err instanceof Error && err.message === "LOCALE_PACK_NOT_READY") {
        setToast(t("packNotReady"));
      } else {
        setToast(t("generateFailed"));
      }
      window.setTimeout(() => setToast(null), 2800);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-slate-50"
      >
        <Languages className="h-4 w-4 text-primary" />
        <span>{labelFor(active)}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {readyLocales.map((code) => {
            const selected = active === code;
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => void onSelect(code)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-slate-50",
                  )}
                >
                  <span>{labelFor(code)}</span>
                  {selected ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              </li>
            );
          })}
          {readyLocales.length <= 2 ? (
            <li className="border-t border-border px-3 py-2 text-[11px] leading-snug text-muted">
              {t("switcherHint")}
            </li>
          ) : null}
        </ul>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

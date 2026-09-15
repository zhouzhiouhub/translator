import {
  defaultLocale,
  fixedLocales,
  isAppLocale,
  type AppLocale,
} from "./config";

/** Comma-separated generated UI locales (excludes built-ins). Readable by middleware. */
export const READY_UI_LOCALES_COOKIE = "kinolin.readyUiLocales";

/** Set only when the user picks a locale in the switcher. */
export const EXPLICIT_UI_LOCALE_COOKIE = "kinolin.uiLocaleExplicit";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseAcceptLanguageTags(
  acceptLanguage: string | null | undefined,
): string[] {
  if (!acceptLanguage) return [];

  return acceptLanguage
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        tag: rawTag.trim(),
        quality: Number.isFinite(quality) ? quality : 1,
      };
    })
    .filter((x) => x.tag && x.tag !== "*")
    .sort((a, b) => b.quality - a.quality)
    .map((x) => x.tag);
}

function findAvailable(
  available: readonly string[],
  predicate: (locale: string) => boolean,
): string | undefined {
  return available.find(predicate);
}

/**
 * Pick the best UI locale from Accept-Language among locales that actually
 * have a UI pack (built-in and/or user-generated). Falls back to en-US.
 */
export function resolveBrowserUiLocale(
  acceptLanguage: string | null | undefined,
  availableLocales: readonly string[] = fixedLocales,
): AppLocale {
  const available = Array.from(
    new Set(
      [...availableLocales, defaultLocale].filter((l) => isAppLocale(l)),
    ),
  );
  if (available.length === 0) return defaultLocale;

  const tags = parseAcceptLanguageTags(acceptLanguage);
  if (tags.length === 0) return defaultLocale;

  for (const tag of tags) {
    const lower = tag.toLowerCase();

    const exact = findAvailable(
      available,
      (l) => l.toLowerCase() === lower,
    );
    if (exact) return exact as AppLocale;

    const lang = lower.split("-")[0] ?? lower;
    const related = available.filter((l) => {
      const ll = l.toLowerCase();
      return ll === lang || ll.startsWith(`${lang}-`);
    });
    if (related.length === 0) continue;

    if (lang === "zh") {
      const wantsTrad =
        lower.includes("tw") ||
        lower.includes("hk") ||
        lower.includes("mo") ||
        lower.includes("hant");
      if (wantsTrad) {
        const trad = findAvailable(related, (l) => {
          const ll = l.toLowerCase();
          return (
            ll === "zh-tw" ||
            ll.includes("hant") ||
            ll === "zh-hk" ||
            ll === "zh-mo"
          );
        });
        if (trad) return trad as AppLocale;
      }
      const hans = findAvailable(
        related,
        (l) => l === "zh-CN" || /hans/i.test(l) || l.toLowerCase() === "zh",
      );
      if (hans) return hans as AppLocale;
    }

    if (lang === "en") {
      const us = findAvailable(
        related,
        (l) => l === "en-US" || l.toLowerCase() === "en",
      );
      if (us) return us as AppLocale;
    }

    const base = findAvailable(related, (l) => l.toLowerCase() === lang);
    if (base) return base as AppLocale;
    return related[0] as AppLocale;
  }

  return defaultLocale;
}

export function parseReadyLocalesCookie(
  value: string | null | undefined,
): AppLocale[] {
  if (!value) return [];
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  return decoded
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is AppLocale => Boolean(s) && isAppLocale(s));
}

export function availableUiLocalesFromCookie(
  readyCookie: string | null | undefined,
): AppLocale[] {
  const ready = parseReadyLocalesCookie(readyCookie);
  return Array.from(new Set<AppLocale>([...fixedLocales, ...ready]));
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  return null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
}

/** Sync generated (non-fixed) ready locales for middleware negotiation. */
export function syncReadyUiLocalesCookie(locales: readonly string[]) {
  const dynamic = locales.filter(
    (l) => isAppLocale(l) && !(fixedLocales as readonly string[]).includes(l),
  );
  writeCookie(READY_UI_LOCALES_COOKIE, dynamic.join(","));
}

export function setExplicitUiLocaleCookie(locale: string) {
  if (!isAppLocale(locale)) return;
  writeCookie(EXPLICIT_UI_LOCALE_COOKIE, locale);
}

export function getExplicitUiLocaleCookie(): AppLocale | null {
  const raw = readCookie(EXPLICIT_UI_LOCALE_COOKIE);
  if (!raw) return null;
  try {
    const value = decodeURIComponent(raw);
    return isAppLocale(value) ? value : null;
  } catch {
    return isAppLocale(raw) ? raw : null;
  }
}

export function browserLanguagesHeader(): string {
  if (typeof navigator === "undefined") return "";
  if (navigator.languages?.length) return navigator.languages.join(",");
  return navigator.language || "";
}

import { defaultLocale, fixedLocales } from "../../i18n/config";

export const DEFAULT_SITE_URL = "https://translator.kinolin.com";

export function getSiteOrigin(
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
) {
  return new URL(siteUrl).origin;
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function buildLocaleUrl(
  locale: string,
  pathname = "",
  siteUrl?: string,
) {
  return `${getSiteOrigin(siteUrl)}/${locale}${normalizePathname(pathname)}`;
}

export function buildLocaleAlternates(pathname = "", siteUrl?: string) {
  return {
    ...Object.fromEntries(
      fixedLocales.map((locale) => [
        locale,
        buildLocaleUrl(locale, pathname, siteUrl),
      ]),
    ),
    "x-default": buildLocaleUrl(defaultLocale, pathname, siteUrl),
  };
}

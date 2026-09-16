import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isAppLocale, locales } from "./i18n/config";
import {
  availableUiLocalesFromCookie,
  EXPLICIT_UI_LOCALE_COOKIE,
  READY_UI_LOCALES_COOKIE,
  resolveBrowserUiLocale,
} from "./i18n/resolve-ui-locale";

const handleI18nRouting = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
  // Keep the full generated locale catalog out of the HTTP Link header.
  // Page metadata still publishes alternates for the built-in locales.
  alternateLinks: false,
  // Accept-Language is handled below so we can include user-generated packs
  // (via cookie) and fall back to en-US when nothing matches.
  localeDetection: false,
});

function localeFromPathname(pathname: string): string | undefined {
  const segment = pathname.split("/")[1];
  if (segment && isAppLocale(segment)) return segment;
  return undefined;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = localeFromPathname(pathname);

  if (!pathLocale) {
    const available = availableUiLocalesFromCookie(
      request.cookies.get(READY_UI_LOCALES_COOKIE)?.value,
    );
    const explicitRaw = request.cookies.get(EXPLICIT_UI_LOCALE_COOKIE)?.value;
    const explicit =
      explicitRaw && isAppLocale(explicitRaw) ? explicitRaw : null;
    const locale =
      explicit && available.includes(explicit)
        ? explicit
        : resolveBrowserUiLocale(
            request.headers.get("accept-language"),
            available,
          );

    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return handleI18nRouting(request);
}

export const config = {
  // Do not match /_next or static files — avoids chunk 404s under locale routes.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export default function middleware(request: Request) {
  return intlMiddleware(request as never);
}

export const config = {
  matcher: ["/", "/(zh-CN|en-US)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};

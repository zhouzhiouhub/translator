import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/config";

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  // Do not match /_next or static files — avoids chunk 404s under locale routes.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

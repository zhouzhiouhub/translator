import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/config";

const localePattern = locales.join("|");

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/",
    `/(${localePattern})/:path*`,
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

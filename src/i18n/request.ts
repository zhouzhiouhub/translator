import { getRequestConfig } from "next-intl/server";
import {
  defaultLocale,
  isAppLocale,
  isFixedLocale,
} from "./config";

async function loadMessages(locale: string) {
  if (isFixedLocale(locale)) {
    return (await import(`../../messages/${locale}.json`)).default;
  }
  // Dynamic route locales: SSR uses zh-CN; client overrides from cache.
  return (await import(`../../messages/${defaultLocale}.json`)).default;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !isAppLocale(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});

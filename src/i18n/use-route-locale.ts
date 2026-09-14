"use client";

import { useParams } from "next/navigation";
import { locales, type AppLocale, defaultLocale } from "@/i18n/config";

/** URL/route locale (zh-CN | en-US), independent of dynamic UI override. */
export function useRouteLocale(): AppLocale {
  const params = useParams();
  const raw = params?.locale;
  const locale = Array.isArray(raw) ? raw[0] : raw;
  if (locale && (locales as readonly string[]).includes(locale)) {
    return locale as AppLocale;
  }
  return defaultLocale;
}

"use client";

import { useParams } from "next/navigation";
import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/app-locale";

/** Locale segment from the URL (`/ru/...` → `ru`). */
export function useRouteLocale(): AppLocale {
  const params = useParams();
  const raw = params?.locale;
  const locale = Array.isArray(raw) ? raw[0] : raw;
  if (locale && isAppLocale(locale)) {
    return locale;
  }
  return defaultLocale;
}

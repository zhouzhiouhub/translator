import { hashString } from "./hash";
import type { UiLocale } from "@/i18n/ui-locales";

export const LOCALE_PACK_PROMPT_VERSION = "v1";

const STORAGE_PREFIX = "kinolin.localePack.";

export interface CachedLocalePack {
  locale: UiLocale;
  messages: Record<string, unknown>;
  sourceVersionHash: string;
  promptVersion: string;
  createdAt: number;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function computeSourceVersionHash(sourceMessages: Record<string, unknown>): string {
  return hashString(JSON.stringify(sourceMessages));
}

export function packCacheKey(
  locale: string,
  sourceVersionHash: string,
  promptVersion = LOCALE_PACK_PROMPT_VERSION,
): string {
  return `${STORAGE_PREFIX}${locale}.${sourceVersionHash}.${promptVersion}`;
}

export async function loadLocalePack(
  locale: string,
  sourceVersionHash: string,
): Promise<CachedLocalePack | null> {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(
      packCacheKey(locale, sourceVersionHash, LOCALE_PACK_PROMPT_VERSION),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLocalePack;
    if (
      parsed.locale !== locale ||
      parsed.sourceVersionHash !== sourceVersionHash ||
      parsed.promptVersion !== LOCALE_PACK_PROMPT_VERSION ||
      !parsed.messages ||
      typeof parsed.messages !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveLocalePack(pack: CachedLocalePack): Promise<void> {
  if (!canUseStorage()) return;
  localStorage.setItem(
    packCacheKey(pack.locale, pack.sourceVersionHash, pack.promptVersion),
    JSON.stringify(pack),
  );
}

export async function hasLocalePack(
  locale: string,
  sourceVersionHash: string,
): Promise<boolean> {
  const pack = await loadLocalePack(locale, sourceVersionHash);
  return pack !== null;
}

/** Best-effort: find any cached pack for locale ignoring hash (for status display). */
export async function findAnyCachedPack(
  locale: string,
): Promise<CachedLocalePack | null> {
  if (!canUseStorage()) return null;
  const prefix = `${STORAGE_PREFIX}${locale}.`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CachedLocalePack;
      if (parsed.locale === locale && parsed.messages) return parsed;
    } catch {
      /* skip */
    }
  }
  return null;
}

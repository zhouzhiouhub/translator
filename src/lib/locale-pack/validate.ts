import {
  flattenKeys,
  localeKeysMatch,
  placeholdersMatch,
} from "@/lib/validation/placeholders";

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function setByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    const next = cur[p];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

export interface LocalePackValidation {
  messages: Record<string, unknown>;
  warnings: string[];
  failedKeys: string[];
}

/**
 * Ensure key set matches source; restore missing keys from source;
 * flag placeholder mismatches (restore source for those keys).
 */
export function validateAndRepairLocalePack(
  source: Record<string, unknown>,
  generated: Record<string, unknown>,
): LocalePackValidation {
  const warnings: string[] = [];
  const failedKeys: string[] = [];
  const messages: Record<string, unknown> = structuredClone(generated);

  const { missing, extra } = localeKeysMatch(source, messages);
  for (const key of missing) {
    const srcVal = getByPath(source, key);
    setByPath(messages, key, srcVal);
    failedKeys.push(key);
    warnings.push(`Missing key restored from source: ${key}`);
  }
  for (const key of extra) {
    warnings.push(`Extra key ignored: ${key}`);
  }

  for (const key of flattenKeys(source)) {
    const srcVal = getByPath(source, key);
    const tgtVal = getByPath(messages, key);
    if (typeof srcVal === "string" && typeof tgtVal === "string") {
      if (!placeholdersMatch(srcVal, tgtVal)) {
        failedKeys.push(key);
        warnings.push(`Placeholder mismatch: ${key}`);
        setByPath(messages, key, srcVal);
      }
    }
  }

  return { messages, warnings, failedKeys: [...new Set(failedKeys)] };
}

/** Ratio of leaf strings that differ from the source catalog. */
export function translationCoverage(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
): { total: number; changed: number; ratio: number } {
  const keys = flattenKeys(source);
  let total = 0;
  let changed = 0;
  for (const key of keys) {
    const srcVal = getByPath(source, key);
    const tgtVal = getByPath(target, key);
    if (typeof srcVal !== "string") continue;
    total += 1;
    if (typeof tgtVal === "string" && tgtVal.trim() !== srcVal.trim()) {
      changed += 1;
    }
  }
  return { total, changed, ratio: total === 0 ? 0 : changed / total };
}

/**
 * Parse model output into a message catalog object.
 * Unwraps common wrappers (messages / sourceMessages / translatedMessages).
 */
export function parseLocaleJson(text: string): Record<string, unknown> {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Locale pack response is not a JSON object");
  }
  return unwrapLocaleObject(parsed as Record<string, unknown>);
}

function unwrapLocaleObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const wrappers = [
    "messages",
    "translatedMessages",
    "sourceMessages",
    "localePack",
    "catalog",
  ] as const;

  for (const key of wrappers) {
    const inner = obj[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const record = inner as Record<string, unknown>;
      // Prefer unwrapping when outer looks like a response envelope.
      const outerKeys = Object.keys(obj);
      if (
        outerKeys.includes("sourceLocale") ||
        outerKeys.includes("targetLocale") ||
        outerKeys.includes("referenceMessages") ||
        (outerKeys.length <= 4 && !obj.nav && !obj.common)
      ) {
        return unwrapLocaleObject(record);
      }
    }
  }
  return obj;
}

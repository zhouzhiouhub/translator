/**
 * Placeholder / variable integrity checks for locale packs and translations.
 * Phase 1: rules ready; Phase 2 locale agent reuses these.
 */

const PLACEHOLDER_PATTERNS = [
  /\{\{[\w.]+\}\}/g, // mustache
  /\{[\w]+(?:,[^}]+)?\}/g, // single brace / ICU-ish
  /%[sdif]/g, // printf simple
  /%\\?\d*\\.?\\d*[sdf]/g,
  /<\/?\d+>/g, // rich-text markers <0></0>
];

export function extractPlaceholders(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      found.add(match[0]);
    }
  }
  return [...found].sort();
}

export function placeholdersMatch(source: string, target: string): boolean {
  const a = extractPlaceholders(source);
  const b = extractPlaceholders(target);
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function flattenKeys(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

export function localeKeysMatch(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
): { ok: boolean; missing: string[]; extra: string[] } {
  const s = new Set(flattenKeys(source));
  const t = new Set(flattenKeys(target));
  const missing = [...s].filter((k) => !t.has(k));
  const extra = [...t].filter((k) => !s.has(k));
  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
}

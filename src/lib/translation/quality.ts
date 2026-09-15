import { getLanguage, languageLabel } from "@/i18n/languages";

/**
 * Distilled from repo-root `Prompt.txt` (product quality rules).
 * Keep prompts compact for BYOK cost/latency; full narrative stays in Prompt.txt.
 */
export const TRANSLATION_PROMPT_VERSION = "prompt.txt-v1-distilled";

const CORE_RULES = `Core rules (Kinolin Translator / Prompt.txt):
- Accuracy first: keep facts, negation, modality, causality, quantities, units. Never invent or drop meaning.
- Natural phrasing for native readers — not word-for-word calque — without changing degree or intent.
- Preserve tone/register (formal, casual, business, technical, academic, humorous, etc.) unless a style override is given.
- Terminology: use standard domain terms; keep product/tech names (React, Next.js, API, HTTP…) and official brand names; do not invent brand translations.
- Never translate: source code, identifiers, URLs, emails, file paths, config keys. Translate only natural-language parts (comments, docs, UI copy).
- Preserve numbers, dates, currency amounts/symbols, Markdown/HTML structure, lists, tables, code fences, and emoji.
- Prefer retaining ambiguity when the source is ambiguous; do not invent gender/roles/relations.
- Priority: accuracy > completeness > context fit > naturalness > style polish.`;

/** Full label for AI prompts — codes alone (e.g. `th`) are often ignored by models. */
export function formatTargetLanguageForPrompt(code: string): string {
  const lang = getLanguage(code);
  if (!lang) return code;
  return `${lang.nameEn} / ${lang.nameZh} (${lang.code})`;
}

function styleDirective(style?: string): string {
  if (!style || style === "default" || style === "custom") {
    return "Mode: ordinary — natural, accurate translation only.";
  }
  const map: Record<string, string> = {
    natural: "Mode: natural — fluent native phrasing.",
    casual: "Mode: spoken/casual — concise, like real chat.",
    business: "Mode: business — professional, polite, clear; avoid slang.",
    formal: "Mode: formal — elevated register.",
    technical: "Mode: technical — precise terms; keep code and tech names.",
    academic: "Mode: academic — formal, rigorous; avoid colloquialisms.",
    localized:
      "Mode: localization — sound native to product/UI readers in the target locale.",
  };
  return map[style] ?? `Mode: ${style}.`;
}

const JSON_OUTPUT_RULE = `Output format (mandatory):
Return ONLY valid JSON (no markdown fences, no preface):
{"detectedSourceLanguage":"<BCP-47-like code from catalog, e.g. zh-CN, en, ja>","translation":"<translated text only>"}
Detect the source language of the user text. The translation field must be entirely in the target language.`;

/** When set, replaces Prompt.txt defaults entirely (does not stack). */
function normalizedCustomPrompt(customPrompt?: string): string | undefined {
  const instructions = customPrompt?.trim();
  return instructions || undefined;
}

export function defaultTranslateSystemPrompt(
  targetCode: string,
  style?: string,
  customPrompt?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const custom = normalizedCustomPrompt(customPrompt);

  if (custom) {
    return `You are Kinolin Translator.

${custom}

Translate into: ${label}.
${styleDirective(style)}

${JSON_OUTPUT_RULE}`;
  }

  return `You are Kinolin Translator, a professional AI translation agent.

${CORE_RULES}

${styleDirective(style)}
Translate into: ${label}.

${JSON_OUTPUT_RULE}`;
}

export function strongTranslateSystemPrompt(
  targetCode: string,
  style?: string,
  customPrompt?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const custom = normalizedCustomPrompt(customPrompt);

  if (custom) {
    return `You are Kinolin Translator.

${custom}

Translate the user text into ${label}.
You MUST write the translation field ONLY in the target language — never leave source-language wording unchanged.
${styleDirective(style)}

${JSON_OUTPUT_RULE}`;
  }

  return `You are Kinolin Translator. ${styleDirective(style)}
Translate the user text into ${label}.
You MUST write the translation field ONLY in the target language — never leave source-language wording unchanged.
Do not copy Chinese (or other source) characters when the target is a different language.
Preserve Markdown structure, lists, and code fences; do not translate code.

${JSON_OUTPUT_RULE}`;
}

export function documentTranslateSystemPrompt(
  targetCode: string,
  style?: string,
  customPrompt?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const custom = normalizedCustomPrompt(customPrompt);

  if (custom) {
    return `You are Kinolin Translator translating a document segment into ${label}.

${custom}

${styleDirective(style)}
Output ONLY the translated segment — plain text, no JSON, no preface.`;
  }

  return `You are Kinolin Translator translating a document segment into ${label}.

${CORE_RULES}

${styleDirective(style)}
Preserve Markdown structure, headings, lists, links, and inline formatting.
Do NOT translate fenced code blocks or inline code; keep them verbatim.
You MUST write the output in the target language — do not leave source-language text unchanged.
Output ONLY the translated segment — plain text, no JSON, no preface.`;
}

function normalizeComparable(text: string): string {
  return text.replace(/\s+/g, "").trim();
}

function hasHan(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function hasThai(text: string): boolean {
  return /[\u0e00-\u0e7f]/i.test(text);
}

function hasCyrillic(text: string): boolean {
  return /[\u0400-\u04ff]/.test(text);
}

function hasJapaneseKana(text: string): boolean {
  return /[\u3040-\u30ff]/.test(text);
}

function hasHangul(text: string): boolean {
  return /[\uac00-\ud7af]/.test(text);
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06ff]/.test(text);
}

function isChineseTarget(code: string): boolean {
  const c = code.toLowerCase();
  return c === "zh" || c.startsWith("zh-") || c === "yue";
}

/**
 * Detect when the model likely returned the source unchanged
 * (common failure with short language codes like `th`).
 */
export function looksUntranslated(
  source: string,
  translated: string,
  targetCode: string,
): boolean {
  const src = normalizeComparable(source);
  const out = normalizeComparable(translated);
  if (!out) return true;

  if (src === out && !isChineseTarget(targetCode)) {
    return true;
  }

  const code = targetCode.toLowerCase();

  if (code === "th" || code.startsWith("th-")) {
    return !hasThai(translated) && hasHan(translated);
  }
  if (code === "ru" || code.startsWith("ru-") || code === "uk" || code === "be") {
    return !hasCyrillic(translated) && hasHan(translated);
  }
  if (code === "ja" || code.startsWith("ja-")) {
    return !hasJapaneseKana(translated) && hasHan(translated) && src === out;
  }
  if (code === "ko" || code.startsWith("ko-")) {
    return !hasHangul(translated) && hasHan(translated);
  }
  if (code === "ar" || code.startsWith("ar-") || code === "fa" || code === "ur") {
    return !hasArabic(translated) && hasHan(translated);
  }
  if (
    code === "en" ||
    code.startsWith("en-") ||
    code === "fr" ||
    code === "de" ||
    code === "es" ||
    code === "it" ||
    code === "pt" ||
    code.startsWith("pt-")
  ) {
    if (hasHan(translated) && !/[A-Za-z]{3,}/.test(translated)) return true;
    if (src === out) return true;
  }

  return false;
}

/** Lightweight script-based guess when the model omits detectedSourceLanguage. */
export function guessSourceLanguage(text: string): string | undefined {
  const sample = text.slice(0, 2000);
  if (!sample.trim()) return undefined;

  if (hasJapaneseKana(sample)) return "ja";
  if (hasHangul(sample)) return "ko";
  if (hasThai(sample)) return "th";
  if (hasArabic(sample)) return "ar";
  if (hasCyrillic(sample)) return "ru";
  if (hasHan(sample)) return "zh-CN";
  if (/[A-Za-z]{3,}/.test(sample)) return "en";
  return undefined;
}

function stripFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function normalizeDetectedCode(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const code = raw.trim();
  if (!code || code.toLowerCase() === "auto" || code === "unknown") {
    return undefined;
  }
  if (getLanguage(code)) return code;
  const lower = code.toLowerCase();
  if (getLanguage(lower)) return lower;
  // Common aliases
  if (lower === "zh" || lower === "zh-hans" || lower === "chinese") return "zh-CN";
  if (lower === "zh-hant" || lower === "zh-tw") return "zh-TW";
  if (lower === "en-us" || lower === "english") return "en";
  if (lower === "jp" || lower === "japanese") return "ja";
  if (lower === "kr" || lower === "korean") return "ko";
  return code;
}

/**
 * Parse model output that should be JSON `{ detectedSourceLanguage, translation }`,
 * with plain-text fallback for stubborn models.
 */
export function parseTranslateModelOutput(
  raw: string,
  sourceText: string,
): { text: string; detectedSourceLanguage?: string } {
  const cleaned = stripFence(raw);
  try {
    const parsed = JSON.parse(cleaned) as {
      detectedSourceLanguage?: unknown;
      translation?: unknown;
      text?: unknown;
    };
    const translation =
      typeof parsed.translation === "string"
        ? parsed.translation
        : typeof parsed.text === "string"
          ? parsed.text
          : "";
    if (translation.trim()) {
      return {
        text: translation.trim(),
        detectedSourceLanguage:
          normalizeDetectedCode(parsed.detectedSourceLanguage) ??
          guessSourceLanguage(sourceText),
      };
    }
  } catch {
    // fall through
  }

  // Soft extract: {"translation":"..."} buried in prose
  const soft = cleaned.match(
    /\{\s*"detectedSourceLanguage"\s*:\s*"([^"]*)"\s*,\s*"translation"\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/,
  );
  if (soft) {
    const unescaped = soft[2]!.replace(/\\n/g, "\n").replace(/\\"/g, '"');
    return {
      text: unescaped.trim(),
      detectedSourceLanguage:
        normalizeDetectedCode(soft[1]) ?? guessSourceLanguage(sourceText),
    };
  }

  return {
    text: cleaned,
    detectedSourceLanguage: guessSourceLanguage(sourceText),
  };
}

/** For logging / errors — human label. */
export function targetLanguageDisplay(code: string): string {
  return languageLabel(code, "both");
}

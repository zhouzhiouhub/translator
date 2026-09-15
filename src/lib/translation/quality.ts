import { getLanguage, languageLabel } from "@/i18n/languages";
import { TRANSLATION_POLICY } from "@/lib/translation/prompt.generated";

/**
 * Translation system prompts. The policy is generated from the root Prompt.txt
 * during the build so browser-side BYOK requests can use the same source.
 * - style `custom` + saved prompt → user prompt only (no Prompt.txt).
 * - style `custom` + empty prompt → simple accurate translation.
 * - other styles → Prompt.txt policy + simple accurate style mode.
 */
export const TRANSLATION_PROMPT_VERSION = "prompt-txt-v1";

/** Full label for AI prompts — codes alone (e.g. `th`) are often ignored by models. */
export function formatTargetLanguageForPrompt(code: string): string {
  const lang = getLanguage(code);
  if (!lang) return code;
  return `${lang.nameEn} / ${lang.nameZh} (${lang.code})`;
}

function styleDirective(style?: string): string {
  if (!style || style === "default" || style === "custom") {
    return "";
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
  const line = map[style] ?? `Mode: ${style}.`;
  return `${line}\n`;
}

const JSON_OUTPUT_RULE = `Output format (mandatory):
Return ONLY valid JSON (no markdown fences, no preface):
{"detectedSourceLanguage":"<BCP-47-like code from catalog, e.g. zh-CN, en, ja>","translation":"<translated text only>"}
Detect the source language of the user text. The translation field must be entirely in the target language.`;

function normalizedCustomPrompt(customPrompt?: string): string | undefined {
  const instructions = customPrompt?.trim();
  return instructions || undefined;
}

function simpleAccuratePrompt(targetLabel: string, style?: string): string {
  const mode = styleDirective(style);
  return `${TRANSLATION_POLICY}

You are a translator. Translate the user text into ${targetLabel} accurately.
Preserve meaning; do not add explanations.
${mode}Output only the required JSON.

${JSON_OUTPUT_RULE}`;
}

function simpleAccurateDocumentPrompt(
  targetLabel: string,
  style?: string,
): string {
  const mode = styleDirective(style);
  return `${TRANSLATION_POLICY}

You are a translator. Translate this document segment into ${targetLabel} accurately.
Preserve meaning and basic structure; do not add explanations.
${mode}Output ONLY the translated segment — plain text, no JSON, no preface.`;
}

export function defaultTranslateSystemPrompt(
  targetCode: string,
  style?: string,
  customPrompt?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const custom =
    style === "custom" ? normalizedCustomPrompt(customPrompt) : undefined;

  if (custom) {
    return `You are Kinolin Translator.

${custom}

Translate into: ${label}.

${JSON_OUTPUT_RULE}`;
  }

  // custom style with empty prompt, or any preset style → simple accurate
  return simpleAccuratePrompt(
    label,
    style === "custom" ? undefined : style,
  );
}

export function strongTranslateSystemPrompt(
  targetCode: string,
  style?: string,
  customPrompt?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const custom =
    style === "custom" ? normalizedCustomPrompt(customPrompt) : undefined;

  if (custom) {
    return `You are Kinolin Translator.

${custom}

Translate the user text into ${label}.
You MUST write the translation field ONLY in the target language — never leave source-language wording unchanged.

${JSON_OUTPUT_RULE}`;
  }

  const mode = style === "custom" ? "" : styleDirective(style);
  return `${TRANSLATION_POLICY}

You are a translator. Translate the user text into ${label} accurately.
You MUST write the translation field ONLY in the target language — never leave source-language wording unchanged.
Do not add explanations.
${mode}
${JSON_OUTPUT_RULE}`;
}

export function documentTranslateSystemPrompt(
  targetCode: string,
  style?: string,
  customPrompt?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const custom =
    style === "custom" ? normalizedCustomPrompt(customPrompt) : undefined;

  if (custom) {
    return `You are Kinolin Translator translating a document segment into ${label}.

${custom}

Output ONLY the translated segment — plain text, no JSON, no preface.`;
  }

  return simpleAccurateDocumentPrompt(
    label,
    style === "custom" ? undefined : style,
  );
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

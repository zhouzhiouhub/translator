import { getLanguage, languageLabel } from "@/i18n/languages";

/** Full label for AI prompts — codes alone (e.g. `th`) are often ignored by models. */
export function formatTargetLanguageForPrompt(code: string): string {
  const lang = getLanguage(code);
  if (!lang) return code;
  return `${lang.nameEn} / ${lang.nameZh} (${lang.code})`;
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
    // Latin targets: still mostly Han means not translated
    if (hasHan(translated) && !/[A-Za-z]{3,}/.test(translated)) return true;
    if (src === out) return true;
  }

  return false;
}

export function strongTranslateSystemPrompt(
  targetCode: string,
  style?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const styleHint =
    style && style !== "default" ? ` Preferred style: ${style}.` : "";
  return `You are Kinolin Translator.${styleHint}
Translate the user text into ${label}.
You MUST output ONLY in the target language — never leave the text in the source language.
Do not copy Chinese (or other source) characters when the target is a different language.
Preserve Markdown structure, lists, and code fences; do not translate code.
Output only the translation — no preface.`;
}

export function defaultTranslateSystemPrompt(
  targetCode: string,
  style?: string,
): string {
  const label = formatTargetLanguageForPrompt(targetCode);
  const styleHint =
    style && style !== "default" ? ` Style: ${style}.` : "";
  return `You are Kinolin Translator. Translate accurately into ${label}.${styleHint} Output only the translation in the target language.`;
}

/** For logging / errors — human label. */
export function targetLanguageDisplay(code: string): string {
  return languageLabel(code, "both");
}

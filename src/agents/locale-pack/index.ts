import zhCN from "../../../messages/zh-CN.json";
import enUS from "../../../messages/en-US.json";
import { createAIProvider } from "@/ai/client/factory";
import type { AIConfig } from "@/types/translation";
import type { LocaleParams, LocaleResult } from "@/ai/types";
import { checkAiConfig } from "@/agents/translator/config";
import { throwIfAborted } from "@/lib/abort";
import {
  computeSourceVersionHash,
  LOCALE_PACK_PROMPT_VERSION,
  loadLocalePack,
  saveLocalePack,
} from "@/lib/locale-pack/cache";
import {
  parseLocaleJson,
  translationCoverage,
  validateAndRepairLocalePack,
} from "@/lib/locale-pack/validate";
import { isFixedUiLocale, type UiLocale } from "@/i18n/ui-locales";
import { getLanguage } from "@/i18n/languages";

export const SOURCE_MESSAGES = zhCN as Record<string, unknown>;
export const REFERENCE_MESSAGES = enUS as Record<string, unknown>;

/** Minimum share of leaf strings that must differ from zh-CN. */
const MIN_COVERAGE_RATIO = 0.35;

export function getSourceVersionHash(): string {
  return computeSourceVersionHash(SOURCE_MESSAGES);
}

const LOCALE_SYSTEM_PROMPT = `You are Kinolin Locale Pack Agent.
Translate a next-intl JSON message namespace into the target language.
Rules:
1. Return ONLY a JSON object — no markdown fences, no commentary.
2. Keep the exact same key structure and key names.
3. Translate every string value into the target language (do not leave Chinese).
4. Preserve placeholders exactly: {count}, {max}, {provider}, {model}, {key}, {style}, {duration}, {{name}}, <0></0>, %s, %d.
5. Keep the brand token "Kinolin" unchanged.
6. Output must be valid JSON.`;

function languageName(locale: string): string {
  return getLanguage(locale)?.nameEn ?? locale;
}

async function translateJsonChunk(
  aiConfig: AIConfig,
  targetLocale: string,
  chunk: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  throwIfAborted(signal);
  const provider = createAIProvider(aiConfig);
  const lang = languageName(targetLocale);
  const result = await provider.translate({
    text: `Translate all string values in this JSON into ${lang} (${targetLocale}).\nReturn ONLY the translated JSON object with identical keys.\n\n${JSON.stringify(chunk)}`,
    targetLanguage: targetLocale,
    systemPrompt: LOCALE_SYSTEM_PROMPT,
    signal,
  });
  return parseLocaleJson(result.text);
}

/**
 * Generate pack namespace-by-namespace so models don't echo the huge payload.
 */
async function generateViaChunks(
  aiConfig: AIConfig,
  params: LocaleParams,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  throwIfAborted(signal);
  const provider = createAIProvider(aiConfig);
  if (provider.generateLocale) {
    const result = await provider.generateLocale(params);
    return result.messages;
  }

  const merged: Record<string, unknown> = {};
  for (const [ns, value] of Object.entries(params.sourceMessages)) {
    throwIfAborted(signal);
    const chunk = { [ns]: value };
    const translated = await translateJsonChunk(
      aiConfig,
      params.targetLocale,
      chunk,
      signal,
    );
    if (translated[ns] !== undefined) {
      merged[ns] = translated[ns];
    } else if (Object.keys(translated).length > 0) {
      // Model returned the namespace contents without the wrapper key.
      merged[ns] = translated;
    } else {
      merged[ns] = value;
    }
  }
  return merged;
}

export interface RunLocalePackInput {
  targetLocale: UiLocale;
  aiConfig?: AIConfig | null;
  /** Skip cache and force regeneration */
  force?: boolean;
  signal?: AbortSignal;
}

export async function runLocalePackGeneration(
  input: RunLocalePackInput,
): Promise<LocaleResult> {
  const { targetLocale, aiConfig, force, signal } = input;
  throwIfAborted(signal);

  if (isFixedUiLocale(targetLocale)) {
    const messages =
      targetLocale === "en-US" ? REFERENCE_MESSAGES : SOURCE_MESSAGES;
    return {
      locale: targetLocale,
      messages,
      warnings: [],
      failedKeys: [],
    };
  }

  const check = checkAiConfig(aiConfig);
  if (!check.ok || !aiConfig) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const sourceVersionHash = getSourceVersionHash();
  if (!force) {
    const cached = await loadLocalePack(targetLocale, sourceVersionHash);
    if (cached) {
      const coverage = translationCoverage(SOURCE_MESSAGES, cached.messages);
      if (coverage.ratio >= MIN_COVERAGE_RATIO) {
        return {
          locale: targetLocale,
          messages: cached.messages,
          warnings: [],
          failedKeys: [],
        };
      }
      // Stale/bad cache (e.g. Chinese echo) — regenerate.
    }
  }

  const params: LocaleParams = {
    sourceLocale: "zh-CN",
    targetLocale,
    sourceMessages: SOURCE_MESSAGES,
    referenceMessages: REFERENCE_MESSAGES,
    glossary: { Kinolin: "Kinolin" },
    promptVersion: LOCALE_PACK_PROMPT_VERSION,
  };

  const raw = await generateViaChunks(aiConfig, params, signal);
  throwIfAborted(signal);
  const repaired = validateAndRepairLocalePack(SOURCE_MESSAGES, raw);
  const coverage = translationCoverage(SOURCE_MESSAGES, repaired.messages);

  if (coverage.ratio < MIN_COVERAGE_RATIO) {
    throw new Error(
      `LOCALE_PACK_LOW_COVERAGE:${Math.round(coverage.ratio * 100)}`,
    );
  }

  await saveLocalePack({
    locale: targetLocale,
    messages: repaired.messages,
    sourceVersionHash,
    promptVersion: LOCALE_PACK_PROMPT_VERSION,
    createdAt: Date.now(),
  });

  return {
    locale: targetLocale,
    messages: repaired.messages,
    warnings: [
      ...repaired.warnings,
      `coverage ${coverage.changed}/${coverage.total}`,
    ],
    failedKeys: repaired.failedKeys,
  };
}

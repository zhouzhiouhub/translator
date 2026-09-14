import zhCN from "../../../messages/zh-CN.json";
import enUS from "../../../messages/en-US.json";
import { createAIProvider } from "@/ai/client/factory";
import type { AIConfig } from "@/types/translation";
import type { LocaleParams, LocaleResult } from "@/ai/types";
import { checkAiConfig } from "@/agents/translator";
import {
  computeSourceVersionHash,
  LOCALE_PACK_PROMPT_VERSION,
  loadLocalePack,
  saveLocalePack,
} from "@/lib/locale-pack/cache";
import {
  parseLocaleJson,
  validateAndRepairLocalePack,
} from "@/lib/locale-pack/validate";
import { isFixedUiLocale, type UiLocale } from "@/i18n/ui-locales";

export const SOURCE_MESSAGES = zhCN as Record<string, unknown>;
export const REFERENCE_MESSAGES = enUS as Record<string, unknown>;

export function getSourceVersionHash(): string {
  return computeSourceVersionHash(SOURCE_MESSAGES);
}

const LOCALE_SYSTEM_PROMPT = `You are Kinolin Locale Pack Agent.
Translate a next-intl JSON message catalog into the target locale.
Rules:
1. Return ONLY a single JSON object — no markdown, no commentary.
2. Keep the exact same key structure and key names as the source.
3. Translate string values only.
4. Preserve placeholders exactly: {{name}}, {count}, {max}, {provider}, {model}, {key}, {style}, {duration}, <0></0>, %s, %d, ICU segments.
5. Keep brand name "Kinolin" unchanged unless it appears inside a longer sentence where localization is natural; never invent new keys.
6. Output must be valid JSON.`;

function buildLocaleUserPrompt(params: LocaleParams): string {
  const payload = {
    sourceLocale: params.sourceLocale,
    targetLocale: params.targetLocale,
    sourceMessages: params.sourceMessages,
    referenceMessages: params.referenceMessages,
    glossary: params.glossary ?? { Kinolin: "Kinolin" },
  };
  return `Translate sourceMessages into locale "${params.targetLocale}".
Use referenceMessages only as style/terminology hints when helpful.
Return the full translated JSON object with identical keys.

${JSON.stringify(payload)}`;
}

async function generateViaTranslate(
  aiConfig: AIConfig,
  params: LocaleParams,
): Promise<Record<string, unknown>> {
  const provider = createAIProvider(aiConfig);
  if (provider.generateLocale) {
    const result = await provider.generateLocale(params);
    return result.messages;
  }

  const result = await provider.translate({
    text: buildLocaleUserPrompt(params),
    targetLanguage: params.targetLocale,
    systemPrompt: LOCALE_SYSTEM_PROMPT,
  });
  return parseLocaleJson(result.text);
}

export interface RunLocalePackInput {
  targetLocale: UiLocale;
  aiConfig?: AIConfig | null;
  /** Skip cache and force regeneration */
  force?: boolean;
}

export async function runLocalePackGeneration(
  input: RunLocalePackInput,
): Promise<LocaleResult> {
  const { targetLocale, aiConfig, force } = input;

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
      return {
        locale: targetLocale,
        messages: cached.messages,
        warnings: [],
        failedKeys: [],
      };
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

  const raw = await generateViaTranslate(aiConfig, params);
  const repaired = validateAndRepairLocalePack(SOURCE_MESSAGES, raw);

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
    warnings: repaired.warnings,
    failedKeys: repaired.failedKeys,
  };
}

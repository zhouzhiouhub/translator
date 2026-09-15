import type { AIConfig, TranslateInput, TranslateResult } from "@/types/translation";
import { AITranslator } from "@/translation/ai/AITranslator";

export interface TranslateOrchestrationInput extends TranslateInput {
  aiConfig?: AIConfig | null;
}

export interface AiConfigCheck {
  ok: boolean;
  hasProvider: boolean;
  hasModel: boolean;
  hasKey: boolean;
  connectionOk: boolean | null;
}

export interface BatchTranslateProgress {
  current: number;
  total: number;
  targetLanguage: string;
}

export interface BatchTranslateResultItem extends TranslateResult {
  targetLanguage: string;
}

export interface BatchTranslateResult {
  results: BatchTranslateResultItem[];
  durationMs: number;
}

export function checkAiConfig(config?: AIConfig | null): AiConfigCheck {
  const hasProvider = Boolean(config?.provider);
  const hasModel = Boolean(config?.model?.trim());
  const hasKey = Boolean(config?.apiKey?.trim());
  const connectionOk =
    typeof config?.lastTestOk === "boolean" ? config.lastTestOk : null;
  const ok = hasProvider && hasModel && hasKey;
  return { ok, hasProvider, hasModel, hasKey, connectionOk };
}

/** Translation Agent — BYOK AI only. */
export async function runTranslation(
  input: TranslateOrchestrationInput,
): Promise<TranslateResult> {
  const check = checkAiConfig(input.aiConfig);
  if (!check.ok || !input.aiConfig) {
    throw new Error("AI_NOT_CONFIGURED");
  }
  const translator = new AITranslator(input.aiConfig);
  return translator.translate(input);
}

/** One source text → multiple target languages (sequential). */
export async function runBatchTranslation(input: {
  text: string;
  targetLanguages: string[];
  style?: TranslateInput["style"];
  sourceLanguage?: string;
  aiConfig?: AIConfig | null;
  onProgress?: (progress: BatchTranslateProgress) => void;
}): Promise<BatchTranslateResult> {
  const check = checkAiConfig(input.aiConfig);
  if (!check.ok || !input.aiConfig) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const uniqueTargets = [
    ...new Set(input.targetLanguages.map((c) => c.trim()).filter(Boolean)),
  ];
  if (uniqueTargets.length === 0) {
    throw new Error("NO_TARGETS");
  }

  const started = Date.now();
  const results: BatchTranslateResultItem[] = [];

  for (let i = 0; i < uniqueTargets.length; i++) {
    const targetLanguage = uniqueTargets[i]!;
    input.onProgress?.({
      current: i + 1,
      total: uniqueTargets.length,
      targetLanguage,
    });
    const one = await runTranslation({
      text: input.text,
      targetLanguage,
      style: input.style,
      sourceLanguage: input.sourceLanguage,
      aiConfig: input.aiConfig,
    });
    results.push({ ...one, targetLanguage });
  }

  return {
    results,
    durationMs: Date.now() - started,
  };
}

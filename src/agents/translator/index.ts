import type { AIConfig, TranslateInput, TranslateResult } from "@/types/translation";
import { isAbortError, throwIfAborted } from "@/lib/abort";
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

export type BatchItemStatus = "done" | "pending";

export interface BatchTranslateResultItem extends TranslateResult {
  targetLanguage: string;
  /** `pending` = cancelled before this target finished. */
  status: BatchItemStatus;
}

export interface BatchTranslateResult {
  results: BatchTranslateResultItem[];
  durationMs: number;
  cancelled?: boolean;
}

function pendingBatchItem(
  targetLanguage: string,
  style?: TranslateInput["style"],
): BatchTranslateResultItem {
  return {
    targetLanguage,
    text: "",
    durationMs: 0,
    status: "pending",
    style,
  };
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
  throwIfAborted(input.signal);
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
  customPrompt?: string;
  sourceLanguage?: string;
  aiConfig?: AIConfig | null;
  signal?: AbortSignal;
  onProgress?: (progress: BatchTranslateProgress) => void;
}): Promise<BatchTranslateResult> {
  throwIfAborted(input.signal);
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
    try {
      throwIfAborted(input.signal);
      input.onProgress?.({
        current: i + 1,
        total: uniqueTargets.length,
        targetLanguage,
      });
      const one = await runTranslation({
        text: input.text,
        targetLanguage,
        style: input.style,
        customPrompt: input.customPrompt,
        sourceLanguage: input.sourceLanguage,
        aiConfig: input.aiConfig,
        signal: input.signal,
      });
      results.push({ ...one, targetLanguage, status: "done" });
    } catch (err) {
      if (!isAbortError(err)) throw err;
      for (let j = i; j < uniqueTargets.length; j++) {
        results.push(pendingBatchItem(uniqueTargets[j]!, input.style));
      }
      return {
        results,
        durationMs: Date.now() - started,
        cancelled: true,
      };
    }
  }

  return {
    results,
    durationMs: Date.now() - started,
  };
}

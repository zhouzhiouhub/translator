import type { AIConfig, TranslateInput, TranslateResult } from "@/types/translation";
import { checkAiConfig, type BatchItemStatus } from "@/agents/translator/config";
import { isAbortError, throwIfAborted } from "@/lib/abort";
import { createConcurrencyLimiter } from "@/lib/concurrency";
import { AITranslator } from "@/translation/ai/AITranslator";

export { checkAiConfig } from "@/agents/translator/config";
export type { AiConfigCheck, BatchItemStatus } from "@/agents/translator/config";

export interface TranslateOrchestrationInput extends TranslateInput {
  aiConfig?: AIConfig | null;
}

export interface BatchTranslateProgress {
  current: number;
  total: number;
  targetLanguage: string;
}

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

/** One source text -> multiple target languages with a shared request limit. */
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
  const results: (BatchTranslateResultItem | undefined)[] = [];
  const limiter = createConcurrencyLimiter();
  const jobs = uniqueTargets.map((targetLanguage, i) =>
    (async () => {
      const one = await limiter.run(
        () => {
          input.onProgress?.({
            current: i + 1,
            total: uniqueTargets.length,
            targetLanguage,
          });
          return runTranslation({
            text: input.text,
            targetLanguage,
            style: input.style,
            customPrompt: input.customPrompt,
            sourceLanguage: input.sourceLanguage,
            aiConfig: input.aiConfig,
            signal: input.signal,
          });
        },
        input.signal,
      );
      results[i] = { ...one, targetLanguage, status: "done" };
    })(),
  );

  const settled = await Promise.allSettled(jobs);
  const failed = settled.find(
    (item): item is PromiseRejectedResult => item.status === "rejected",
  );
  if (failed && !isAbortError(failed.reason)) throw failed.reason;
  if (failed) {
    return {
      results: uniqueTargets.map(
        (targetLanguage, i) =>
          results[i] ?? pendingBatchItem(targetLanguage, input.style),
      ),
      durationMs: Date.now() - started,
      cancelled: true,
    };
  }

  return {
    results: results as BatchTranslateResultItem[],
    durationMs: Date.now() - started,
  };
}

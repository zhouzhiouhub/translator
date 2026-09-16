import { runTranslation } from "@/agents/translator";
import {
  checkAiConfig,
  type BatchItemStatus,
} from "@/agents/translator/config";
import { isAbortError, throwIfAborted } from "@/lib/abort";
import { createConcurrencyLimiter, type ConcurrencyLimiter } from "@/lib/concurrency";
import { chunkDocumentText } from "@/lib/document/chunk";
import { parseDocumentFile } from "@/lib/document/parse";
import type {
  DocumentTranslateProgress,
  ParsedDocument,
} from "@/lib/document/types";
import {
  documentTranslateSystemPrompt,
  guessSourceLanguage,
} from "@/lib/translation/quality";
import type { AIConfig, TranslationStyle } from "@/types/translation";

export interface DocumentTranslateInput {
  file: File;
  targetLanguage: string;
  style?: TranslationStyle;
  customPrompt?: string;
  aiConfig?: AIConfig | null;
  signal?: AbortSignal;
  onProgress?: (progress: DocumentTranslateProgress) => void;
}

export interface DocumentTranslateResult {
  parsed: ParsedDocument;
  text: string;
  chunks: number;
  targetLanguage: string;
  detectedSourceLanguage?: string;
  model?: string;
  style?: TranslationStyle;
  durationMs: number;
  /** `pending` = cancelled before this target finished. */
  status: BatchItemStatus;
}

export interface BatchDocumentTranslateInput {
  file: File;
  targetLanguages: string[];
  style?: TranslationStyle;
  customPrompt?: string;
  aiConfig?: AIConfig | null;
  signal?: AbortSignal;
  onProgress?: (progress: DocumentTranslateProgress) => void;
}

export interface BatchDocumentTranslateResult {
  parsed: ParsedDocument;
  results: DocumentTranslateResult[];
  durationMs: number;
  cancelled?: boolean;
}

function pendingDocumentResult(
  parsed: ParsedDocument,
  targetLanguage: string,
  chunks: number,
  style?: TranslationStyle,
): DocumentTranslateResult {
  return {
    parsed,
    text: "",
    chunks,
    targetLanguage,
    style,
    durationMs: 0,
    status: "pending",
  };
}

function documentSystemPrompt(
  targetLanguage: string,
  style?: TranslationStyle,
  customPrompt?: string,
): string {
  return documentTranslateSystemPrompt(targetLanguage, style, customPrompt);
}

async function translateParsedDocument(options: {
  parsed: ParsedDocument;
  chunks: ReturnType<typeof chunkDocumentText>;
  targetLanguage: string;
  style?: TranslationStyle;
  customPrompt?: string;
  aiConfig: AIConfig;
  languageIndex: number;
  languageTotal: number;
  signal?: AbortSignal;
  onProgress?: (progress: DocumentTranslateProgress) => void;
  limiter: ConcurrencyLimiter;
}): Promise<DocumentTranslateResult> {
  const {
    parsed,
    chunks,
    targetLanguage,
    style,
    customPrompt,
    aiConfig,
    languageIndex,
    languageTotal,
    signal,
    onProgress,
  } = options;

  const systemPrompt = documentSystemPrompt(
    targetLanguage,
    style,
    customPrompt,
  );
  const started = Date.now();
  const translatedParts: string[] = new Array(chunks.length);
  const chunkResults = await Promise.all(
    chunks.map(async (chunk, i) => {
      if (/^(`{3,}|~{3,})/.test(chunk.text.trim())) {
        throwIfAborted(signal);
        onProgress?.({
          phase: "translating",
          current: i + 1,
          total: chunks.length,
          languageIndex,
          languageTotal,
          targetLanguage,
        });
        translatedParts[i] = chunk.text;
        return undefined;
      }

      const result = await options.limiter.run(
        () => {
          onProgress?.({
            phase: "translating",
            current: i + 1,
            total: chunks.length,
            languageIndex,
            languageTotal,
            targetLanguage,
          });
          return runTranslation({
            text: chunk.text,
            targetLanguage,
            style,
            customPrompt,
            aiConfig,
            systemPrompt,
            signal,
          });
        },
        signal,
      );
      translatedParts[i] = result.text;
      return result;
    }),
  );
  const detectedSourceLanguage =
    chunkResults.find((result) => result?.detectedSourceLanguage)
      ?.detectedSourceLanguage ?? guessSourceLanguage(parsed.text);
  const model = chunkResults.find((result) => result?.model)?.model;

  return {
    parsed,
    text: translatedParts.join("\n\n"),
    chunks: chunks.length,
    targetLanguage,
    detectedSourceLanguage,
    model,
    style,
    durationMs: Date.now() - started,
    status: "done",
  };
}

export async function runDocumentTranslation(
  input: DocumentTranslateInput,
): Promise<DocumentTranslateResult> {
  const batch = await runBatchDocumentTranslation({
    file: input.file,
    targetLanguages: [input.targetLanguage],
    style: input.style,
    customPrompt: input.customPrompt,
    aiConfig: input.aiConfig,
    signal: input.signal,
    onProgress: input.onProgress,
  });
  return batch.results[0]!;
}

export async function runBatchDocumentTranslation(
  input: BatchDocumentTranslateInput,
): Promise<BatchDocumentTranslateResult> {
  throwIfAborted(input.signal);
  const check = checkAiConfig(input.aiConfig);
  if (!check.ok || !input.aiConfig) {
    throw new Error("AI_NOT_CONFIGURED");
  }
  const aiConfig = input.aiConfig;

  const uniqueTargets = [
    ...new Set(input.targetLanguages.map((c) => c.trim()).filter(Boolean)),
  ];
  if (uniqueTargets.length === 0) {
    throw new Error("DOCUMENT_NO_TARGETS");
  }

  input.onProgress?.({ phase: "parsing", current: 0, total: 0 });
  const parsed = await parseDocumentFile(input.file);
  throwIfAborted(input.signal);
  const chunks = chunkDocumentText(parsed.text);
  if (chunks.length === 0) {
    throw new Error("DOCUMENT_EMPTY");
  }

  const started = Date.now();
  const results: (DocumentTranslateResult | undefined)[] = [];
  const limiter = createConcurrencyLimiter();
  const jobs = uniqueTargets.map((targetLanguage, li) =>
    (async () => {
      const one = await translateParsedDocument({
        parsed,
        chunks,
        targetLanguage,
        style: input.style,
        customPrompt: input.customPrompt,
        aiConfig,
        languageIndex: li + 1,
        languageTotal: uniqueTargets.length,
        signal: input.signal,
        onProgress: input.onProgress,
        limiter,
      });
      results[li] = one;
    })(),
  );
  const settled = await Promise.allSettled(jobs);
  const failed = settled.find(
    (item): item is PromiseRejectedResult => item.status === "rejected",
  );
  if (failed && !isAbortError(failed.reason)) throw failed.reason;
  if (failed) {
    return {
      parsed,
      results: uniqueTargets.map(
        (targetLanguage, i) =>
          results[i] ??
          pendingDocumentResult(
            parsed,
            targetLanguage,
            chunks.length,
            input.style,
          ),
      ),
      durationMs: Date.now() - started,
      cancelled: true,
    };
  }

  input.onProgress?.({
    phase: "done",
    current: chunks.length,
    total: chunks.length,
    languageIndex: uniqueTargets.length,
    languageTotal: uniqueTargets.length,
  });

  return {
    parsed,
    results: results as DocumentTranslateResult[],
    durationMs: Date.now() - started,
  };
}

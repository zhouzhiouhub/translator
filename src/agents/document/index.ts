import {
  checkAiConfig,
  runTranslation,
  type BatchItemStatus,
} from "@/agents/translator";
import { isAbortError, throwIfAborted } from "@/lib/abort";
import { chunkDocumentText } from "@/lib/document/chunk";
import { parseDocumentFile } from "@/lib/document/parse";
import type {
  DocumentTranslateProgress,
  ParsedDocument,
} from "@/lib/document/types";
import type { AIConfig, TranslationStyle } from "@/types/translation";

export interface DocumentTranslateInput {
  file: File;
  targetLanguage: string;
  style?: TranslationStyle;
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
): string {
  const styleHint =
    style && style !== "default" ? ` Preferred style: ${style}.` : "";
  return `You are Kinolin Translator translating a document segment (target: ${targetLanguage}).${styleHint}
Preserve Markdown structure, headings, lists, links, and inline formatting.
Do NOT translate fenced code blocks or inline code; keep them verbatim.
You MUST write the output in the target language — do not leave source-language text unchanged.
Output only the translated segment — no preface or commentary.`;
}

async function translateParsedDocument(options: {
  parsed: ParsedDocument;
  chunks: ReturnType<typeof chunkDocumentText>;
  targetLanguage: string;
  style?: TranslationStyle;
  aiConfig: AIConfig;
  languageIndex: number;
  languageTotal: number;
  signal?: AbortSignal;
  onProgress?: (progress: DocumentTranslateProgress) => void;
}): Promise<DocumentTranslateResult> {
  const {
    parsed,
    chunks,
    targetLanguage,
    style,
    aiConfig,
    languageIndex,
    languageTotal,
    signal,
    onProgress,
  } = options;

  const systemPrompt = documentSystemPrompt(targetLanguage, style);
  const started = Date.now();
  const translatedParts: string[] = [];
  let detectedSourceLanguage: string | undefined;
  let model: string | undefined;

  for (let i = 0; i < chunks.length; i++) {
    throwIfAborted(signal);
    onProgress?.({
      phase: "translating",
      current: i + 1,
      total: chunks.length,
      languageIndex,
      languageTotal,
      targetLanguage,
    });

    const chunk = chunks[i]!;
    if (/^(`{3,}|~{3,})/.test(chunk.text.trim())) {
      translatedParts.push(chunk.text);
      continue;
    }

    const result = await runTranslation({
      text: chunk.text,
      targetLanguage,
      style,
      aiConfig,
      systemPrompt,
      signal,
    });

    translatedParts.push(result.text);
    detectedSourceLanguage ??= result.detectedSourceLanguage;
    model ??= result.model;
  }

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
  const results: DocumentTranslateResult[] = [];

  for (let li = 0; li < uniqueTargets.length; li++) {
    const targetLanguage = uniqueTargets[li]!;
    try {
      throwIfAborted(input.signal);
      const one = await translateParsedDocument({
        parsed,
        chunks,
        targetLanguage,
        style: input.style,
        aiConfig: input.aiConfig,
        languageIndex: li + 1,
        languageTotal: uniqueTargets.length,
        signal: input.signal,
        onProgress: input.onProgress,
      });
      results.push(one);
    } catch (err) {
      if (!isAbortError(err)) throw err;
      for (let j = li; j < uniqueTargets.length; j++) {
        results.push(
          pendingDocumentResult(
            parsed,
            uniqueTargets[j]!,
            chunks.length,
            input.style,
          ),
        );
      }
      return {
        parsed,
        results,
        durationMs: Date.now() - started,
        cancelled: true,
      };
    }
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
    results,
    durationMs: Date.now() - started,
  };
}

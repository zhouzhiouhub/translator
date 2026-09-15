import { checkAiConfig, runTranslation } from "@/agents/translator";
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
  onProgress?: (progress: DocumentTranslateProgress) => void;
}

export interface DocumentTranslateResult {
  parsed: ParsedDocument;
  text: string;
  chunks: number;
  detectedSourceLanguage?: string;
  model?: string;
  style?: TranslationStyle;
  durationMs: number;
}

function documentSystemPrompt(style?: TranslationStyle): string {
  const styleHint =
    style && style !== "default" ? ` Preferred style: ${style}.` : "";
  return `You are Kinolin Translator translating a document segment.${styleHint}
Preserve Markdown structure, headings, lists, links, and inline formatting.
Do NOT translate fenced code blocks or inline code; keep them verbatim.
Output only the translated segment — no preface or commentary.`;
}

export async function runDocumentTranslation(
  input: DocumentTranslateInput,
): Promise<DocumentTranslateResult> {
  const check = checkAiConfig(input.aiConfig);
  if (!check.ok || !input.aiConfig) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  input.onProgress?.({ phase: "parsing", current: 0, total: 0 });
  const parsed = await parseDocumentFile(input.file);
  const chunks = chunkDocumentText(parsed.text);
  if (chunks.length === 0) {
    throw new Error("DOCUMENT_EMPTY");
  }

  const systemPrompt = documentSystemPrompt(input.style);
  const started = Date.now();
  const translatedParts: string[] = [];
  let detectedSourceLanguage: string | undefined;
  let model: string | undefined;

  for (let i = 0; i < chunks.length; i++) {
    input.onProgress?.({
      phase: "translating",
      current: i + 1,
      total: chunks.length,
    });

    const chunk = chunks[i]!;
    if (/^(`{3,}|~{3,})/.test(chunk.text.trim())) {
      translatedParts.push(chunk.text);
      continue;
    }

    const result = await runTranslation({
      text: chunk.text,
      targetLanguage: input.targetLanguage,
      style: input.style,
      aiConfig: input.aiConfig,
      systemPrompt,
    });

    translatedParts.push(result.text);
    detectedSourceLanguage ??= result.detectedSourceLanguage;
    model ??= result.model;
  }

  input.onProgress?.({
    phase: "done",
    current: chunks.length,
    total: chunks.length,
  });

  return {
    parsed,
    text: translatedParts.join("\n\n"),
    chunks: chunks.length,
    detectedSourceLanguage,
    model,
    style: input.style,
    durationMs: Date.now() - started,
  };
}

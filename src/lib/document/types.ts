export type DocumentFormat = "txt" | "md" | "html" | "docx";

export interface ParsedDocument {
  format: DocumentFormat;
  fileName: string;
  text: string;
  charCount: number;
}

export interface DocumentChunk {
  index: number;
  text: string;
}

export interface DocumentTranslateProgress {
  phase: "parsing" | "translating" | "done";
  current: number;
  total: number;
  /** 1-based index of the current target language in a batch. */
  languageIndex?: number;
  languageTotal?: number;
  targetLanguage?: string;
}

export const MAX_BATCH_TARGET_LANGUAGES = 5;

export const SUPPORTED_EXTENSIONS = [
  ".txt",
  ".md",
  ".markdown",
  ".html",
  ".htm",
  ".docx",
] as const;

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_DOCUMENT_CHARS = 80_000;
export const DOCUMENT_CHUNK_CHARS = 1_600;

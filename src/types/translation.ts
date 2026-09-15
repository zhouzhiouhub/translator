export type AiProviderId =
  | "openai"
  | "claude"
  | "gemini"
  | "deepseek"
  | "compatible";

export type TranslationStyle =
  | "default"
  | "natural"
  | "casual"
  | "business"
  | "formal"
  | "technical"
  | "academic"
  | "localized";

export interface AIConfig {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string;
  lastTestAt?: number;
  lastTestOk?: boolean;
}

export interface TranslateInput {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  style?: TranslationStyle;
  /** Optional override for document / specialized translation. */
  systemPrompt?: string;
}

export interface TranslateResult {
  text: string;
  detectedSourceLanguage?: string;
  model?: string;
  style?: TranslationStyle;
  durationMs: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  sourceText: string;
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  style?: TranslationStyle;
  model?: string;
  durationMs: number;
}

export interface Translator {
  translate(input: TranslateInput): Promise<TranslateResult>;
}

import type { TranslationStyle } from "@/types/translation";

export interface TranslateParams {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
  style?: TranslationStyle;
  systemPrompt?: string;
  signal?: AbortSignal;
}

export interface TranslateResult {
  text: string;
  detectedSourceLanguage?: string;
  model: string;
  durationMs: number;
}

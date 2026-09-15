import { createAIProvider } from "@/ai/client/factory";
import { throwIfAborted } from "@/lib/abort";
import {
  defaultTranslateSystemPrompt,
  formatTargetLanguageForPrompt,
  looksUntranslated,
  strongTranslateSystemPrompt,
} from "@/lib/translation/quality";
import type {
  AIConfig,
  TranslateInput,
  TranslateResult,
  Translator,
} from "@/types/translation";

export class AITranslator implements Translator {
  constructor(private readonly config: AIConfig) {}

  async translate(input: TranslateInput): Promise<TranslateResult> {
    throwIfAborted(input.signal);
    const provider = createAIProvider(this.config);
    const targetLabel = formatTargetLanguageForPrompt(input.targetLanguage);
    const baseSystem =
      input.systemPrompt ??
      defaultTranslateSystemPrompt(input.targetLanguage, input.style);

    const first = await provider.translate({
      text: input.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: targetLabel,
      style: input.style,
      systemPrompt: baseSystem,
      signal: input.signal,
    });

    if (
      !looksUntranslated(input.text, first.text, input.targetLanguage)
    ) {
      return {
        text: first.text,
        detectedSourceLanguage: first.detectedSourceLanguage,
        model: first.model,
        style: input.style,
        durationMs: first.durationMs,
      };
    }

    throwIfAborted(input.signal);

    // One forced retry with an explicit “must change language” prompt
    const retry = await provider.translate({
      text: input.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: targetLabel,
      style: input.style,
      systemPrompt: strongTranslateSystemPrompt(
        input.targetLanguage,
        input.style,
      ),
      signal: input.signal,
    });

    if (looksUntranslated(input.text, retry.text, input.targetLanguage)) {
      throw new Error("TRANSLATION_UNCHANGED");
    }

    return {
      text: retry.text,
      detectedSourceLanguage:
        retry.detectedSourceLanguage ?? first.detectedSourceLanguage,
      model: retry.model ?? first.model,
      style: input.style,
      durationMs: first.durationMs + retry.durationMs,
    };
  }
}

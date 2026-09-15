import { createAIProvider } from "@/ai/client/factory";
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

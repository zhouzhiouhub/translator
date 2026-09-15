import { createAIProvider } from "@/ai/client/factory";
import { throwIfAborted } from "@/lib/abort";
import {
  defaultTranslateSystemPrompt,
  formatTargetLanguageForPrompt,
  guessSourceLanguage,
  looksUntranslated,
  parseTranslateModelOutput,
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
    const usesJsonEnvelope = !input.systemPrompt;
    const baseSystem =
      input.systemPrompt ??
      defaultTranslateSystemPrompt(
        input.targetLanguage,
        input.style,
        input.customPrompt,
      );

    const firstRaw = await provider.translate({
      text: input.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: targetLabel,
      style: input.style,
      systemPrompt: baseSystem,
      signal: input.signal,
    });
    const first = usesJsonEnvelope
      ? parseTranslateModelOutput(firstRaw.text, input.text)
      : {
          text: firstRaw.text,
          detectedSourceLanguage:
            firstRaw.detectedSourceLanguage ??
            guessSourceLanguage(input.text),
        };

    if (!looksUntranslated(input.text, first.text, input.targetLanguage)) {
      return {
        text: first.text,
        detectedSourceLanguage: first.detectedSourceLanguage,
        model: firstRaw.model,
        style: input.style,
        durationMs: firstRaw.durationMs,
      };
    }

    throwIfAborted(input.signal);

    const retryRaw = await provider.translate({
      text: input.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: targetLabel,
      style: input.style,
      systemPrompt: usesJsonEnvelope
        ? strongTranslateSystemPrompt(
            input.targetLanguage,
            input.style,
            input.customPrompt,
          )
        : input.systemPrompt,
      signal: input.signal,
    });
    const retry = usesJsonEnvelope
      ? parseTranslateModelOutput(retryRaw.text, input.text)
      : {
          text: retryRaw.text,
          detectedSourceLanguage:
            retryRaw.detectedSourceLanguage ??
            first.detectedSourceLanguage ??
            guessSourceLanguage(input.text),
        };

    if (looksUntranslated(input.text, retry.text, input.targetLanguage)) {
      throw new Error("TRANSLATION_UNCHANGED");
    }

    return {
      text: retry.text,
      detectedSourceLanguage:
        retry.detectedSourceLanguage ?? first.detectedSourceLanguage,
      model: retryRaw.model ?? firstRaw.model,
      style: input.style,
      durationMs: firstRaw.durationMs + retryRaw.durationMs,
    };
  }
}

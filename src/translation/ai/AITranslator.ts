import { createAIProvider } from "@/ai/client/factory";
import type { AIConfig, TranslateInput, TranslateResult, Translator } from "@/types/translation";

export class AITranslator implements Translator {
  constructor(private readonly config: AIConfig) {}

  async translate(input: TranslateInput): Promise<TranslateResult> {
    const provider = createAIProvider(this.config);
    const result = await provider.translate({
      text: input.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      style: input.style,
      systemPrompt: input.systemPrompt,
    });

    return {
      text: result.text,
      detectedSourceLanguage: result.detectedSourceLanguage,
      model: result.model,
      style: input.style,
      durationMs: result.durationMs,
    };
  }
}

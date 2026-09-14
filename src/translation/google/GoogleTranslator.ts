import type { TranslateInput, TranslateResult, Translator } from "@/types/translation";

export class GoogleTranslator implements Translator {
  async translate(input: TranslateInput): Promise<TranslateResult> {
    const started = Date.now();
    const res = await fetch("/api/translate/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input.text,
        targetLanguage: input.targetLanguage,
        sourceLanguage: input.sourceLanguage,
      }),
    });

    const data = (await res.json()) as {
      text?: string;
      detectedSourceLanguage?: string;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(data.error || `Google translate failed (${res.status})`);
    }

    return {
      text: data.text ?? "",
      detectedSourceLanguage: data.detectedSourceLanguage,
      engine: "google",
      durationMs: Date.now() - started,
    };
  }
}

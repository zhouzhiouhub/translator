import type { AIConfig } from "@/types/translation";
import type { AIProvider, TranslateParams, TranslateResult } from "@/ai/types";

/** Google Gemini generateContent — browser BYOK. */
export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  constructor(private readonly config: AIConfig) {}

  private endpoint(method: "generateContent") {
    const model = encodeURIComponent(this.config.model);
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}?key=${encodeURIComponent(this.config.apiKey)}`;
  }

  async testConnection(): Promise<boolean> {
    const res = await fetch(this.endpoint("generateContent"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 8 },
      }),
    });
    return res.ok;
  }

  async translate(params: TranslateParams): Promise<TranslateResult> {
    const started = Date.now();
    const styleHint = params.style && params.style !== "default" ? ` Style: ${params.style}.` : "";
    const res = await fetch(this.endpoint("generateContent"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are Kinolin Translator. Translate accurately and naturally.${styleHint} Output only the translation.\nTarget language: ${params.targetLanguage}\n\n${params.text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) throw new Error("Empty Gemini translation response");

    return {
      text,
      model: this.config.model,
      durationMs: Date.now() - started,
    };
  }
}

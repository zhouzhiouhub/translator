import type { AIConfig } from "@/types/translation";
import type { AIProvider, TranslateParams, TranslateResult } from "@/ai/types";

/** Google Gemini generateContent — browser BYOK. */
export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  constructor(private readonly config: AIConfig) {}

  private endpoint(method: "generateContent") {
    const model = encodeURIComponent(this.config.model.trim());
    // Prefer header for key (avoids leaking key into URL / console network logs)
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`;
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "x-goog-api-key": this.config.apiKey.trim(),
    };
  }

  async testConnection(): Promise<boolean> {
    const res = await fetch(this.endpoint("generateContent"), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 8 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(formatGeminiError(res.status, body, this.config.model));
    }
    return true;
  }

  async translate(params: TranslateParams): Promise<TranslateResult> {
    const started = Date.now();
    const styleHint =
      params.style && params.style !== "default" ? ` Style: ${params.style}.` : "";
    const res = await fetch(this.endpoint("generateContent"), {
      method: "POST",
      headers: this.headers(),
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
      throw new Error(formatGeminiError(res.status, body, this.config.model));
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

function formatGeminiError(status: number, body: string, model: string): string {
  if (status === 404) {
    return `模型不可用（404）：${model}。请改用 gemini-2.5-flash 或 gemini-2.5-flash-lite（gemini-2.0-flash 已下线）`;
  }
  if (status === 400 || status === 401 || status === 403) {
    return `Gemini 鉴权/请求失败（${status}）。请确认 API Key 来自 Google AI Studio，且已开通 Gemini API。`;
  }
  const snippet = body.replace(/\s+/g, " ").slice(0, 160);
  return `Gemini error ${status}${snippet ? `: ${snippet}` : ""}`;
}

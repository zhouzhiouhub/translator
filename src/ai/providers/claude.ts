import type { AIConfig } from "@/types/translation";
import type { AIProvider, TranslateParams, TranslateResult } from "@/ai/types";

/** Anthropic Messages API — browser BYOK (may hit CORS; Compatible proxy is fallback). */
export class ClaudeProvider implements AIProvider {
  readonly id = "claude";
  constructor(private readonly config: AIConfig) {}

  async testConnection(): Promise<boolean> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    return res.ok || res.status === 400;
  }

  async translate(params: TranslateParams): Promise<TranslateResult> {
    const started = Date.now();
    const styleHint = params.style && params.style !== "default" ? ` Style: ${params.style}.` : "";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        system: `You are Kinolin Translator. Translate accurately and naturally.${styleHint} Output only the translation.`,
        messages: [
          {
            role: "user",
            content: `Target language: ${params.targetLanguage}\n\n${params.text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Claude error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    if (!text) throw new Error("Empty Claude translation response");

    return {
      text,
      model: this.config.model,
      durationMs: Date.now() - started,
    };
  }
}

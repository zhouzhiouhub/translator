import type { AIConfig } from "@/types/translation";
import type { AIProvider, TranslateParams, TranslateResult } from "@/ai/types";

async function openAiCompatibleTranslate(
  config: AIConfig,
  params: TranslateParams,
  defaultBase: string,
): Promise<TranslateResult> {
  const started = Date.now();
  const base = (config.baseUrl || defaultBase).replace(/\/$/, "");
  const styleHint = params.style && params.style !== "default" ? ` Style: ${params.style}.` : "";
  const system =
    params.systemPrompt ??
    `You are Kinolin Translator. Translate accurately and naturally.${styleHint} Output only the translation.`;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      ...(params.systemPrompt ? { max_tokens: 16_384 } : {}),
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Target language: ${params.targetLanguage}\n\n${params.text}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Empty AI translation response");

  return {
    text,
    model: config.model,
    durationMs: Date.now() - started,
  };
}

async function openAiCompatibleTest(config: AIConfig, defaultBase: string): Promise<boolean> {
  const base = (config.baseUrl || defaultBase).replace(/\/$/, "");
  const res = await fetch(`${base}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });
  return res.ok;
}

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  constructor(private readonly config: AIConfig) {}

  testConnection() {
    return openAiCompatibleTest(this.config, "https://api.openai.com/v1");
  }

  translate(params: TranslateParams) {
    return openAiCompatibleTranslate(this.config, params, "https://api.openai.com/v1");
  }
}

export class DeepSeekProvider implements AIProvider {
  readonly id = "deepseek";
  constructor(private readonly config: AIConfig) {}

  testConnection() {
    return openAiCompatibleTest(this.config, "https://api.deepseek.com/v1");
  }

  translate(params: TranslateParams) {
    return openAiCompatibleTranslate(this.config, params, "https://api.deepseek.com/v1");
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id = "compatible";
  constructor(private readonly config: AIConfig) {}

  testConnection() {
    if (!this.config.baseUrl) return Promise.resolve(false);
    return openAiCompatibleTest(this.config, this.config.baseUrl);
  }

  translate(params: TranslateParams) {
    if (!this.config.baseUrl) {
      return Promise.reject(new Error("API base URL is required for Compatible provider"));
    }
    return openAiCompatibleTranslate(this.config, params, this.config.baseUrl);
  }
}

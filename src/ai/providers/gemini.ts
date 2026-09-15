import type { AIConfig } from "@/types/translation";
import type { AIProvider, TranslateParams, TranslateResult } from "@/ai/types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Google Gemini generateContent — browser BYOK. */
export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  constructor(private readonly config: AIConfig) {}

  private headers() {
    return {
      "Content-Type": "application/json",
      "x-goog-api-key": this.config.apiKey.trim(),
    };
  }

  private generateUrl(model: string) {
    return `${GEMINI_BASE}/models/${encodeURIComponent(model.trim())}:generateContent`;
  }

  async testConnection(): Promise<boolean> {
    // 1) List models — distinguishes bad key vs unreachable network vs missing model
    const listRes = await fetch(`${GEMINI_BASE}/models?pageSize=20`, {
      method: "GET",
      headers: this.headers(),
    });

    if (!listRes.ok) {
      const body = await listRes.text().catch(() => "");
      throw new Error(
        formatGeminiError(listRes.status, body, this.config.model, "list"),
      );
    }

    const list = (await listRes.json()) as {
      models?: { name?: string }[];
    };
    const names = (list.models ?? [])
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);

    const wanted = this.config.model.trim();
    const matched =
      names.includes(wanted) ||
      names.some((n) => n === wanted || n.startsWith(`${wanted}-`));

    if (!matched) {
      const sample = names.slice(0, 6).join(", ") || "(empty)";
      throw new Error(`GEMINI_MODEL_MISSING|${wanted}|${sample}`);
    }

    // 2) Tiny generate to confirm write path
    const res = await fetch(this.generateUrl(wanted), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 8 },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(formatGeminiError(res.status, body, wanted, "generate"));
    }
    return true;
  }

  async translate(params: TranslateParams): Promise<TranslateResult> {
    const started = Date.now();
    const model = this.config.model.trim();
    const styleHint =
      params.style && params.style !== "default" ? ` Style: ${params.style}.` : "";
    const system =
      params.systemPrompt ??
      `You are Kinolin Translator. Translate accurately and naturally.${styleHint} Output only the translation.`;
    const res = await fetch(this.generateUrl(model), {
      method: "POST",
      headers: this.headers(),
      signal: params.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${system}\nTarget language: ${params.targetLanguage}\n\n${params.text}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 16_384,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(formatGeminiError(res.status, body, model, "generate"));
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) throw new Error("GEMINI_EMPTY");

    return {
      text,
      model,
      durationMs: Date.now() - started,
    };
  }
}

/** Machine-readable codes for UI i18n (`mapProviderError`). */
function formatGeminiError(
  status: number,
  body: string,
  model: string,
  phase: "list" | "generate",
): string {
  const snippet = body.replace(/\s+/g, " ").slice(0, 180).replace(/\|/g, "/");

  if (status === 404) {
    return `GEMINI_HTTP_404|${phase}|${model}|${snippet}`;
  }

  if (status === 400 || status === 401 || status === 403) {
    return `GEMINI_HTTP_AUTH|${status}|${snippet}`;
  }

  return `GEMINI_HTTP|${status}|${snippet}`;
}

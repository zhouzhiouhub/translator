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
      throw new Error(formatGeminiError(listRes.status, body, this.config.model, "list"));
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
      throw new Error(
        `当前 Key 可用模型中没有「${wanted}」。可试用：${sample}`,
      );
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
    if (!text) throw new Error("Empty Gemini translation response");

    return {
      text,
      model,
      durationMs: Date.now() - started,
    };
  }
}

function formatGeminiError(
  status: number,
  body: string,
  model: string,
  phase: "list" | "generate",
): string {
  const snippet = body.replace(/\s+/g, " ").slice(0, 180);

  if (status === 404) {
    return [
      `Gemini 返回 404（${phase} / ${model}）。`,
      "新 Key 请用 gemini-3.5-flash-lite / gemini-3.1-flash-lite / gemini-flash-lite-latest；",
      "2.0/2.5 系列已不对新用户开放。",
      "若仍失败再查网络或配额。",
      snippet ? `详情：${snippet}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (status === 400 || status === 401 || status === 403) {
    return [
      `Gemini 鉴权/权限失败（${status}）。`,
      "请到 Google AI Studio 新建 API Key，确认已启用 Gemini，",
      "且 Key 未限制到其它域名（本机测试需允许 localhost）。",
      snippet ? `详情：${snippet}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return `Gemini error ${status}${snippet ? `: ${snippet}` : ""}`;
}

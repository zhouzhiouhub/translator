import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAIProvider } from "../src/ai/client/factory.ts";
import { runTranslation } from "../src/agents/translator/index.ts";
import { AITranslator } from "../src/translation/ai/AITranslator.ts";
import type { AIConfig } from "../src/types/translation.ts";

const baseConfig: AIConfig = {
  provider: "openai",
  model: "test-model",
  apiKey: "sk-test",
};

function mockFetch(handler: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>) {
  const original = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

describe("provider adapters", () => {
  it("parses an OpenAI-compatible response and forwards the abort signal", async () => {
    let request: RequestInit | undefined;
    const restore = mockFetch(async (_input, init) => {
      request = init;
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "Hello" } }] }),
        { status: 200 },
      );
    });
    try {
      const controller = new AbortController();
      const result = await createAIProvider(baseConfig).translate({
        text: "你好",
        targetLanguage: "en",
        signal: controller.signal,
      });
      assert.equal(result.text, "Hello");
        assert.equal(result.detectedSourceLanguage, "zh-CN");
      assert.equal(request?.signal, controller.signal);
    } finally {
      restore();
    }
  });

  it("parses Claude text content", async () => {
    const restore = mockFetch(async () =>
      new Response(JSON.stringify({ content: [{ type: "text", text: "Bonjour" }] }), {
        status: 200,
      }),
    );
    try {
      const result = await createAIProvider({
        ...baseConfig,
        provider: "claude",
      }).translate({ text: "你好", targetLanguage: "fr" });
      assert.equal(result.text, "Bonjour");
        assert.equal(result.detectedSourceLanguage, "zh-CN");
    } finally {
      restore();
    }
  });

  it("parses Gemini candidate content", async () => {
    const restore = mockFetch(async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Hola" }] } }],
        }),
        { status: 200 },
      ),
    );
    try {
      const result = await createAIProvider({
        ...baseConfig,
        provider: "gemini",
      }).translate({ text: "你好", targetLanguage: "es" });
      assert.equal(result.text, "Hola");
        assert.equal(result.detectedSourceLanguage, "zh-CN");
    } finally {
      restore();
    }
  });
});

describe("translation agent orchestration", () => {
  it("blocks translation when AI is not configured", async () => {
    await assert.rejects(
      runTranslation({
        text: "你好",
        targetLanguage: "en",
        aiConfig: null,
      }),
      { message: "AI_NOT_CONFIGURED" },
    );
  });

  it("retries when the model returns the source unchanged", async () => {
    let calls = 0;
    const restore = mockFetch(async () => {
      calls += 1;
      const content =
        calls === 1
          ? '{"detectedSourceLanguage":"zh-CN","translation":"你好"}'
          : '{"detectedSourceLanguage":"zh-CN","translation":"Hello"}';
      return new Response(
        JSON.stringify({ choices: [{ message: { content } }] }),
        { status: 200 },
      );
    });
    try {
      const result = await new AITranslator(baseConfig).translate({
        text: "你好",
        targetLanguage: "en",
      });
      assert.equal(calls, 2);
      assert.equal(result.text, "Hello");
      assert.equal(result.detectedSourceLanguage, "zh-CN");
    } finally {
      restore();
    }
  });
});

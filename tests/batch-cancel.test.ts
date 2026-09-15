import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runBatchTranslation } from "../src/agents/translator/index.ts";
import type { AIConfig } from "../src/types/translation.ts";

describe("runBatchTranslation cancel", () => {
  it("returns done items and marks the rest pending", async () => {
    const config = {
      provider: "compatible",
      model: "test",
      apiKey: "sk-test",
      baseUrl: "https://example.invalid/v1",
    } satisfies AIConfig;

    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      assert.equal(calls, 1, "second language should abort before fetch");
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "Hello" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    try {
      const ac = new AbortController();
      const result = await runBatchTranslation({
        text: "你好",
        targetLanguages: ["en", "ja", "ko"],
        aiConfig: config,
        signal: ac.signal,
        onProgress: (p) => {
          if (p.current === 2) ac.abort();
        },
      });

      assert.equal(result.cancelled, true);
      assert.equal(result.results.length, 3);
      assert.equal(result.results[0]?.status, "done");
      assert.equal(result.results[0]?.text, "Hello");
      assert.equal(result.results[1]?.status, "pending");
      assert.equal(result.results[2]?.status, "pending");
      assert.equal(result.results[1]?.text, "");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSafeBaseUrl,
  validateAIConfig,
} from "../src/lib/security/ai-config-storage.ts";

describe("BYOK config security", () => {
  it("accepts provider metadata with a non-empty key", () => {
    const config = validateAIConfig({
      provider: "openai",
      model: "gpt-4o",
      apiKey: "sk-test",
    });
    assert.equal(config?.provider, "openai");
    assert.equal(config?.model, "gpt-4o");
  });

  it("rejects malformed or unknown provider configs", () => {
    assert.equal(validateAIConfig(null), null);
    assert.equal(
      validateAIConfig({ provider: "unknown", model: "x", apiKey: "y" }),
      null,
    );
    assert.equal(
      validateAIConfig({ provider: "openai", model: "", apiKey: "y" }),
      null,
    );
  });

  it("requires safe URLs for compatible providers", () => {
    assert.equal(isSafeBaseUrl("https://api.example.com/v1"), true);
    assert.equal(isSafeBaseUrl("http://localhost:8787/v1"), true);
    assert.equal(isSafeBaseUrl("http://10.0.0.4/v1"), false);
    assert.equal(isSafeBaseUrl("javascript:alert(1)"), false);
    assert.equal(isSafeBaseUrl("https://user:pass@example.com/v1"), false);
    assert.equal(
      validateAIConfig({
        provider: "compatible",
        model: "model",
        apiKey: "key",
        baseUrl: "http://10.0.0.4/v1",
      }),
      null,
    );
  });
});
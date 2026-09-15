import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapProviderError } from "../src/lib/i18n/map-provider-error.ts";

describe("mapProviderError", () => {
  const t = (key: string, values?: Record<string, string | number>) => {
    if (key === "geminiModelMissing") {
      return `missing:${values?.model}:${values?.sample}`;
    }
    if (key === "providerHttp") {
      return `${values?.provider}/${values?.status}${values?.detail ?? ""}`;
    }
    if (key === "compatibleBaseUrlMissing") return "base-url-required";
    if (key === "providerGeneric") return "provider-generic";
    return key;
  };

  it("maps gemini model missing", () => {
    assert.equal(
      mapProviderError("GEMINI_MODEL_MISSING|foo|bar,baz", t),
      "missing:foo:bar,baz",
    );
  });

  it("localizes unknown provider messages", () => {
    assert.equal(mapProviderError("random failure", t), "provider-generic");
  });

  it("maps a missing compatible provider URL", () => {
    assert.equal(
      mapProviderError("COMPATIBLE_BASE_URL_MISSING", t),
      "base-url-required",
    );
  });

  it("maps provider http", () => {
    assert.equal(
      mapProviderError("PROVIDER_HTTP|Claude|429|rate limited", t),
      "Claude/429 rate limited",
    );
  });
});

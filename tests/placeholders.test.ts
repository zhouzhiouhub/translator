import { describe, expect, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractPlaceholders,
  localeKeysMatch,
  placeholdersMatch,
} from "../src/lib/validation/placeholders";

describe("placeholders", () => {
  it("extracts mustache and printf", () => {
    const found = extractPlaceholders("欢迎，{{name}} 共 %d 条");
    assert.ok(found.includes("{{name}}"));
    assert.ok(found.includes("%d"));
  });

  it("matches equal placeholders", () => {
    expect(placeholdersMatch("Hi {{name}}", "你好 {{name}}")).toBe?.(true);
    assert.equal(placeholdersMatch("Hi {{name}}", "你好 {{name}}"), true);
    assert.equal(placeholdersMatch("Hi {{name}}", "你好"), false);
  });
});

describe("localeKeysMatch", () => {
  it("detects missing keys", () => {
    const result = localeKeysMatch(
      { a: { b: "1" }, c: "2" },
      { a: { b: "x" } },
    );
    assert.equal(result.ok, false);
    assert.deepEqual(result.missing, ["c"]);
  });
});

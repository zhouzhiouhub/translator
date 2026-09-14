import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseLocaleJson,
  validateAndRepairLocalePack,
} from "../src/lib/locale-pack/validate";

describe("locale pack validate", () => {
  it("restores missing keys and fixes placeholder mismatches", () => {
    const source = {
      common: { save: "保存", count: "{count} / {max}" },
      brand: { name: "Kinolin" },
    };
    const generated = {
      common: { save: "Save", count: "X / Y" },
      // brand missing
      extra: { nope: "1" },
    };

    const result = validateAndRepairLocalePack(source, generated);
    assert.equal(
      (result.messages.common as { count: string }).count,
      "{count} / {max}",
    );
    assert.equal(
      (result.messages.brand as { name: string }).name,
      "Kinolin",
    );
    assert.ok(result.failedKeys.includes("brand.name"));
    assert.ok(result.failedKeys.includes("common.count"));
    assert.ok(result.warnings.some((w) => w.includes("Extra key")));
  });

  it("parses fenced JSON", () => {
    const obj = parseLocaleJson('```json\n{"a":{"b":"c"}}\n```');
    assert.deepEqual(obj, { a: { b: "c" } });
  });
});

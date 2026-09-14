import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseLocaleJson,
  translationCoverage,
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

  it("unwraps envelope with sourceMessages", () => {
    const obj = parseLocaleJson(
      JSON.stringify({
        sourceLocale: "zh-CN",
        targetLocale: "ru",
        sourceMessages: { nav: { settings: "Настройки" } },
      }),
    );
    assert.deepEqual(obj, { nav: { settings: "Настройки" } });
  });

  it("measures translation coverage", () => {
    const source = { a: { x: "你好", y: "世界" } };
    const same = translationCoverage(source, { a: { x: "你好", y: "世界" } });
    assert.equal(same.changed, 0);
    assert.equal(same.ratio, 0);

    const translated = translationCoverage(source, {
      a: { x: "Hello", y: "World" },
    });
    assert.equal(translated.changed, 2);
    assert.equal(translated.ratio, 1);
  });
});

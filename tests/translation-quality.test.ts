import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatTargetLanguageForPrompt,
  looksUntranslated,
} from "../src/lib/translation/quality";

describe("translation quality", () => {
  it("formats target language with English name", () => {
    assert.match(formatTargetLanguageForPrompt("th"), /Thai/);
    assert.match(formatTargetLanguageForPrompt("th"), /\(th\)/);
  });

  it("flags Chinese returned for Thai", () => {
    const source = "AI 翻译不可用";
    assert.equal(looksUntranslated(source, source, "th"), true);
    assert.equal(
      looksUntranslated(source, "AI การแปลไม่พร้อมใช้งาน", "th"),
      false,
    );
  });

  it("flags Chinese returned for Russian", () => {
    const source = "状态 4: 模型不存在";
    assert.equal(looksUntranslated(source, source, "ru"), true);
    assert.equal(
      looksUntranslated(source, "Статус 4: модель не существует", "ru"),
      false,
    );
  });

  it("allows Chinese family targets to keep Han script", () => {
    const source = "你好世界";
    assert.equal(looksUntranslated(source, "你好世界", "zh-TW"), false);
  });
});

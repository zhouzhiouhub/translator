import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultTranslateSystemPrompt,
  formatTargetLanguageForPrompt,
  guessSourceLanguage,
  looksUntranslated,
  parseTranslateModelOutput,
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

  it("uses a simple accurate prompt when custom style has empty prompt", () => {
    const prompt = defaultTranslateSystemPrompt("en", "custom", "   ");
    assert.doesNotMatch(prompt, /Prompt\.txt/);
    assert.doesNotMatch(prompt, /business/);
    assert.match(prompt, /accurately/i);
    assert.match(prompt, /detectedSourceLanguage/);
  });

  it("uses user prompt when style is custom", () => {
    const prompt = defaultTranslateSystemPrompt(
      "en",
      "custom",
      "Keep tech terms in English; witty tone.",
    );
    assert.match(prompt, /Keep tech terms in English/);
    assert.doesNotMatch(prompt, /business/);
    assert.match(prompt, /detectedSourceLanguage/);
  });

  it("applies preset style without custom prompt body", () => {
    const prompt = defaultTranslateSystemPrompt("en", "business");
    assert.match(prompt, /business/i);
    assert.doesNotMatch(prompt, /Keep tech terms/);
  });

  it("guesses source language from script", () => {
    assert.equal(guessSourceLanguage("你好，世界"), "zh-CN");
    assert.equal(guessSourceLanguage("こんにちは"), "ja");
    assert.equal(guessSourceLanguage("안녕하세요"), "ko");
    assert.equal(guessSourceLanguage("Hello world"), "en");
  });

  it("parses JSON translation envelope", () => {
    const parsed = parseTranslateModelOutput(
      '{"detectedSourceLanguage":"zh-CN","translation":"Hello"}',
      "你好",
    );
    assert.equal(parsed.text, "Hello");
    assert.equal(parsed.detectedSourceLanguage, "zh-CN");
  });

  it("falls back to plain text and heuristic detect", () => {
    const parsed = parseTranslateModelOutput("Hello there", "你好啊");
    assert.equal(parsed.text, "Hello there");
    assert.equal(parsed.detectedSourceLanguage, "zh-CN");
  });

  it("parses fenced JSON", () => {
    const parsed = parseTranslateModelOutput(
      '```json\n{"detectedSourceLanguage":"ja","translation":"Hi"}\n```',
      "やあ",
    );
    assert.equal(parsed.text, "Hi");
    assert.equal(parsed.detectedSourceLanguage, "ja");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  availableUiLocalesFromCookie,
  parseReadyLocalesCookie,
  resolveBrowserUiLocale,
} from "../src/i18n/resolve-ui-locale";
import { languageLabel, stableLanguageName } from "../src/i18n/languages";

describe("resolveBrowserUiLocale", () => {
  it("falls back to en-US when nothing matches", () => {
    assert.equal(resolveBrowserUiLocale("fr-FR,fr;q=0.9", ["zh-CN", "en-US"]), "en-US");
    assert.equal(resolveBrowserUiLocale(null, ["zh-CN", "en-US"]), "en-US");
  });

  it("matches built-in Chinese and English", () => {
    assert.equal(resolveBrowserUiLocale("zh-CN,zh;q=0.8", ["zh-CN", "en-US"]), "zh-CN");
    assert.equal(resolveBrowserUiLocale("zh", ["zh-CN", "en-US"]), "zh-CN");
    assert.equal(resolveBrowserUiLocale("en-GB,en;q=0.9", ["zh-CN", "en-US"]), "en-US");
  });

  it("prefers a generated pack when the browser language matches", () => {
    const available = ["zh-CN", "en-US", "ja", "fr"];
    assert.equal(resolveBrowserUiLocale("ja-JP,ja;q=0.9,en;q=0.8", available), "ja");
    assert.equal(resolveBrowserUiLocale("fr-FR,fr;q=0.9", available), "fr");
  });

  it("uses generated zh-TW when available, else zh-CN", () => {
    assert.equal(
      resolveBrowserUiLocale("zh-TW,zh;q=0.8", ["zh-CN", "en-US", "zh-TW"]),
      "zh-TW",
    );
    assert.equal(
      resolveBrowserUiLocale("zh-TW,zh;q=0.8", ["zh-CN", "en-US"]),
      "zh-CN",
    );
  });
});

describe("fixed UI locale labels", () => {
  it("uses Simplified Chinese and English labels for built-in locales", () => {
    assert.equal(stableLanguageName("zh-CN", "zh-CN"), "简体中文");
    assert.equal(stableLanguageName("en-US", "en-US"), "English");
    assert.equal(languageLabel("zh-CN", "zh"), "简体中文");
    assert.equal(languageLabel("en-US", "zh"), "English");
  });
});

describe("ready locales cookie", () => {
  it("parses generated locales and merges with built-ins", () => {
    assert.deepEqual(parseReadyLocalesCookie("ja,fr"), ["ja", "fr"]);
    assert.deepEqual(availableUiLocalesFromCookie("ja,fr"), [
      "zh-CN",
      "en-US",
      "ja",
      "fr",
    ]);
  });
});

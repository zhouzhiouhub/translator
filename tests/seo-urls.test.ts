import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLocaleAlternates,
  buildLocaleUrl,
  DEFAULT_SITE_URL,
  getSiteOrigin,
} from "../src/lib/seo/urls";

describe("SEO locale URLs", () => {
  it("defaults to the production translator origin", () => {
    assert.equal(DEFAULT_SITE_URL, "https://translator.kinolin.com");
  });

  it("normalizes configured site URLs to their origin", () => {
    assert.equal(
      getSiteOrigin("https://translator.kinolin.com/"),
      "https://translator.kinolin.com",
    );
    assert.equal(
      getSiteOrigin("https://translator.kinolin.com/en-US?from=env#hash"),
      "https://translator.kinolin.com",
    );
  });

  it("builds self-canonical locale URLs without duplicated slashes", () => {
    assert.equal(
      buildLocaleUrl("en-US", "", "https://translator.kinolin.com/"),
      "https://translator.kinolin.com/en-US",
    );
    assert.equal(
      buildLocaleUrl("zh-CN", "/", "https://translator.kinolin.com/"),
      "https://translator.kinolin.com/zh-CN",
    );
  });

  it("keeps hreflang URLs aligned with page canonicals", () => {
    assert.deepEqual(
      buildLocaleAlternates("", "https://translator.kinolin.com/en-US"),
      {
        "zh-CN": "https://translator.kinolin.com/zh-CN",
        "en-US": "https://translator.kinolin.com/en-US",
        "x-default": "https://translator.kinolin.com/en-US",
      },
    );
  });
});

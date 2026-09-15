import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chunkDocumentText } from "../src/lib/document/chunk";
import {
  detectDocumentFormat,
  isSupportedDocumentFile,
  translatedFileName,
} from "../src/lib/document/detect";

describe("document detect", () => {
  it("detects supported formats", () => {
    assert.equal(detectDocumentFormat("a.txt"), "txt");
    assert.equal(detectDocumentFormat("a.MD"), "md");
    assert.equal(detectDocumentFormat("notes.markdown"), "md");
    assert.equal(detectDocumentFormat("page.html"), "html");
    assert.equal(detectDocumentFormat("doc.DOCX"), "docx");
    assert.equal(detectDocumentFormat("scan.pdf"), null);
    assert.equal(isSupportedDocumentFile("x.docx"), true);
  });

  it("builds translated file names", () => {
    assert.equal(translatedFileName("brief.md", "zh-CN"), "brief.zh-CN.md");
    assert.equal(translatedFileName("report.docx", "en"), "report.en.txt");
  });
});

describe("document chunk", () => {
  it("keeps short text as one chunk", () => {
    const chunks = chunkDocumentText("Hello world.");
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0]!.text, "Hello world.");
  });

  it("splits on paragraphs under the size limit", () => {
    const a = "A".repeat(1000);
    const b = "B".repeat(1000);
    const chunks = chunkDocumentText(`${a}\n\n${b}`, 1500);
    assert.equal(chunks.length, 2);
    assert.ok(chunks[0]!.text.includes("A"));
    assert.ok(chunks[1]!.text.includes("B"));
  });

  it("keeps fenced code blocks intact within chunks", () => {
    const fence = "```js\nconst x = 1;\n```";
    const text = `Intro\n\n${fence}\n\nOutro`;
    const chunks = chunkDocumentText(text, 2000);
    const joined = chunks.map((c) => c.text).join("\n\n");
    assert.ok(joined.includes(fence));
    assert.equal(chunks.length, 1);
  });

  it("emits oversized fences as their own hard-split pieces", () => {
    const body = "x".repeat(100);
    const fence = `\`\`\`\n${body}\n\`\`\``;
    const chunks = chunkDocumentText(`Before\n\n${fence}`, 80);
    assert.ok(chunks.length >= 2);
    assert.ok(chunks.some((c) => c.text.includes(body.slice(0, 20))));
  });
});

import {
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_CHARS,
  type DocumentFormat,
  type ParsedDocument,
} from "./types";
import { detectDocumentFormat } from "./detect";

function stripHtml(html: string): string {
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\u00a0/g, " ").trim();
  }
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

async function readAsText(file: File): Promise<string> {
  return file.text();
}

async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return (result.value ?? "").trim();
}

export async function parseDocumentFile(file: File): Promise<ParsedDocument> {
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("DOCUMENT_TOO_LARGE");
  }

  const format = detectDocumentFormat(file.name);
  if (!format) {
    throw new Error("DOCUMENT_UNSUPPORTED");
  }

  let text: string;
  switch (format) {
    case "docx": {
      const buffer = await readAsArrayBuffer(file);
      text = await parseDocx(buffer);
      break;
    }
    case "html": {
      const raw = await readAsText(file);
      text = stripHtml(raw);
      break;
    }
    case "txt":
    case "md":
    default: {
      text = (await readAsText(file)).replace(/^\uFEFF/, "");
      break;
    }
  }

  text = text.replace(/\r\n/g, "\n").trim();
  if (!text) {
    throw new Error("DOCUMENT_EMPTY");
  }
  if (text.length > MAX_DOCUMENT_CHARS) {
    throw new Error("DOCUMENT_TOO_MANY_CHARS");
  }

  return {
    format: format as DocumentFormat,
    fileName: file.name,
    text,
    charCount: text.length,
  };
}

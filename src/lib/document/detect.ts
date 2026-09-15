import type { DocumentFormat } from "./types";
import { SUPPORTED_EXTENSIONS } from "./types";

export function extensionOf(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i).toLowerCase() : "";
}

export function detectDocumentFormat(
  fileName: string,
): DocumentFormat | null {
  const ext = extensionOf(fileName);
  switch (ext) {
    case ".txt":
      return "txt";
    case ".md":
    case ".markdown":
      return "md";
    case ".html":
    case ".htm":
      return "html";
    case ".docx":
      return "docx";
    default:
      return null;
  }
}

export function isSupportedDocumentFile(fileName: string): boolean {
  return detectDocumentFormat(fileName) !== null;
}

export function acceptAttribute(): string {
  return SUPPORTED_EXTENSIONS.join(",");
}

export function translatedFileName(
  originalName: string,
  targetLanguage: string,
): string {
  const format = detectDocumentFormat(originalName);
  const ext = extensionOf(originalName) || ".txt";
  const base = originalName.slice(0, Math.max(0, originalName.length - ext.length));
  // DOCX is extracted to plain text; export as .txt
  const outExt = format === "docx" ? ".txt" : ext === ".markdown" ? ".md" : ext || ".txt";
  const safeLang = targetLanguage.replace(/[^\w-]+/g, "_") || "translated";
  return `${base}.${safeLang}${outExt}`;
}

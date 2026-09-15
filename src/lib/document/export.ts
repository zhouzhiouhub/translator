import { translatedFileName } from "@/lib/document/detect";

export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Build a download name for history / text results. */
export function historyDownloadFileName(options: {
  fileName?: string;
  targetLanguage: string;
  kind?: "text" | "document";
}): string {
  const safeLang =
    options.targetLanguage.replace(/[^\w-]+/g, "_") || "translated";
  if (options.fileName) {
    return translatedFileName(options.fileName, options.targetLanguage);
  }
  const prefix = options.kind === "document" ? "document" : "translation";
  return `${prefix}.${safeLang}.txt`;
}

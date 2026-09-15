import type { DocumentChunk } from "./types";
import { DOCUMENT_CHUNK_CHARS } from "./types";

const FENCE_RE = /^(`{3,}|~{3,})/;

/**
 * Split document text into translation chunks.
 * Keeps fenced code blocks intact (not translated as prose chunks alone —
 * they are still sent when glued to surrounding text under the size limit,
 * but we prefer to emit a fence as its own chunk so the model can leave it).
 */
export function chunkDocumentText(
  text: string,
  maxChars = DOCUMENT_CHUNK_CHARS,
): DocumentChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks = splitIntoBlocks(normalized);
  const chunks: DocumentChunk[] = [];
  let buffer = "";

  const flush = () => {
    const piece = buffer.trim();
    if (piece) {
      chunks.push({ index: chunks.length, text: piece });
    }
    buffer = "";
  };

  for (const block of blocks) {
    if (block.length > maxChars) {
      flush();
      for (const part of hardSplit(block, maxChars)) {
        chunks.push({ index: chunks.length, text: part });
      }
      continue;
    }

    const candidate = buffer ? `${buffer}\n\n${block}` : block;
    if (candidate.length <= maxChars) {
      buffer = candidate;
    } else {
      flush();
      buffer = block;
    }
  }
  flush();
  return chunks;
}

function splitIntoBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const fence = line.match(FENCE_RE);
    if (fence) {
      const marker = fence[1]![0]!;
      const len = fence[1]!.length;
      const fenceBody = [line];
      i += 1;
      while (i < lines.length) {
        fenceBody.push(lines[i]!);
        if (new RegExp(`^${marker}{${len},}\\s*$`).test(lines[i]!)) {
          i += 1;
          break;
        }
        i += 1;
      }
      blocks.push(fenceBody.join("\n"));
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i]!.trim() && !FENCE_RE.test(lines[i]!)) {
      para.push(lines[i]!);
      i += 1;
    }
    blocks.push(para.join("\n"));
  }

  return blocks;
}

function hardSplit(text: string, maxChars: number): string[] {
  const parts: string[] = [];
  let rest = text;
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf("\n", maxChars);
    if (cut < maxChars * 0.4) {
      cut = rest.lastIndexOf(" ", maxChars);
    }
    if (cut < maxChars * 0.4) {
      cut = maxChars;
    }
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trimStart();
  }
  if (rest) parts.push(rest);
  return parts.filter(Boolean);
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry, HistoryKind } from "@/types/translation";

const MAX_ENTRIES = 100;
/** Keep enough text for online preview without blowing localStorage. */
const MAX_STORED_TEXT = 12_000;

type NewHistoryEntry = Omit<HistoryEntry, "id" | "createdAt" | "kind"> & {
  kind?: HistoryKind;
};

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: NewHistoryEntry) => void;
  addBatchEntries: (entries: NewHistoryEntry[]) => void;
  removeEntry: (id: string) => void;
  removeBatch: (batchId: string) => void;
  clearAll: () => void;
  clearKind: (kind: HistoryKind) => void;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clip(text: string, max = MAX_STORED_TEXT) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function normalizeEntry(
  entry: NewHistoryEntry,
  createdAt: number,
): HistoryEntry {
  return {
    ...entry,
    id: createId(),
    createdAt,
    kind: entry.kind ?? "text",
    sourceText: clip(entry.sourceText),
    translatedText: clip(entry.translatedText),
  };
}

function migrateEntries(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const e = item as Partial<HistoryEntry>;
    return {
      id: e.id ?? createId(),
      createdAt: typeof e.createdAt === "number" ? e.createdAt : Date.now(),
      kind: e.kind === "document" ? "document" : "text",
      sourceText: e.sourceText ?? "",
      translatedText: e.translatedText ?? "",
      sourceLanguage: e.sourceLanguage,
      targetLanguage: e.targetLanguage ?? "en",
      style: e.style,
      model: e.model,
      durationMs: e.durationMs ?? 0,
      batchId: e.batchId,
      fileName: e.fileName,
    };
  });
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [normalizeEntry(entry, Date.now()), ...state.entries].slice(
            0,
            MAX_ENTRIES,
          ),
        })),
      addBatchEntries: (batch) =>
        set((state) => {
          if (batch.length === 0) return state;
          const createdAt = Date.now();
          const batchId = batch[0]?.batchId ?? createId();
          const prepared = batch.map((entry) =>
            normalizeEntry(
              { ...entry, batchId: entry.batchId ?? batchId },
              createdAt,
            ),
          );
          return {
            entries: [...prepared, ...state.entries].slice(0, MAX_ENTRIES),
          };
        }),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((item) => item.id !== id),
        })),
      removeBatch: (batchId) =>
        set((state) => ({
          entries: state.entries.filter((item) => item.batchId !== batchId),
        })),
      clearAll: () => set({ entries: [] }),
      clearKind: (kind) =>
        set((state) => ({
          entries: state.entries.filter((item) => item.kind !== kind),
        })),
    }),
    {
      name: "kinolin.history",
      partialize: (state) => ({ entries: state.entries }),
      merge: (persisted, current) => {
        const p = persisted as { entries?: unknown } | undefined;
        return {
          ...current,
          entries: migrateEntries(p?.entries ?? current.entries),
        };
      },
    },
  ),
);

export function createBatchId() {
  return createId();
}

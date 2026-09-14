import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry } from "@/types/translation";

const MAX_ENTRIES = 100;

type NewHistoryEntry = Omit<HistoryEntry, "id" | "createdAt">;

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: NewHistoryEntry) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: createId(),
              createdAt: Date.now(),
            },
            ...state.entries,
          ].slice(0, MAX_ENTRIES),
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((item) => item.id !== id),
        })),
      clearAll: () => set({ entries: [] }),
    }),
    {
      name: "kinolin.history",
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

import type { AIConfig } from "@/types/translation";

const STORAGE_KEY = "kinolin.aiConfig";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Phase 1: localStorage; prefer IndexedDB wrapper later without changing call sites. */
export async function loadAIConfig(): Promise<AIConfig | null> {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AIConfig;
  } catch {
    return null;
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export async function clearAIConfig(): Promise<void> {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}••••${key.slice(-4)}`;
}

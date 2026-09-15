import type { AIConfig } from "@/types/translation";

const STORAGE_KEY = "kinolin.aiConfig";
const PROVIDERS = new Set(["openai", "claude", "gemini", "deepseek", "compatible"]);
const MAX_MODEL_LENGTH = 200;
const MAX_BASE_URL_LENGTH = 2048;

// Keep the secret only for this page session. Persistent browser storage is
// intentionally limited to non-sensitive connection metadata.
let sessionApiKey = "";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function validateAIConfig(value: unknown): AIConfig | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AIConfig>;
  if (
    typeof candidate.provider !== "string" ||
    !PROVIDERS.has(candidate.provider) ||
    typeof candidate.model !== "string" ||
    candidate.model.trim().length === 0 ||
    candidate.model.length > MAX_MODEL_LENGTH ||
    typeof candidate.apiKey !== "string" ||
    candidate.apiKey.trim().length === 0
  ) {
    return null;
  }

  const baseUrl = candidate.baseUrl?.trim();
  if (candidate.provider === "compatible" && !isSafeBaseUrl(baseUrl)) {
    return null;
  }
  if (baseUrl && !isSafeBaseUrl(baseUrl)) return null;

  return {
    provider: candidate.provider as AIConfig["provider"],
    model: candidate.model.trim(),
    apiKey: candidate.apiKey.trim(),
    baseUrl: baseUrl || undefined,
    lastTestAt:
      typeof candidate.lastTestAt === "number" ? candidate.lastTestAt : undefined,
    lastTestOk:
      typeof candidate.lastTestOk === "boolean" ? candidate.lastTestOk : undefined,
  };
}

export function isSafeBaseUrl(value: string | undefined): value is string {
  if (!value || value.length > MAX_BASE_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname.includes("\\")) return false;
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export async function loadAIConfig(): Promise<AIConfig | null> {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const stored = parsed as Partial<AIConfig>;
    const config = validateAIConfig({ ...stored, apiKey: sessionApiKey });
    return config;
  } catch {
    return null;
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  if (!canUseStorage()) return;
  const validated = validateAIConfig(config);
  if (!validated) throw new Error("AI_CONFIG_INVALID");
  sessionApiKey = validated.apiKey;
  const { apiKey: _apiKey, ...metadata } = validated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
}

export async function clearAIConfig(): Promise<void> {
  sessionApiKey = "";
  if (canUseStorage()) localStorage.removeItem(STORAGE_KEY);
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}••••${key.slice(-4)}`;
}

import type { AIConfig } from "@/types/translation";

const STORAGE_KEY = "kinolin.aiConfig";
const DATABASE_NAME = "kinolin-secure-storage";
const DATABASE_VERSION = 1;
const KEY_STORE = "keys";
const SECRET_STORE = "secrets";
const API_KEY_ID = "ai-api-key";
const PROVIDERS = new Set(["openai", "claude", "gemini", "deepseek", "compatible"]);
const MAX_MODEL_LENGTH = 200;
const MAX_BASE_URL_LENGTH = 2048;

interface EncryptedSecret {
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
}

function canUseIndexedDb() {
  return (
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined" &&
    typeof window.crypto?.subtle !== "undefined"
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(KEY_STORE)) {
        database.createObjectStore(KEY_STORE);
      }
      if (!database.objectStoreNames.contains(SECRET_STORE)) {
        database.createObjectStore(SECRET_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("AI_STORAGE_UNAVAILABLE"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("AI_STORAGE_UNAVAILABLE"));
  });
}

async function getEncryptionKey(database: IDBDatabase, create: boolean): Promise<CryptoKey | null> {
  const readTransaction = database.transaction(KEY_STORE, "readonly");
  const stored = await requestResult(readTransaction.objectStore(KEY_STORE).get(API_KEY_ID));
  if (stored) return stored as CryptoKey;
  if (!create) return null;

  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const writeTransaction = database.transaction(KEY_STORE, "readwrite");
  writeTransaction.objectStore(KEY_STORE).put(key, API_KEY_ID);
  await new Promise<void>((resolve, reject) => {
    writeTransaction.oncomplete = () => resolve();
    writeTransaction.onerror = () => reject(writeTransaction.error ?? new Error("AI_STORAGE_UNAVAILABLE"));
  });
  return key;
}

async function encryptApiKey(apiKey: string): Promise<EncryptedSecret> {
  if (!canUseIndexedDb()) throw new Error("AI_STORAGE_UNAVAILABLE");
  const database = await openDatabase();
  try {
    const key = await getEncryptionKey(database, true);
    if (!key) throw new Error("AI_STORAGE_UNAVAILABLE");
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(apiKey),
    );
    return { iv: iv.buffer, ciphertext };
  } finally {
    database.close();
  }
}

async function decryptApiKey(secret: EncryptedSecret): Promise<string | null> {
  if (!canUseIndexedDb()) return null;
  const database = await openDatabase();
  try {
    const key = await getEncryptionKey(database, false);
    if (!key) return null;
    const plaintext = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: secret.iv },
      key,
      secret.ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  } finally {
    database.close();
  }
}

async function saveEncryptedApiKey(secret: EncryptedSecret): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SECRET_STORE, "readwrite");
    transaction.objectStore(SECRET_STORE).put(secret, API_KEY_ID);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("AI_STORAGE_UNAVAILABLE"));
    });
  } finally {
    database.close();
  }
}

async function loadEncryptedApiKey(): Promise<string | null> {
  if (!canUseIndexedDb()) return null;
  const database = await openDatabase();
  try {
    const request = database
      .transaction(SECRET_STORE, "readonly")
      .objectStore(SECRET_STORE)
      .get(API_KEY_ID);
    const secret = await requestResult(request);
    return secret ? decryptApiKey(secret as EncryptedSecret) : null;
  } finally {
    database.close();
  }
}

async function clearEncryptedApiKey(): Promise<void> {
  if (!canUseIndexedDb()) return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction([KEY_STORE, SECRET_STORE], "readwrite");
    transaction.objectStore(KEY_STORE).delete(API_KEY_ID);
    transaction.objectStore(SECRET_STORE).delete(API_KEY_ID);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("AI_STORAGE_UNAVAILABLE"));
    });
  } finally {
    database.close();
  }
}

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
    if (Object.prototype.hasOwnProperty.call(stored, "apiKey")) {
      // Remove the pre-encryption format instead of ever returning its secret.
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const apiKey = await loadEncryptedApiKey();
    const config = validateAIConfig({ ...stored, apiKey });
    return config;
  } catch {
    return null;
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  if (!canUseStorage()) return;
  const validated = validateAIConfig(config);
  if (!validated) throw new Error("AI_CONFIG_INVALID");
  const encryptedApiKey = await encryptApiKey(validated.apiKey);
  await saveEncryptedApiKey(encryptedApiKey);
  const { apiKey: _apiKey, ...metadata } = validated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
}

export async function clearAIConfig(): Promise<void> {
  await clearEncryptedApiKey();
  if (canUseStorage()) localStorage.removeItem(STORAGE_KEY);
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}••••${key.slice(-4)}`;
}

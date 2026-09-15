import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AIConfig,
  TranslationStyle,
  TranslateResult,
} from "@/types/translation";
import { checkAiConfig } from "@/agents/translator";
import {
  clearAIConfig,
  loadAIConfig,
  saveAIConfig,
} from "@/lib/security/ai-config-storage";

const MAX_CHARS = 2000;

function normalizeTargetLanguages(codes: string[] | undefined, fallback = "en") {
  const unique = [
    ...new Set((codes ?? []).map((c) => c.trim()).filter(Boolean)),
  ];
  return unique.length > 0 ? unique : [fallback];
}

interface AppState {
  sourceLanguage: string;
  /** Primary / first target — kept in sync with targetLanguages[0]. */
  targetLanguage: string;
  /** Batch target languages (persisted across refresh). */
  targetLanguages: string[];
  style: TranslationStyle;
  followUiToTarget: boolean;
  inputText: string;
  result: TranslateResult | null;
  aiConfig: AIConfig | null;
  aiConfigured: boolean;
  maxChars: number;
  setSourceLanguage: (v: string) => void;
  setTargetLanguage: (v: string) => void;
  setTargetLanguages: (v: string[]) => void;
  setStyle: (v: TranslationStyle) => void;
  setFollowUiToTarget: (v: boolean) => void;
  setInputText: (v: string) => void;
  setResult: (v: TranslateResult | null) => void;
  hydrateAiConfig: () => Promise<void>;
  setAiConfig: (config: AIConfig) => Promise<void>;
  clearAiKey: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sourceLanguage: "auto",
      targetLanguage: "en",
      targetLanguages: ["en"],
      style: "default",
      followUiToTarget: false,
      inputText: "",
      result: null,
      aiConfig: null,
      aiConfigured: false,
      maxChars: MAX_CHARS,
      setSourceLanguage: (sourceLanguage) => set({ sourceLanguage }),
      setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
      setTargetLanguages: (codes) =>
        set(() => {
          const targetLanguages = normalizeTargetLanguages(codes);
          return {
            targetLanguages,
            targetLanguage: targetLanguages[0]!,
          };
        }),
      setStyle: (style) => set({ style }),
      setFollowUiToTarget: (followUiToTarget) => set({ followUiToTarget }),
      setInputText: (inputText) =>
        set({ inputText: inputText.slice(0, MAX_CHARS) }),
      setResult: (result) => set({ result }),
      hydrateAiConfig: async () => {
        const aiConfig = await loadAIConfig();
        set({
          aiConfig,
          aiConfigured: checkAiConfig(aiConfig).ok,
        });
      },
      setAiConfig: async (config) => {
        await saveAIConfig(config);
        set({
          aiConfig: config,
          aiConfigured: checkAiConfig(config).ok,
        });
      },
      clearAiKey: async () => {
        await clearAIConfig();
        set({ aiConfig: null, aiConfigured: false });
      },
    }),
    {
      name: "kinolin.app",
      partialize: (state) => ({
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        targetLanguages: state.targetLanguages,
        style: state.style,
        followUiToTarget: state.followUiToTarget,
        // never persist apiKey here — kept in dedicated storage module
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const targetLanguages = normalizeTargetLanguages(
          p.targetLanguages ??
            (p.targetLanguage ? [p.targetLanguage] : undefined),
          current.targetLanguage,
        );
        return {
          ...current,
          ...p,
          targetLanguages,
          targetLanguage: targetLanguages[0] ?? current.targetLanguage,
        };
      },
    },
  ),
);

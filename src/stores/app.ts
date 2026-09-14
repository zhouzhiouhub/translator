import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AIConfig,
  TranslationEngine,
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

interface AppState {
  sourceLanguage: string;
  targetLanguage: string;
  engine: TranslationEngine;
  style: TranslationStyle;
  followUiToTarget: boolean;
  inputText: string;
  result: TranslateResult | null;
  aiConfig: AIConfig | null;
  aiConfigured: boolean;
  maxChars: number;
  setSourceLanguage: (v: string) => void;
  setTargetLanguage: (v: string) => void;
  setEngine: (v: TranslationEngine) => void;
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
      engine: "google",
      style: "default",
      followUiToTarget: false,
      inputText: "",
      result: null,
      aiConfig: null,
      aiConfigured: false,
      maxChars: MAX_CHARS,
      setSourceLanguage: (sourceLanguage) => set({ sourceLanguage }),
      setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
      setEngine: (engine) => set({ engine }),
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
        engine: state.engine,
        style: state.style,
        followUiToTarget: state.followUiToTarget,
        // never persist apiKey here — kept in dedicated storage module
      }),
    },
  ),
);

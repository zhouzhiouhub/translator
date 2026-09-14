import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIConfig } from "@/types/translation";
import {
  getSourceVersionHash,
  runLocalePackGeneration,
  SOURCE_MESSAGES,
  REFERENCE_MESSAGES,
} from "@/agents/locale-pack";
import { loadLocalePack } from "@/lib/locale-pack/cache";
import { translationCoverage } from "@/lib/locale-pack/validate";
import {
  isFixedUiLocale,
  isUiLocale,
  type UiLocale,
} from "@/i18n/ui-locales";

const MIN_COVERAGE_RATIO = 0.35;

export type UiLocaleStatus =
  | "idle"
  | "generating"
  | "ready"
  | "error";

interface UiLocaleState {
  preferredUiLocale: UiLocale;
  /** Active dynamic messages (null = use route/SSR messages). */
  dynamicMessages: Record<string, unknown> | null;
  status: UiLocaleStatus;
  errorMessage: string | null;
  lastWarnings: string[];
  setPreferredUiLocale: (locale: UiLocale) => void;
  hydrateDynamicPack: () => Promise<void>;
  /**
   * Apply a UI locale. Fixed → caller should also navigate.
   * Dynamic → generate/load pack and set dynamicMessages.
   */
  applyLocale: (
    locale: UiLocale,
    options?: { aiConfig?: AIConfig | null; force?: boolean },
  ) => Promise<{ kind: "fixed" | "dynamic"; locale: UiLocale }>;
  clearDynamicOverride: () => void;
  packStatusFor: (locale: UiLocale) => Promise<"builtin" | "cached" | "needGenerate">;
}

export const useUiLocaleStore = create<UiLocaleState>()(
  persist(
    (set, get) => ({
      preferredUiLocale: "zh-CN",
      dynamicMessages: null,
      status: "idle",
      errorMessage: null,
      lastWarnings: [],

      setPreferredUiLocale: (preferredUiLocale) => set({ preferredUiLocale }),

      clearDynamicOverride: () =>
        set({ dynamicMessages: null, status: "idle", errorMessage: null }),

      hydrateDynamicPack: async () => {
        const { preferredUiLocale } = get();
        if (isFixedUiLocale(preferredUiLocale)) {
          set({ dynamicMessages: null, status: "idle" });
          return;
        }
        const hash = getSourceVersionHash();
        const cached = await loadLocalePack(preferredUiLocale, hash);
        if (!cached) return;

        const coverage = translationCoverage(SOURCE_MESSAGES, cached.messages);
        if (coverage.ratio < MIN_COVERAGE_RATIO) {
          set({ dynamicMessages: null, status: "idle" });
          return;
        }

        set({
          dynamicMessages: cached.messages,
          status: "ready",
          errorMessage: null,
        });
      },

      packStatusFor: async (locale) => {
        if (isFixedUiLocale(locale)) return "builtin";
        const cached = await loadLocalePack(locale, getSourceVersionHash());
        if (!cached) return "needGenerate";
        const coverage = translationCoverage(SOURCE_MESSAGES, cached.messages);
        return coverage.ratio >= MIN_COVERAGE_RATIO ? "cached" : "needGenerate";
      },

      applyLocale: async (locale, options) => {
        if (!isUiLocale(locale)) {
          throw new Error(`Unsupported UI locale: ${locale}`);
        }

        if (isFixedUiLocale(locale)) {
          set({
            preferredUiLocale: locale,
            dynamicMessages: null,
            status: "idle",
            errorMessage: null,
            lastWarnings: [],
          });
          return { kind: "fixed", locale };
        }

        set({
          status: "generating",
          errorMessage: null,
          preferredUiLocale: locale,
        });

        try {
          const result = await runLocalePackGeneration({
            targetLocale: locale,
            aiConfig: options?.aiConfig,
            force: options?.force,
          });
          set({
            preferredUiLocale: locale,
            dynamicMessages: result.messages,
            status: "ready",
            errorMessage: null,
            lastWarnings: result.warnings,
          });
          return { kind: "dynamic", locale };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "LOCALE_PACK_FAILED";
          set({
            status: "error",
            errorMessage: message,
          });
          throw err;
        }
      },
    }),
    {
      name: "kinolin.uiLocale",
      partialize: (state) => ({
        preferredUiLocale: state.preferredUiLocale,
      }),
    },
  ),
);

export function fixedMessagesFor(locale: "zh-CN" | "en-US") {
  return locale === "en-US" ? REFERENCE_MESSAGES : SOURCE_MESSAGES;
}

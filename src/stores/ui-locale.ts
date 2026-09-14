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
  DYNAMIC_UI_LOCALES,
  FIXED_UI_LOCALES,
  isFixedUiLocale,
  isUiLocale,
  type UiLocale,
} from "@/i18n/ui-locales";

const MIN_COVERAGE_RATIO = 0.35;

export type UiLocaleStatus = "idle" | "generating" | "ready" | "error";

interface UiLocaleState {
  preferredUiLocale: UiLocale;
  /** Active dynamic messages (null = use route/SSR messages). */
  dynamicMessages: Record<string, unknown> | null;
  /** Generated packs ready to appear in the top switcher. */
  readyLocales: UiLocale[];
  status: UiLocaleStatus;
  errorMessage: string | null;
  lastWarnings: string[];
  setPreferredUiLocale: (locale: UiLocale) => void;
  hydrateDynamicPack: () => Promise<void>;
  refreshReadyLocales: () => Promise<void>;
  /** Generate (and cache) only — does not switch UI. */
  generatePack: (
    locale: UiLocale,
    options?: { aiConfig?: AIConfig | null; force?: boolean },
  ) => Promise<void>;
  /**
   * Apply a ready UI locale. Fixed → caller should also navigate.
   * Dynamic → load cache only (must already be generated).
   */
  applyLocale: (
    locale: UiLocale,
  ) => Promise<{ kind: "fixed" | "dynamic"; locale: UiLocale }>;
  clearDynamicOverride: () => void;
  packStatusFor: (
    locale: UiLocale,
  ) => Promise<"builtin" | "cached" | "needGenerate">;
}

async function isPackReady(locale: UiLocale): Promise<boolean> {
  if (isFixedUiLocale(locale)) return true;
  const cached = await loadLocalePack(locale, getSourceVersionHash());
  if (!cached) return false;
  return (
    translationCoverage(SOURCE_MESSAGES, cached.messages).ratio >=
    MIN_COVERAGE_RATIO
  );
}

export const useUiLocaleStore = create<UiLocaleState>()(
  persist(
    (set, get) => ({
      preferredUiLocale: "zh-CN",
      dynamicMessages: null,
      readyLocales: [...FIXED_UI_LOCALES],
      status: "idle",
      errorMessage: null,
      lastWarnings: [],

      setPreferredUiLocale: (preferredUiLocale) => set({ preferredUiLocale }),

      clearDynamicOverride: () =>
        set({ dynamicMessages: null, status: "idle", errorMessage: null }),

      refreshReadyLocales: async () => {
        const ready: UiLocale[] = [...FIXED_UI_LOCALES];
        for (const locale of DYNAMIC_UI_LOCALES) {
          if (await isPackReady(locale)) ready.push(locale);
        }
        set({ readyLocales: ready });
      },

      hydrateDynamicPack: async () => {
        await get().refreshReadyLocales();
        const { preferredUiLocale } = get();
        if (isFixedUiLocale(preferredUiLocale)) {
          set({ dynamicMessages: null, status: "idle" });
          return;
        }
        const hash = getSourceVersionHash();
        const cached = await loadLocalePack(preferredUiLocale, hash);
        if (!cached) {
          // Preferred dynamic pack missing — fall back visually to route locale.
          set({ dynamicMessages: null, status: "idle" });
          return;
        }

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
        return (await isPackReady(locale)) ? "cached" : "needGenerate";
      },

      generatePack: async (locale, options) => {
        if (!isUiLocale(locale)) {
          throw new Error(`Unsupported UI locale: ${locale}`);
        }
        if (isFixedUiLocale(locale)) {
          await get().refreshReadyLocales();
          return;
        }

        set({ status: "generating", errorMessage: null });
        try {
          const result = await runLocalePackGeneration({
            targetLocale: locale,
            aiConfig: options?.aiConfig,
            force: options?.force ?? false,
          });
          set({
            status: "idle",
            errorMessage: null,
            lastWarnings: result.warnings,
          });
          await get().refreshReadyLocales();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "LOCALE_PACK_FAILED";
          set({ status: "error", errorMessage: message });
          throw err;
        }
      },

      applyLocale: async (locale) => {
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

        if (!(await isPackReady(locale))) {
          throw new Error("LOCALE_PACK_NOT_READY");
        }

        const cached = await loadLocalePack(locale, getSourceVersionHash());
        if (!cached) throw new Error("LOCALE_PACK_NOT_READY");

        set({
          preferredUiLocale: locale,
          dynamicMessages: cached.messages,
          status: "ready",
          errorMessage: null,
        });
        return { kind: "dynamic", locale };
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

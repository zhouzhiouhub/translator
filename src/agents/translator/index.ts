import type { AIConfig, TranslateInput, TranslateResult } from "@/types/translation";
import { AITranslator } from "@/translation/ai/AITranslator";

export interface TranslateOrchestrationInput extends TranslateInput {
  aiConfig?: AIConfig | null;
}

export interface AiConfigCheck {
  ok: boolean;
  hasProvider: boolean;
  hasModel: boolean;
  hasKey: boolean;
  connectionOk: boolean | null;
}

export function checkAiConfig(config?: AIConfig | null): AiConfigCheck {
  const hasProvider = Boolean(config?.provider);
  const hasModel = Boolean(config?.model?.trim());
  const hasKey = Boolean(config?.apiKey?.trim());
  const connectionOk =
    typeof config?.lastTestOk === "boolean" ? config.lastTestOk : null;
  const ok = hasProvider && hasModel && hasKey;
  return { ok, hasProvider, hasModel, hasKey, connectionOk };
}

/** Translation Agent — BYOK AI only. */
export async function runTranslation(
  input: TranslateOrchestrationInput,
): Promise<TranslateResult> {
  const check = checkAiConfig(input.aiConfig);
  if (!check.ok || !input.aiConfig) {
    throw new Error("AI_NOT_CONFIGURED");
  }
  const translator = new AITranslator(input.aiConfig);
  return translator.translate(input);
}

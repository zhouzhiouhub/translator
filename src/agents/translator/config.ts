import type { AIConfig } from "@/types/translation";

export interface AiConfigCheck {
  ok: boolean;
  hasProvider: boolean;
  hasModel: boolean;
  hasKey: boolean;
  connectionOk: boolean | null;
}

export type BatchItemStatus = "done" | "pending";

export function checkAiConfig(config?: AIConfig | null): AiConfigCheck {
  const hasProvider = Boolean(config?.provider);
  const hasModel = Boolean(config?.model?.trim());
  const hasKey = Boolean(config?.apiKey?.trim());
  const connectionOk =
    typeof config?.lastTestOk === "boolean" ? config.lastTestOk : null;
  const ok = hasProvider && hasModel && hasKey;
  return { ok, hasProvider, hasModel, hasKey, connectionOk };
}

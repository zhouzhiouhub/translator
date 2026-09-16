import type { AiProviderId } from "@/types/translation";

export const PROVIDER_OPTIONS: { id: AiProviderId; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "compatible", label: "OpenAI Compatible" },
];

export const DEFAULT_MODELS: Record<AiProviderId, string> = {
  openai: "gpt-4o",
  claude: "claude-sonnet-4-20250514",
  gemini: "gemini-3.5-flash-lite",
  deepseek: "deepseek-chat",
  compatible: "",
};

/** Suggested models shown in AI config UI */
export const MODEL_SUGGESTIONS: Partial<Record<AiProviderId, string[]>> = {
  gemini: [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
  ],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  openai: ["gpt-4o", "gpt-4o-mini"],
};

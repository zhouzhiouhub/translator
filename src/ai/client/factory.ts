import type { AIConfig, AiProviderId } from "@/types/translation";
import type { AIProvider } from "@/ai/types";
import { OpenAIProvider } from "@/ai/providers/openai";
import { ClaudeProvider } from "@/ai/providers/claude";
import { GeminiProvider } from "@/ai/providers/gemini";
import { DeepSeekProvider } from "@/ai/providers/deepseek";
import { OpenAICompatibleProvider } from "@/ai/providers/compatible";

export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "claude":
      return new ClaudeProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    case "deepseek":
      return new DeepSeekProvider(config);
    case "compatible":
      return new OpenAICompatibleProvider(config);
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

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
  gemini: "gemini-2.0-flash",
  deepseek: "deepseek-chat",
  compatible: "",
};

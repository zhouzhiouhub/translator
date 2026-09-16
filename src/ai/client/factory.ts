import type { AIConfig } from "@/types/translation";
import type { AIProvider } from "@/ai/types";
import { OpenAIProvider } from "@/ai/providers/openai";
import { ClaudeProvider } from "@/ai/providers/claude";
import { GeminiProvider } from "@/ai/providers/gemini";
import { DeepSeekProvider } from "@/ai/providers/deepseek";
import { OpenAICompatibleProvider } from "@/ai/providers/compatible";

export { DEFAULT_MODELS, MODEL_SUGGESTIONS, PROVIDER_OPTIONS } from "./options";

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

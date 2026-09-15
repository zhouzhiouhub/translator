/**
 * Map machine-readable provider / AI errors to localized UI copy.
 * Providers should throw codes like `GEMINI_MODEL_MISSING|model|sample`.
 */

function withDetail(detail: string | undefined): string {
  const d = detail?.trim();
  return d ? ` ${d}` : "";
}

export function mapProviderError(
  message: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const [code, ...parts] = message.split("|");

  switch (code) {
    case "GEMINI_MODEL_MISSING":
      return t("geminiModelMissing", {
        model: parts[0] ?? "",
        sample: parts[1] ?? "",
      });
    case "GEMINI_HTTP_404":
      return t("geminiHttp404", {
        phase: parts[0] ?? "",
        model: parts[1] ?? "",
        detail: withDetail(parts[2]),
      });
    case "GEMINI_HTTP_AUTH":
      return t("geminiHttpAuth", {
        status: parts[0] ?? "",
        detail: withDetail(parts[1]),
      });
    case "GEMINI_HTTP":
      return t("geminiHttpGeneric", {
        status: parts[0] ?? "",
        detail: withDetail(parts[1]),
      });
    case "GEMINI_EMPTY":
      return t("geminiEmpty");
    case "PROVIDER_HTTP":
      return t("providerHttp", {
        provider: parts[0] ?? "AI",
        status: parts[1] ?? "",
        detail: withDetail(parts[2]),
      });
    case "PROVIDER_EMPTY":
      return t("providerEmpty", { provider: parts[0] ?? "AI" });
    default:
      return message;
  }
}

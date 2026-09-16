"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_MODELS, PROVIDER_OPTIONS } from "@/ai/client/options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageContainer } from "@/components/layout/page-container";
import { CustomPromptEditor } from "@/components/translator/custom-prompt-editor";
import { mapProviderError } from "@/lib/i18n/map-provider-error";
import {
  isSafeBaseUrl,
  maskApiKey,
  validateAIConfig,
} from "@/lib/security/ai-config-storage";
import { useAppStore } from "@/stores/app";
import type { AiProviderId } from "@/types/translation";

const MODEL_PLACEHOLDER_KEYS = {
  openai: "modelPlaceholderOpenai",
  claude: "modelPlaceholderClaude",
  gemini: "modelPlaceholderGemini",
  deepseek: "modelPlaceholderDeepseek",
  compatible: "modelPlaceholderCompatible",
} as const;

export function AiConfigForm() {
  const t = useTranslations("aiConfig");
  const tCommon = useTranslations("common");
  const { aiConfig, hydrateAiConfig, setAiConfig, clearAiKey, aiConfigured, customPrompt, setCustomPrompt } =
    useAppStore();

  const [provider, setProvider] = useState<AiProviderId>("openai");
  const [model, setModel] = useState(DEFAULT_MODELS.openai);
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyPreview, setKeyPreview] = useState("");

  // Uncontrolled password field — browser autofill often does not update React state
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  useEffect(() => {
    if (!aiConfig) return;
    // Sync the external persisted config into the editable form controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(aiConfig.provider);
    setModel(aiConfig.model || DEFAULT_MODELS[aiConfig.provider]);
    setBaseUrl(aiConfig.baseUrl ?? "");
    setKeyPreview(aiConfig.apiKey ? maskApiKey(aiConfig.apiKey) : "");
    if (apiKeyRef.current) {
      apiKeyRef.current.value = aiConfig.apiKey;
    }
  }, [aiConfig]);

  function flash(tone: "ok" | "error", text: string) {
    setMessageTone(tone);
    setMessage(text);
  }

  function readApiKey() {
    return (apiKeyRef.current?.value ?? "").trim();
  }

  function readModel() {
    const fromInput = (modelRef.current?.value ?? model).trim();
    return fromInput || DEFAULT_MODELS[provider];
  }

  async function onTestConnection() {
    if (testing) return;
    setTesting(true);
    try {
      const nextModel = readModel();
      const nextKey = readApiKey();
      if (!nextModel || !nextKey) {
        throw new Error(t("saveIncomplete"));
      }
      if (provider === "compatible" && !baseUrl.trim()) {
        throw new Error("AI_BASE_URL_MISSING");
      }
      const config = {
        provider,
        model: nextModel,
        apiKey: nextKey,
        baseUrl: provider === "compatible" ? baseUrl.trim() : undefined,
      };
      if (!validateAIConfig(config)) throw new Error("AI_CONFIG_INVALID");
      const { createAIProvider } = await import("@/ai/client/factory");
      const p = createAIProvider(config);
      const ok = await p.testConnection();
      if (!ok) throw new Error(t("statusFailed"));
      await setAiConfig({
        ...config,
        lastTestAt: Date.now(),
        lastTestOk: true,
      });
      flash("ok", t("testSuccess"));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      flash("error", mapProviderError(error.message, t) || t("statusFailed"));
    } finally {
      setTesting(false);
    }
  }

  async function onSave() {
    setSaving(true);
    try {
      const nextModel = readModel();
      const nextKey = readApiKey();

      if (!nextKey || !nextModel) {
        flash("error", t("saveIncomplete"));
        return;
      }
      if (provider === "compatible" && !baseUrl.trim()) {
        flash("error", t("baseUrlMissing"));
        return;
      }
      if (baseUrl.trim() && !isSafeBaseUrl(baseUrl.trim())) {
        flash("error", t("baseUrlInvalid"));
        return;
      }

      setModel(nextModel);
      setKeyPreview(maskApiKey(nextKey));

      const config = {
        provider,
        model: nextModel,
        apiKey: nextKey,
        baseUrl: provider === "compatible" ? baseUrl.trim() : undefined,
        lastTestAt: aiConfig?.lastTestAt,
        lastTestOk: aiConfig?.lastTestOk,
      };
      if (!validateAIConfig(config)) {
        flash("error", t("configInvalid"));
        return;
      }
      await setAiConfig(config);

      flash("ok", t("saveSuccess"));
    } catch {
      flash("error", t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const statusTone = !aiConfigured
    ? "warning"
    : aiConfig?.lastTestOk === false
      ? "danger"
      : aiConfig?.lastTestOk === true
        ? "success"
        : "primary";
  const statusLabel = !aiConfigured
    ? t("statusUnconfigured")
    : aiConfig?.lastTestOk === false
      ? t("statusFailed")
      : aiConfig?.lastTestOk === true
        ? t("statusConfigured")
        : t("statusSavedNeedTest");

  const showErrorHints =
    messageTone === "error" || aiConfig?.lastTestOk === false;

  return (
    <PageContainer>
      <header>
        <h1 className="text-2xl font-semibold text-brand-ink">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("localOnlyHint")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">{t("status")}</span>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </div>

        {message ? (
          <div
            role="status"
            className={
              messageTone === "error"
                ? "mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                : "mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            }
          >
            {message}
          </div>
        ) : null}

        {aiConfigured && aiConfig ? (
          <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
            {t("savedSummary", {
              provider: aiConfig.provider,
              model: aiConfig.model || "—",
              key: maskApiKey(aiConfig.apiKey),
            })}
          </p>
        ) : null}

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave();
          }}
        >
          <Field label={t("provider")} htmlFor="ai-provider-select">
            <Select
              id="ai-provider-select"
              value={provider}
              onChange={(e) => {
                const next = e.target.value as AiProviderId;
                setProvider(next);
                setModel(DEFAULT_MODELS[next]);
              }}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("model")} htmlFor="ai-model-input">
            <Input
              id="ai-model-input"
              ref={modelRef}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t(MODEL_PLACEHOLDER_KEYS[provider])}
            />
          </Field>

          {provider === "gemini" && showErrorHints ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
              {t("geminiNetworkHint")}
            </p>
          ) : null}

          <Field label={t("apiKey")}>
            <div className="flex gap-2">
              <Input
                ref={apiKeyRef}
                type={showKey ? "text" : "password"}
                defaultValue=""
                autoComplete="off"
                name="kinolin-ai-api-key"
                onChange={(e) => setKeyPreview(maskApiKey(e.target.value))}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? t("hideKey") : t("showKey")}
              </Button>
            </div>
            {keyPreview ? (
              <p className="mt-1 text-xs text-muted">{keyPreview}</p>
            ) : (
              <p className="mt-1 text-xs text-muted">{t("apiKeyEmptyHint")}</p>
            )}
          </Field>

          {provider === "compatible" ? (
            <Field label={t("apiBase")}>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("baseUrlPlaceholder")}
              />
              <p className="mt-1 text-xs text-warning">{t("compatiblePhishHint")}</p>
              <p className="mt-1 text-xs text-muted">{t("apiBaseHint")}</p>
            </Field>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? tCommon("loading") : t("save")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={testing}
              onClick={() => void onTestConnection()}
            >
              {testing ? tCommon("loading") : t("testConnection")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void (async () => {
                  await clearAiKey();
                  if (apiKeyRef.current) apiKeyRef.current.value = "";
                  setKeyPreview("");
                  setModel(DEFAULT_MODELS.openai);
                  setProvider("openai");
                  setBaseUrl("");
                  flash("ok", t("clearKey"));
                })();
              }}
            >
              {t("clearKey")}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-medium text-brand-ink">
          {t("customPromptSectionTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("customPromptSectionDesc")}</p>
        <div className="mt-4">
          <CustomPromptEditor
            value={customPrompt}
            onSave={setCustomPrompt}
          />
        </div>
      </section>

      <p className="text-sm text-muted">{t("byokNotice")}</p>
    </PageContainer>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

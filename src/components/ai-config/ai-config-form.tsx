"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  createAIProvider,
  DEFAULT_MODELS,
  PROVIDER_OPTIONS,
} from "@/ai/client/factory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { maskApiKey } from "@/lib/security/ai-config-storage";
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
  const { aiConfig, hydrateAiConfig, setAiConfig, clearAiKey, aiConfigured } =
    useAppStore();

  const [provider, setProvider] = useState<AiProviderId>("openai");
  const [model, setModel] = useState(DEFAULT_MODELS.openai);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  useEffect(() => {
    if (!aiConfig) return;
    setProvider(aiConfig.provider);
    setModel(aiConfig.model || DEFAULT_MODELS[aiConfig.provider]);
    setApiKey(aiConfig.apiKey);
    setBaseUrl(aiConfig.baseUrl ?? "");
  }, [aiConfig]);

  function flash(tone: "ok" | "error", text: string) {
    setMessageTone(tone);
    setMessage(text);
  }

  const testMutation = useMutation({
    mutationFn: async () => {
      const nextModel = model.trim() || DEFAULT_MODELS[provider];
      const nextKey = apiKey.trim();
      if (!nextModel || !nextKey) {
        throw new Error(t("saveIncomplete"));
      }
      if (provider === "compatible" && !baseUrl.trim()) {
        throw new Error(t("saveIncomplete"));
      }
      const config = {
        provider,
        model: nextModel,
        apiKey: nextKey,
        baseUrl: provider === "compatible" ? baseUrl.trim() : undefined,
      };
      const p = createAIProvider(config);
      const ok = await p.testConnection();
      if (!ok) throw new Error(t("statusFailed"));
      await setAiConfig({
        ...config,
        lastTestAt: Date.now(),
        lastTestOk: true,
      });
      return true;
    },
    onSuccess: () => flash("ok", t("testSuccess")),
    onError: (err: Error) => flash("error", err.message || t("statusFailed")),
  });

  async function onSave() {
    setSaving(true);
    try {
      const nextModel = (model.trim() || DEFAULT_MODELS[provider]).trim();
      const nextKey = apiKey.trim();

      if (!nextKey) {
        flash("error", t("saveIncomplete"));
        return;
      }
      if (!nextModel) {
        flash("error", t("saveIncomplete"));
        return;
      }
      if (provider === "compatible" && !baseUrl.trim()) {
        flash("error", t("saveIncomplete"));
        return;
      }

      // Keep controlled input in sync if we fell back to default model
      if (!model.trim() && nextModel) {
        setModel(nextModel);
      }

      await setAiConfig({
        provider,
        model: nextModel,
        apiKey: nextKey,
        baseUrl: provider === "compatible" ? baseUrl.trim() : undefined,
        lastTestAt: aiConfig?.lastTestAt,
        lastTestOk: aiConfig?.lastTestOk,
      });

      flash("ok", t("saveSuccess"));
    } catch (err) {
      const text =
        err instanceof Error && err.message
          ? err.message
          : "保存失败，请检查浏览器是否禁用了本地存储";
      flash("error", text);
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
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

        <div className="grid gap-4">
          <Field label={t("provider")}>
            <Select
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

          <Field label={t("model")}>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t(MODEL_PLACEHOLDER_KEYS[provider])}
            />
          </Field>

          <Field label={t("apiKey")}>
            <div className="flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
                autoComplete="off"
                name="kinolin-ai-api-key"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? "Hide" : "Show"}
              </Button>
            </div>
            {apiKey ? (
              <p className="mt-1 text-xs text-muted">{maskApiKey(apiKey)}</p>
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
            <Button
              type="button"
              disabled={saving}
              onClick={() => {
                void onSave();
              }}
            >
              {saving ? tCommon("loading") : t("save")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={testMutation.isPending}
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending ? tCommon("loading") : t("testConnection")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                void (async () => {
                  await clearAiKey();
                  setApiKey("");
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
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
        {t("byokNotice")}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">{t("compareAi")}</h3>
        <p className="mt-1 text-xs text-muted">{t("compareAiDesc")}</p>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  // Use div instead of label so nested buttons (Show / etc.) don't steal clicks
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}

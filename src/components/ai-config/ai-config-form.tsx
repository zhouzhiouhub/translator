"use client";

import { useEffect, useRef, useState } from "react";
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
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");
  const [saving, setSaving] = useState(false);
  const [keyPreview, setKeyPreview] = useState("");

  // Uncontrolled password field — browser autofill often does not update React state
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  useEffect(() => {
    if (!aiConfig) return;
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

  const testMutation = useMutation({
    mutationFn: async () => {
      const nextModel = readModel();
      const nextKey = readApiKey();
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
      const nextModel = readModel();
      const nextKey = readApiKey();

      if (!nextKey || !nextModel) {
        flash("error", t("saveIncomplete"));
        return;
      }
      if (provider === "compatible" && !baseUrl.trim()) {
        flash("error", t("saveIncomplete"));
        return;
      }

      setModel(nextModel);
      setKeyPreview(maskApiKey(nextKey));

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

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave();
          }}
        >
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
              ref={modelRef}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t(MODEL_PLACEHOLDER_KEYS[provider])}
            />
          </Field>

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
                {showKey ? "Hide" : "Show"}
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
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}

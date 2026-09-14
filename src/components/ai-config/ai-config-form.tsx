"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { createAIProvider, DEFAULT_MODELS, PROVIDER_OPTIONS } from "@/ai/client/factory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { maskApiKey } from "@/lib/security/ai-config-storage";
import { useAppStore } from "@/stores/app";
import type { AiProviderId } from "@/types/translation";

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

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  useEffect(() => {
    if (!aiConfig) return;
    setProvider(aiConfig.provider);
    setModel(aiConfig.model);
    setApiKey(aiConfig.apiKey);
    setBaseUrl(aiConfig.baseUrl ?? "");
  }, [aiConfig]);

  const testMutation = useMutation({
    mutationFn: async () => {
      const config = {
        provider,
        model: model.trim(),
        apiKey: apiKey.trim(),
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
    onSuccess: () => setMessage(t("testSuccess")),
    onError: (err: Error) => setMessage(err.message),
  });

  async function onSave() {
    await setAiConfig({
      provider,
      model: model.trim(),
      apiKey: apiKey.trim(),
      baseUrl: provider === "compatible" ? baseUrl.trim() : undefined,
      lastTestAt: aiConfig?.lastTestAt,
      lastTestOk: aiConfig?.lastTestOk,
    });
    setMessage(tCommon("save"));
  }

  const statusTone = !aiConfigured
    ? "warning"
    : aiConfig?.lastTestOk === false
      ? "danger"
      : "success";
  const statusLabel = !aiConfigured
    ? t("statusUnconfigured")
    : aiConfig?.lastTestOk === false
      ? t("statusFailed")
      : t("statusConfigured");

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
              placeholder={t("modelPlaceholder")}
            />
          </Field>

          <Field label={t("apiKey")}>
            <div className="flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
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
            ) : null}
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
            <Button type="button" onClick={() => void onSave()}>
              {t("save")}
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
              onClick={async () => {
                await clearAiKey();
                setApiKey("");
                setMessage(t("clearKey"));
              }}
            >
              {t("clearKey")}
            </Button>
          </div>

          {message ? <p className="text-sm text-primary">{message}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
        {t("byokNotice")}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">{t("compareAi")}</h3>
          <p className="mt-1 text-xs text-muted">{t("compareAiDesc")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">{t("compareGoogle")}</h3>
          <p className="mt-1 text-xs text-muted">{t("compareGoogleDesc")}</p>
        </div>
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
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

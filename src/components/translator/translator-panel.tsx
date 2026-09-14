"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";
import { checkAiConfig, runTranslation } from "@/agents/translator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app";
import type { TranslationStyle } from "@/types/translation";

const TARGET_LANGS = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "ru", label: "Русский" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
];

const STYLES: TranslationStyle[] = [
  "default",
  "natural",
  "casual",
  "business",
  "formal",
  "technical",
  "academic",
  "localized",
];

export function TranslatorPanel() {
  const t = useTranslations("translator");
  const tGate = useTranslations("aiGate");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  const {
    inputText,
    setInputText,
    engine,
    setEngine,
    targetLanguage,
    setTargetLanguage,
    style,
    setStyle,
    followUiToTarget,
    setFollowUiToTarget,
    result,
    setResult,
    aiConfig,
    aiConfigured,
    maxChars,
    hydrateAiConfig,
  } = useAppStore();

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  const mutation = useMutation({
    mutationFn: () =>
      runTranslation({
        text: inputText,
        targetLanguage,
        style,
        engine,
        aiConfig,
      }),
    onSuccess: (data) => setResult(data),
    onError: (err: Error) => {
      if (err.message === "AI_NOT_CONFIGURED") {
        setGateOpen(true);
        return;
      }
      setToast(err.message);
    },
  });

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function onTranslate() {
    if (!inputText.trim()) {
      showToast(t("emptyInput"));
      return;
    }
    if (engine === "ai") {
      const check = checkAiConfig(aiConfig);
      if (!check.ok) {
        setGateOpen(true);
        return;
      }
    }
    mutation.mutate();
  }

  const check = checkAiConfig(aiConfig);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
          {t("greeting")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className="rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
          >
            {t("tabText")}
          </button>
          <button
            type="button"
            disabled
            className="rounded-xl px-3 py-1.5 text-sm text-muted"
          >
            {t("tabDocument")}
            <span className="ml-2 text-[11px] text-warning">{tCommon("comingSoon")}</span>
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t("placeholder")}
              className="min-h-[220px]"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted">
                {t("charCount", { count: inputText.length, max: maxChars })}
              </span>
              <Button onClick={onTranslate} disabled={mutation.isPending}>
                {mutation.isPending ? tCommon("loading") : t("translate")}
              </Button>
            </div>
          </div>

          <aside className="flex flex-col gap-3 rounded-xl border border-border bg-slate-50/80 p-3">
            <label className="text-xs font-medium text-muted">{t("engine")}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={engine === "google" ? "default" : "secondary"}
                size="sm"
                onClick={() => setEngine("google")}
              >
                {t("engineGoogle")}
              </Button>
              <Button
                type="button"
                variant={engine === "ai" ? "default" : "secondary"}
                size="sm"
                onClick={() => setEngine("ai")}
                className="relative"
              >
                {t("engineAi")}
                <Badge
                  tone={aiConfigured ? "success" : "warning"}
                  className="absolute -right-1 -top-2"
                >
                  {aiConfigured ? t("configured") : t("notConfigured")}
                </Badge>
              </Button>
            </div>

            <label className="text-xs font-medium text-muted">{t("targetLanguage")}</label>
            <Select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {TARGET_LANGS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </Select>

            <label className="text-xs font-medium text-muted">{t("style")}</label>
            <Select
              value={style}
              onChange={(e) => setStyle(e.target.value as TranslationStyle)}
              disabled={engine !== "ai"}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {t(
                    `style${s.charAt(0).toUpperCase()}${s.slice(1)}` as
                      | "styleDefault"
                      | "styleNatural"
                      | "styleCasual"
                      | "styleBusiness"
                      | "styleFormal"
                      | "styleTechnical"
                      | "styleAcademic"
                      | "styleLocalized",
                  )}
                </option>
              ))}
            </Select>

            <label className="mt-1 flex items-start gap-2 text-xs text-muted opacity-60">
              <input
                type="checkbox"
                checked={followUiToTarget}
                disabled
                onChange={(e) => setFollowUiToTarget(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                {t("followUi")}
                <span className="ml-1 text-warning">Phase 2</span>
              </span>
            </label>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <EngineCard
          icon={<Zap className="h-4 w-4 text-primary" />}
          title={t("googleDescTitle")}
          desc={t("googleDesc")}
        />
        <EngineCard
          icon={<Sparkles className="h-4 w-4 text-brand-violet" />}
          title={t("aiDescTitle")}
          desc={t("aiDesc")}
        />
      </section>

      {result ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>
                  {t("sourceLanguage")}
                  {result.detectedSourceLanguage
                    ? `：${result.detectedSourceLanguage}`
                    : ""}
                </span>
              </div>
              <div className="min-h-[120px] rounded-xl border border-border bg-slate-50 p-3 text-sm whitespace-pre-wrap">
                {inputText}
              </div>
              <p className="mt-2 text-xs text-muted">{t("resultSource")}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>
                  {t("targetLanguage")}：{targetLanguage}
                  {result.style ? ` · ${result.style}` : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(result.text);
                      showToast(tCommon("copy"));
                    }}
                  >
                    {tCommon("copy")}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={onTranslate}>
                    {t("retranslate")}
                  </Button>
                </div>
              </div>
              <div className="min-h-[120px] rounded-xl border border-border bg-white p-3 text-sm whitespace-pre-wrap">
                {result.text}
              </div>
              <p className="mt-2 text-xs text-muted">
                {result.engine === "google"
                  ? t("metaGoogle", {
                      duration: `${(result.durationMs / 1000).toFixed(1)}s`,
                    })
                  : t("metaAi", {
                      model: result.model ?? "—",
                      style: result.style ?? "default",
                      duration: `${(result.durationMs / 1000).toFixed(1)}s`,
                    })}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["featureDetect", "featureDetectDesc"],
            ["featureStyle", "featureStyleDesc"],
            ["featureDual", "featureDualDesc"],
            ["featureByok", "featureByokDesc"],
          ] as const
        ).map(([title, desc]) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-brand-ink">{t(title)}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{t(desc)}</p>
          </div>
        ))}
      </section>

      <Dialog
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        title={tGate("title")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setGateOpen(false);
                setEngine("google");
                mutation.mutate();
              }}
            >
              {tGate("useGoogle")}
            </Button>
            <Button
              onClick={() => {
                setGateOpen(false);
                router.push(`/${locale}/settings/ai`);
              }}
            >
              {tGate("goConfigure")}
            </Button>
          </>
        }
      >
        <ul className="space-y-2">
          <CheckRow label={tGate("checkProvider")} ok={check.hasProvider} />
          <CheckRow label={tGate("checkModel")} ok={check.hasModel} />
          <CheckRow label={tGate("checkKey")} ok={check.hasKey} />
          <CheckRow
            label={tGate("checkConnection")}
            ok={check.connectionOk === true}
            pending={check.connectionOk === null}
          />
        </ul>
      </Dialog>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function EngineCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted">{desc}</p>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  ok,
  pending,
}: {
  label: string;
  ok: boolean;
  pending?: boolean;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-foreground">
      <span>{label}</span>
      <span>
        {pending ? "—" : ok ? "✅" : "❌"}
      </span>
    </li>
  );
}

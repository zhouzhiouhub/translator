"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import {
  checkAiConfig,
  runBatchTranslation,
  type BatchTranslateProgress,
  type BatchTranslateResult,
  type BatchTranslateResultItem,
} from "@/agents/translator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DocumentPanel } from "@/components/translator/document-panel";
import { MultiTargetLanguagePicker } from "@/components/translator/multi-target-language-picker";
import { useAppStore } from "@/stores/app";
import { createBatchId, useHistoryStore } from "@/stores/history";
import { useUiLocaleStore } from "@/stores/ui-locale";
import { useRouteLocale } from "@/i18n/use-route-locale";
import { useLocalizedLanguageOptions } from "@/i18n/use-localized-languages";
import { mapTargetLangToUiLocale } from "@/i18n/ui-locales";
import { setExplicitUiLocaleCookie } from "@/i18n/resolve-ui-locale";
import { PageContainer } from "@/components/layout/page-container";
import type { TranslationStyle } from "@/types/translation";

type TranslatorTab = "text" | "document";

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
  const tDoc = useTranslations("document");
  const tGate = useTranslations("aiGate");
  const tCommon = useTranslations("common");
  const routeLocale = useRouteLocale();
  const router = useRouter();
  const langs = useLocalizedLanguageOptions();
  const [toast, setToast] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tab, setTab] = useState<TranslatorTab>("text");
  const [progress, setProgress] = useState<BatchTranslateProgress | null>(null);
  const [batchResult, setBatchResult] = useState<BatchTranslateResult | null>(
    null,
  );
  const [activeLang, setActiveLang] = useState<string | null>(null);

  const {
    inputText,
    setInputText,
    targetLanguages,
    setTargetLanguage,
    setTargetLanguages,
    style,
    setStyle,
    followUiToTarget,
    setFollowUiToTarget,
    setResult,
    aiConfig,
    aiConfigured,
    maxChars,
    hydrateAiConfig,
  } = useAppStore();
  const addBatchEntries = useHistoryStore((s) => s.addBatchEntries);
  const applyLocale = useUiLocaleStore((s) => s.applyLocale);

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  function langLabel(code: string) {
    return langs.find((l) => l.value === code)?.label ?? code;
  }

  const activeResult: BatchTranslateResultItem | null = useMemo(() => {
    if (!batchResult) return null;
    const code = activeLang ?? batchResult.results[0]?.targetLanguage;
    return (
      batchResult.results.find((r) => r.targetLanguage === code) ??
      batchResult.results[0] ??
      null
    );
  }, [activeLang, batchResult]);

  const mutation = useMutation({
    mutationFn: () =>
      runBatchTranslation({
        text: inputText,
        targetLanguages,
        style,
        aiConfig,
        onProgress: setProgress,
      }),
    onSuccess: (data) => {
      setProgress(null);
      setBatchResult(data);
      const first = data.results[0];
      setActiveLang(first?.targetLanguage ?? null);
      if (first) {
        setResult(first);
        setTargetLanguage(first.targetLanguage);
      }

      const batchId = createBatchId();
      addBatchEntries(
        data.results.map((r) => ({
          kind: "text" as const,
          batchId: data.results.length > 1 ? batchId : undefined,
          sourceText: inputText,
          translatedText: r.text,
          sourceLanguage: r.detectedSourceLanguage,
          targetLanguage: r.targetLanguage,
          style: r.style ?? style,
          model: r.model,
          durationMs: r.durationMs,
        })),
      );

      if (data.results.length > 1) {
        showToast(t("batchDone", { count: data.results.length }));
      }

      if (followUiToTarget && data.results.length === 1 && first) {
        const uiLocale = mapTargetLangToUiLocale(first.targetLanguage);
        if (uiLocale) {
          void applyLocale(uiLocale)
            .then(() => {
              setExplicitUiLocaleCookie(uiLocale);
              const rest =
                window.location.pathname.replace(
                  new RegExp(`^/${routeLocale}`),
                  "",
                ) || "";
              router.push(`/${uiLocale}${rest}`);
            })
            .catch((err: Error) => {
              if (err.message === "LOCALE_PACK_NOT_READY") {
                setToast(t("followUiPackMissing"));
                return;
              }
              setToast(err.message);
            });
        }
      }
    },
    onError: (err: Error) => {
      setProgress(null);
      if (err.message === "AI_NOT_CONFIGURED") {
        setGateOpen(true);
        return;
      }
      if (err.message === "NO_TARGETS") {
        showToast(tDoc("errorNoTargets"));
        return;
      }
      if (err.message === "TRANSLATION_UNCHANGED") {
        showToast(t("errorUnchanged"));
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
    if (targetLanguages.length === 0) {
      showToast(tDoc("errorNoTargets"));
      return;
    }
    const check = checkAiConfig(aiConfig);
    if (!check.ok) {
      setGateOpen(true);
      return;
    }
    mutation.mutate();
  }

  const check = checkAiConfig(aiConfig);

  const progressLabel =
    progress && targetLanguages.length > 1
      ? t("progressBatch", {
          lang: langLabel(progress.targetLanguage),
          current: progress.current,
          total: progress.total,
        })
      : null;

  return (
    <PageContainer>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
          {t("greeting")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("text")}
              className={
                tab === "text"
                  ? "rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  : "rounded-xl px-3 py-1.5 text-sm text-muted hover:bg-slate-100"
              }
            >
              {t("tabText")}
            </button>
            <button
              type="button"
              onClick={() => setTab("document")}
              className={
                tab === "document"
                  ? "rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  : "rounded-xl px-3 py-1.5 text-sm text-muted hover:bg-slate-100"
              }
            >
              {t("tabDocument")}
            </button>
          </div>
          {tab === "text" ? (
            <Badge tone={aiConfigured ? "success" : "warning"}>
              {aiConfigured ? t("configured") : t("notConfigured")}
            </Badge>
          ) : null}
        </div>

        {tab === "document" ? (
          <DocumentPanel onToast={showToast} />
        ) : (
          <div className="space-y-4">
            <div>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t("placeholder")}
                className="min-h-[220px]"
              />
              <div className="mt-2 text-xs text-muted">
                {t("charCount", { count: inputText.length, max: maxChars })}
              </div>
            </div>

            <MultiTargetLanguagePicker
              values={targetLanguages}
              onChange={setTargetLanguages}
              disabled={mutation.isPending}
            />

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex min-w-[180px] flex-1 flex-col gap-3 sm:max-w-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">
                    {t("style")}
                  </label>
                  <Select
                    value={style}
                    onChange={(e) =>
                      setStyle(e.target.value as TranslationStyle)
                    }
                    disabled={mutation.isPending}
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
                </div>
                <label className="flex items-start gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={followUiToTarget}
                    onChange={(e) => setFollowUiToTarget(e.target.checked)}
                    disabled={mutation.isPending || targetLanguages.length > 1}
                    className="mt-0.5"
                  />
                  <span>
                    {t("followUi")}
                    {targetLanguages.length > 1 ? (
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {t("followUiBatchHint")}
                      </span>
                    ) : null}
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {progressLabel ? (
                  <span className="max-w-[220px] text-xs text-muted">
                    {progressLabel}
                  </span>
                ) : null}
                <Button onClick={onTranslate} disabled={mutation.isPending}>
                  {mutation.isPending ? tCommon("loading") : t("translate")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {tab === "text" && batchResult && activeResult ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-brand-ink">
                {t("resultTarget")}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {batchResult.results.length > 1
                  ? t("batchResultMeta", {
                      languages: batchResult.results.length,
                      model: activeResult.model ?? "—",
                      duration: `${(batchResult.durationMs / 1000).toFixed(1)}s`,
                    })
                  : t("metaAi", {
                      model: activeResult.model ?? "—",
                      style: activeResult.style ?? "default",
                      duration: `${(activeResult.durationMs / 1000).toFixed(1)}s`,
                    })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {tDoc("previewOnline")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(activeResult.text);
                  showToast(tCommon("copy"));
                }}
              >
                {tCommon("copy")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={onTranslate}
                disabled={mutation.isPending}
              >
                {t("retranslate")}
              </Button>
            </div>
          </div>

          {batchResult.results.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {batchResult.results.map((r) => {
                const selected = r.targetLanguage === activeResult.targetLanguage;
                return (
                  <button
                    key={r.targetLanguage}
                    type="button"
                    onClick={() => {
                      setActiveLang(r.targetLanguage);
                      setResult(r);
                      setTargetLanguage(r.targetLanguage);
                    }}
                    className={
                      selected
                        ? "rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                        : "rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-muted hover:bg-slate-50"
                    }
                  >
                    {langLabel(r.targetLanguage)}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs text-muted">
                {t("sourceLanguage")}
                {activeResult.detectedSourceLanguage
                  ? `：${langLabel(activeResult.detectedSourceLanguage)}`
                  : ""}
              </div>
              <div className="min-h-[120px] rounded-xl border border-border bg-slate-50 p-3 text-sm whitespace-pre-wrap">
                {inputText}
              </div>
              <p className="mt-2 text-xs text-muted">{t("resultSource")}</p>
            </div>
            <div>
              <div className="mb-2 text-xs text-muted">
                {t("targetLanguage")}：{langLabel(activeResult.targetLanguage)}
                {activeResult.style ? ` · ${activeResult.style}` : ""}
              </div>
              <div className="min-h-[120px] rounded-xl border border-border bg-white p-3 text-sm whitespace-pre-wrap">
                {activeResult.text}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["featureDetect", "featureDetectDesc"],
            ["featureStyle", "featureStyleDesc"],
            ["featureAgent", "featureAgentDesc"],
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
        open={previewOpen && !!activeResult}
        onClose={() => setPreviewOpen(false)}
        title={tDoc("previewDialogTitle", {
          lang: activeResult ? langLabel(activeResult.targetLanguage) : "",
        })}
        className="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              {tCommon("cancel")}
            </Button>
            {activeResult ? (
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(activeResult.text);
                  showToast(tCommon("copy"));
                }}
              >
                {tCommon("copy")}
              </Button>
            ) : null}
          </>
        }
      >
        {batchResult && activeResult ? (
          <div className="space-y-3">
            {batchResult.results.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {batchResult.results.map((r) => {
                  const selected =
                    r.targetLanguage === activeResult.targetLanguage;
                  return (
                    <button
                      key={r.targetLanguage}
                      type="button"
                      onClick={() => {
                        setActiveLang(r.targetLanguage);
                        setResult(r);
                        setTargetLanguage(r.targetLanguage);
                      }}
                      className={
                        selected
                          ? "rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          : "rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-slate-50"
                      }
                    >
                      {langLabel(r.targetLanguage)}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <pre className="max-h-[55vh] overflow-auto rounded-xl border border-border bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {activeResult.text}
            </pre>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        title={tGate("title")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGateOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => {
                setGateOpen(false);
                router.push(`/${routeLocale}/settings/ai`);
              }}
            >
              {tGate("goConfigure")}
            </Button>
          </>
        }
      >
        <p className="mb-3">{tGate("requiredHint")}</p>
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
    </PageContainer>
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
      <span>{pending ? "—" : ok ? "✅" : "❌"}</span>
    </li>
  );
}

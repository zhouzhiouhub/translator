"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, FileText, Upload } from "lucide-react";
import { checkAiConfig } from "@/agents/translator";
import {
  runBatchDocumentTranslation,
  type BatchDocumentTranslateResult,
  type DocumentTranslateResult,
} from "@/agents/document";
import { isAbortError } from "@/lib/abort";
import { acceptAttribute, translatedFileName } from "@/lib/document/detect";
import { downloadTextFile } from "@/lib/document/export";
import {
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_CHARS,
  type DocumentTranslateProgress,
} from "@/lib/document/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { MultiTargetLanguagePicker } from "@/components/translator/multi-target-language-picker";
import { useAppStore } from "@/stores/app";
import { createBatchId, useHistoryStore } from "@/stores/history";
import { useRouteLocale } from "@/i18n/use-route-locale";
import { useLocalizedLanguageOptions } from "@/i18n/use-localized-languages";
import type { TranslationStyle } from "@/types/translation";

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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentPanel({
  onToast,
}: {
  onToast: (message: string) => void;
}) {
  const t = useTranslations("document");
  const tTranslator = useTranslations("translator");
  const tGate = useTranslations("aiGate");
  const tCommon = useTranslations("common");
  const routeLocale = useRouteLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const langs = useLocalizedLanguageOptions();

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [progress, setProgress] = useState<DocumentTranslateProgress | null>(
    null,
  );
  const [batchResult, setBatchResult] =
    useState<BatchDocumentTranslateResult | null>(null);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    targetLanguages,
    setTargetLanguages,
    style,
    setStyle,
    aiConfig,
  } = useAppStore();
  const addBatchEntries = useHistoryStore((s) => s.addBatchEntries);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const check = checkAiConfig(aiConfig);

  function langLabel(code: string) {
    return langs.find((l) => l.value === code)?.label ?? code;
  }

  const activeResult: DocumentTranslateResult | null = useMemo(() => {
    if (!batchResult) return null;
    const code = activeLang ?? batchResult.results[0]?.targetLanguage;
    return (
      batchResult.results.find((r) => r.targetLanguage === code) ??
      batchResult.results[0] ??
      null
    );
  }, [activeLang, batchResult]);

  const doneResults = useMemo(
    () => batchResult?.results.filter((r) => r.status === "done") ?? [],
    [batchResult],
  );
  const pendingCount = batchResult
    ? batchResult.results.length - doneResults.length
    : 0;
  const activeDone = activeResult?.status === "done";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("DOCUMENT_NO_FILE");
      if (targetLanguages.length === 0) throw new Error("DOCUMENT_NO_TARGETS");
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      return runBatchDocumentTranslation({
        file,
        targetLanguages,
        style,
        aiConfig,
        signal: ac.signal,
        onProgress: setProgress,
      });
    },
    onSettled: () => {
      abortRef.current = null;
    },
    onSuccess: (data) => {
      setBatchResult(data);
      const firstDone =
        data.results.find((r) => r.status === "done") ?? data.results[0];
      setActiveLang(firstDone?.targetLanguage ?? null);
      setProgress(null);

      const completed = data.results.filter((r) => r.status === "done");
      const pending = data.results.length - completed.length;

      if (completed.length > 0) {
        const batchId = createBatchId();
        addBatchEntries(
          completed.map((r) => ({
            kind: "document" as const,
            batchId: completed.length > 1 ? batchId : undefined,
            fileName: data.parsed.fileName,
            sourceText: data.parsed.text,
            translatedText: r.text,
            sourceLanguage: r.detectedSourceLanguage,
            targetLanguage: r.targetLanguage,
            style: r.style ?? style,
            model: r.model,
            durationMs: r.durationMs,
          })),
        );
      }

      if (data.cancelled) {
        onToast(
          t("cancelledPartial", {
            done: completed.length,
            pending,
          }),
        );
        return;
      }

      onToast(
        t("batchDone", {
          count: completed.length,
        }),
      );
    },
    onError: (err: Error) => {
      setProgress(null);
      if (isAbortError(err)) {
        onToast(tCommon("cancelled"));
        return;
      }
      if (err.message === "AI_NOT_CONFIGURED") {
        setGateOpen(true);
        return;
      }
      onToast(mapDocumentError(err.message, t));
    },
  });

  const onPickFile = useCallback(
    (next: File | null) => {
      setBatchResult(null);
      setActiveLang(null);
      setProgress(null);
      if (!next) {
        setFile(null);
        return;
      }
      if (next.size > MAX_DOCUMENT_BYTES) {
        onToast(t("errorTooLarge", { max: formatBytes(MAX_DOCUMENT_BYTES) }));
        return;
      }
      setFile(next);
    },
    [onToast, t],
  );

  function onTranslate() {
    if (!file) {
      onToast(t("errorNoFile"));
      return;
    }
    if (targetLanguages.length === 0) {
      onToast(t("errorNoTargets"));
      return;
    }
    if (!check.ok) {
      setGateOpen(true);
      return;
    }
    mutation.mutate();
  }

  function onCancel() {
    abortRef.current?.abort();
  }

  function onDownload(result: DocumentTranslateResult) {
    if (!file || result.status !== "done") return;
    downloadTextFile(
      translatedFileName(file.name, result.targetLanguage),
      result.text,
    );
  }

  function onDownloadAll() {
    if (!file || !batchResult) return;
    for (const r of doneResults) {
      onDownload(r);
    }
  }

  const progressLabel = (() => {
    if (!progress) return null;
    if (progress.phase === "parsing") return t("progressParsing");
    if (progress.phase === "translating") {
      if (progress.languageTotal && progress.languageTotal > 1) {
        return t("progressBatchTranslating", {
          lang: langLabel(progress.targetLanguage ?? ""),
          languageIndex: progress.languageIndex ?? 1,
          languageTotal: progress.languageTotal,
          current: progress.current,
          total: progress.total,
        });
      }
      return t("progressTranslating", {
        current: progress.current,
        total: progress.total,
      });
    }
    return null;
  })();

  return (
    <>
      <div className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0] ?? null;
            onPickFile(dropped);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-slate-50/80 hover:border-primary/40"
          }`}
        >
          <Upload className="mb-2 h-8 w-8 text-primary/80" aria-hidden />
          <p className="text-sm font-medium text-brand-ink">{t("dropTitle")}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
            {t("dropHint", {
              formats: "TXT, MD, HTML, DOCX",
              maxSize: formatBytes(MAX_DOCUMENT_BYTES),
              maxChars: MAX_DOCUMENT_CHARS.toLocaleString(),
            })}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttribute()}
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {file ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
            <div className="flex min-w-0 items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-ink">
                  {file.name}
                </p>
                <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPickFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              {tCommon("clear")}
            </Button>
          </div>
        ) : null}

        <MultiTargetLanguagePicker
          values={targetLanguages}
          onChange={setTargetLanguages}
          disabled={mutation.isPending}
        />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">
              {tTranslator("style")}
            </label>
            <Select
              value={style}
              onChange={(e) => setStyle(e.target.value as TranslationStyle)}
              disabled={mutation.isPending}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {tTranslator(
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

          <div className="flex flex-wrap items-center gap-2">
            {progressLabel ? (
              <span className="max-w-[240px] text-xs text-muted">
                {progressLabel}
              </span>
            ) : null}
            {mutation.isPending ? (
              <Button variant="secondary" onClick={onCancel}>
                {tCommon("cancel")}
              </Button>
            ) : null}
            <Button onClick={onTranslate} disabled={mutation.isPending || !file}>
              {mutation.isPending ? tCommon("loading") : t("translate")}
            </Button>
          </div>
        </div>
      </div>

      {batchResult && activeResult ? (
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-brand-ink">
                {t("resultTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {batchResult.cancelled || pendingCount > 0
                  ? t("batchResultMetaPartial", {
                      done: doneResults.length,
                      total: batchResult.results.length,
                      model:
                        (activeDone
                          ? activeResult.model
                          : doneResults[0]?.model) ?? "—",
                      duration: `${(batchResult.durationMs / 1000).toFixed(1)}s`,
                    })
                  : t("batchResultMeta", {
                      languages: batchResult.results.length,
                      model: activeResult.model ?? "—",
                      duration: `${(batchResult.durationMs / 1000).toFixed(1)}s`,
                    })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={!activeDone}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {t("previewOnline")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!activeDone}
                onClick={async () => {
                  await navigator.clipboard.writeText(activeResult.text);
                  onToast(tCommon("copy"));
                }}
              >
                {tCommon("copy")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!activeDone}
                onClick={() => onDownload(activeResult)}
              >
                {t("download")}
              </Button>
              {doneResults.length > 1 ? (
                <Button size="sm" onClick={onDownloadAll}>
                  {t("downloadAll")}
                </Button>
              ) : null}
            </div>
          </div>

          {batchResult.results.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {batchResult.results.map((r) => {
                const selected = r.targetLanguage === activeResult.targetLanguage;
                const pending = r.status === "pending";
                return (
                  <button
                    key={r.targetLanguage}
                    type="button"
                    onClick={() => setActiveLang(r.targetLanguage)}
                    className={
                      selected
                        ? "rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                        : pending
                          ? "rounded-xl border border-dashed border-border bg-slate-50 px-3 py-1.5 text-sm text-muted"
                          : "rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-muted hover:bg-slate-50"
                    }
                  >
                    {langLabel(r.targetLanguage)}
                    {pending ? (
                      <span className="ml-1 text-[11px] opacity-80">
                        · {t("notGenerated")}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-muted">{t("previewSource")}</p>
              <pre className="max-h-[240px] overflow-auto rounded-xl border border-border bg-slate-50 p-3 text-xs whitespace-pre-wrap text-foreground">
                {batchResult.parsed.text}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">
                {t("previewTarget")} · {langLabel(activeResult.targetLanguage)}
              </p>
              <pre className="max-h-[240px] overflow-auto rounded-xl border border-border bg-white p-3 text-xs whitespace-pre-wrap text-foreground">
                {activeDone ? activeResult.text : t("notGeneratedHint")}
              </pre>
            </div>
          </div>
          {batchResult.parsed.format === "docx" ? (
            <p className="mt-3 text-xs text-muted">{t("docxExportNote")}</p>
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={previewOpen && !!activeResult && activeDone}
        onClose={() => setPreviewOpen(false)}
        title={t("previewDialogTitle", {
          lang: activeResult ? langLabel(activeResult.targetLanguage) : "",
        })}
        className="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              {tCommon("cancel")}
            </Button>
            {activeResult && activeDone ? (
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(activeResult.text);
                  onToast(tCommon("copy"));
                }}
              >
                {tCommon("copy")}
              </Button>
            ) : null}
          </>
        }
      >
        {batchResult && activeResult && activeDone ? (
          <div className="space-y-3">
            {batchResult.results.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {batchResult.results.map((r) => {
                  const selected =
                    r.targetLanguage === activeResult.targetLanguage;
                  const pending = r.status === "pending";
                  return (
                    <button
                      key={r.targetLanguage}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (!pending) setActiveLang(r.targetLanguage);
                      }}
                      className={
                        selected
                          ? "rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          : pending
                            ? "rounded-lg border border-dashed border-border px-2.5 py-1 text-xs text-muted opacity-60"
                            : "rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-slate-50"
                      }
                    >
                      {langLabel(r.targetLanguage)}
                      {pending ? ` · ${t("notGenerated")}` : ""}
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
    </>
  );
}

function mapDocumentError(
  code: string,
  t: ReturnType<typeof useTranslations<"document">>,
): string {
  switch (code) {
    case "DOCUMENT_TOO_LARGE":
      return t("errorTooLarge", { max: formatBytes(MAX_DOCUMENT_BYTES) });
    case "DOCUMENT_TOO_MANY_CHARS":
      return t("errorTooManyChars", {
        max: MAX_DOCUMENT_CHARS.toLocaleString(),
      });
    case "DOCUMENT_UNSUPPORTED":
      return t("errorUnsupported");
    case "DOCUMENT_EMPTY":
      return t("errorEmpty");
    case "DOCUMENT_NO_FILE":
      return t("errorNoFile");
    case "DOCUMENT_NO_TARGETS":
      return t("errorNoTargets");
    case "TRANSLATION_UNCHANGED":
      return t("errorUnchanged");
    default:
      return code;
  }
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

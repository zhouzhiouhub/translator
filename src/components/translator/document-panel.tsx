"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { checkAiConfig } from "@/agents/translator";
import { runDocumentTranslation } from "@/agents/document";
import type { DocumentTranslateResult } from "@/agents/document";
import { acceptAttribute } from "@/lib/document/detect";
import { translatedFileName } from "@/lib/document/detect";
import { downloadTextFile } from "@/lib/document/export";
import {
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_CHARS,
  type DocumentTranslateProgress,
} from "@/lib/document/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { LanguageSelect } from "@/components/ui/language-select";
import { useAppStore } from "@/stores/app";
import { useHistoryStore } from "@/stores/history";
import { useRouteLocale } from "@/i18n/use-route-locale";
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

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [progress, setProgress] = useState<DocumentTranslateProgress | null>(
    null,
  );
  const [result, setResult] = useState<DocumentTranslateResult | null>(null);

  const {
    targetLanguage,
    setTargetLanguage,
    style,
    setStyle,
    aiConfig,
    aiConfigured,
  } = useAppStore();
  const addEntry = useHistoryStore((s) => s.addEntry);

  const check = checkAiConfig(aiConfig);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("DOCUMENT_NO_FILE");
      return runDocumentTranslation({
        file,
        targetLanguage,
        style,
        aiConfig,
        onProgress: setProgress,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setProgress(null);
      addEntry({
        sourceText: `[${data.parsed.fileName}] ${data.parsed.text.slice(0, 200)}`,
        translatedText: data.text.slice(0, 500),
        sourceLanguage: data.detectedSourceLanguage,
        targetLanguage,
        style: data.style ?? style,
        model: data.model,
        durationMs: data.durationMs,
      });
    },
    onError: (err: Error) => {
      setProgress(null);
      if (err.message === "AI_NOT_CONFIGURED") {
        setGateOpen(true);
        return;
      }
      onToast(mapDocumentError(err.message, t));
    },
  });

  const onPickFile = useCallback(
    (next: File | null) => {
      setResult(null);
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
    if (!check.ok) {
      setGateOpen(true);
      return;
    }
    mutation.mutate();
  }

  function onDownload() {
    if (!result || !file) return;
    downloadTextFile(
      translatedFileName(file.name, targetLanguage),
      result.text,
    );
  }

  const progressLabel =
    progress?.phase === "parsing"
      ? t("progressParsing")
      : progress?.phase === "translating"
        ? t("progressTranslating", {
            current: progress.current,
            total: progress.total,
          })
        : null;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="space-y-3">
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
            className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
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

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={aiConfigured ? "success" : "warning"}>
                {aiConfigured
                  ? tTranslator("configured")
                  : tTranslator("notConfigured")}
              </Badge>
              {progressLabel ? (
                <span className="text-xs text-muted">{progressLabel}</span>
              ) : null}
            </div>
            <Button onClick={onTranslate} disabled={mutation.isPending || !file}>
              {mutation.isPending ? tCommon("loading") : t("translate")}
            </Button>
          </div>
        </div>

        <aside className="flex flex-col gap-3 rounded-xl border border-border bg-slate-50/80 p-3">
          <label className="text-xs font-medium text-muted">
            {tTranslator("targetLanguage")}
          </label>
          <LanguageSelect value={targetLanguage} onChange={setTargetLanguage} />

          <label className="text-xs font-medium text-muted">
            {tTranslator("style")}
          </label>
          <Select
            value={style}
            onChange={(e) => setStyle(e.target.value as TranslationStyle)}
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

          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {t("privacyNote")}
          </p>
        </aside>
      </div>

      {result ? (
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-brand-ink">
                {t("resultTitle")}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {t("resultMeta", {
                  chunks: result.chunks,
                  model: result.model ?? "—",
                  duration: `${(result.durationMs / 1000).toFixed(1)}s`,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(result.text);
                  onToast(tCommon("copy"));
                }}
              >
                {tCommon("copy")}
              </Button>
              <Button size="sm" onClick={onDownload}>
                {t("download")}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-muted">{t("previewSource")}</p>
              <pre className="max-h-[280px] overflow-auto rounded-xl border border-border bg-slate-50 p-3 text-xs whitespace-pre-wrap">
                {result.parsed.text}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted">{t("previewTarget")}</p>
              <pre className="max-h-[280px] overflow-auto rounded-xl border border-border bg-white p-3 text-xs whitespace-pre-wrap">
                {result.text}
              </pre>
            </div>
          </div>
          {result.parsed.format === "docx" ? (
            <p className="mt-3 text-xs text-muted">{t("docxExportNote")}</p>
          ) : null}
        </div>
      ) : null}

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

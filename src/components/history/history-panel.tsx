"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Copy, Download, Eye, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LanguageSelect } from "@/components/ui/language-select";
import { PageContainer } from "@/components/layout/page-container";
import {
  downloadTextFile,
  historyDownloadFileName,
} from "@/lib/document/export";
import { useAppStore } from "@/stores/app";
import { useHistoryStore } from "@/stores/history";
import { useLocalizedLanguageOptions } from "@/i18n/use-localized-languages";
import type {
  HistoryEntry,
  HistoryKind,
  TranslationStyle,
} from "@/types/translation";

const STYLE_KEYS = [
  "default",
  "natural",
  "casual",
  "business",
  "formal",
  "technical",
  "academic",
  "localized",
] as const;

type KindFilter = "all" | HistoryKind;

type HistoryGroup =
  | { type: "single"; entry: HistoryEntry }
  | { type: "batch"; batchId: string; entries: HistoryEntry[] };

function styleLabelKey(style: TranslationStyle) {
  return `style${style.charAt(0).toUpperCase()}${style.slice(1)}` as
    | "styleDefault"
    | "styleNatural"
    | "styleCasual"
    | "styleBusiness"
    | "styleFormal"
    | "styleTechnical"
    | "styleAcademic"
    | "styleLocalized";
}

/** Full text in a scrollable block — never pretend the translation ended early. */
function HistoryText({ text }: { text: string }) {
  return (
    <pre className="max-h-[320px] overflow-auto rounded-xl border border-border bg-slate-50/80 p-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
      {text}
    </pre>
  );
}

function formatTime(ts: number, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function groupHistoryEntries(entries: HistoryEntry[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  const seenBatches = new Set<string>();

  for (const entry of entries) {
    if (entry.batchId) {
      if (seenBatches.has(entry.batchId)) continue;
      seenBatches.add(entry.batchId);
      const siblings = entries
        .filter((e) => e.batchId === entry.batchId)
        .sort((a, b) => a.targetLanguage.localeCompare(b.targetLanguage));
      if (siblings.length > 1) {
        groups.push({
          type: "batch",
          batchId: entry.batchId,
          entries: siblings,
        });
      } else {
        groups.push({ type: "single", entry: siblings[0] ?? entry });
      }
      continue;
    }
    groups.push({ type: "single", entry });
  }

  return groups;
}

export function HistoryPanel() {
  const t = useTranslations("history");
  const tTranslator = useTranslations("translator");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const TARGET_LANGS = useLocalizedLanguageOptions();

  function langLabel(code: string) {
    return TARGET_LANGS.find((l) => l.value === code)?.label ?? code;
  }

  const entries = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);
  const removeBatch = useHistoryStore((s) => s.removeBatch);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const clearKind = useHistoryStore((s) => s.clearKind);

  const setInputText = useAppStore((s) => s.setInputText);
  const setTargetLanguage = useAppStore((s) => s.setTargetLanguage);
  const setStyle = useAppStore((s) => s.setStyle);
  const setResult = useAppStore((s) => s.setResult);

  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);
  const [batchPreview, setBatchPreview] = useState<{
    entries: HistoryEntry[];
    activeId: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (kindFilter !== "all" && entry.kind !== kindFilter) return false;
      if (langFilter !== "all" && entry.targetLanguage !== langFilter) {
        return false;
      }
      if (!q) return true;
      return (
        entry.sourceText.toLowerCase().includes(q) ||
        entry.translatedText.toLowerCase().includes(q) ||
        (entry.fileName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [entries, query, langFilter, kindFilter]);

  const groups = useMemo(() => groupHistoryEntries(filtered), [filtered]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function restore(entry: HistoryEntry) {
    if (entry.kind === "document") {
      showToast(t("restoreDocumentHint"));
      router.push(`/${locale}`);
      return;
    }
    setInputText(entry.sourceText);
    setTargetLanguage(entry.targetLanguage);
    if (entry.style) setStyle(entry.style);
    setResult({
      text: entry.translatedText,
      detectedSourceLanguage: entry.sourceLanguage,
      model: entry.model,
      style: entry.style,
      durationMs: entry.durationMs,
    });
    router.push(`/${locale}`);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    showToast(t("copied"));
  }

  function downloadEntry(entry: HistoryEntry) {
    downloadTextFile(
      historyDownloadFileName({
        fileName: entry.fileName,
        targetLanguage: entry.targetLanguage,
        kind: entry.kind,
      }),
      entry.translatedText,
    );
    showToast(t("downloaded"));
  }

  function downloadEntries(list: HistoryEntry[]) {
    for (const entry of list) {
      downloadTextFile(
        historyDownloadFileName({
          fileName: entry.fileName,
          targetLanguage: entry.targetLanguage,
          kind: entry.kind,
        }),
        entry.translatedText,
      );
    }
    showToast(t("downloaded"));
  }

  const kindTabs: { id: KindFilter; label: string }[] = [
    { id: "all", label: t("filterKindAll") },
    { id: "text", label: t("filterKindText") },
    { id: "document", label: t("filterKindDocument") },
  ];

  return (
    <PageContainer>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Button
          variant="secondary"
          disabled={entries.length === 0}
          onClick={() => setClearOpen(true)}
        >
          {t("clearAll")}
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {kindTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setKindFilter(tab.id)}
            className={
              kindFilter === tab.id
                ? "rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                : "rounded-xl px-3 py-1.5 text-sm text-muted hover:bg-slate-100"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1"
        />
        <LanguageSelect
          value={langFilter}
          onChange={setLangFilter}
          className="sm:w-48"
          allOptionLabel={t("filterAll")}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : groups.length === 0 ? (
        <EmptyState message={t("emptyFiltered")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) =>
            group.type === "single" ? (
              <li key={group.entry.id}>
                <HistoryCard
                  entry={group.entry}
                  langLabel={langLabel}
                  locale={locale}
                  onRestore={() => restore(group.entry)}
                  onCopy={() => void copyText(group.entry.translatedText)}
                  onDownload={() => downloadEntry(group.entry)}
                  onPreview={() => setPreviewEntry(group.entry)}
                  onDelete={() => removeEntry(group.entry.id)}
                  t={t}
                  tTranslator={tTranslator}
                />
              </li>
            ) : (
              <li key={group.batchId}>
                <BatchHistoryCard
                  entries={group.entries}
                  langLabel={langLabel}
                  locale={locale}
                  onPreviewLang={(entry) =>
                    setBatchPreview({
                      entries: group.entries,
                      activeId: entry.id,
                    })
                  }
                  onCopy={(entry) => void copyText(entry.translatedText)}
                  onDownload={(entry) => downloadEntry(entry)}
                  onDownloadAll={() => downloadEntries(group.entries)}
                  onDeleteBatch={() => removeBatch(group.batchId)}
                  t={t}
                  tTranslator={tTranslator}
                />
              </li>
            ),
          )}
        </ul>
      )}

      <Dialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title={
          kindFilter === "all"
            ? t("clearConfirmTitle")
            : t("clearKindConfirmTitle", {
                kind:
                  kindFilter === "text"
                    ? t("filterKindText")
                    : t("filterKindDocument"),
              })
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setClearOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => {
                if (kindFilter === "all") clearAll();
                else clearKind(kindFilter);
                setClearOpen(false);
                showToast(t("cleared"));
              }}
            >
              {tCommon("confirm")}
            </Button>
          </>
        }
      >
        <p>
          {kindFilter === "all"
            ? t("clearConfirmBody")
            : t("clearKindConfirmBody", {
                kind:
                  kindFilter === "text"
                    ? t("filterKindText")
                    : t("filterKindDocument"),
              })}
        </p>
      </Dialog>

      <Dialog
        open={!!previewEntry}
        onClose={() => setPreviewEntry(null)}
        title={t("previewTitle")}
        className="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewEntry(null)}>
              {tCommon("cancel")}
            </Button>
            {previewEntry ? (
              <Button onClick={() => void copyText(previewEntry.translatedText)}>
                {t("copyTranslation")}
              </Button>
            ) : null}
          </>
        }
      >
        {previewEntry ? (
          <pre className="max-h-[55vh] overflow-auto rounded-xl border border-border bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {previewEntry.translatedText}
          </pre>
        ) : null}
      </Dialog>

      <Dialog
        open={!!batchPreview}
        onClose={() => setBatchPreview(null)}
        title={t("previewTitle")}
        className="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBatchPreview(null)}>
              {tCommon("cancel")}
            </Button>
            {batchPreview ? (
              <Button
                onClick={() => {
                  const active =
                    batchPreview.entries.find(
                      (e) => e.id === batchPreview.activeId,
                    ) ?? batchPreview.entries[0];
                  if (active) void copyText(active.translatedText);
                }}
              >
                {t("copyTranslation")}
              </Button>
            ) : null}
          </>
        }
      >
        {batchPreview ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {batchPreview.entries.map((entry) => {
                const selected = entry.id === batchPreview.activeId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() =>
                      setBatchPreview({
                        entries: batchPreview.entries,
                        activeId: entry.id,
                      })
                    }
                    className={
                      selected
                        ? "rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        : "rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:bg-slate-50"
                    }
                  >
                    {langLabel(entry.targetLanguage)}
                  </button>
                );
              })}
            </div>
            <pre className="max-h-[55vh] overflow-auto rounded-xl border border-border bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {(
                batchPreview.entries.find((e) => e.id === batchPreview.activeId) ??
                batchPreview.entries[0]
              )?.translatedText}
            </pre>
          </div>
        ) : null}
      </Dialog>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </PageContainer>
  );
}

function HistoryCard({
  entry,
  langLabel,
  locale,
  onRestore,
  onCopy,
  onDownload,
  onPreview,
  onDelete,
  t,
  tTranslator,
}: {
  entry: HistoryEntry;
  langLabel: (code: string) => string;
  locale: string;
  onRestore: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onPreview: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslations<"history">>;
  tTranslator: ReturnType<typeof useTranslations<"translator">>;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <KindBadge kind={entry.kind} t={t} />
        <span>{formatTime(entry.createdAt, locale)}</span>
        <span>·</span>
        <span>
          {entry.sourceLanguage
            ? langLabel(entry.sourceLanguage)
            : t("sourceAuto")}
          {" → "}
          {langLabel(entry.targetLanguage)}
        </span>
        {entry.fileName ? (
          <>
            <span>·</span>
            <span className="truncate">{entry.fileName}</span>
          </>
        ) : null}
        {entry.style ? (
          <>
            <span>·</span>
            <span>
              {STYLE_KEYS.includes(entry.style as (typeof STYLE_KEYS)[number])
                ? tTranslator(styleLabelKey(entry.style))
                : entry.style}
            </span>
          </>
        ) : null}
        {entry.model ? (
          <>
            <span>·</span>
            <span>{entry.model}</span>
          </>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{t("source")}</p>
          <HistoryText text={entry.sourceText} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted">
            {t("translation")}
          </p>
          <HistoryText text={entry.translatedText} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {entry.kind === "text" ? (
          <Button size="sm" onClick={onRestore}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {t("restore")}
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" onClick={onPreview}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          {t("preview")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCopy}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          {t("copyTranslation")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onDownload}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {t("download")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}

function BatchHistoryCard({
  entries,
  langLabel,
  locale,
  onPreviewLang,
  onCopy,
  onDownload,
  onDownloadAll,
  onDeleteBatch,
  t,
  tTranslator,
}: {
  entries: HistoryEntry[];
  langLabel: (code: string) => string;
  locale: string;
  onPreviewLang: (entry: HistoryEntry) => void;
  onCopy: (entry: HistoryEntry) => void;
  onDownload: (entry: HistoryEntry) => void;
  onDownloadAll: () => void;
  onDeleteBatch: () => void;
  t: ReturnType<typeof useTranslations<"history">>;
  tTranslator: ReturnType<typeof useTranslations<"translator">>;
}) {
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");
  const active =
    entries.find((e) => e.id === activeId) ?? entries[0] ?? null;
  if (!active) return null;

  const first = entries[0]!;

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <KindBadge kind={first.kind} t={t} />
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {t("batchBadge", { count: entries.length })}
        </span>
        <span>{formatTime(first.createdAt, locale)}</span>
        {first.fileName ? (
          <>
            <span>·</span>
            <span className="truncate">{first.fileName}</span>
          </>
        ) : null}
        {first.style ? (
          <>
            <span>·</span>
            <span>
              {STYLE_KEYS.includes(first.style as (typeof STYLE_KEYS)[number])
                ? tTranslator(styleLabelKey(first.style))
                : first.style}
            </span>
          </>
        ) : null}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {entries.map((entry) => {
          const selected = entry.id === active.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setActiveId(entry.id)}
              className={
                selected
                  ? "rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  : "rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-muted hover:bg-slate-50"
              }
            >
              {langLabel(entry.targetLanguage)}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-muted">{t("source")}</p>
          <HistoryText text={active.sourceText} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted">
            {t("translation")} · {langLabel(active.targetLanguage)}
          </p>
          <HistoryText text={active.translatedText} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onPreviewLang(active)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          {t("preview")}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onCopy(active)}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          {t("copyTranslation")}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onDownload(active)}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {t("download")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onDownloadAll}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {t("downloadAll")}
        </Button>
        <Button size="sm" variant="secondary" onClick={onDeleteBatch}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {t("deleteBatch")}
        </Button>
      </div>
    </article>
  );
}

function KindBadge({
  kind,
  t,
}: {
  kind: HistoryKind;
  t: ReturnType<typeof useTranslations<"history">>;
}) {
  return (
    <span
      className={
        kind === "document"
          ? "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-warning"
          : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
      }
    >
      {kind === "document" ? t("kindDocument") : t("kindText")}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center text-sm text-muted">
      {message}
    </div>
  );
}

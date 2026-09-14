"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageContainer } from "@/components/layout/page-container";
import { useAppStore } from "@/stores/app";
import { useHistoryStore } from "@/stores/history";
import { languagesForSelect } from "@/i18n/languages";
import type { HistoryEntry, TranslationStyle } from "@/types/translation";

const TARGET_LANGS = languagesForSelect().map((l) => ({
  value: l.code,
  label: `${l.nameZh} · ${l.nameEn}`,
}));

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

function langLabel(code: string) {
  return TARGET_LANGS.find((l) => l.value === code)?.label ?? code;
}

function truncate(text: string, max = 160) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
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

export function HistoryPanel() {
  const t = useTranslations("history");
  const tTranslator = useTranslations("translator");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const entries = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);
  const clearAll = useHistoryStore((s) => s.clearAll);

  const setInputText = useAppStore((s) => s.setInputText);
  const setTargetLanguage = useAppStore((s) => s.setTargetLanguage);
  const setStyle = useAppStore((s) => s.setStyle);
  const setResult = useAppStore((s) => s.setResult);

  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (langFilter !== "all" && entry.targetLanguage !== langFilter) {
        return false;
      }
      if (!q) return true;
      return (
        entry.sourceText.toLowerCase().includes(q) ||
        entry.translatedText.toLowerCase().includes(q)
      );
    });
  }, [entries, query, langFilter]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function restore(entry: HistoryEntry) {
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1"
        />
        <Select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="sm:w-48"
        >
          <option value="all">{t("filterAll")}</option>
          {TARGET_LANGS.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </Select>
      </div>

      {entries.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : filtered.length === 0 ? (
        <EmptyState message={t("emptyFiltered")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{formatTime(entry.createdAt, locale)}</span>
                <span>·</span>
                <span>
                  {entry.sourceLanguage
                    ? langLabel(entry.sourceLanguage)
                    : t("sourceAuto")}
                  {" → "}
                  {langLabel(entry.targetLanguage)}
                </span>
                {entry.style ? (
                  <>
                    <span>·</span>
                    <span>
                      {STYLE_KEYS.includes(
                        entry.style as (typeof STYLE_KEYS)[number],
                      )
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
                  <p className="mb-1 text-xs font-medium text-muted">
                    {t("source")}
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {truncate(entry.sourceText)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted">
                    {t("translation")}
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {truncate(entry.translatedText)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => restore(entry)}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  {t("restore")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void copyText(entry.translatedText)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {t("copyTranslation")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {t("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title={t("clearConfirmTitle")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setClearOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => {
                clearAll();
                setClearOpen(false);
                showToast(t("cleared"));
              }}
            >
              {tCommon("confirm")}
            </Button>
          </>
        }
      >
        <p>{t("clearConfirmBody")}</p>
      </Dialog>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </PageContainer>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center text-sm text-muted">
      {message}
    </div>
  );
}

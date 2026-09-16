"use client";

import dynamic from "next/dynamic";
import { Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { LanguageSelectProps } from "@/components/ui/language-select";
import { cn } from "@/lib/utils";

const slotTriggerClass =
  "h-10 border-transparent bg-primary/10 px-3 text-foreground shadow-none hover:bg-primary/15 focus-visible:ring-primary/20";

const LanguageSelect = dynamic<LanguageSelectProps>(
  () =>
    import("@/components/ui/language-select").then(
      (mod) => mod.LanguageSelect,
    ),
  {
    loading: () => (
      <div className="relative w-[168px]">
        <button
          type="button"
          disabled
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm opacity-70",
            slotTriggerClass,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">...</span>
          </span>
        </button>
      </div>
    ),
  },
);

export function MultiTargetLanguagePicker({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("document");
  const locale = useLocale();
  const [adding, setAdding] = useState(false);
  const canAdd = !adding;

  function setAt(index: number, code: string) {
    const next = [...values];
    next[index] = code;
    onChange(dedupeKeepOrder(next));
  }

  function removeAt(index: number) {
    if (values.length <= 1) return;
    onChange(values.filter((_, i) => i !== index));
  }

  async function addSlot() {
    if (!canAdd) return;
    setAdding(true);
    try {
      const { languagesForSelect } = await import("@/i18n/languages");
      const used = new Set(values);
      const candidate = languagesForSelect(locale, false).find(
        (lang) => !used.has(lang.code),
      )?.code;
      if (candidate) onChange([...values, candidate]);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted">
          {t("languageSelect")}
        </label>
        <span className="text-[11px] text-muted">
          {t("languageCount", { count: values.length })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {values.map((code, index) => (
          <div key={`${code}-${index}`} className="relative">
            <LanguageSelect
              value={code}
              onChange={(v) => setAt(index, v)}
              disabled={disabled}
              excludeValues={values.filter((_, i) => i !== index)}
              className={cn("w-[168px]", values.length > 1 && "pr-0")}
              triggerClassName={cn(
                slotTriggerClass,
                values.length > 1 && "pr-8",
              )}
              leading={
                <span className="text-xs font-semibold text-primary">
                  {index + 1}
                </span>
              }
            />
            {values.length > 1 ? (
              <button
                type="button"
                disabled={disabled}
                aria-label={t("removeLanguage")}
                onClick={() => removeAt(index)}
                className="absolute top-1/2 right-1.5 z-10 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:bg-white/70 hover:text-foreground disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          disabled={disabled || !canAdd}
          onClick={() => void addSlot()}
          aria-label={t("addLanguage")}
          title={t("addLanguage")}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-primary/10 text-primary transition-colors",
            "hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function dedupeKeepOrder(codes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const code of codes) {
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out.length > 0 ? out : ["en"];
}

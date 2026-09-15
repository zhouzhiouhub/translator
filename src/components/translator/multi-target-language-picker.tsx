"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSelect } from "@/components/ui/language-select";
import { useLocalizedLanguageOptions } from "@/i18n/use-localized-languages";
import { cn } from "@/lib/utils";

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
  const langs = useLocalizedLanguageOptions();
  const used = new Set(values);
  const remaining = langs.filter((l) => !used.has(l.value));
  const canAdd = remaining.length > 0;

  function labelOf(code: string) {
    return langs.find((l) => l.value === code)?.label ?? code;
  }

  function setAt(index: number, code: string) {
    const next = [...values];
    next[index] = code;
    onChange(dedupeKeepOrder(next));
  }

  function removeAt(index: number) {
    if (values.length <= 1) return;
    onChange(values.filter((_, i) => i !== index));
  }

  function addSlot() {
    if (!canAdd) return;
    const candidate = remaining[0]?.value;
    if (!candidate) return;
    onChange([...values, candidate]);
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
          <div
            key={`${code}-${index}`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-2 py-1.5 shadow-sm"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
              {index + 1}
            </span>
            <LanguageSelect
              value={code}
              onChange={(v) => setAt(index, v)}
              disabled={disabled}
              excludeValues={values.filter((_, i) => i !== index)}
              className="min-w-[140px] border-0 shadow-none"
            />
            {values.length > 1 ? (
              <button
                type="button"
                disabled={disabled}
                aria-label={t("removeLanguage")}
                onClick={() => removeAt(index)}
                className="rounded-md p-1 text-muted transition-colors hover:bg-slate-100 hover:text-foreground disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          disabled={disabled || !canAdd}
          onClick={addSlot}
          aria-label={t("addLanguage")}
          title={canAdd ? t("addLanguage") : t("languageAllSelected")}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border text-primary transition-colors",
            "hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        {t("batchHint", {
          languages: values.map(labelOf).join(" · "),
        })}
      </p>
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

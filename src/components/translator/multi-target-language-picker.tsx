"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSelect } from "@/components/ui/language-select";
import { useLocalizedLanguageOptions } from "@/i18n/use-localized-languages";
import { cn } from "@/lib/utils";

const slotTriggerClass =
  "h-10 border-transparent bg-primary/10 px-3 text-foreground shadow-none hover:bg-primary/15 focus-visible:ring-primary/20";

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
          onClick={addSlot}
          aria-label={t("addLanguage")}
          title={canAdd ? t("addLanguage") : t("languageAllSelected")}
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

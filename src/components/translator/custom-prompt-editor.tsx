"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { MAX_CUSTOM_PROMPT_CHARS } from "@/types/translation";

export function CustomPromptEditor({
  value,
  onSave,
  disabled,
  compact,
}: {
  /** Last saved prompt from the store. */
  value: string;
  onSave: (value: string) => void;
  disabled?: boolean;
  /** Smaller textarea for the translator panel. */
  compact?: boolean;
}) {
  const t = useTranslations("translator");
  const [draft, setDraft] = useState(value);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const dirty = draft !== value;

  function handleSave() {
    onSave(draft.slice(0, MAX_CUSTOM_PROMPT_CHARS));
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <label className="text-xs font-medium text-muted">
          {t("customPromptLabel")}
        </label>
        <span className="text-[11px] text-muted">
          {t("customPromptCount", {
            count: draft.length,
            max: MAX_CUSTOM_PROMPT_CHARS,
          })}
        </span>
      </div>
      <Textarea
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.slice(0, MAX_CUSTOM_PROMPT_CHARS))}
        placeholder={t("customPromptPlaceholder")}
        className={compact ? "min-h-[100px]" : "min-h-[140px]"}
        maxLength={MAX_CUSTOM_PROMPT_CHARS}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={disabled || !dirty}
          onClick={handleSave}
        >
          {t("customPromptSave")}
        </Button>
        {savedFlash ? (
          <span className="text-xs text-emerald-700">{t("customPromptSaved")}</span>
        ) : dirty ? (
          <span className="text-xs text-amber-700">{t("customPromptUnsaved")}</span>
        ) : null}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        {t("customPromptHint")}
      </p>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { useLocalizedLanguageOptions } from "@/i18n/use-localized-languages";

type LanguageSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  leading?: ReactNode;
  /** Exclude built-in zh-CN / en-US (settings pack generation). */
  excludeBuiltin?: boolean;
  /** Hide these language codes from the list (already selected targets). */
  excludeValues?: string[];
  /** Prepend an “all languages” row (history filter). */
  allOptionLabel?: string;
  placeholder?: string;
};

/** Shared language picker: search field + scrollable list (not the top UI switcher). */
export function LanguageSelect({
  value,
  onChange,
  disabled,
  className,
  triggerClassName,
  leading,
  excludeBuiltin = false,
  excludeValues,
  allOptionLabel,
  placeholder,
}: LanguageSelectProps) {
  const tCommon = useTranslations("common");
  const langs = useLocalizedLanguageOptions({ excludeBuiltin });

  const options = useMemo<SearchableSelectOption[]>(() => {
    const excluded = new Set(excludeValues ?? []);
    let list = langs.filter((l) => !excluded.has(l.value) || l.value === value);
    if (allOptionLabel) {
      list = [{ value: "all", label: allOptionLabel }, ...list];
    }
    return list;
  }, [allOptionLabel, excludeValues, langs, value]);

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      className={className}
      triggerClassName={triggerClassName}
      leading={leading}
      placeholder={placeholder}
      searchPlaceholder={tCommon("languageSearchPlaceholder")}
      emptyText={tCommon("languageSearchEmpty")}
    />
  );
}

"use client";

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
  /** Exclude built-in zh-CN / en-US (settings pack generation). */
  excludeBuiltin?: boolean;
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
  excludeBuiltin = false,
  allOptionLabel,
  placeholder,
}: LanguageSelectProps) {
  const tCommon = useTranslations("common");
  const langs = useLocalizedLanguageOptions({ excludeBuiltin });

  const options = useMemo<SearchableSelectOption[]>(() => {
    if (!allOptionLabel) return langs;
    return [{ value: "all", label: allOptionLabel }, ...langs];
  }, [allOptionLabel, langs]);

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
      searchPlaceholder={tCommon("languageSearchPlaceholder")}
      emptyText={tCommon("languageSearchEmpty")}
    />
  );
}

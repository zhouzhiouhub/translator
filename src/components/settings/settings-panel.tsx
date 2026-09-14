"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageContainer } from "@/components/layout/page-container";
import { useAppStore } from "@/stores/app";
import { useUiLocaleStore } from "@/stores/ui-locale";
import { useRouteLocale } from "@/i18n/use-route-locale";
import { isFixedUiLocale, type UiLocale } from "@/i18n/ui-locales";
import { languagesForSelect } from "@/i18n/languages";
import { cn } from "@/lib/utils";

const GENERATE_LANGS = languagesForSelect().filter(
  (l) => !isFixedUiLocale(l.code),
);

export function SettingsPanel() {
  const t = useTranslations("settings");
  const tGate = useTranslations("aiGate");
  const routeLocale = useRouteLocale();

  const aiConfig = useAppStore((s) => s.aiConfig);
  const aiConfigured = useAppStore((s) => s.aiConfigured);
  const hydrateAiConfig = useAppStore((s) => s.hydrateAiConfig);

  const status = useUiLocaleStore((s) => s.status);
  const generatePack = useUiLocaleStore((s) => s.generatePack);
  const packStatusFor = useUiLocaleStore((s) => s.packStatusFor);
  const readyLocales = useUiLocaleStore((s) => s.readyLocales);

  const [selected, setSelected] = useState<UiLocale>("ja");
  const [packKind, setPackKind] = useState<"builtin" | "cached" | "needGenerate">(
    "needGenerate",
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  useEffect(() => {
    void packStatusFor(selected).then(setPackKind);
  }, [selected, packStatusFor, status, readyLocales]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  async function onGenerate(force = false) {
    if (isFixedUiLocale(selected)) {
      showToast(t("builtinNoGenerate"));
      return;
    }
    if (!aiConfigured) {
      showToast(t("aiRequired"));
      return;
    }

    try {
      await generatePack(selected, { aiConfig, force });
      showToast(t("generateSuccess"));
      void packStatusFor(selected).then(setPackKind);
    } catch (err) {
      if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
        showToast(t("aiRequired"));
        return;
      }
      if (
        err instanceof Error &&
        err.message.startsWith("LOCALE_PACK_LOW_COVERAGE")
      ) {
        showToast(t("generateLowCoverage"));
        return;
      }
      showToast(t("generateFailed"));
    }
  }

  const busy = status === "generating";
  const needsAi = !isFixedUiLocale(selected) && !aiConfigured;
  const statusLabel =
    status === "generating"
      ? t("statusGenerating")
      : packKind === "builtin"
        ? t("statusBuiltin")
        : packKind === "cached"
          ? t("statusCached")
          : t("statusNeedGenerate");

  return (
    <PageContainer>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-medium">{t("uiLanguageTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("uiLanguageDesc")}</p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted">
          {t("uiLanguage")}
        </label>
        <Select
          value={selected}
          disabled={busy}
          onChange={(e) => setSelected(e.target.value as UiLocale)}
        >
          {GENERATE_LANGS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nameZh} · {lang.nameEn}
            </option>
          ))}
        </Select>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span
            className={cn(
              "rounded-lg px-2 py-1",
              packKind === "builtin"
                ? "bg-slate-100"
                : packKind === "cached"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700",
            )}
          >
            {statusLabel}
          </span>
        </div>

        {needsAi ? (
          <p className="mt-3 text-sm text-amber-700">
            {t("aiRequired")}{" "}
            <Link
              href={`/${routeLocale}/settings/ai`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("goConfigureAi")}
            </Link>
          </p>
        ) : null}

        <p className="mt-3 text-xs text-muted">{t("generateOnlyHint")}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || needsAi || isFixedUiLocale(selected)}
            onClick={() => void onGenerate(packKind === "cached")}
          >
            {busy
              ? t("statusGenerating")
              : packKind === "cached"
                ? t("regenerate")
                : t("generate")}
          </Button>
        </div>
      </section>

      <Link
        href={`/${routeLocale}/settings/ai`}
        className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-slate-50"
      >
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-medium">{t("aiConfigLinkTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("aiConfigLinkDesc")}</p>
          {!aiConfigured ? (
            <p className="mt-2 text-xs text-amber-700">{tGate("requiredHint")}</p>
          ) : null}
        </div>
      </Link>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </PageContainer>
  );
}

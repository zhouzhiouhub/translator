"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSelect } from "@/components/ui/language-select";
import { PageContainer } from "@/components/layout/page-container";
import { useAppStore } from "@/stores/app";
import { useUiLocaleStore } from "@/stores/ui-locale";
import { useRouteLocale } from "@/i18n/use-route-locale";
import { isFixedUiLocale, type UiLocale } from "@/i18n/ui-locales";

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

  async function onGenerate() {
    if (isFixedUiLocale(selected)) {
      showToast(t("builtinNoGenerate"));
      return;
    }
    if (!aiConfigured) {
      showToast(t("aiRequired"));
      return;
    }

    try {
      await generatePack(selected, { aiConfig, force: packKind === "cached" });
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

  return (
    <PageContainer>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-medium">{t("uiLanguageTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("uiLanguageDesc")}</p>

        <label className="mt-4 mb-1 block text-xs font-medium text-muted">
          {t("uiLanguage")}
        </label>
        <LanguageSelect
          value={selected}
          disabled={busy}
          excludeBuiltin
          onChange={(v) => setSelected(v as UiLocale)}
        />

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

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || needsAi || isFixedUiLocale(selected)}
            onClick={() => void onGenerate()}
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
        className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-slate-50"
      >
        <h2 className="text-base font-medium">{t("aiConfigLinkTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("aiConfigLinkDesc")}</p>
        {!aiConfigured ? (
          <p className="mt-2 text-xs text-amber-700">{tGate("requiredHint")}</p>
        ) : null}
      </Link>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </PageContainer>
  );
}

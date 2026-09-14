"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app";
import { useUiLocaleStore } from "@/stores/ui-locale";
import {
  ALL_UI_LOCALES,
  UI_LOCALE_LABELS,
  isFixedUiLocale,
  type UiLocale,
} from "@/i18n/ui-locales";
import { cn } from "@/lib/utils";

function swapLocalePath(pathname: string, current: string, next: string) {
  const rest = pathname.replace(new RegExp(`^/${current}`), "") || "";
  return `/${next}${rest}`;
}

export function SettingsPanel() {
  const t = useTranslations("settings");
  const tGate = useTranslations("aiGate");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const aiConfig = useAppStore((s) => s.aiConfig);
  const aiConfigured = useAppStore((s) => s.aiConfigured);
  const hydrateAiConfig = useAppStore((s) => s.hydrateAiConfig);

  const preferredUiLocale = useUiLocaleStore((s) => s.preferredUiLocale);
  const status = useUiLocaleStore((s) => s.status);
  const applyLocale = useUiLocaleStore((s) => s.applyLocale);
  const packStatusFor = useUiLocaleStore((s) => s.packStatusFor);

  const [selected, setSelected] = useState<UiLocale>(preferredUiLocale);
  const [packKind, setPackKind] = useState<"builtin" | "cached" | "needGenerate">(
    "builtin",
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void hydrateAiConfig();
  }, [hydrateAiConfig]);

  useEffect(() => {
    setSelected(preferredUiLocale);
  }, [preferredUiLocale]);

  useEffect(() => {
    void packStatusFor(selected).then(setPackKind);
  }, [selected, packStatusFor, status]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  async function onApply() {
    if (!isFixedUiLocale(selected) && !aiConfigured) {
      showToast(t("aiRequired"));
      return;
    }

    try {
      const result = await applyLocale(selected, {
        aiConfig,
      });

      if (result.kind === "fixed") {
        router.push(swapLocalePath(pathname, locale, result.locale));
        showToast(t("applySuccess"));
        return;
      }

      showToast(
        packKind === "cached" ? t("applySuccess") : t("generateSuccess"),
      );
      void packStatusFor(selected).then(setPackKind);
    } catch (err) {
      if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
        showToast(t("aiRequired"));
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
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
          {ALL_UI_LOCALES.map((code) => (
            <option key={code} value={code}>
              {UI_LOCALE_LABELS[code]}
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
          {preferredUiLocale === selected && status !== "generating" ? (
            <span className="rounded-lg bg-primary/10 px-2 py-1 text-primary">
              {t("statusActive")}
            </span>
          ) : null}
        </div>

        {needsAi ? (
          <p className="mt-3 text-sm text-amber-700">
            {t("aiRequired")}{" "}
            <Link
              href={`/${locale}/settings/ai`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("goConfigureAi")}
            </Link>
          </p>
        ) : null}

        <div className="mt-4">
          <Button
            type="button"
            disabled={busy || needsAi}
            onClick={() => void onApply()}
          >
            {busy
              ? t("statusGenerating")
              : packKind === "needGenerate"
                ? t("generateAndApply")
                : t("apply")}
          </Button>
        </div>
      </section>

      <Link
        href={`/${locale}/settings/ai`}
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
    </div>
  );
}

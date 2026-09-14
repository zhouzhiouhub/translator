import type { ReactNode } from "react";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

const STEP_KEYS = ["1", "2", "3", "4", "5"] as const;
const TIP_KEYS = ["1", "2", "3", "4"] as const;
const QUICK_KEYS = ["1", "2", "3"] as const;
const FAQ_KEYS = ["1", "2", "3", "4"] as const;

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-brand-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">
          {t("quickStartTitle")}
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {QUICK_KEYS.map((key) => (
            <li key={key}>{t(`quickStartSteps.${key}`)}</li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <HelpLink href={`/${locale}/settings/ai`}>{t("linkConfig")}</HelpLink>
          <HelpLink href={`/${locale}`}>{t("linkTranslator")}</HelpLink>
          <HelpLink href={`/${locale}/history`}>{t("linkHistory")}</HelpLink>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">
          {t("configTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted">{t("configIntro")}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {STEP_KEYS.map((key) => (
            <li key={key}>{t(`configSteps.${key}`)}</li>
          ))}
        </ol>
        <h3 className="mt-5 text-sm font-semibold text-brand-ink">
          {t("configTipsTitle")}
        </h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          {TIP_KEYS.map((key) => (
            <li key={key}>{t(`configTips.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">
          {t("useTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted">{t("useIntro")}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {STEP_KEYS.map((key) => (
            <li key={key}>{t(`useSteps.${key}`)}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">
          {t("historyTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {t("historyBody")}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">
          {t("uiLangTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {t("uiLangBody")}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">
          {t("faqTitle")}
        </h2>
        <dl className="mt-3 space-y-4">
          {FAQ_KEYS.map((key) => (
            <div key={key}>
              <dt className="text-sm font-medium text-brand-ink">
                {t(`faq.q${key}`)}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">
                {t(`faq.a${key}`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function HelpLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
    >
      {children}
    </Link>
  );
}

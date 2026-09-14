import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-brand-ink">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted">{t("placeholder")}</p>
    </div>
  );
}

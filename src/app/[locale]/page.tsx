import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageContainer } from "@/components/layout/page-container";
import { TranslatorPanel } from "@/components/translator/translator-panel";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "translator" });

  return (
    <PageContainer>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
          {t("greeting")}
        </h1>
      </header>
      <TranslatorPanel />
    </PageContainer>
  );
}

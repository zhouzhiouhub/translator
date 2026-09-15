import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UiLocaleProvider } from "@/components/i18n/ui-locale-provider";
import { Providers } from "@/components/providers";
import { isAppLocale, fixedLocales } from "@/i18n/config";
import { buildLocaleAlternates, buildLocaleUrl } from "@/lib/seo/urls";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const url = buildLocaleUrl(locale);

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: t("author") }],
    creator: t("creator"),
    alternates: {
      canonical: url,
      languages: buildLocaleAlternates(),
    },
    openGraph: {
      locale: locale === "zh-CN" ? "zh_CN" : "en_US",
      title: t("title"),
      description: t("description"),
      url,
      type: "website",
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

/** Only prebuild built-in locales; catalog languages resolve on demand. */
export function generateStaticParams() {
  return fixedLocales.map((locale) => ({ locale }));
}

export const dynamicParams = true;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <UiLocaleProvider>
              <AppShell>{children}</AppShell>
            </UiLocaleProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

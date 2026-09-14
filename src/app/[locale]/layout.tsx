import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UiLocaleProvider } from "@/components/i18n/ui-locale-provider";
import { Providers } from "@/components/providers";
import { isAppLocale, fixedLocales } from "@/i18n/config";
import "../globals.css";

export const metadata: Metadata = {
  title: "Kinolin Translator",
  description: "AI Translation Agent — BYOK only",
  icons: {
    icon: "/brand/symbol.svg",
  },
};

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

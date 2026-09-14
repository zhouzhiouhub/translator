import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UiLocaleProvider } from "@/components/i18n/ui-locale-provider";
import { Providers } from "@/components/providers";
import { locales, type AppLocale } from "@/i18n/config";
import "../globals.css";

export const metadata: Metadata = {
  title: "Kinolin Translator",
  description: "AI Translation Agent — BYOK only",
  icons: {
    icon: "/brand/symbol.svg",
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as AppLocale)) {
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
              <div className="flex h-dvh overflow-hidden">
                <AppSidebar />
                <main className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                  {children}
                </main>
              </div>
            </UiLocaleProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

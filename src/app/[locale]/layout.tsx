import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Providers } from "@/components/providers";
import { locales, type AppLocale } from "@/i18n/config";
import "../globals.css";

export const metadata: Metadata = {
  title: "Kinolin Translator",
  description: "AI Translation Agent — Google baseline + BYOK AI",
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
            <div className="flex min-h-screen">
              <AppSidebar />
              <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

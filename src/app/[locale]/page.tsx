import { setRequestLocale } from "next-intl/server";
import { TranslatorPanel } from "@/components/translator/translator-panel";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TranslatorPanel />;
}
